import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeTicket } from '@/test/fixtures';
import { renderApp } from '@/test/render';
import { MyTicketsPage } from './MyTicketsPage';

vi.mock('../services/tickets.service', () => ({
  listMyTickets: vi.fn(),
  cancelTicket: vi.fn(),
  shareTicket: vi.fn(),
}));

import { listMyTickets } from '../services/tickets.service';

describe('MyTicketsPage', () => {
  beforeEach(() => {
    vi.mocked(listMyTickets).mockReset();
  });

  it('lists the tickets of the signed-in client', async () => {
    vi.mocked(listMyTickets).mockResolvedValue([makeTicket()]);

    renderApp(<MyTicketsPage />);

    expect(
      await screen.findByRole('heading', { name: 'Rock in Rio 2026' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Fileira F · Assento 9/)).toBeInTheDocument();
  });

  it('shows an empty state when there are no tickets', async () => {
    vi.mocked(listMyTickets).mockResolvedValue([]);

    renderApp(<MyTicketsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Você ainda não tem ingressos/)).toBeInTheDocument();
    });
  });
});
