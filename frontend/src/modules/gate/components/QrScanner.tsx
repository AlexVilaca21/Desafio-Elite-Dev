import { useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import styles from './QrScanner.module.css';

type QrScannerProps = {
  active: boolean;
  onScan: (value: string) => void;
  onError: (message: string) => void;
};

export function QrScanner({ active, onScan, onError }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);

  onScanRef.current = onScan;
  onErrorRef.current = onError;

  useEffect(() => {
    if (!active) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      return;
    }

    const frameCanvas = canvas;
    const context = frameCanvas.getContext('2d', { willReadFrequently: true });

    if (!context) {
      onErrorRef.current('Não foi possível iniciar a leitura do QR.');
      return;
    }

    const frameContext = context;

    if (!navigator.mediaDevices?.getUserMedia) {
      onErrorRef.current(
        'Este aparelho não libera a câmera. Digite o código do ingresso.',
      );
      return;
    }

    let stream: MediaStream | null = null;
    let cancelled = false;
    let timer: number | null = null;
    let lastValue = '';

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
      } catch {
        if (!cancelled) {
          onErrorRef.current(
            'Sem acesso à câmera. Digite o código do ingresso abaixo.',
          );
        }
        return;
      }

      if (cancelled || !video) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      video.srcObject = stream;

      try {
        await video.play();
      } catch {
        if (!cancelled) {
          onErrorRef.current('Não foi possível ligar a câmera.');
        }
        return;
      }

      const tick = () => {
        if (cancelled || !video) {
          return;
        }

        if (video.readyState >= 2 && video.videoWidth > 0) {
          const width = video.videoWidth;
          const height = video.videoHeight;
          frameCanvas.width = width;
          frameCanvas.height = height;
          frameContext.drawImage(video, 0, 0, width, height);
          const image = frameContext.getImageData(0, 0, width, height);
          const result = jsQR(image.data, image.width, image.height, {
            inversionAttempts: 'attemptBoth',
          });

          if (result?.data && result.data !== lastValue) {
            lastValue = result.data;
            onScanRef.current(result.data.trim());
          }
        }

        timer = window.setTimeout(tick, 180);
      };

      tick();
    }

    void start();

    return () => {
      cancelled = true;
      if (timer !== null) {
        window.clearTimeout(timer);
      }
      video.pause();
      video.srcObject = null;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [active]);

  return (
    <div className={styles.viewfinder}>
      <video
        ref={videoRef}
        className={styles.video}
        playsInline
        muted
        autoPlay
      />
      <canvas ref={canvasRef} className={styles.canvas} />
      <div className={styles.frame} aria-hidden="true" />
      <p className={styles.hint}>Aponte para o QR do ingresso</p>
    </div>
  );
}
