import { useEffect, useState, type FormEvent } from 'react';
import { searchEvents } from '../services/events.service';
import type { EventSummary } from '../types/event.types';
import styles from './EventsListPage.module.css';

export function EventsListPage() {
  const [keyword, setKeyword] = useState('music');
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadEvents(searchKeyword = keyword) {
    setLoading(true);
    setError(null);

    try {
      const response = await searchEvents({
        keyword: searchKeyword,
        size: 12,
        page: 0,
      });

      setEvents(response.events);
      setTotal(response.page.totalElements);
    } catch (err) {
      setEvents([]);
      setTotal(0);
      setError(
        err instanceof Error ? err.message : 'Falha ao carregar eventos',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEvents('music');
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadEvents(keyword);
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Eventos</h1>
          <p>Catálogo via Ticketmaster Discovery API</p>
        </div>

        <form className={styles.search} onSubmit={handleSubmit}>
          <input
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Buscar evento..."
            aria-label="Buscar evento"
          />
          <button type="submit" disabled={loading}>
            Buscar
          </button>
        </form>
      </header>

      {loading && <p className={styles.status}>Carregando eventos...</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && !error && (
        <>
          <p className={styles.meta}>{total} resultado(s)</p>
          <ul className={styles.list}>
            {events.map((item) => (
              <li key={item.id} className={styles.card}>
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} />
                ) : (
                  <div className={styles.placeholder}>Sem imagem</div>
                )}
                <div className={styles.content}>
                  <h2>{item.name}</h2>
                  <p>
                    {[item.startDate, item.startTime].filter(Boolean).join(' · ') ||
                      'Data a definir'}
                  </p>
                  <p>
                    {item.venue
                      ? [item.venue.name, item.venue.city, item.venue.stateCode]
                          .filter(Boolean)
                          .join(' · ')
                      : 'Local a definir'}
                  </p>
                  {item.attractions.length > 0 && (
                    <p className={styles.attractions}>
                      {item.attractions.join(', ')}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
