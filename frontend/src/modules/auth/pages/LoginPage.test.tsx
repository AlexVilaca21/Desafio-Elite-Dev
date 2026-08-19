import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderApp } from '@/test/render';
import { LoginPage } from './LoginPage';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../context/AuthContext';

describe('LoginPage', () => {
  it('logs in with the email and password typed in the form', async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockResolvedValue({
      id: 'user-1',
      name: 'Cliente Ana',
      email: 'cliente@elite.dev',
      role: 'CLIENT',
    });

    vi.mocked(useAuth).mockReturnValue({
      user: null,
      ready: true,
      isClient: false,
      login,
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderApp(<LoginPage />, { route: '/entrar' });

    expect(
      screen.queryByText(/contas para avaliação/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/senha123/)).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('E-mail'), 'cliente@elite.dev');
    await user.type(screen.getByLabelText('Senha'), 'senha123');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('cliente@elite.dev', 'senha123');
    });
  });

  it('asks for the gate account when coming from the gate page', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      ready: true,
      isClient: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderApp(<LoginPage />, { route: '/entrar?from=/portaria' });

    expect(
      screen.getByText(/conta de portaria para conferir os ingressos/i),
    ).toBeInTheDocument();
  });
});
