import { useEffect } from 'react';
import styles from './QrLightbox.module.css';

type QrLightboxProps = {
  src: string;
  code: string;
  alt: string;
  onClose: () => void;
};

export function QrLightbox({ src, code, alt, onClose }: QrLightboxProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={`QR ampliado ${code}`}
      onClick={onClose}
    >
      <div className={styles.panel} onClick={(event) => event.stopPropagation()}>
        <img src={src} alt={alt} />
        <p className={styles.code}>{code}</p>
        <p className={styles.hint}>Toque fora para fechar</p>
        <button type="button" className={styles.close} onClick={onClose}>
          Fechar
        </button>
      </div>
    </div>
  );
}
