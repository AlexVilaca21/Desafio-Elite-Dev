import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './LoginPage.module.css';

const TEST_ACCOUNTS = [
  { role: 'Cliente', email: 'cliente@elite.dev' },
  { role: 'Cliente 2', email: 'cliente2@elite.dev' },
  { role: 'Organizador', email: 'organizador@elite.dev' },
  { role: 'Portaria', email: 'portaria@elite.dev' },
];

export function LoginPage() {
  const { login, register, user, ready } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromParam = searchParams.get('from') || '/';
  const from = fromParam.startsWith('/') ? fromParam : '/';

  function destination(role: 'ORGANIZER' | 'CLIENT' | 'GATE'): string {
    if (from !== '/') {
      return from;
    }

    return role === 'GATE' ? '/portaria' : '/';
  }

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('cliente@elite.dev');
  const [password, setPassword] = useState('senha123');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const logged =
        mode === 'register'
          ? await register(name, email, password)
          : await login(email, password);
      navigate(destination(logged.role), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar');
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) {
    return <p>Carregando sessão...</p>;
  }

  if (user) {
    return <Navigate to={destination(user.role)} replace />;
  }

  return (
    <section className={styles.page}>
      <article className={styles.ticket}>
        <aside className={styles.stub}>
          <p className={styles.kicker}>Acesso</p>
          <h1>{mode === 'login' ? 'Entrar' : 'Criar conta'}</h1>
          <p>
            {mode === 'login'
              ? 'Use sua conta para comprar e ver os ingressos.'
              : 'O cadastro cria uma conta de cliente.'}
          </p>
        </aside>

        <form className={styles.form} onSubmit={handleSubmit}>
          {from.includes('checkout') && (
            <p className={styles.notice}>
              Entre como cliente para concluir a compra.
            </p>
          )}
          {from.includes('portaria') && (
            <p className={styles.notice}>
              Entre com a conta de portaria para conferir os ingressos.
            </p>
          )}

          {mode === 'register' && (
            <label>
              Nome
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
                minLength={2}
              />
            </label>
          )}

          <label>
            E-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label>
            Senha
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={
                mode === 'login' ? 'current-password' : 'new-password'
              }
              required
              minLength={6}
            />
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" disabled={submitting}>
            {submitting
              ? 'Aguarde...'
              : mode === 'login'
                ? 'Entrar'
                : 'Criar conta'}
          </button>

          <button
            type="button"
            className={styles.switch}
            onClick={() => {
              setError(null);
              setMode((current) => (current === 'login' ? 'register' : 'login'));
            }}
          >
            {mode === 'login'
              ? 'Criar conta de cliente'
              : 'Já tenho conta'}
          </button>

          <details className={styles.accounts}>
            <summary>Contas para avaliação</summary>
            <ul>
              {TEST_ACCOUNTS.map((account) => (
                <li key={account.email}>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setEmail(account.email);
                      setPassword('senha123');
                    }}
                  >
                    {account.role}
                  </button>
                  <span>{account.email} · senha123</span>
                </li>
              ))}
            </ul>
          </details>

          <Link to="/" className={styles.back}>
            ← Voltar aos eventos
          </Link>
        </form>
      </article>
    </section>
  );
}
