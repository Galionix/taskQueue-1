import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from './Header.module.css';

interface HeaderProps {
  title?: string;
  onRestartEngine?: () => void;
  isRestartingEngine?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title = "🎯 Task Queue Dashboard",
  onRestartEngine,
  isRestartingEngine = false,
}) => {
  const router = useRouter();
  const currentPath = router.pathname;

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.leftSection}>
          <Link href="/" className={styles.titleLink}>
            <h1 className={styles.title}>{title}</h1>
          </Link>
        </div>

        <nav className={styles.navigation}>
          <Link
            href="/"
            className={`${styles.navLink} ${
              currentPath === '/' ? styles.active : ''
            }`}
          >
            🏠 Dashboard
          </Link>
          <Link
            href="/browsers"
            className={`${styles.navLink} ${
              currentPath === '/browsers' ? styles.active : ''
            }`}
          >
            🌐 Browsers
          </Link>
          <Link
            href="/docs"
            className={`${styles.navLink} ${
              currentPath === '/docs' ? styles.active : ''
            }`}
          >
            📚 Documentation
          </Link>
        </nav>

        <div className={styles.headerActions}>
          {onRestartEngine && (
            <button
              onClick={onRestartEngine}
              className={styles.restartButton}
              disabled={isRestartingEngine}
            >
              {isRestartingEngine ? '⏳' : '🔄'} Restart Engine
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
