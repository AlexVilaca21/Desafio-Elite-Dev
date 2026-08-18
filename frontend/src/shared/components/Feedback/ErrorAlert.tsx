import Alert from '@mui/material/Alert';
import type { ReactNode } from 'react';

type ErrorAlertProps = {
  children: ReactNode;
};

export function ErrorAlert({ children }: ErrorAlertProps) {
  if (!children) {
    return null;
  }

  return (
    <Alert severity="error" variant="outlined">
      {children}
    </Alert>
  );
}
