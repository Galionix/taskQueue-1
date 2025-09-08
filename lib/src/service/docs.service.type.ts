// Documentation service types
export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  relativePath: string;
  children?: FileNode[];
  isMarkdown?: boolean;
  size?: number;
  lastModified?: Date;
}

export interface SearchMatch {
  line: number;
  content: string;
  context: string;
}

export interface SearchResult {
  file: string;
  relativePath: string;
  matches: SearchMatch[];
}

export interface DocumentationStats {
  totalFiles: number;
  totalSize: number;
  lastUpdated: Date;
  filesByFolder: Record<string, number>;
}

export interface FileContent {
  path: string;
  content: string;
  lastModified: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// Docs service interface
export interface IDocsService {
  getProjectTree(): Promise<FileNode>;
  readMarkdownFile(path: string): Promise<string>;
  searchInDocumentation(query: string): Promise<SearchResult[]>;
  getDocumentationStats(): Promise<DocumentationStats>;
}
