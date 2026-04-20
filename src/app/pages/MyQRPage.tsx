import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, Shield } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAppStore } from '../store';
import { supabase } from '@/integrations/supabase/client';

const MyQRPage = () => {
  const navigate = useNavigate();
  const { userId, userName, phoneNumber } = useAppStore();
  const [token, setToken] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [totalRemaining, setTotalRemaining] = useState(0);

  // Generate a rotating token (refreshes every 60s for security)
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
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-2xl border-b border-secondary/10">
        <div className="flex items-center gap-3 px-4 h-14 max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-full bg-secondary/8 border border-secondary/15">
            <ArrowLeft size={16} className="text-secondary" />
          </button>
          <h1 className="font-heading text-base text-foreground">My Check-in QR</h1>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-lg mx-auto w-full">
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full bg-card border-2 border-secondary/20 rounded-3xl p-6 shadow-lg"
        >
          <div className="text-center mb-4">
            <p className="font-heading text-xs uppercase tracking-[0.2em] text-secondary">Just Goofing</p>
            <h2 className="font-heading text-lg text-foreground mt-1">{userName || 'Goofer'}</h2>
            {phoneNumber && <p className="text-[11px] text-muted-foreground mt-0.5">+91 {phoneNumber}</p>}
          </div>

          <div className="bg-card p-5 rounded-2xl border border-border flex items-center justify-center">
            {token ? (
              <QRCodeSVG
                value={token}
                size={220}
                bgColor="hsl(var(--card))"
                fgColor="hsl(var(--foreground))"
                level="H"
                includeMargin={false}
              />
            ) : (
              <div className="w-[220px] h-[220px] bg-muted animate-pulse rounded-xl" />
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 text-center">
            <div className="bg-muted/50 rounded-xl p-3">
              <p className="font-heading text-lg text-secondary">{totalRemaining}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Hours Left</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3">
              <p className="font-heading text-lg text-secondary tabular-nums">{secondsLeft}s</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center justify-center gap-1">
                <RefreshCw size={9} /> Refreshes
              </p>
            </div>
          </div>
        </motion.div>

        <div className="mt-6 flex items-start gap-2 px-2 text-center">
          <Shield size={14} className="text-secondary/60 shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Show this code to the staff. They'll scan it to check you in and deduct hours when you leave. Code refreshes every minute for security.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MyQRPage;
