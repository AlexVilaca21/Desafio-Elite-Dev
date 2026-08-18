import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TicketCard } from '../components/TicketCard';
import { listMyTickets } from '../services/tickets.service';
import type { Ticket } from '../types/ticket.types';
import styles from './MyTicketsPage.module.css';

export function MyTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await listMyTickets();
        if (!cancelled) {
          setTickets(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Falha ao carregar ingressos',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className={styles.page}>
      <header>
        <p className={styles.kicker}>Carteira</p>
        <h1>Meus ingressos</h1>
        <p>Mostre o QR na entrada ou compartilhe o ingresso por link.</p>
      </header>

      {loading && <p className={styles.status}>Carregando seus ingressos...</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && !error && tickets.length === 0 && (
        <p className={styles.status}>
          Você ainda não tem ingressos.{' '}
          <Link to="/">Escolher um evento</Link>
        </p>
      )}

      {!loading && !error && tickets.length > 0 && (
        <ul className={styles.list}>
          {tickets.map((ticket) => (
            <li key={ticket.id}>
              <TicketCard ticket={ticket} shareable />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
