import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types/auth.types';
import { ROLE_LABELS } from '../types/auth.types';

type RequireAuthProps = {
  roles?: Role[];
  children: ReactNode;
};

export function RequireAuth({ roles, children }: RequireAuthProps) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) {
    return <p>Carregando sessão...</p>;
  }

  if (!user) {
    const from = `${location.pathname}${location.search}`;
    return <Navigate to={`/entrar?from=${encodeURIComponent(from)}`} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    const allowed = roles.map((role) => ROLE_LABELS[role]).join(', ');

    return (
      <section>
        <h1>Sem acesso</h1>
        <p>Esta área é restrita a {allowed}.</p>
      </section>
    );
  }

  return children;
}
