import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatEventDate, formatMoney, formatVenue } from '@/modules/events/utils/format';
import { mediaUrl } from '@/shared/utils/media';
import type { EventSummary } from '@/modules/events/types/event.types';
import {
  listOrganizerEvents,
  searchCatalog,
  unpublishEvent,
} from '../services/organizer.service';
import type { OrganizerEvent } from '../types/organizer.types';
import styles from './OrganizerPage.module.css';

export function OrganizerPage() {
  const navigate = useNavigate();
  const [published, setPublished] = useState<OrganizerEvent[]>([]);
  const [catalog, setCatalog] = useState<EventSummary[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loadingBoard, setLoadingBoard] = useState(true);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function loadBoard() {
    setLoadingBoard(true);
    setError(null);

    try {
      setPublished(await listOrganizerEvents());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível carregar o cartaz',
      );
    } finally {
      setLoadingBoard(false);
    }
  }

  useEffect(() => {
    void loadBoard();
  }, []);

  async function handleCatalogSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoadingCatalog(true);
    setCatalogError(null);

    try {
      const response = await searchCatalog({
        keyword: keyword.trim() || undefined,
        countryCode: 'BR',
        size: 8,
        page: 0,
      });
      setCatalog(response.events);
    } catch (err) {
      setCatalog([]);
      setCatalogError(
        err instanceof Error
          ? err.message
          : 'Falha ao buscar no catálogo Ticketmaster',
      );
    } finally {
      setLoadingCatalog(false);
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
      setError(
        err instanceof Error ? err.message : 'Não foi possível tirar do cartaz',
      );
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
          Escolha um show no catálogo Ticketmaster ou crie o evento do zero,
          com banner, data, local, capacidade e preço. Só o que você publicar
          aparece para o cliente.
        </p>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      <section className={styles.board}>
        <div className={styles.boardHead}>
          <div>
            <h2>No cartaz</h2>
            <p>{published.length} evento(s) à venda</p>
          </div>
          <Link to="/organizar/novo" className={styles.create}>
            Criar evento próprio
          </Link>
        </div>

        {loadingBoard && <p className={styles.status}>Carregando sua casa...</p>}

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

      <section className={styles.catalog}>
        <div className={styles.boardHead}>
          <h2>Do catálogo</h2>
          <p>Ticketmaster — escolha o show e publique na casa</p>
        </div>

        <form className={styles.search} onSubmit={handleCatalogSearch}>
          <input
            type="search"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Artista, show ou cidade"
            aria-label="Buscar no catálogo"
          />
          <button type="submit" disabled={loadingCatalog}>
            {loadingCatalog ? 'Buscando...' : 'Buscar catálogo'}
          </button>
        </form>

        {catalogError && <p className={styles.error}>{catalogError}</p>}

        {catalog.length > 0 && (
          <ul className={styles.catalogList}>
            {catalog.map((event) => {
              const alreadyOut = event.status === 'published';

              return (
                <li key={event.id}>
                  <article className={styles.catalogCard}>
                    {event.imageUrl ? (
                      <img src={event.imageUrl} alt="" />
                    ) : (
                      <div className={styles.placeholder}>Sem arte</div>
                    )}
                    <div>
                      <h3>{event.name}</h3>
                      <p>{formatEventDate(event.startDate, event.startTime)}</p>
                      <p>{formatVenue(event.venue)}</p>
                      {alreadyOut ? (
                        <p className={styles.hint}>Já está no cartaz</p>
                      ) : (
                        <button
                          type="button"
                          className={styles.publish}
                          onClick={() =>
                            navigate(
                              `/organizar/novo/${encodeURIComponent(event.id)}`,
                            )
                          }
                        >
                          Colocar no cartaz
                        </button>
                      )}
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </section>
  );
}
