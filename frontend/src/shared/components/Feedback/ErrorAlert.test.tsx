import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ErrorAlert } from './ErrorAlert';
import { renderApp } from '@/test/render';

describe('ErrorAlert', () => {
  it('renders the message', () => {
    renderApp(<ErrorAlert>Não foi possível cancelar o ingresso.</ErrorAlert>);
    expect(
      screen.getByText('Não foi possível cancelar o ingresso.'),
    ).toBeInTheDocument();
  });

  it('renders nothing without children', () => {
    const { container } = renderApp(<ErrorAlert>{null}</ErrorAlert>);
    expect(container).toBeEmptyDOMElement();
  });
});
