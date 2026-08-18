import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { TicketCard } from '../components/TicketCard';
import { getSharedTicket } from '../services/tickets.service';
import type { Ticket } from '../types/ticket.types';
import styles from './MyTicketsPage.module.css';

export function SharedTicketPage() {
  const { token } = useParams<{ token: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Link inválido');
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load(shareToken: string) {
      setLoading(true);
      setError(null);

      try {
        const data = await getSharedTicket(shareToken);
        if (!cancelled) {
          setTicket(data);
        }
      } catch (err) {
        if (!cancelled) {
          setTicket(null);
          setError(
            err instanceof Error ? err.message : 'Ingresso compartilhado inválido',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load(token);

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <section className={styles.page}>
      <header>
        <h1>Ingresso compartilhado</h1>
        <p>Este QR vale na entrada do evento.</p>
      </header>

      {loading && <p className={styles.status}>Carregando ingresso...</p>}
      {error && <p className={styles.error}>{error}</p>}
      {ticket && <TicketCard ticket={ticket} />}

      <Link to="/" className={styles.status}>
        ← Ver eventos
      </Link>
    </section>
  );
}
