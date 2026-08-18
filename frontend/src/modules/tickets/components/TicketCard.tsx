import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { formatEventDate } from '@/modules/events/utils/format';
import { getErrorMessage } from '@/shared/api/api-error';
import { ConfirmModal } from '@/shared/components/Modal/ConfirmModal';
import { cancelTicket, shareTicket } from '../services/tickets.service';
import type { Ticket } from '../types/ticket.types';
import { QrLightbox } from './QrLightbox';
import styles from './TicketCard.module.css';

type TicketCardProps = {
  ticket: Ticket;
  shareable?: boolean;
  cancellable?: boolean;
  onCancelled?: (ticket: Ticket) => void;
};

function statusLabel(status: Ticket['status']): string {
  if (status === 'USED') {
    return 'Utilizado';
  }

  if (status === 'CANCELLED') {
    return 'Cancelado';
  }

  return 'Válido';
}

export function TicketCard({
  ticket,
  shareable = false,
  cancellable = false,
  onCancelled,
}: TicketCardProps) {
  const [copied, setCopied] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const cancelled = ticket.status === 'CANCELLED';
  const venue = [
    ticket.event.venueName,
    ticket.event.venueCity,
    ticket.event.venueStateCode,
  ]
    .filter(Boolean)
    .join(' · ');

  async function copyShareLink() {
    let token = ticket.shareToken;

    try {
      const shared = await shareTicket(ticket.id);
      token = shared.shareToken;
    } catch {
      // usa o token já emitido na compra
    }

    const url = `${window.location.origin}/ingressos/compartilhado/${token}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function openCancelConfirm() {
    setCancelError(null);
    setConfirmOpen(true);
  }

  async function handleCancel() {
    setCancelling(true);
    setCancelError(null);

    try {
      const updated = await cancelTicket(ticket.id);
      setConfirmOpen(false);
      onCancelled?.(updated);
    } catch (error) {
      setCancelError(
        getErrorMessage(error, 'Não foi possível cancelar o ingresso.'),
      );
    } finally {
      setCancelling(false);
    }
  }

  return (
    <article
      className={`${styles.ticket} ${ticket.status !== 'VALID' ? styles.used : ''}`}
    >
      <div className={styles.qr}>
        {cancelled ? (
          <div className={styles.cancelledMark}>Cancelado</div>
        ) : ticket.qrImage ? (
          <button
            type="button"
            className={styles.qrButton}
            onClick={() => setZoomed(true)}
            aria-label={`Ampliar QR do ingresso ${ticket.code}`}
          >
            <img src={ticket.qrImage} alt={`QR do ingresso ${ticket.code}`} />
          </button>
        ) : null}
        <p className={styles.code}>{ticket.code}</p>
        <p className={`${styles.status} ${cancelled ? styles.cancelled : ''}`}>
          {statusLabel(ticket.status)}
        </p>
        {!cancelled && ticket.qrImage && (
          <p className={styles.zoomHint}>Toque no QR para ampliar</p>
        )}
      </div>

      <div className={styles.body}>
        <p className={styles.kicker}>Ingresso</p>
        <h2>{ticket.event.name}</h2>
        <p>{formatEventDate(ticket.event.startDate, ticket.event.startTime)}</p>
        <p>{venue || 'Local a definir'}</p>
        <p className={styles.seat}>
          Fileira {ticket.seat.row} · Assento {ticket.seat.number}
        </p>

        {shareable && ticket.status === 'VALID' && (
          <button
            type="button"
            className={styles.share}
            onClick={() => void copyShareLink()}
          >
            {copied ? 'Link copiado' : 'Compartilhar ingresso'}
          </button>
        )}

        {cancellable && ticket.status === 'VALID' && (
          <button
            type="button"
            className={styles.cancel}
            disabled={cancelling}
            onClick={openCancelConfirm}
          >
            Cancelar e devolver lugar
          </button>
        )}
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Cancelar este ingresso?"
        confirmLabel="Cancelar e devolver"
        cancelLabel="Manter ingresso"
        danger
        loading={cancelling}
        error={cancelError}
        titleId={`cancel-ticket-${ticket.id}`}
        onClose={() => {
          if (!cancelling) {
            setConfirmOpen(false);
          }
        }}
        onConfirm={() => void handleCancel()}
        description={
          <Typography color="text.secondary">
            O ingresso de <strong>{ticket.event.name}</strong> será cancelado. O
            lugar Fileira {ticket.seat.row} · Assento {ticket.seat.number} volta
            para o estoque e o QR deixa de valer na entrada.
          </Typography>
        }
      />

      {zoomed && ticket.qrImage && (
        <QrLightbox
          src={ticket.qrImage}
          code={ticket.code}
          alt={`QR ampliado do ingresso ${ticket.code}`}
          onClose={() => setZoomed(false)}
        />
      )}
    </article>
  );
}
