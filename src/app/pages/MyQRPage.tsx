import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, Shield } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAppStore } from '../store';
import { Star, Sparkle, Heart } from '../components/Stickers';
import { supabase } from '@/integrations/supabase/client';

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
    <div className="min-h-screen bg-background bg-confetti flex flex-col">
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 h-16 max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full bg-card border-2 border-ink/10 shadow-soft">
            <ArrowLeft size={18} className="text-ink" strokeWidth={2.5} />
          </button>
          <h1 className="font-display text-xl text-ink">My Check-in</h1>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-lg mx-auto w-full">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 18 }}
          className="relative w-full bg-card rounded-[36px] p-6 shadow-pop border-4 border-ink/8 overflow-hidden"
        >
          <div className="absolute top-4 left-4 animate-wobble">
            <Star size={26} color="hsl(var(--butter))" />
          </div>
          <div className="absolute top-6 right-5 animate-bounce-soft">
            <Heart size={22} color="hsl(var(--coral))" />
          </div>
          <div className="absolute bottom-6 left-6">
            <Sparkle size={18} color="hsl(var(--mint))" />
          </div>
          <div className="absolute bottom-4 right-8 animate-wobble">
            <Star size={18} color="hsl(var(--lavender))" />
          </div>

          <div className="text-center mb-4 relative z-10">
            <p className="font-display text-xs uppercase tracking-[0.2em] text-coral">Just Goofing</p>
            <h2 className="font-display text-2xl text-ink mt-1">{userName || 'Goofer'} ✨</h2>
            {phoneNumber && <p className="text-xs text-muted-foreground mt-0.5 font-medium">+91 {phoneNumber}</p>}
          </div>

          <div className="bg-gradient-butter p-5 rounded-[24px] border-4 border-ink/10 flex items-center justify-center shadow-pop-butter">
            <div className="bg-card p-4 rounded-2xl">
              {token ? (
                <QRCodeSVG
                  value={token}
                  size={210}
                  bgColor="hsl(var(--card))"
                  fgColor="hsl(var(--ink))"
                  level="H"
                  includeMargin={false}
                />
              ) : (
                <div className="w-[210px] h-[210px] bg-muted animate-pulse rounded-xl" />
              )}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 text-center relative z-10">
            <div className="bg-gradient-mint rounded-2xl p-3 border-2 border-ink/8 shadow-soft">
              <p className="font-display text-2xl text-ink leading-none">{totalRemaining}</p>
              <p className="text-[10px] font-display text-ink/70 mt-1">hrs left</p>
            </div>
            <div className="bg-gradient-lavender rounded-2xl p-3 border-2 border-ink/8 shadow-soft">
              <p className="font-display text-2xl text-ink tabular-nums leading-none">{secondsLeft}s</p>
              <p className="text-[10px] font-display text-ink/70 mt-1 flex items-center justify-center gap-1">
                <RefreshCw size={9} strokeWidth={2.5} /> refreshes
              </p>
            </div>
          </div>
        </motion.div>

        <div className="mt-6 flex items-start gap-2 px-4 text-center bg-card/60 rounded-2xl p-3 border-2 border-ink/8">
          <Shield size={14} className="text-ink/60 shrink-0 mt-0.5" strokeWidth={2.5} />
          <p className="text-xs text-muted-foreground leading-relaxed font-medium">
            Show this to staff. They scan to check you in & deduct hours when you leave. Refreshes every minute.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MyQRPage;
