import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/modules/auth/context/AuthContext';
import {
  createReservation,
  getEventSeating,
} from '../services/events.service';
import type { EventSeating, Reservation, Seat } from '../types/event.types';
import { formatEventDate, formatMoney } from '../utils/format';
import styles from './EventCheckoutPage.module.css';

const MAX_SEATS = 6;

export function EventCheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { isClient, ready } = useAuth();
  const loginPath = `/entrar?from=${encodeURIComponent(location.pathname)}`;
  const [seating, setSeating] = useState<EventSeating | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Reservation | null>(null);

  async function loadSeating(eventId: string, silent = false) {
    if (!silent) {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await getEventSeating(eventId);
      setSeating(data);
    } catch (err) {
      setSeating(null);
      setError(
        err instanceof Error
          ? err.message
          : 'Falha ao carregar o mapa de assentos',
      );
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    if (!id) {
      setError('Evento não informado');
      setLoading(false);
      return;
    }

    void loadSeating(id);
  }, [id]);

  const selectedSeats = useMemo(() => {
    if (!seating) {
      return [];
    }

    return seating.rows
      .flatMap((row) => row.seats)
      .filter((seat) => selectedIds.includes(seat.id));
  }, [seating, selectedIds]);

  const total = seating
    ? selectedSeats.length * seating.event.unitPrice
    : 0;

  function toggleSeat(seat: Seat) {
    if (seat.status === 'SOLD' || result?.status === 'PAID') {
      return;
    }

    setResult(null);
    setError(null);
    setSelectedIds((current) => {
      if (current.includes(seat.id)) {
        return current.filter((item) => item !== seat.id);
      }

      if (current.length >= MAX_SEATS) {
        return current;
      }

      return [...current, seat.id];
    });
  }

  async function pay(paymentOutcome: 'approve' | 'decline') {
    if (!id || selectedIds.length === 0) {
      return;
    }

    if (!isClient) {
      navigate(loginPath);
      return;
    }

    setPaying(true);
    setError(null);

    try {
      const reservation = await createReservation({
        eventId: id,
        seatIds: selectedIds,
        paymentOutcome,
      });

      setResult(reservation);

      if (reservation.status === 'PAID') {
        await loadSeating(id, true);
        setSelectedIds([]);
      }
    } catch (err) {
      setResult(null);
      setError(
        err instanceof Error ? err.message : 'Falha ao processar o pagamento',
      );
      if (id) {
        await loadSeating(id, true);
      }
    } finally {
      setPaying(false);
    }
  }

  return (
    <section className={styles.page}>
      <Link to={id ? `/events/${encodeURIComponent(id)}` : '/'} className={styles.back}>
        ← Voltar ao evento
      </Link>

      {loading && <p className={styles.status}>Montando o mapa de assentos...</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && seating && (
        <>
          <header className={styles.header}>
            <div>
              <p className={styles.kicker}>Comprar ingressos</p>
              <h1>{seating.event.name}</h1>
              <p>
                {formatEventDate(
                  seating.event.startDate,
                  seating.event.startTime,
                )}
              </p>
              <p>
                {[
                  seating.event.venueName,
                  seating.event.venueCity,
                  seating.event.venueStateCode,
                ]
                  .filter(Boolean)
                  .join(' · ') || 'Local a definir'}
              </p>
            </div>
            <p className={styles.price}>
              {formatMoney(seating.event.unitPrice, seating.event.currency)}
              <span> por lugar</span>
            </p>
          </header>

          <div className={styles.layout}>
            <div className={styles.mapPanel}>
              <div className={styles.stage}>Palco</div>

              <div className={styles.map} role="grid" aria-label="Mapa de assentos">
                {seating.rows.map((row) => (
                  <div key={row.row} className={styles.row} role="row">
                    <span className={styles.rowLabel}>{row.row}</span>
                    <div className={styles.seats}>
                      {row.seats.map((seat) => {
                        const selected = selectedIds.includes(seat.id);
                        const sold = seat.status === 'SOLD';

                        return (
                          <button
                            key={seat.id}
                            type="button"
                            role="gridcell"
                            className={`${styles.seat} ${sold ? styles.sold : ''} ${selected ? styles.selected : ''}`}
                            disabled={sold || paying}
                            aria-pressed={selected}
                            aria-label={`Fileira ${seat.row} assento ${seat.number}${sold ? ', ocupado' : ''}`}
                            onClick={() => toggleSeat(seat)}
                          >
                            {seat.number}
                          </button>
                        );
                      })}
                    </div>
                    <span className={styles.rowLabel}>{row.row}</span>
                  </div>
                ))}
              </div>

              <ul className={styles.legend}>
                <li>
                  <span className={styles.seat} /> Livre
                </li>
                <li>
                  <span className={`${styles.seat} ${styles.selected}`} /> Escolhido
                </li>
                <li>
                  <span className={`${styles.seat} ${styles.sold}`} /> Ocupado
                </li>
              </ul>
              <p className={styles.hint}>
                {seating.availableCount} lugares livres · até {MAX_SEATS} por
                compra
              </p>
            </div>

            <aside className={styles.summary}>
              <h2>Seus lugares</h2>

              {selectedSeats.length === 0 ? (
                <p>Clique no mapa para escolher os assentos.</p>
              ) : (
                <ul className={styles.picked}>
                  {selectedSeats.map((seat) => (
                    <li key={seat.id}>
                      Fileira {seat.row} · Assento {seat.number}
                    </li>
                  ))}
                </ul>
              )}

              <p className={styles.total}>
                Total{' '}
                <strong>
                  {formatMoney(total, seating.event.currency)}
                </strong>
              </p>

              {ready && !isClient && (
                <p className={styles.notice}>
                  <Link to={loginPath}>Entre como cliente</Link> para pagar e
                  receber o QR do ingresso.
                </p>
              )}

              <button
                type="button"
                className={styles.pay}
                disabled={paying || selectedSeats.length === 0 || !isClient}
                onClick={() => void pay('approve')}
              >
                {paying ? 'Processando...' : 'Pagar e confirmar'}
              </button>
              <button
                type="button"
                className={styles.decline}
                disabled={paying || selectedSeats.length === 0 || !isClient}
                onClick={() => void pay('decline')}
              >
                Simular recusa
              </button>

              {result && (
                <p
                  className={
                    result.status === 'PAID' ? styles.success : styles.error
                  }
                >
                  {result.message}
                  {result.status === 'PAID' &&
                    ` Lugares: ${result.seats
                      .map((seat) => `${seat.row}${seat.number}`)
                      .join(', ')}.`}
                </p>
              )}

              {result?.status === 'PAID' && result.tickets?.length > 0 && (
                <div className={styles.issued}>
                  <p>Seus QRs</p>
                  <ul>
                    {result.tickets.map((ticket) => (
                      <li key={ticket.id}>
                        <img
                          src={ticket.qrImage}
                          alt={`QR ${ticket.code}`}
                        />
                        <span>
                          {ticket.code}
                          <br />
                          {ticket.seat.row}
                          {ticket.seat.number}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/meus-ingressos">Ver em meus ingressos</Link>
                </div>
              )}
            </aside>
          </div>
        </>
      )}
    </section>
  );
}
