import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getEventById } from '../services/events.service';
import type { EventDetail } from '../types/event.types';
import {
  formatEventDate,
  formatEventStatus,
  formatPriceRange,
} from '../utils/format';
import styles from './EventDetailPage.module.css';

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Evento não informado');
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadEvent(eventId: string) {
      setLoading(true);
      setError(null);

      try {
        const detail = await getEventById(eventId);
        if (!cancelled) {
          setEvent(detail);
        }
      } catch (err) {
        if (!cancelled) {
          setEvent(null);
          setError(
            err instanceof Error ? err.message : 'Falha ao carregar o evento',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadEvent(id);

    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <section className={styles.page}>
      <Link to="/" className={styles.back}>
        ← Voltar aos eventos
      </Link>

      {loading && <p className={styles.status}>Carregando evento...</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && !error && event && (
        <article>
          <div className={styles.hero}>
            {event.imageUrl ? (
              <img src={event.imageUrl} alt="" className={styles.cover} />
            ) : (
              <div className={styles.placeholder}>Sem imagem</div>
            )}

            <div className={styles.summary}>
              <h1>{event.name}</h1>
              <p>{formatEventDate(event.startDate, event.startTime)}</p>
              {event.status && (
                <p className={styles.badge}>{formatEventStatus(event.status)}</p>
              )}
              {event.classification && (
                <p>
                  {[
                    event.classification.segment,
                    event.classification.genre,
                    event.classification.subGenre,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              )}
              {event.attractions.length > 0 && (
                <p className={styles.attractions}>
                  {event.attractions.join(', ')}
                </p>
              )}
              <Link
                className={styles.cta}
                to={`/events/${encodeURIComponent(event.id)}/checkout`}
              >
                Comprar ingressos
              </Link>
            </div>
          </div>

          {event.venue && (
            <section className={styles.block}>
              <h2>Local</h2>
              <p>{event.venue.name}</p>
              <p>
                {[
                  event.venue.address,
                  event.venue.city,
                  event.venue.state,
                  event.venue.stateCode,
                  event.venue.postalCode,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </section>
          )}

          {event.priceRanges && event.priceRanges.length > 0 && (
            <section className={styles.block}>
              <h2>Preços</h2>
              <ul className={styles.prices}>
                {event.priceRanges.map((range) => (
                  <li key={`${range.type}-${range.currency}-${range.min}`}>
                    {range.type}:{' '}
                    {formatPriceRange(range.min, range.max, range.currency)}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {event.description && (
            <section className={styles.block}>
              <h2>Sobre o evento</h2>
              <p>{event.description}</p>
            </section>
          )}

          {event.info && (
            <section className={styles.block}>
              <h2>Informações</h2>
              <p>{event.info}</p>
            </section>
          )}

          {event.pleaseNote && (
            <section className={styles.block}>
              <h2>Observações</h2>
              <p>{event.pleaseNote}</p>
            </section>
          )}

          {event.seatmapUrl && (
            <section className={styles.block}>
              <h2>Mapa de assentos</h2>
              <img
                src={event.seatmapUrl}
                alt={`Mapa de assentos de ${event.name}`}
                className={styles.seatmap}
              />
            </section>
          )}
        </article>
      )}
    </section>
  );
}
