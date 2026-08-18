import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import {
  emptyEventFilters,
  type EventFiltersValue,
} from '@/modules/events/types/event-filters';
import { formatEventDate, formatMoney } from '@/modules/events/utils/format';
import { filtersToSearchParams } from '@/modules/events/utils/filters';
import { mediaUrl } from '@/shared/utils/media';
import { getErrorMessage, isAbortError } from '@/shared/api/api-error';
import { ErrorAlert } from '@/shared/components/Feedback/ErrorAlert';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { CatalogSearchModal } from '../components/CatalogSearchModal';
import {
  listOrganizerEvents,
  searchCatalog,
  unpublishEvent,
} from '../services/organizer.service';
import type { OrganizerEvent } from '../types/organizer.types';
import type { EventSummary } from '@/modules/events/types/event.types';
import styles from './OrganizerPage.module.css';

export function OrganizerPage() {
  const navigate = useNavigate();
  const [published, setPublished] = useState<OrganizerEvent[]>([]);
  const [catalog, setCatalog] = useState<EventSummary[]>([]);
  const [filters, setFilters] = useState<EventFiltersValue>(
    emptyEventFilters({ sort: 'relevance,desc' }),
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingBoard, setLoadingBoard] = useState(true);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const keyword = useDebouncedValue(filters.keyword);
  const city = useDebouncedValue(filters.city);
  const queryKey = JSON.stringify({ ...filters, keyword, city });

  async function loadBoard() {
    setLoadingBoard(true);
    setError(null);

    try {
      setPublished(await listOrganizerEvents());
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível carregar o cartaz.'));
    } finally {
      setLoadingBoard(false);
    }
  }

  useEffect(() => {
    void loadBoard();
  }, []);

  useEffect(() => {
    if (!modalOpen) {
      return;
    }

    const controller = new AbortController();
    const nextFilters = JSON.parse(queryKey) as EventFiltersValue;
    void loadCatalog(nextFilters, controller.signal);

    return () => controller.abort();
  }, [modalOpen, queryKey]);

  async function loadCatalog(
    nextFilters: EventFiltersValue,
    signal?: AbortSignal,
  ) {
    setLoadingCatalog(true);
    setCatalogError(null);

    try {
      const response = await searchCatalog(
        filtersToSearchParams(nextFilters),
        signal,
      );
      setCatalog(response.events);
    } catch (err) {
      if (isAbortError(err)) {
        return;
      }

      setCatalog([]);
      setCatalogError(
        getErrorMessage(
          err,
          'Não foi possível buscar no catálogo Ticketmaster.',
        ),
      );
    } finally {
      if (!signal?.aborted) {
        setLoadingCatalog(false);
      }
    }
  }

  async function handleUnpublish(event: OrganizerEvent) {
    if (event.soldCount > 0) {
      return;
    }

    const confirmed = window.confirm(
      `Tirar "${event.name}" do cartaz? Os lugares voltam a ficar indisponíveis para compra.`,
    );

    if (!confirmed) {
      return;
    }

    setBusyId(event.id);
    setError(null);

    try {
      await unpublishEvent(event.id);
      await loadBoard();
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível tirar do cartaz.'));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.intro}>
        <p className={styles.kicker}>Casa</p>
        <h1>Montar o cartaz</h1>
        <p>
          Busque no catálogo Ticketmaster ou crie o evento do zero, com banner,
          data, local, capacidade e preço.
        </p>
      </header>

      {error && <ErrorAlert>{error}</ErrorAlert>}

      <section className={styles.board}>
        <div className={styles.boardHead}>
          <div>
            <h2>No cartaz</h2>
            <p>{published.length} evento(s) à venda</p>
          </div>
          <Box
            className={styles.toolbar}
            sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}
          >
            <TextField
              size="small"
              value={filters.keyword}
              onChange={(event) =>
                setFilters({ ...filters, keyword: event.target.value })
              }
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  setModalOpen(true);
                }
              }}
              placeholder="Buscar no catálogo"
              aria-label="Buscar no catálogo"
              sx={{ flex: '1 1 220px', minWidth: 180 }}
            />
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={() => setModalOpen(true)}
              disabled={loadingCatalog && modalOpen}
            >
              Buscar
            </Button>
            <Button
              component={Link}
              to="/organizar/novo"
              variant="outlined"
              startIcon={<AddIcon />}
            >
              Criar evento próprio
            </Button>
          </Box>
        </div>

        {loadingBoard && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} variant="rounded" height={260} width={280} />
            ))}
          </Box>
        )}

        {!loadingBoard && published.length === 0 && (
          <p className={styles.status}>
            Ainda não há nada colado no mural. Crie um evento próprio ou busque
            no catálogo.
          </p>
        )}

        {published.length > 0 && (
          <ul className={styles.flyers}>
            {published.map((event) => (
              <li key={event.id} className={styles.flyer}>
                <div className={styles.flyerCover}>
                  {mediaUrl(event.imageUrl) ? (
                    <img src={mediaUrl(event.imageUrl)} alt="" />
                  ) : (
                    <div className={styles.placeholder}>Sem arte</div>
                  )}
                </div>
                <div className={styles.flyerBody}>
                  <h3>{event.name}</h3>
                  <p>{formatEventDate(event.startDate, event.startTime)}</p>
                  <p>
                    {[event.venueName, event.venueCity, event.venueStateCode]
                      .filter(Boolean)
                      .join(' · ') || 'Local a definir'}
                  </p>
                  <p className={styles.price}>
                    {formatMoney(event.unitPrice, event.currency)}
                  </p>
                  <p className={styles.occupancy}>
                    {event.soldCount} vendidos · {event.availableCount} livres
                    · {event.capacity} lugares
                  </p>
                  <div className={styles.actions}>
                    <Link to={`/organizar/${encodeURIComponent(event.id)}/editar`}>
                      Ajustar
                    </Link>
                    <button
                      type="button"
                      disabled={event.soldCount > 0 || busyId === event.id}
                      onClick={() => void handleUnpublish(event)}
                    >
                      Tirar do cartaz
                    </button>
                  </div>
                  {event.soldCount > 0 && (
                    <p className={styles.hint}>
                      Com venda feita, o evento permanece no cartaz.
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <CatalogSearchModal
        open={modalOpen}
        filters={filters}
        loading={loadingCatalog}
        error={catalogError}
        events={catalog}
        onFiltersChange={setFilters}
        onClose={() => setModalOpen(false)}
        onSelect={(eventId) => {
          setModalOpen(false);
          navigate(`/organizar/novo/${encodeURIComponent(eventId)}`);
        }}
      />
    </section>
  );
}
