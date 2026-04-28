import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSafeBack } from '../hooks/useSafeBack';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, Shield } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAppStore } from '../store';
import { supabase } from '@/integrations/supabase/client';
import Icon3D from '../components/Icon3D';
import illusQR from '@/assets/illus/illus-qr.png';

const MyQRPage = () => {
  const navigate = useNavigate();
  const { userId, userName, phoneNumber } = useAppStore();
  const [token, setToken] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [totalRemaining, setTotalRemaining] = useState(0);

  useEffect(() => {
    const generate = () => {
      const rand = Math.random().toString(36).slice(2, 8);
      const ts = Math.floor(Date.now() / 1000);
      setToken(`JG:${userId}:${ts}:${rand}`);
      setSecondsLeft(60);
    };
    generate();
    const tick = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { generate(); return 60; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    supabase.from('user_packs' as any)
      .select('total_hours, hours_used')
      .eq('user_id', userId)
      .eq('status', 'active')
      .then(({ data }) => {
        const total = ((data as any) || []).reduce((sum: number, p: any) =>
          sum + (Number(p.total_hours) - Number(p.hours_used)), 0);
        setTotalRemaining(total);
      });
  }, [userId]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-5 h-16 max-w-lg mx-auto">
          <motion.button whileTap={{ scale: 0.9 }} onClick={useSafeBack()}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft size={18} className="text-ink" strokeWidth={2.5} />
          </motion.button>
          <h1 className="font-display text-xl text-ink -tracking-wide">Check-in QR</h1>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center px-5 py-6 max-w-lg mx-auto w-full">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 18 }}
          className="relative w-full bg-ink rounded-[36px] p-6 shadow-hero overflow-hidden"
        >
          <motion.img
            src={illusQR}
            alt=""
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute -top-4 -right-4 w-28 h-28 object-contain pointer-events-none opacity-90"
          />

          <div className="text-center mb-4 relative z-10">
            <p className="font-display text-[10px] uppercase tracking-[0.2em] text-mint">Just Goofing</p>
            <h2 className="font-display text-2xl text-white mt-1 -tracking-wide">{userName || 'Goofer'}</h2>
            {phoneNumber && <p className="text-xs text-white/55 mt-0.5 font-heading">+91 {phoneNumber}</p>}
          </div>

          <div className="bg-white p-5 rounded-[24px] flex items-center justify-center">
            {token ? (
              <QRCodeSVG
                value={token}
                size={220}
                bgColor="#FFFFFF"
                fgColor="#0E0E10"
                level="H"
                includeMargin={false}
              />
            ) : (
              <div className="w-[220px] h-[220px] bg-muted animate-pulse rounded-xl" />
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2.5 relative z-10">
            <div className="bg-mint rounded-2xl p-3 text-center">
              <p className="font-display text-2xl text-ink leading-none tabular-nums">{totalRemaining}</p>
              <p className="text-[10px] font-display text-ink/70 mt-1">hrs left</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-3 text-center">
              <p className="font-display text-2xl text-white tabular-nums leading-none">{secondsLeft}s</p>
              <p className="text-[10px] font-heading text-white/60 mt-1 flex items-center justify-center gap-1">
                <RefreshCw size={9} strokeWidth={2.5} /> refresh
              </p>
            </div>
          </div>
        </motion.div>

        <div className="mt-5 flex items-start gap-2 text-center bg-muted rounded-[20px] p-4 w-full">
          <Shield size={14} className="text-muted-foreground shrink-0 mt-0.5" strokeWidth={2.5} />
          <p className="text-xs text-muted-foreground leading-relaxed font-heading text-left">
            Show this to staff. They scan to check you in & deduct hours when you leave. Refreshes every minute.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MyQRPage;
