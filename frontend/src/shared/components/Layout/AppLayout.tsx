import { Outlet } from 'react-router-dom';
import styles from './AppLayout.module.css';

export function AppLayout() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <strong className={styles.brand}>Elite Ingressos</strong>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
