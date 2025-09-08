import React, { useState } from 'react';
import { useDocsTree, useDocsFile } from '@/api/query';
import { DocsTree } from './DocsTree';
import { DocsViewer } from './DocsViewer';
import styles from './DocsMain.module.css';

export const DocsMain: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string>('');
  
  const { 
    data: treeData, 
    isLoading: isLoadingTree, 
    error: treeError 
  } = useDocsTree();
  
  const { 
    data: fileContent, 
    isLoading: isLoadingFile, 
    error: fileError 
  } = useDocsFile(selectedFile);

  const handleFileSelect = (path: string) => {
    setSelectedFile(path);
  };

  if (isLoadingTree) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading documentation tree...</p>
      </div>
    );
  }

  if (treeError) {
    return (
      <div className={styles.error}>
        <h2>❌ Error Loading Documentation</h2>
        <details>
          <summary>Show details</summary>
          <pre>{JSON.stringify(treeError, null, 2)}</pre>
        </details>
      </div>
    );
  }

  if (!treeData) {
    return (
      <div className={styles.empty}>
        <p>No documentation found</p>
      </div>
    );
  }

  return (
    <div className={styles.docsMain}>
      <div className={styles.sidebar}>
        <DocsTree
          node={treeData}
          onFileSelect={handleFileSelect}
          selectedPath={selectedFile}
        />
      </div>
      
      <div className={styles.content}>
        {selectedFile ? (
          <>
            {isLoadingFile && (
              <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading file...</p>
              </div>
            )}
            
            {fileError && (
              <div className={styles.error}>
                <h2>❌ Error Loading File</h2>
                <details>
                  <summary>Show details</summary>
                  <pre>{JSON.stringify(fileError, null, 2)}</pre>
                </details>
              </div>
            )}
            
            {fileContent && !isLoadingFile && (
              <DocsViewer content={fileContent} filePath={selectedFile} />
            )}
          </>
        ) : (
          <div className={styles.placeholder}>
            <div className={styles.placeholderContent}>
              <h2>📚 Documentation</h2>
              <p>Select a Markdown file from the tree to view its content</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
