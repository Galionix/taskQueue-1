import React from 'react';
import { FileNode } from '@tasks/lib';
import styles from './DocsTree.module.css';

interface DocsTreeProps {
  node: FileNode;
  onFileSelect: (path: string) => void;
  selectedPath?: string;
  level?: number;
}

export const DocsTreeNode: React.FC<DocsTreeProps> = ({
  node,
  onFileSelect,
  selectedPath,
  level = 0,
}) => {
  const isSelected = selectedPath === node.relativePath;

  return (
    <div className={styles.treeNode}>
      <div
        className={`${styles.nodeContent} ${isSelected ? styles.selected : ''}`}
        style={{ paddingLeft: `${level * 20}px` }}
        onClick={() =>
          node.type === 'file' &&
          node.isMarkdown &&
          onFileSelect(node.relativePath)
        }
      >
        <span className={styles.nodeIcon}>
          {node.type === 'directory' ? '📁' : node.isMarkdown ? '📄' : '📋'}
        </span>
        <span
          className={`${styles.nodeName} ${
            node.type === 'file' && node.isMarkdown ? styles.clickable : ''
          }`}
        >
          {node.name}
        </span>
        {node.type === 'file' && node.size && (
          <span className={styles.fileSize}>
            ({Math.round(node.size / 1024)}KB)
          </span>
        )}
      </div>

      {node.children && node.children.length > 0 && (
        <div className={styles.nodeChildren}>
          {node.children.map((child, index) => (
            <DocsTreeNode
              key={`${child.path}-${index}`}
              node={child}
              onFileSelect={onFileSelect}
              selectedPath={selectedPath}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface DocsTreeRootProps {
  node: FileNode;
  onFileSelect: (path: string) => void;
  selectedPath?: string;
}

export const DocsTree: React.FC<DocsTreeRootProps> = ({
  node,
  onFileSelect,
  selectedPath,
}) => {
  return (
    <div className={styles.docsTree}>
      <h3 className={styles.treeTitle}>📚 Documentation</h3>
      <DocsTreeNode
        node={node}
        onFileSelect={onFileSelect}
        selectedPath={selectedPath}
      />
    </div>
  );
};
