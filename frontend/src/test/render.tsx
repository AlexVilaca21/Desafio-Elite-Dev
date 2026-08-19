import { ThemeProvider } from '@mui/material/styles';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { appTheme } from '@/shared/theme/appTheme';

type Options = Omit<RenderOptions, 'wrapper'> & {
  route?: string;
};

export function renderApp(ui: ReactElement, options: Options = {}) {
  const { route = '/', ...rest } = options;

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ThemeProvider theme={appTheme}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </ThemeProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...rest });
}
