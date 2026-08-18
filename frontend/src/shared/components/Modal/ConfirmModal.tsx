import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { ErrorAlert } from '@/shared/components/Feedback/ErrorAlert';
import { AppModal } from './AppModal';

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  danger?: boolean;
  error?: string | null;
  titleId?: string;
  onClose: () => void;
  onConfirm: () => void;
};

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Voltar',
  loading = false,
  danger = false,
  error = null,
  titleId = 'confirm-modal-title',
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  return (
    <AppModal
      open={open}
      title={title}
      kicker="Confirmação"
      titleId={titleId}
      disableClose={loading}
      onClose={onClose}
      actions={
        <>
          <Button variant="outlined" disabled={loading} onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant="contained"
            color={danger ? 'error' : 'primary'}
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? 'Aguarde...' : confirmLabel}
          </Button>
        </>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {typeof description === 'string' ? (
          <Typography color="text.secondary">{description}</Typography>
        ) : (
          description
        )}
        {error ? <ErrorAlert>{error}</ErrorAlert> : null}
      </Box>
    </AppModal>
  );
}
