import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { ROLE_LABELS } from '@/modules/auth/types/auth.types';
import styles from './AppLayout.module.css';

export function AppLayout() {
  const { user, logout, ready } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    navigate('/');
    logout();
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link to="/" className={styles.brand}>
          Elite Ingressos
        </Link>

        <nav className={styles.nav} aria-label="Principal">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.active : ''}`
            }
          >
            Eventos
          </NavLink>
          {user?.role === 'CLIENT' && (
            <NavLink
              to="/meus-ingressos"
              className={({ isActive }) =>
                `${styles.link} ${isActive ? styles.active : ''}`
              }
            >
              Meus ingressos
            </NavLink>
          )}

          {ready && user ? (
            <>
              <span className={styles.user}>
                {user.name} · {ROLE_LABELS[user.role]}
              </span>
              <button type="button" className={styles.logout} onClick={handleLogout}>
                Sair
              </button>
            </>
          ) : (
            <NavLink to="/entrar" className={styles.link}>
              Entrar
            </NavLink>
          )}
        </nav>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
