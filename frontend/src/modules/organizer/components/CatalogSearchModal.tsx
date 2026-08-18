import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import { EventFilters } from '@/modules/events/components/EventFilters';
import type { EventFiltersValue } from '@/modules/events/types/event-filters';
import type { EventSummary } from '@/modules/events/types/event.types';
import {
  formatEventDate,
  formatStartingPrice,
  formatVenue,
} from '@/modules/events/utils/format';
import { ErrorAlert } from '@/shared/components/Feedback/ErrorAlert';
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
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
      aria-labelledby="catalog-search-title"
    >
      {loading && <LinearProgress />}
      <DialogTitle id="catalog-search-title" sx={{ pb: 1 }}>
        <Typography
          variant="overline"
          color="primary"
          sx={{ fontWeight: 700, letterSpacing: 1.4 }}
        >
          Catálogo Ticketmaster
        </Typography>
        <Typography variant="h5" component="h2">
          {filters.keyword.trim()
            ? `Resultados para “${filters.keyword.trim()}”`
            : 'Buscar eventos para o cartaz'}
        </Typography>
        {!loading && !error && (
          <Typography color="text.secondary">
            {events.length} evento(s) retornados pela API
          </Typography>
        )}
      </DialogTitle>
      <DialogContent dividers sx={{ px: { xs: 1.5, sm: 2.5 }, py: 2 }}>
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
      </DialogContent>
    </Dialog>
  );
}
