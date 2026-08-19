import { useEffect, useState } from 'react';
import { getErrorMessage } from '@/shared/api/api-error';
import { env } from '@/shared/config/env';
import { getEventSeating } from '../services/events.service';
import type { EventSeating } from '../types/event.types';

type LiveSeating = {
  seating: EventSeating | null;
  loading: boolean;
  error: string | null;
  live: boolean;
  refresh: () => Promise<void>;
};

export function useLiveSeating(eventId: string | undefined): LiveSeating {
  const [seating, setSeating] = useState<EventSeating | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (!eventId) {
      setError('Evento não informado');
      setLoading(false);
      return;
    }

    const id = eventId;
    let cancelled = false;
    let source: EventSource | null = null;
    let pollTimer: number | undefined;

    async function load(silent = false) {
      if (!silent) {
        setLoading(true);
      }

      try {
        const data = await getEventSeating(id);
        if (!cancelled) {
          setSeating(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            getErrorMessage(err, 'Falha ao carregar o mapa de assentos'),
          );
        }
      } finally {
        if (!cancelled && !silent) {
          setLoading(false);
        }
      }
    }

    function stopPoll() {
      if (pollTimer !== undefined) {
        window.clearInterval(pollTimer);
        pollTimer = undefined;
      }
    }

    function startPoll() {
      setLive(false);
      stopPoll();
      pollTimer = window.setInterval(() => {
        void load(true);
      }, 3000);
    }

    void load();

    try {
      source = new EventSource(
        `${env.apiUrl}/events/${encodeURIComponent(id)}/seating/stream`,
      );
      source.onopen = () => {
        if (!cancelled) {
          setLive(true);
          stopPoll();
        }
      };
      source.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as EventSeating;
          if (!cancelled) {
            setSeating(data);
            setLoading(false);
            setError(null);
            setLive(true);
            stopPoll();
          }
        } catch {
          // ignore a malformed payload and keep the last good map
        }
      };
      source.onerror = () => {
        if (!cancelled) {
          startPoll();
        }
      };
    } catch {
      startPoll();
    }

    return () => {
      cancelled = true;
      source?.close();
      stopPoll();
    };
  }, [eventId]);

  return {
    seating,
    loading,
    error,
    live,
    refresh: async () => {
      if (!eventId) {
        return;
      }

      try {
        setSeating(await getEventSeating(eventId));
        setError(null);
      } catch (err) {
        setError(getErrorMessage(err, 'Falha ao carregar o mapa de assentos'));
      }
    },
  };
}
