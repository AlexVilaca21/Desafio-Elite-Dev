import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import { EventFilters } from '@/modules/events/components/EventFilters';
import type { EventFiltersValue } from '@/modules/events/types/event-filters';
import type { EventSummary } from '@/modules/events/types/event.types';
import {
  formatEventDate,
  formatStartingPrice,
  formatVenue,
} from '@/modules/events/utils/format';
import { ErrorAlert } from '@/shared/components/Feedback/ErrorAlert';
import { AppModal } from '@/shared/components/Modal/AppModal';
import styles from './CatalogSearchModal.module.css';

type CatalogSearchModalProps = {
  open: boolean;
  filters: EventFiltersValue;
  loading: boolean;
  error: string | null;
  events: EventSummary[];
  onClose: () => void;
  onFiltersChange: (next: EventFiltersValue) => void;
  onSelect: (eventId: string) => void;
};

export function CatalogSearchModal({
  open,
  filters,
  loading,
  error,
  events,
  onClose,
  onFiltersChange,
  onSelect,
}: CatalogSearchModalProps) {
  const keyword = filters.keyword.trim();

  return (
    <AppModal
      open={open}
      onClose={onClose}
      maxWidth="md"
      titleId="catalog-search-title"
      kicker="Catálogo Ticketmaster"
      title={
        keyword
          ? `Resultados para “${keyword}”`
          : 'Buscar eventos para o cartaz'
      }
      subtitle={
        !loading && !error
          ? `${events.length} show(s) no catálogo Ticketmaster`
          : undefined
      }
      headerExtra={loading ? <LinearProgress /> : null}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <EventFilters
          value={filters}
          loading={loading}
          showGenre
          catalog
          onChange={onFiltersChange}
        />

        {error && <ErrorAlert>{error}</ErrorAlert>}

        {!loading && !error && events.length === 0 && (
          <Alert severity="info" variant="outlined">
            Nenhum evento encontrado para esses filtros.
          </Alert>
        )}

        {!error && events.length > 0 && (
          <ul className={styles.list}>
            {events.map((event) => {
              const alreadyOut = event.status === 'published';
              const price = formatStartingPrice(event.priceRanges);

              return (
                <li key={event.id}>
                  <article className={styles.card}>
                    {event.imageUrl ? (
                      <img src={event.imageUrl} alt="" />
                    ) : (
                      <Box className={styles.placeholder}>Sem arte</Box>
                    )}
                    <div className={styles.meta}>
                      <h3>{event.name}</h3>
                      <p>
                        {formatEventDate(event.startDate, event.startTime)}
                      </p>
                      <p>{formatVenue(event.venue)}</p>
                      {price && <p className={styles.price}>{price}</p>}
                      {alreadyOut ? (
                        <p className={styles.hint}>Já está no cartaz</p>
                      ) : (
                        <Button
                          variant="contained"
                          onClick={() => onSelect(event.id)}
                        >
                          Colocar no cartaz
                        </Button>
                      )}
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </Box>
    </AppModal>
  );
}
