import { ThemeProvider } from '@mui/material/styles';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appTheme } from '@/shared/theme/appTheme';
import type { EventSeating, Reservation } from '../types/event.types';
import { EventCheckoutPage } from './EventCheckoutPage';

vi.mock('@/modules/auth/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../services/events.service', () => ({
  getEventSeating: vi.fn(),
  createReservation: vi.fn(),
}));

import { useAuth } from '@/modules/auth/context/AuthContext';
import { createReservation, getEventSeating } from '../services/events.service';

const seating: EventSeating = {
  event: {
    id: 'event-1',
    name: 'Rock in Rio 2026',
    startDate: '2026-09-13',
    startTime: '12:00:00',
    venueName: 'Cidade do Rock',
    venueCity: 'Rio de Janeiro',
    venueStateCode: 'RJ',
    currency: 'BRL',
    unitPrice: 150,
  },
  availableCount: 7,
  rows: [
    {
      row: 'A',
      seats: [
        { id: 'a1', row: 'A', number: 1, status: 'AVAILABLE' },
        { id: 'a2', row: 'A', number: 2, status: 'SOLD' },
        { id: 'a3', row: 'A', number: 3, status: 'AVAILABLE' },
        { id: 'a4', row: 'A', number: 4, status: 'AVAILABLE' },
        { id: 'a5', row: 'A', number: 5, status: 'AVAILABLE' },
        { id: 'a6', row: 'A', number: 6, status: 'AVAILABLE' },
        { id: 'a7', row: 'A', number: 7, status: 'AVAILABLE' },
        { id: 'a8', row: 'A', number: 8, status: 'AVAILABLE' },
      ],
    },
  ],
};

function renderCheckout() {
  return render(
    <ThemeProvider theme={appTheme}>
      <MemoryRouter initialEntries={['/events/event-1/checkout']}>
        <Routes>
          <Route path="/events/:id/checkout" element={<EventCheckoutPage />} />
          <Route path="/entrar" element={<p>Login</p>} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe('EventCheckoutPage', () => {
  beforeEach(() => {
    vi.mocked(getEventSeating).mockReset();
    vi.mocked(createReservation).mockReset();
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 'user-1',
        name: 'Cliente Ana',
        email: 'cliente@elite.dev',
        role: 'CLIENT',
      },
      ready: true,
      isClient: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
    vi.mocked(getEventSeating).mockResolvedValue(seating);
  });

  it('loads the seat map and ignores a sold seat', async () => {
    const user = userEvent.setup();
    renderCheckout();

    expect(
      await screen.findByRole('grid', { name: 'Mapa de assentos' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Atualizando o mapa')).toBeInTheDocument();

    const sold = screen.getByRole('gridcell', {
      name: 'Fileira A assento 2, ocupado',
    });
    expect(sold).toBeDisabled();

    await user.click(screen.getByRole('gridcell', { name: 'Fileira A assento 1' }));
    expect(screen.getByText('Fileira A · Assento 1')).toBeInTheDocument();
  });

  it('keeps at most six seats', async () => {
    const user = userEvent.setup();
    renderCheckout();
    await screen.findByRole('grid', { name: 'Mapa de assentos' });

    for (const number of [1, 3, 4, 5, 6, 7, 8]) {
      await user.click(
        screen.getByRole('gridcell', { name: `Fileira A assento ${number}` }),
      );
    }

    expect(screen.getAllByText(/Fileira A · Assento/).length).toBe(6);
    expect(screen.queryByText('Fileira A · Assento 8')).not.toBeInTheDocument();
  });

  it('confirms a simulated payment and shows the QR', async () => {
    const user = userEvent.setup();
    const reservation: Reservation = {
      id: 'res-1',
      status: 'PAID',
      eventId: 'event-1',
      eventName: 'Rock in Rio 2026',
      total: 150,
      currency: 'BRL',
      seats: [{ id: 'a1', row: 'A', number: 1 }],
      tickets: [
        {
          id: 'ticket-1',
          code: 'ABC123',
          qrPayload: 'ABC123.sig',
          qrImage: 'data:image/png;base64,qr',
          shareToken: 'share',
          seat: { id: 'a1', row: 'A', number: 1 },
        },
      ],
      message: 'Pagamento confirmado. Seus ingressos foram gerados.',
    };
    vi.mocked(createReservation).mockResolvedValue(reservation);
    vi.mocked(getEventSeating)
      .mockResolvedValueOnce(seating)
      .mockResolvedValueOnce(seating);

    renderCheckout();
    await screen.findByRole('grid', { name: 'Mapa de assentos' });
    await user.click(screen.getByRole('gridcell', { name: 'Fileira A assento 1' }));
    await user.click(screen.getByRole('button', { name: 'Pagar e confirmar' }));

    await waitFor(() => {
      expect(createReservation).toHaveBeenCalledWith({
        eventId: 'event-1',
        seatIds: ['a1'],
        paymentOutcome: 'approve',
      });
    });
    expect(
      await screen.findByText(/Pagamento confirmado/),
    ).toBeInTheDocument();
    expect(screen.getByAltText('QR ABC123')).toBeInTheDocument();
  });

  it('shows the refusal when the simulated payment is declined', async () => {
    const user = userEvent.setup();
    vi.mocked(createReservation).mockResolvedValue({
      id: 'res-2',
      status: 'REFUSED',
      eventId: 'event-1',
      eventName: 'Rock in Rio 2026',
      total: 150,
      currency: 'BRL',
      seats: [{ id: 'a1', row: 'A', number: 1 }],
      tickets: [],
      message: 'Pagamento recusado. Os lugares continuam disponíveis.',
    });

    renderCheckout();
    await screen.findByRole('grid', { name: 'Mapa de assentos' });
    await user.click(screen.getByRole('gridcell', { name: 'Fileira A assento 1' }));
    await user.click(screen.getByRole('button', { name: 'Simular recusa' }));

    expect(
      await screen.findByText(/Pagamento recusado/),
    ).toBeInTheDocument();
  });
});
