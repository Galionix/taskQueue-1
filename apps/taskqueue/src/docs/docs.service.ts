import { Injectable, Logger } from '@nestjs/common';
import { IDocsService, FileNode, SearchResult, DocumentationStats } from '@tasks/lib';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocsService implements IDocsService{
  private readonly logger = new Logger(DocsService.name);
  private readonly projectRoot: string;
  private readonly excludePatterns = [
    'node_modules',
    '.git',
    '.nx',
    'dist',
    'build',
    'coverage',
    '.vscode',
    '.idea',
    'tmp',
    'temp'
  ];

  constructor() {
    // Находим корень проекта (где лежит package.json)
    this.projectRoot = this.findProjectRoot();
    this.logger.log(`Project root: ${this.projectRoot}`);
  }

  private findProjectRoot(): string {
    let currentDir = __dirname;

    // Если мы в dist папке, то поднимаемся выше
    if (currentDir.includes('dist')) {
      // Поднимаемся до корня проекта (где package.json)
      while (currentDir !== path.dirname(currentDir)) {
        const packageJsonPath = path.join(currentDir, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
          // Проверяем, что это корень монорепо (есть nx.json)
          const nxJsonPath = path.join(currentDir, 'nx.json');
          if (fs.existsSync(nxJsonPath)) {
            return currentDir;
          }
        }
        currentDir = path.dirname(currentDir);
      }
    } else {
      // Если мы в исходниках, ищем как обычно
      while (currentDir !== path.dirname(currentDir)) {
        const packageJsonPath = path.join(currentDir, 'package.json');
        const nxJsonPath = path.join(currentDir, 'nx.json');
        if (fs.existsSync(packageJsonPath) && fs.existsSync(nxJsonPath)) {
          return currentDir;
        }
        currentDir = path.dirname(currentDir);
      }
    }

    // Fallback to current directory
    return process.cwd();
  }

  async getProjectTree(): Promise<FileNode> {
    this.logger.log('Scanning project tree for documentation...');
    return this.scanDirectory(this.projectRoot, '');
  }

  private async scanDirectory(dirPath: string, relativePath: string): Promise<FileNode> {
    const stats = fs.statSync(dirPath);
    const name = path.basename(dirPath);

    const node: FileNode = {
      name,
      type: 'directory',
      path: dirPath,
      relativePath,
      children: [],
      lastModified: stats.mtime
    };

    // Пропускаем исключенные папки
    if (this.shouldExclude(name)) {
      return node;
    }

    try {
      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const itemRelativePath = relativePath ? `${relativePath}/${item}` : item;

        if (this.shouldExclude(item)) {
          continue;
        }

        const itemStats = fs.statSync(fullPath);

        if (itemStats.isDirectory()) {
          const childNode = await this.scanDirectory(fullPath, itemRelativePath);
          if (childNode.children && childNode.children.length > 0) {
            node.children!.push(childNode);
          }
        } else if (this.isMarkdownFile(item)) {
          node.children!.push({
            name: item,
            type: 'file',
            path: fullPath,
            relativePath: itemRelativePath,
            isMarkdown: true,
            size: itemStats.size,
            lastModified: itemStats.mtime
          });
        }
      }
    } catch (error) {
      this.logger.warn(`Could not read directory ${dirPath}: ${(error as Error).message}`);
    }

    return node;
  }

  private shouldExclude(name: string): boolean {
    return this.excludePatterns.some(pattern => name.includes(pattern));
  }

  private isMarkdownFile(filename: string): boolean {
    return filename.toLowerCase().endsWith('.md');
  }

  async readMarkdownFile(relativePath: string): Promise<string> {
    const fullPath = path.join(this.projectRoot, relativePath);

    // Проверяем безопасность пути
    if (!fullPath.startsWith(this.projectRoot)) {
      throw new Error('Invalid file path - outside project root');
    }

    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${relativePath}`);
    }

    if (!this.isMarkdownFile(fullPath)) {
      throw new Error('File is not a markdown file');
    }

    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      this.logger.log(`Read markdown file: ${relativePath} (${content.length} chars)`);
      return content;
    } catch (error) {
      this.logger.error(`Error reading file ${relativePath}: ${(error as Error).message}`);
      throw error;
    }
  }

  async searchInDocumentation(query: string): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const tree = await this.getProjectTree();

    await this.searchInNode(tree, query, results);

    this.logger.log(`Search for "${query}" found ${results.length} results`);
    return results;
  }

  private async searchInNode(node: FileNode, query: string, results: SearchResult[]): Promise<void> {
    if (node.type === 'file' && node.isMarkdown) {
      try {
        const content = await this.readMarkdownFile(node.relativePath);
        const matches = this.searchInContent(content, query);

        if (matches.length > 0) {
          results.push({
            file: node.name,
            relativePath: node.relativePath,
            matches
          });
        }
      } catch (error) {
        this.logger.warn(`Could not search in file ${node.relativePath}: ${(error as Error).message}`);
      }
    }

    if (node.children) {
      for (const child of node.children) {
        await this.searchInNode(child, query, results);
      }
    }
  }

  private searchInContent(content: string, query: string): { line: number; content: string; context: string; }[] {
    const lines = content.split('\n');
    const matches: { line: number; content: string; context: string; }[] = [];
    const lowercaseQuery = query.toLowerCase();

    lines.forEach((line, index) => {
      if (line.toLowerCase().includes(lowercaseQuery)) {
        // Получаем контекст (строку выше и ниже)
        const contextLines = [];
        if (index > 0) contextLines.push(lines[index - 1]);
        contextLines.push(line);
        if (index < lines.length - 1) contextLines.push(lines[index + 1]);

        matches.push({
          line: index + 1,
          content: line.trim(),
          context: contextLines.join('\n')
        });
      }
    });

    return matches;
  }

  // Получить статистику документации
  async getDocumentationStats(): Promise<DocumentationStats> {
    const tree = await this.getProjectTree();
    const stats = {
      totalFiles: 0,
      totalSize: 0,
      lastUpdated: new Date(0),
      filesByFolder: {} as Record<string, number>
    };

    this.collectStats(tree, stats, '');

    return stats;
  }

  private collectStats(node: FileNode, stats: any, folderPath: string): void {
    if (node.type === 'file' && node.isMarkdown) {
      stats.totalFiles++;
      stats.totalSize += node.size || 0;

      if (node.lastModified && node.lastModified > stats.lastUpdated) {
        stats.lastUpdated = node.lastModified;
      }

      const folder = folderPath || 'root';
      stats.filesByFolder[folder] = (stats.filesByFolder[folder] || 0) + 1;
    }

    if (node.children) {
      const currentPath = folderPath ? `${folderPath}/${node.name}` : node.name;
      for (const child of node.children) {
        this.collectStats(child, stats, currentPath);
      }
    }
  }
}
