import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  onResult: (text: string) => void;
  onClose: () => void;
}

const QrScanner = ({ onResult, onClose }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handledRef = useRef(false);
  const onResultRef = useRef(onResult);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);

  // Keep latest onResult without retriggering the start effect
  useEffect(() => { onResultRef.current = onResult; }, [onResult]);

  useEffect(() => {
    if (!containerRef.current) return;
    const id = `qr-scanner-region-${Math.random().toString(36).slice(2, 8)}`;
    containerRef.current.id = id;

    let cancelled = false;
    let scanner: Html5Qrcode | null = null;

    const start = async () => {
      try {
        scanner = new Html5Qrcode(id, { verbose: false } as any);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decoded) => {
            if (handledRef.current) return;
            handledRef.current = true;
            onResultRef.current(decoded.trim());
          },
          () => {}
        );
        if (cancelled) {
          scanner.stop().then(() => scanner?.clear()).catch(() => {});
          return;
        }
        setStarting(false);
      } catch (err: any) {
        console.error('[QrScanner] Failed to start:', err);
        if (!cancelled) {
          setStarting(false);
          setError(
            err?.name === 'NotAllowedError'
              ? 'Camera permission denied. Allow camera access in your browser settings and tap retry.'
              : err?.message || 'Could not start camera. Make sure no other app is using it.'
          );
        }
      }
    };

    start();

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      if (s) {
        try {
          if (s.isScanning) {
            s.stop().then(() => s.clear()).catch(() => {});
          } else {
            s.clear();
          }
        } catch {}
      }
      scannerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-ink/95 backdrop-blur-xl flex flex-col"
    >
      <div className="flex items-center justify-between p-4">
        <div>
          <h2 className="font-display text-lg text-cream">Scan QR</h2>
          <p className="text-xs text-cream/60">Point camera at the customer's code</p>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-cream/10 flex items-center justify-center text-cream"
          aria-label="Close scanner"
        >
          <X size={18} />
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="relative w-full max-w-sm aspect-square rounded-3xl overflow-hidden border-4 border-coral shadow-pop-coral bg-ink">
          <div ref={containerRef} className="absolute inset-0 [&_video]:w-full [&_video]:h-full [&_video]:object-cover" />
          <div className="pointer-events-none absolute inset-6 border-2 border-cream/40 rounded-2xl" />
          {starting && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-cream/80 pointer-events-none">
              <Camera size={28} className="animate-pulse" />
              <p className="text-xs">Starting camera…</p>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center bg-ink/90">
              <p className="text-sm text-cream">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-full bg-coral text-ink text-xs font-heading shadow-pop-coral"
              >
                Close & retry
              </button>
            </div>
          )}
        </div>
      </div>
      <p className="text-center text-xs text-cream/60 pb-6 px-6">
        Allow camera access if prompted
      </p>
    </motion.div>
  );
};

export default QrScanner;
