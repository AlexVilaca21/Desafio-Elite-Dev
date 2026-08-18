import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Pagination from '@mui/material/Pagination';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { EventFilters } from '../components/EventFilters';
import {
  emptyEventFilters,
  type EventFiltersValue,
} from '../types/event-filters';
import { searchEvents } from '../services/events.service';
import type { EventSummary } from '../types/event.types';
import { filtersToSearchParams } from '../utils/filters';
import {
  formatEventDate,
  formatEventStatus,
  formatStartingPrice,
  formatVenue,
} from '../utils/format';
import { mediaUrl } from '@/shared/utils/media';
import { getErrorMessage, isAbortError } from '@/shared/api/api-error';
import { ErrorAlert } from '@/shared/components/Feedback/ErrorAlert';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import styles from './EventsListPage.module.css';

const PAGE_SIZE = 12;

export function EventsListPage() {
  const [filters, setFilters] = useState<EventFiltersValue>(emptyEventFilters());
  const [page, setPage] = useState(0);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const keyword = useDebouncedValue(filters.keyword);
  const city = useDebouncedValue(filters.city);
  const queryKey = JSON.stringify({ ...filters, keyword, city });

  useEffect(() => {
    const controller = new AbortController();
    const nextFilters = JSON.parse(queryKey) as EventFiltersValue;
    setPage(0);
    void loadEvents(0, nextFilters, controller.signal);

    return () => controller.abort();
  }, [queryKey]);

  async function loadEvents(
    nextPage: number,
    nextFilters: EventFiltersValue,
    signal?: AbortSignal,
  ) {
    setLoading(true);
    setError(null);

    try {
      const response = await searchEvents(
        filtersToSearchParams(nextFilters, {
          size: PAGE_SIZE,
          page: nextPage,
        }),
        signal,
      );

      setEvents(response.events);
      setTotal(response.page.totalElements);
      setTotalPages(response.page.totalPages);
      setPage(response.page.number);
    } catch (err) {
      if (isAbortError(err)) {
        return;
      }

      setEvents([]);
      setTotal(0);
      setTotalPages(0);
      setError(getErrorMessage(err, 'Não foi possível carregar os eventos.'));
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }

  const firstLoad = loading && events.length === 0 && !error;

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Cartaz</p>
          <h1>Eventos</h1>
          <p>
            Só entra no cartaz o que o organizador publicou, com data, local e
            preço
          </p>
        </div>
      </header>

      <EventFilters
        value={filters}
        loading={loading}
        onChange={setFilters}
      />

      {loading && <LinearProgress color="primary" />}
      {error && <ErrorAlert>{error}</ErrorAlert>}

      {firstLoad && (
        <ul className={styles.list}>
          {Array.from({ length: 6 }, (_, index) => (
            <li key={index}>
              <Skeleton variant="rounded" height={280} />
            </li>
          ))}
        </ul>
      )}

      {!loading && !error && events.length === 0 && (
        <p className={styles.status}>
          {keyword || city || filters.stateCode || filters.startDate
            ? 'Nenhum evento encontrado para esses filtros. Tente outro estado, cidade ou data.'
            : 'Ainda não há eventos no cartaz. O organizador publica a partir do catálogo.'}
        </p>
      )}

      {events.length > 0 && (
        <>
          <Typography className={styles.meta} color="text.secondary">
            {total} resultado(s)
          </Typography>
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
                      {mediaUrl(item.imageUrl) ? (
                        <img src={mediaUrl(item.imageUrl)} alt="" />
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
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Pagination
                count={totalPages}
                page={page + 1}
                disabled={loading}
                onChange={(_, next) => {
                  const nextPage = next - 1;
                  setPage(nextPage);
                  void loadEvents(nextPage, { ...filters, keyword, city });
                }}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </section>
  );
}
