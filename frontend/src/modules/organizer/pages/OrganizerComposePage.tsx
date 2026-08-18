import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BRAZIL_STATES } from '@/modules/events/constants/states';
import { formatStartingPrice } from '@/modules/events/utils/format';
import { mediaUrl } from '@/shared/utils/media';
import {
  createCustomEvent,
  getCatalogEvent,
  getOrganizerEvent,
  publishEvent,
  updateEvent,
} from '../services/organizer.service';
import styles from './OrganizerComposePage.module.css';

type FormState = {
  name: string;
  description: string;
  startDate: string;
  startTime: string;
  venueName: string;
  venueCity: string;
  venueStateCode: string;
  unitPrice: string;
  capacity: string;
};

function timeToInput(value?: string): string {
  return value ? value.slice(0, 5) : '';
}

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  startDate: '',
  startTime: '',
  venueName: '',
  venueCity: '',
  venueStateCode: '',
  unitPrice: '150',
  capacity: '96',
};

export function OrganizerComposePage() {
  const { catalogId, eventId } = useParams<{
    catalogId?: string;
    eventId?: string;
  }>();
  const navigate = useNavigate();
  const isEdit = Boolean(eventId);
  const isCustom = !isEdit && !catalogId;
  const [title, setTitle] = useState(
    isCustom ? 'Evento da casa' : 'Publicar evento',
  );
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | undefined>();
  const [hint, setHint] = useState<string | null>(null);
  const [soldCount, setSoldCount] = useState(0);
  const [loading, setLoading] = useState(!isCustom);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  useEffect(() => {
    if (!bannerFile) {
      setBannerPreview(undefined);
      return;
    }

    const preview = URL.createObjectURL(bannerFile);
    setBannerPreview(preview);

    return () => URL.revokeObjectURL(preview);
  }, [bannerFile]);

  useEffect(() => {
    if (isCustom) {
      return;
    }

    const targetId = eventId ?? catalogId;

    if (!targetId) {
      setError('Evento não informado');
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        if (isEdit && eventId) {
          const event = await getOrganizerEvent(eventId);
          if (cancelled) {
            return;
          }

          setTitle(event.name);
          setImageUrl(event.imageUrl);
          setSoldCount(event.soldCount);
          setForm({
            name: event.name,
            description: event.description ?? '',
            startDate: event.startDate ?? '',
            startTime: timeToInput(event.startTime),
            venueName: event.venueName ?? '',
            venueCity: event.venueCity ?? '',
            venueStateCode: event.venueStateCode ?? '',
            unitPrice: String(event.unitPrice),
            capacity: String(event.capacity),
          });
          return;
        }

        if (!catalogId) {
          return;
        }

        const catalog = await getCatalogEvent(catalogId);
        if (cancelled) {
          return;
        }

        if (catalog.status === 'published') {
          navigate(`/organizar/${encodeURIComponent(catalog.id)}/editar`, {
            replace: true,
          });
          return;
        }

        const suggested = catalog.priceRanges[0]?.min;
        setTitle(catalog.name);
        setImageUrl(catalog.imageUrl);
        setHint(formatStartingPrice(catalog.priceRanges) ?? null);
        setForm({
          name: catalog.name,
          description: catalog.description ?? '',
          startDate: catalog.startDate ?? '',
          startTime: timeToInput(catalog.startTime),
          venueName: catalog.venue?.name ?? '',
          venueCity: catalog.venue?.city ?? '',
          venueStateCode: catalog.venue?.stateCode ?? '',
          unitPrice: suggested ? String(suggested) : '150',
          capacity: '96',
        });
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Não foi possível abrir este evento',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [catalogId, eventId, isCustom, isEdit, navigate]);

  const canChangeCapacity = !isEdit || soldCount === 0;
  const posterSrc = bannerPreview ?? mediaUrl(imageUrl);

  const payload = useMemo(
    () => ({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      startDate: form.startDate,
      startTime: form.startTime || undefined,
      venueName: form.venueName.trim(),
      venueCity: form.venueCity.trim() || undefined,
      venueStateCode: form.venueStateCode || undefined,
      unitPrice: Number(form.unitPrice),
      capacity: Number(form.capacity),
    }),
    [form],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (isCustom) {
        if (!bannerFile) {
          setError('Envie o banner do evento');
          setSaving(false);
          return;
        }

        await createCustomEvent({ ...payload, currency: 'BRL' }, bannerFile);
      } else if (isEdit && eventId) {
        await updateEvent(
          eventId,
          {
            ...payload,
            capacity: canChangeCapacity ? payload.capacity : undefined,
          },
          bannerFile ?? undefined,
        );
      } else if (catalogId) {
        await publishEvent({
          ticketmasterId: catalogId,
          currency: 'BRL',
          startDate: payload.startDate,
          startTime: payload.startTime,
          venueName: payload.venueName,
          venueCity: payload.venueCity,
          venueStateCode: payload.venueStateCode,
          unitPrice: payload.unitPrice,
          capacity: payload.capacity,
        });
      }

      navigate('/organizar', { replace: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Não foi possível salvar o evento',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={styles.page}>
      <Link to="/organizar" className={styles.back}>
        ← Voltar ao cartaz
      </Link>

      <header className={styles.intro}>
        <p className={styles.kicker}>
          {isEdit ? 'Ajuste' : isCustom ? 'Da casa' : 'Publicar'}
        </p>
        <h1>
          {isEdit
            ? 'Afinar o cartaz'
            : isCustom
              ? 'Criar evento próprio'
              : 'Colocar no cartaz'}
        </h1>
        <p>
          {isCustom
            ? 'Nome, banner, data, local, capacidade e preço — tudo preenchido por você, sem o catálogo.'
            : 'Data, casa, quantos lugares e quanto custa. O catálogo só empresta o show; a venda é daqui.'}
        </p>
      </header>

      {loading && <p className={styles.status}>Montando a ficha...</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && (isCustom || !error || Boolean(form.name)) && (
        <article className={styles.sheet}>
          <aside className={styles.poster}>
            {posterSrc ? (
              <img src={posterSrc} alt="" />
            ) : (
              <div className={styles.placeholder}>Banner</div>
            )}
            <h2>{form.name || title}</h2>
            {hint && <p>{hint} no catálogo</p>}
          </aside>

          <form className={styles.form} onSubmit={handleSubmit}>
            {(isCustom || isEdit) && (
              <label className={styles.wide}>
                Nome do evento
                <input
                  required
                  minLength={2}
                  maxLength={140}
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </label>
            )}

            <label className={styles.wide}>
              Banner
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required={isCustom}
                onChange={(event) =>
                  setBannerFile(event.target.files?.[0] ?? null)
                }
              />
            </label>

            {(isCustom || isEdit) && (
              <label className={styles.wide}>
                Sobre o evento
                <textarea
                  rows={4}
                  maxLength={4000}
                  value={form.description}
                  placeholder="O que o público vai encontrar na casa"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </label>
            )}

            <label>
              Data
              <input
                type="date"
                required
                value={form.startDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    startDate: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              Horário
              <input
                type="time"
                value={form.startTime}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    startTime: event.target.value,
                  }))
                }
              />
            </label>
            <label className={styles.wide}>
              Local
              <input
                required
                value={form.venueName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    venueName: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              Cidade
              <input
                value={form.venueCity}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    venueCity: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              Estado
              <select
                value={form.venueStateCode}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    venueStateCode: event.target.value,
                  }))
                }
              >
                <option value="">Não informado</option>
                {BRAZIL_STATES.map((state) => (
                  <option key={state.code} value={state.code}>
                    {state.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Preço do ingresso (R$)
              <input
                type="number"
                required
                min={1}
                max={9999}
                step="1"
                value={form.unitPrice}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    unitPrice: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              Capacidade
              <input
                type="number"
                required
                min={12}
                max={144}
                step="1"
                disabled={!canChangeCapacity}
                value={form.capacity}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    capacity: event.target.value,
                  }))
                }
              />
            </label>
            {!canChangeCapacity && (
              <p className={styles.hint}>
                A capacidade trava depois da primeira venda, para não apagar
                lugares ocupados.
              </p>
            )}
            <p className={styles.hint}>De 12 a 144 lugares, em fileiras de 12.</p>

            <button type="submit" disabled={saving}>
              {saving
                ? 'Salvando...'
                : isEdit
                  ? 'Salvar no cartaz'
                  : 'Publicar evento'}
            </button>
          </form>
        </article>
      )}
    </section>
  );
}
