import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { BRAZIL_STATES } from '../constants/states';
import { searchEvents } from '../services/events.service';
import type { EventSummary } from '../types/event.types';
import {
  formatEventDate,
  formatEventStatus,
  formatStartingPrice,
  formatVenue,
} from '../utils/format';
import styles from './EventsListPage.module.css';

const PAGE_SIZE = 12;

type EventFilters = {
  keyword: string;
  stateCode: string;
  city: string;
};

export function EventsListPage() {
  const [keyword, setKeyword] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [city, setCity] = useState('');
  const [page, setPage] = useState(0);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadEvents(nextPage: number, filters: EventFilters) {
    setLoading(true);
    setError(null);

    try {
      const response = await searchEvents({
        keyword: filters.keyword.trim() || undefined,
        stateCode: filters.stateCode || undefined,
        city: filters.city.trim() || undefined,
        countryCode: 'BR',
        size: PAGE_SIZE,
        page: nextPage,
      });

      setEvents(response.events);
      setTotal(response.page.totalElements);
      setTotalPages(response.page.totalPages);
      setPage(response.page.number);
    } catch (err) {
      setEvents([]);
      setTotal(0);
      setTotalPages(0);
      setError(
        err instanceof Error ? err.message : 'Falha ao carregar eventos',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEvents(0, { keyword: '', stateCode: '', city: '' });
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadEvents(0, { keyword, stateCode, city });
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Cartaz</p>
          <h1>Eventos</h1>
          <p>Busque o evento e escolha os lugares no mapa para comprar</p>
        </div>

        <form className={styles.search} onSubmit={handleSubmit}>
          <input
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Nome do evento ou artista"
            aria-label="Buscar evento"
          />
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Cidade"
            aria-label="Cidade"
          />
          <select
            value={stateCode}
            onChange={(e) => setStateCode(e.target.value)}
            aria-label="Estado"
          >
            <option value="">Todos os estados</option>
            {BRAZIL_STATES.map((state) => (
              <option key={state.code} value={state.code}>
                {state.name}
              </option>
            ))}
          </select>
          <button type="submit" disabled={loading}>
            Buscar
          </button>
        </form>
      </header>

      {loading && <p className={styles.status}>Carregando eventos...</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && !error && events.length === 0 && (
        <p className={styles.status}>
          Nenhum evento encontrado. Tente outro estado, cidade ou palavra-chave.
        </p>
      )}

      {!loading && !error && events.length > 0 && (
        <>
          <p className={styles.meta}>{total} resultado(s)</p>
          <ul className={styles.list}>
            {events.map((item) => {
              const status = formatEventStatus(item.status);
              const price = formatStartingPrice(item.priceRanges);

              return (
                <li key={item.id}>
                  <Link
                    to={`/events/${encodeURIComponent(item.id)}`}
                    className={styles.card}
                  >
                    <div className={styles.cover}>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="" />
                      ) : (
                        <div className={styles.placeholder}>Sem imagem</div>
                      )}
                      <span className={styles.date}>
                        {formatEventDate(item.startDate, item.startTime)}
                      </span>
                    </div>
                    <div className={styles.content}>
                      <h2>{item.name}</h2>
                      <p>{formatVenue(item.venue)}</p>
                      {price && <p className={styles.price}>{price}</p>}
                      {item.classification?.genre && (
                        <p>{item.classification.genre}</p>
                      )}
                      {item.attractions.length > 0 && (
                        <p className={styles.attractions}>
                          {item.attractions.join(', ')}
                        </p>
                      )}
                      <span className={styles.select}>
                        {status ? `${status} · Ver evento` : 'Ver evento'}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                type="button"
                disabled={loading || page <= 0}
                onClick={() => void loadEvents(page - 1, { keyword, stateCode, city })}
              >
                Anterior
              </button>
              <span>
                Página {page + 1} de {totalPages}
              </span>
              <button
                type="button"
                disabled={loading || page + 1 >= totalPages}
                onClick={() => void loadEvents(page + 1, { keyword, stateCode, city })}
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
