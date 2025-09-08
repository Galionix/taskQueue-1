import { Test, TestingModule } from '@nestjs/testing';
import { DocsController } from './docs.controller';
import { DocsService } from './docs.service';

// Мокаем DocsService
const mockDocsService = {
  getProjectTree: jest.fn().mockResolvedValue({ name: 'root', type: 'directory', path: '/', relativePath: '', children: [], lastModified: new Date() }),
  readMarkdownFile: jest.fn().mockResolvedValue('# Markdown'),
  searchInDocumentation: jest.fn().mockResolvedValue([
    { file: 'file.md', relativePath: 'file.md', matches: [{ line: 1, content: 'result', context: '' }] }
  ]),
  getDocumentationStats: jest.fn().mockResolvedValue({ totalFiles: 1, totalSize: 100, lastUpdated: new Date(), filesByFolder: { '': 1 } }),
};

describe('DocsController', () => {
  let controller: DocsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocsController],
      providers: [
        { provide: DocsService, useValue: mockDocsService },
      ],
    }).compile();
    controller = module.get<DocsController>(DocsController);
  });

  it('should get project tree', async () => {
    const result = await controller.getProjectTree();
    expect(result.success).toBe(true);
    expect(result.data.name).toBe('root');
  });

  it('should get markdown file', async () => {
    const result = await controller.getMarkdownFile('file.md');
    expect(result.success).toBe(true);
    expect(result.data.content).toBe('# Markdown');
  });

  it('should search documentation', async () => {
    const result = await controller.searchDocumentation('test');
    expect(result.success).toBe(true);
    expect(result.data[0].file).toBe('file.md');
    expect(result.data[0].matches[0].content).toBe('result');
  });

  it('should get documentation stats', async () => {
    const result = await controller.getDocumentationStats();
    expect(result.success).toBe(true);
    expect(result.data.totalFiles).toBe(1);
    expect(result.data.totalSize).toBe(100);
  });
});
