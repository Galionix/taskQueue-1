// API types for documentation
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

export interface SearchResult {
  file: string;
  relativePath: string;
  matches: {
    line: number;
    content: string;
    context: string;
  }[];
}

export interface DocumentationStats {
  totalFiles: number;
  totalSize: number;
  lastUpdated: Date;
  filesByFolder: Record<string, number>;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface FileContent {
  path: string;
  content: string;
  lastModified: Date;
}
