import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { ROLE_LABELS } from '@/modules/auth/types/auth.types';
import styles from './AppLayout.module.css';

export function AppLayout() {
  const { user, logout, ready } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    navigate('/');
    logout();
  }

  const onTickets =
    location.pathname.startsWith('/meus-ingressos') ||
    location.pathname.startsWith('/ingressos/');
  const ticketsTo =
    user?.role === 'CLIENT' ? '/meus-ingressos' : '/entrar?from=/meus-ingressos';

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.bar}>
          <Link to="/" className={styles.brand}>
            <span className={styles.mark} aria-hidden="true" />
            Elite Ingressos
          </Link>

          <nav className={styles.desktopNav} aria-label="Principal">
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
                <button
                  type="button"
                  className={styles.logout}
                  onClick={handleLogout}
                >
                  Sair
                </button>
              </>
            ) : (
              <NavLink to="/entrar" className={styles.enter}>
                Entrar
              </NavLink>
            )}
          </nav>
        </div>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <div className={styles.bar}>
          <p>Eventos, lugares e o QR na palma da mão.</p>
        </div>
      </footer>

      <nav className={styles.tabBar} aria-label="Navegação do aplicativo">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `${styles.tab} ${isActive ? styles.tabActive : ''}`
          }
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 11.5 12 4l8 7.5V20H4z" />
            <path d="M10 20v-6h4v6" />
          </svg>
          Eventos
        </NavLink>
        <NavLink
          to={ticketsTo}
          className={`${styles.tab} ${onTickets ? styles.tabActive : ''}`}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 8h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4z" />
          </svg>
          Ingressos
        </NavLink>
        {ready && user ? (
          <button type="button" className={styles.tab} onClick={handleLogout}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10 7V4h10v16H10v-3" />
              <path d="M4 12h11M8 8l-4 4 4 4" />
            </svg>
            Sair
          </button>
        ) : (
          <NavLink
            to="/entrar"
            className={({ isActive }) =>
              `${styles.tab} ${isActive ? styles.tabActive : ''}`
            }
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="8" r="3.2" />
              <path d="M5 19c1.5-3.2 3.8-5 7-5s5.5 1.8 7 5" />
            </svg>
            Entrar
          </NavLink>
        )}
      </nav>
    </div>
  );
}
