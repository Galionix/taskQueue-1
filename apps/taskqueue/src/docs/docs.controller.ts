import { Controller, Get, Param, Logger, NotFoundException } from '@nestjs/common';
import { DocsService } from './docs.service';
import { ApiResponse, FileContent, FileNode, SearchResult, DocumentationStats } from '@tasks/lib';

@Controller('docs')
export class DocsController {
  private readonly logger = new Logger(DocsController.name);

  constructor(private readonly docsService: DocsService) {}

  @Get('tree')
  async getProjectTree(): Promise<ApiResponse<FileNode>> {
    this.logger.log('Getting project documentation tree');
    try {
      const tree = await this.docsService.getProjectTree();
      return { success: true, data: tree };
    } catch (error) {
      this.logger.error('Error getting project tree:', error);
      throw new NotFoundException('Could not load project tree');
    }
  }

  @Get('file/*path')
  async getMarkdownFile(@Param('path') filePath: string | string[]): Promise<ApiResponse<FileContent>> {
    // Обрабатываем случай, когда параметр приходит как массив или строка с запятыми
    let normalizedPath: string;

    if (Array.isArray(filePath)) {
      normalizedPath = filePath.join('/');
    } else if (typeof filePath === 'string' && filePath.includes(',')) {
      normalizedPath = filePath.split(',').join('/');
    } else {
      normalizedPath = filePath || '';
    }

    this.logger.log(`Getting markdown file: ${normalizedPath} (original: ${filePath})`);

    if (!normalizedPath) {
      this.logger.error('No file path provided');
      throw new NotFoundException('File path is required');
    }

    try {
      const content = await this.docsService.readMarkdownFile(normalizedPath);
      return {
        success: true,
        data: {
          path: normalizedPath,
          content,
          lastModified: new Date()
        }
      };
    } catch (error) {
      this.logger.error(`Error reading file ${normalizedPath}:`, error);
      throw new NotFoundException(`File not found: ${normalizedPath}`);
    }
  }

  @Get('search/:query')
  async searchDocumentation(@Param('query') query: string): Promise<ApiResponse<SearchResult[]>> {
    this.logger.log(`Searching documentation for: ${query}`);

    try {
      const results = await this.docsService.searchInDocumentation(query);
      return { success: true, data: results };
    } catch (error) {
      this.logger.error('Error searching documentation:', error);
      return { success: false, data: [] };
    }
  }

  @Get('stats')
  async getDocumentationStats(): Promise<ApiResponse<DocumentationStats>> {
    this.logger.log('Getting documentation statistics');

    try {
      const stats = await this.docsService.getDocumentationStats();
      return { success: true, data: stats };
    } catch (error) {
      this.logger.error('Error getting documentation stats:', error);
      throw new NotFoundException('Could not load documentation stats');
    }
  }
}
