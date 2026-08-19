import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmModal } from './ConfirmModal';
import { renderApp } from '@/test/render';

describe('ConfirmModal', () => {
  it('asks for confirmation and runs the action', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    renderApp(
      <ConfirmModal
        open
        title="Cancelar este ingresso?"
        description="O lugar volta para o estoque."
        confirmLabel="Cancelar e devolver"
        cancelLabel="Manter ingresso"
        danger
        onClose={onClose}
        onConfirm={onConfirm}
      />,
    );

    expect(
      screen.getByRole('dialog', { name: /cancelar este ingresso/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('O lugar volta para o estoque.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancelar e devolver' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('closes without confirming', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    renderApp(
      <ConfirmModal
        open
        title="Tirar do cartaz?"
        description="O evento sai da venda."
        confirmLabel="Tirar do cartaz"
        cancelLabel="Manter no cartaz"
        onClose={onClose}
        onConfirm={onConfirm}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Manter no cartaz' }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('shows an error and blocks closing while loading', () => {
    const onClose = vi.fn();

    renderApp(
      <ConfirmModal
        open
        title="Cancelar este ingresso?"
        description="O lugar volta para o estoque."
        loading
        error="Não foi possível cancelar o ingresso."
        onClose={onClose}
        onConfirm={() => undefined}
      />,
    );

    expect(
      screen.getByText('Não foi possível cancelar o ingresso.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aguarde...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeDisabled();
  });
});
