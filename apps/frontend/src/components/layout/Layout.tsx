import React from 'react';
import { Header } from './Header';
import styles from './Layout.module.css';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  onRestartEngine?: () => void;
  isRestartingEngine?: boolean;
  showRestartButton?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  title,
  onRestartEngine,
  isRestartingEngine,
  showRestartButton = true,
}) => {
  return (
    <div className={styles.layout}>
      <Header
        title={title}
        onRestartEngine={showRestartButton ? onRestartEngine : undefined}
        isRestartingEngine={isRestartingEngine}
      />
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
};
