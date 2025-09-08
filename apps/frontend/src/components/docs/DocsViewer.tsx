import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import 'highlight.js/styles/github-dark.css'; // Можно выбрать другую тему
import styles from './DocsViewer.module.css';

interface DocsViewerProps {
  content: string;
  filePath: string;
}

export const DocsViewer: React.FC<DocsViewerProps> = ({ content, filePath }) => {
  return (
    <div className={styles.docsViewer}>
      <div className={styles.header}>
        <h3 className={styles.title}>📄 {filePath}</h3>
      </div>
      <div className={styles.content}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight, rehypeRaw]}
          components={{
            // Кастомизируем компоненты для лучшего стиля
            h1: ({ children, ...props }) => (
              <h1 className={styles.h1} {...props}>{children}</h1>
            ),
            h2: ({ children, ...props }) => (
              <h2 className={styles.h2} {...props}>{children}</h2>
            ),
            h3: ({ children, ...props }) => (
              <h3 className={styles.h3} {...props}>{children}</h3>
            ),
            h4: ({ children, ...props }) => (
              <h4 className={styles.h4} {...props}>{children}</h4>
            ),
            p: ({ children, ...props }) => (
              <p className={styles.paragraph} {...props}>{children}</p>
            ),
            li: ({ children, ...props }) => (
              <li className={styles.listItem} {...props}>{children}</li>
            ),
            code: ({ inline, className, children, ...props }: any) => {
              if (inline) {
                return (
                  <code className={styles.inlineCode} {...props}>
                    {children}
                  </code>
                );
              }
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
            pre: ({ children, ...props }) => (
              <pre className={styles.codeBlock} {...props}>
                {children}
              </pre>
            ),
            blockquote: ({ children, ...props }) => (
              <blockquote className={styles.blockquote} {...props}>
                {children}
              </blockquote>
            ),
            table: ({ children, ...props }) => (
              <div className={styles.tableContainer}>
                <table className={styles.table} {...props}>
                  {children}
                </table>
              </div>
            ),
            th: ({ children, ...props }) => (
              <th className={styles.tableHeader} {...props}>
                {children}
              </th>
            ),
            td: ({ children, ...props }) => (
              <td className={styles.tableCell} {...props}>
                {children}
              </td>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
};
