import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import styles from './Layout.module.css';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps): JSX.Element {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const isActive = (path: string): boolean => {
    return location.pathname === path;
  };

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <nav className={styles.nav}>
          <Link to="/list" className={isActive('/list') ? styles.active : ''}>
            Список объявлений
          </Link>
          <Link to="/stats" className={isActive('/stats') ? styles.active : ''}>
            Статистика
          </Link>
        </nav>
        <button className={styles.themeToggle} onClick={toggleTheme} title="Переключить тему">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
