import { screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeTicket } from '@/test/fixtures';
import { renderApp } from '@/test/render';
import { TicketCard } from './TicketCard';

vi.mock('../services/tickets.service', () => ({
  cancelTicket: vi.fn(),
  shareTicket: vi.fn(),
}));

import { cancelTicket, shareTicket } from '../services/tickets.service';

describe('TicketCard', () => {
  beforeEach(() => {
    vi.mocked(cancelTicket).mockReset();
    vi.mocked(shareTicket).mockReset();
  });

  it('shows the event, seat and QR for a valid ticket', () => {
    renderApp(<TicketCard ticket={makeTicket()} shareable cancellable />);

    expect(screen.getByText('Rock in Rio 2026')).toBeInTheDocument();
    expect(screen.getByText(/Fileira F · Assento 9/)).toBeInTheDocument();
    expect(screen.getByAltText(/QR do ingresso 5B9B631B47B7/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Cancelar e devolver lugar' }),
    ).toBeInTheDocument();
  });

  it('hides the QR and cancel action after cancellation', () => {
    renderApp(
      <TicketCard
        ticket={makeTicket({ status: 'CANCELLED', qrImage: '' })}
        shareable
        cancellable
      />,
    );

    expect(screen.getAllByText('Cancelado').length).toBeGreaterThan(0);
    expect(screen.queryByAltText(/QR do ingresso/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Cancelar e devolver lugar' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Compartilhar ingresso' }),
    ).not.toBeInTheDocument();
  });

  it('asks in the modal before cancelling and returning the seat', async () => {
    const user = userEvent.setup();
    const onCancelled = vi.fn();
    const cancelled = makeTicket({
      status: 'CANCELLED',
      qrImage: '',
      cancelledAt: '2026-08-18T21:00:00.000Z',
    });
    vi.mocked(cancelTicket).mockResolvedValue(cancelled);

    renderApp(
      <TicketCard
        ticket={makeTicket()}
        shareable
        cancellable
        onCancelled={onCancelled}
      />,
    );

    await user.click(
      screen.getByRole('button', { name: 'Cancelar e devolver lugar' }),
    );
    expect(screen.getByText(/volta para o estoque/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Manter ingresso' }));
    expect(cancelTicket).not.toHaveBeenCalled();
    await waitForElementToBeRemoved(() => screen.queryByRole('dialog'));

    await user.click(
      screen.getByRole('button', { name: 'Cancelar e devolver lugar' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Cancelar e devolver' }),
    );

    await waitFor(() => {
      expect(cancelTicket).toHaveBeenCalledWith('ticket-1');
      expect(onCancelled).toHaveBeenCalledWith(cancelled);
    });
  });

  it('copies the share link', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    vi.mocked(shareTicket).mockResolvedValue({ shareToken: 'share-token' });

    renderApp(<TicketCard ticket={makeTicket()} shareable />);

    await user.click(screen.getByRole('button', { name: 'Compartilhar ingresso' }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        `${window.location.origin}/ingressos/compartilhado/share-token`,
      );
      expect(screen.getByText('Link copiado')).toBeInTheDocument();
    });
  });
});
