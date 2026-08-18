import { useEffect, useRef, useState, type FormEvent } from 'react';
import { formatEventDate } from '@/modules/events/utils/format';
import { QrScanner } from '../components/QrScanner';
import { listGateEvents, validateTicket } from '../services/gate.service';
import type {
  GateEvent,
  GateResultKind,
  GateValidation,
} from '../types/gate.types';
import styles from './GatePage.module.css';

const EVENT_STORAGE_KEY = 'elite.gate.eventId';

const RESULT_COPY: Record<
  GateResultKind,
  { title: string; hint: string; stamp: string }
> = {
  VALID: {
    title: 'Pode entrar',
    hint: 'Ingresso válido',
    stamp: styles.valid,
  },
  INVALID: {
    title: 'Não entra',
    hint: 'Ingresso inválido',
    stamp: styles.invalid,
  },
  ALREADY_USED: {
    title: 'Já utilizado',
    hint: 'Este QR já passou na porta',
    stamp: styles.alreadyUsed,
  },
  WRONG_EVENT: {
    title: 'Evento errado',
    hint: 'Este ingresso é de outro evento',
    stamp: styles.wrongEvent,
  },
};

function storedEventId(): string {
  try {
    return sessionStorage.getItem(EVENT_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

export function GatePage() {
  const [events, setEvents] = useState<GateEvent[]>([]);
  const [eventId, setEventId] = useState(storedEventId);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<GateValidation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastScan = useRef('');

  const selected = events.find((event) => event.id === eventId);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadingEvents(true);
      setEventsError(null);

      try {
        const data = await listGateEvents();
        if (cancelled) {
          return;
        }

        setEvents(data);

        setEventId((current) => {
          if (current && data.some((event) => event.id === current)) {
            return current;
          }
          return data.length === 1 ? data[0].id : '';
        });
      } catch (err) {
        if (!cancelled) {
          setEventsError(
            err instanceof Error
              ? err.message
              : 'Não foi possível carregar os eventos da porta.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingEvents(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    try {
      if (eventId) {
        sessionStorage.setItem(EVENT_STORAGE_KEY, eventId);
      }
    } catch {
      // ignore private mode
    }
  }, [eventId]);

  async function submit(payload: { qrPayload?: string; code?: string }) {
    if (busy) {
      return;
    }

    setBusy(true);
    setError(null);
    setScanning(false);

    try {
      const data = await validateTicket({
        ...payload,
        eventId: eventId || undefined,
      });
      setResult(data);
      setCode('');
    } catch (err) {
      lastScan.current = '';
      setResult(null);
      setError(
        err instanceof Error ? err.message : 'Falha ao validar o ingresso',
      );
    } finally {
      setBusy(false);
    }
  }

  function handleScan(value: string) {
    if (!value || value === lastScan.current || busy) {
      return;
    }

    lastScan.current = value;
    void submit({ qrPayload: value });
  }

  function handleManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = code.trim();

    if (!trimmed) {
      setError('Digite o código impresso no ingresso.');
      return;
    }

    void submit(
      trimmed.includes('.') ? { qrPayload: trimmed } : { code: trimmed },
    );
  }

  function nextTicket() {
    lastScan.current = '';
    setResult(null);
    setError(null);
    setScanning(true);
  }

  return (
    <section className={styles.page}>
      <header className={styles.intro}>
        <p className={styles.kicker}>Porta</p>
        <h1>Conferir ingresso</h1>
        <p>
          Escolha o evento da fila, leia o QR ou digite o código. A resposta
          precisa ser imediata: válido, inválido, já utilizado ou evento errado.
        </p>
      </header>

      <label className={styles.eventField}>
        Evento desta porta
        <select
          value={eventId}
          onChange={(event) => {
            setEventId(event.target.value);
            setResult(null);
          }}
          disabled={loadingEvents || events.length === 0}
        >
          <option value="">
            {loadingEvents
              ? 'Carregando eventos...'
              : events.length === 0
                ? 'Nenhum evento publicado'
                : 'Selecione o evento'}
          </option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name}
            </option>
          ))}
        </select>
      </label>

      {eventsError && <p className={styles.error}>{eventsError}</p>}

      {selected && (
        <p className={styles.eventMeta}>
          {formatEventDate(selected.startDate, selected.startTime)}
          {selected.venueName ? ` · ${selected.venueName}` : ''}
          {selected.venueCity ? ` · ${selected.venueCity}` : ''}
          <span>
            {selected.usedCount} já entraram · {selected.validCount} ainda
            válidos
          </span>
        </p>
      )}

      {!eventId && !loadingEvents && events.length > 0 && (
        <p className={styles.notice}>
          Sem o evento da porta, não dá para saber se o ingresso é de outra
          sessão.
        </p>
      )}

      <div className={styles.board}>
        {scanning ? (
          <QrScanner
            active={!result && !busy}
            onScan={handleScan}
            onError={setCameraError}
          />
        ) : (
          <div className={styles.idleCamera}>
            <p>Use a câmera traseira, como na catraca.</p>
            <button
              type="button"
              className={styles.primary}
              onClick={() => {
                setCameraError(null);
                setResult(null);
                setScanning(true);
              }}
            >
              Ler QR
            </button>
          </div>
        )}

        {cameraError && <p className={styles.error}>{cameraError}</p>}

        {scanning && !result && (
          <button
            type="button"
            className={styles.ghost}
            onClick={() => setScanning(false)}
          >
            Fechar câmera
          </button>
        )}
      </div>

      <form className={styles.manual} onSubmit={handleManual}>
        <label>
          Código do ingresso
          <input
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="Ex.: A1B2C3D4E5F6"
            autoComplete="off"
            spellCheck={false}
            inputMode="text"
          />
        </label>
        <button type="submit" className={styles.primary} disabled={busy}>
          {busy ? 'Conferindo...' : 'Validar código'}
        </button>
      </form>

      {error && <p className={styles.error}>{error}</p>}

      {result && (
        <article
          className={`${styles.stamp} ${RESULT_COPY[result.result].stamp}`}
          aria-live="assertive"
        >
          <p className={styles.stampKicker}>{RESULT_COPY[result.result].hint}</p>
          <h2>{RESULT_COPY[result.result].title}</h2>
          <p>{result.message}</p>
          {result.ticket && (
            <dl>
              <div>
                <dt>Evento</dt>
                <dd>{result.ticket.event.name}</dd>
              </div>
              <div>
                <dt>Lugar</dt>
                <dd>
                  Fileira {result.ticket.seat.row} · Assento{' '}
                  {result.ticket.seat.number}
                </dd>
              </div>
              <div>
                <dt>Código</dt>
                <dd>{result.ticket.code}</dd>
              </div>
            </dl>
          )}
          <button type="button" className={styles.next} onClick={nextTicket}>
            Próximo ingresso
          </button>
        </article>
      )}
    </section>
  );
}
