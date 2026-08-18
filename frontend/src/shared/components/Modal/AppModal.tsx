import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

type AppModalProps = {
  open: boolean;
  title: string;
  kicker?: string;
  subtitle?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  headerExtra?: ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg';
  disableClose?: boolean;
  titleId?: string;
  onClose: () => void;
};

export function AppModal({
  open,
  title,
  kicker,
  subtitle,
  children,
  actions,
  headerExtra,
  maxWidth = 'sm',
  disableClose = false,
  titleId = 'app-modal-title',
  onClose,
}: AppModalProps) {
  return (
    <Dialog
      open={open}
      onClose={disableClose ? undefined : onClose}
      fullWidth
      maxWidth={maxWidth}
      scroll="paper"
      aria-labelledby={titleId}
    >
      {headerExtra}
      <DialogTitle id={titleId} sx={{ pb: 1 }}>
        {kicker && (
          <Typography
            variant="overline"
            color="primary"
            sx={{ fontWeight: 700, letterSpacing: 1.4 }}
          >
            {kicker}
          </Typography>
        )}
        <Typography variant="h5" component="h2">
          {title}
        </Typography>
        {subtitle ? (
          <Typography color="text.secondary" component="div">
            {subtitle}
          </Typography>
        ) : null}
      </DialogTitle>
      <DialogContent dividers sx={{ px: { xs: 1.5, sm: 2.5 }, py: 2 }}>
        {children}
      </DialogContent>
      {actions ? (
        <DialogActions sx={{ px: { xs: 1.5, sm: 2.5 }, py: 1.5, gap: 1 }}>
          {actions}
        </DialogActions>
      ) : null}
    </Dialog>
  );
}
