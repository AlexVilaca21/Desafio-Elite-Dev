import type { ReactNode } from 'react';
import { screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { appTheme } from '@/shared/theme/appTheme';
import { RequireAuth } from './RequireAuth';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../context/AuthContext';

function renderAt(path: string, ui: ReactNode) {
  return render(
    <ThemeProvider theme={appTheme}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/entrar" element={<p>Tela de login</p>} />
          <Route path="/meus-ingressos" element={ui} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe('RequireAuth', () => {
  it('waits while the session loads', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      ready: false,
      isClient: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderAt(
      '/meus-ingressos',
      <RequireAuth roles={['CLIENT']}>
        <p>Carteira</p>
      </RequireAuth>,
    );

    expect(screen.getByText('Carregando sessão...')).toBeInTheDocument();
  });

  it('sends a visitor to login', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      ready: true,
      isClient: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderAt(
      '/meus-ingressos',
      <RequireAuth roles={['CLIENT']}>
        <p>Carteira</p>
      </RequireAuth>,
    );

    expect(screen.getByText('Tela de login')).toBeInTheDocument();
  });

  it('blocks a client from the gate area', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: '1',
        name: 'Ana',
        email: 'cliente@elite.dev',
        role: 'CLIENT',
      },
      ready: true,
      isClient: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderAt(
      '/meus-ingressos',
      <RequireAuth roles={['GATE']}>
        <p>Portaria</p>
      </RequireAuth>,
    );

    expect(screen.getByText('Sem acesso')).toBeInTheDocument();
    expect(screen.getByText(/restrita a Portaria/)).toBeInTheDocument();
  });

  it('renders the page when the role matches', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: '1',
        name: 'Ana',
        email: 'cliente@elite.dev',
        role: 'CLIENT',
      },
      ready: true,
      isClient: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderAt(
      '/meus-ingressos',
      <RequireAuth roles={['CLIENT']}>
        <p>Carteira</p>
      </RequireAuth>,
    );

    expect(screen.getByText('Carteira')).toBeInTheDocument();
  });
});
