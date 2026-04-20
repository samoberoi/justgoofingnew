import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  onResult: (text: string) => void;
  onClose: () => void;
}

const QrScanner = ({ onResult, onClose }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handledRef = useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    const id = 'qr-scanner-region';
    ref.current.id = id;

    const scanner = new Html5Qrcode(id, { verbose: false });
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decoded) => {
          if (handledRef.current) return;
          handledRef.current = true;
          onResult(decoded.trim());
          scanner.stop().then(() => scanner.clear()).catch(() => {});
        },
        () => {}
      )
      .catch((err) => {
        console.error('[QrScanner] Failed to start:', err);
      });

    return () => {
      if (scanner.isScanning) {
        scanner.stop().then(() => scanner.clear()).catch(() => {});
      }
    };
  }, [onResult]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-ink/95 backdrop-blur-xl flex flex-col"
    >
      <div className="flex items-center justify-between p-4">
        <div>
          <h2 className="font-display text-lg text-cream">Scan QR</h2>
          <p className="text-xs text-cream/60">Point camera at the customer's code</p>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-cream/10 flex items-center justify-center text-cream"
        >
          <X size={18} />
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="relative w-full max-w-sm aspect-square rounded-3xl overflow-hidden border-4 border-coral shadow-pop-coral">
          <div ref={ref} className="absolute inset-0" />
          <div className="pointer-events-none absolute inset-6 border-2 border-cream/40 rounded-2xl" />
        </div>
      </div>
      <p className="text-center text-xs text-cream/60 pb-6 px-6">
        Allow camera access if prompted
      </p>
    </motion.div>
  );
};

export default QrScanner;
