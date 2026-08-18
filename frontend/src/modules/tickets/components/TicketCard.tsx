import { useState } from 'react';
import { formatEventDate } from '@/modules/events/utils/format';
import { shareTicket } from '../services/tickets.service';
import type { Ticket } from '../types/ticket.types';
import { QrLightbox } from './QrLightbox';
import styles from './TicketCard.module.css';

type TicketCardProps = {
  ticket: Ticket;
  shareable?: boolean;
};

export function TicketCard({ ticket, shareable = false }: TicketCardProps) {
  const [copied, setCopied] = useState(false);
  const [zoomed, setZoomed] = useState(false);
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

  return (
    <article
      className={`${styles.ticket} ${ticket.status === 'USED' ? styles.used : ''}`}
    >
      <div className={styles.qr}>
        <button
          type="button"
          className={styles.qrButton}
          onClick={() => setZoomed(true)}
          aria-label={`Ampliar QR do ingresso ${ticket.code}`}
        >
          <img src={ticket.qrImage} alt={`QR do ingresso ${ticket.code}`} />
        </button>
        <p className={styles.code}>{ticket.code}</p>
        <p className={styles.status}>
          {ticket.status === 'USED' ? 'Utilizado' : 'Válido'}
        </p>
        <p className={styles.zoomHint}>Toque no QR para ampliar</p>
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
      </div>

      {zoomed && (
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
