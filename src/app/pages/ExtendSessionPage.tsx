import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSafeBack } from '../hooks/useSafeBack';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '../store';
import { toast } from 'sonner';
import Icon3D from '../components/Icon3D';

const HOUR_OPTIONS: { value: number; label: string; sub: string }[] = [
  { value: 0.5, label: '+30', sub: 'mins' },
  { value: 1, label: '+1', sub: 'hour' },
  { value: 2, label: '+2', sub: 'hours' },
  { value: 3, label: '+3', sub: 'hours' },
];

const ExtendSessionPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { userId } = useAppStore();
  const [session, setSession] = useState<any>(null);
  const [packs, setPacks] = useState<any[]>([]);
  const [hours, setHours] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!sessionId || !userId) return;
      const [sessionRes, packsRes] = await Promise.all([
        supabase.from('play_sessions' as any).select('*').eq('id', sessionId).single(),
        supabase.from('user_packs' as any).select('*').eq('user_id', userId).eq('status', 'active'),
      ]);
      setSession(sessionRes.data);
      setPacks((packsRes.data as any) || []);
    };
    load();
  }, [sessionId, userId]);

  const totalRemaining = packs.reduce((sum, p) => sum + (Number(p.total_hours) - Number(p.hours_used)), 0);
  // Minimum deduction is always 1 hour per extension request
  const canExtend = totalRemaining >= hours;

  const handleExtend = async () => {
    if (!session) return;
    setSubmitting(true);
    const { error } = await supabase
      .from('play_sessions' as any)
      .update({ extended_hours: Number(session.extended_hours || 0) + hours })
      .eq('id', session.id);
    setSubmitting(false);
    if (error) {
      toast.error('Could not extend', { description: error.message });
      return;
    }
    const label = hours < 1 ? `${hours * 60} mins` : `${hours}h`;
    toast.success(`+${label} added! 🎉`, { description: 'Show your QR to staff to confirm.' });
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-5 h-16 max-w-lg mx-auto">
          <motion.button whileTap={{ scale: 0.9 }} onClick={useSafeBack()}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft size={18} className="text-ink" strokeWidth={2.5} />
          </motion.button>
          <h1 className="font-display text-xl text-ink -tracking-wide">Extend session</h1>
        </div>
      </header>

      <div className="px-5 pt-4 max-w-lg mx-auto space-y-5">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-ink rounded-[32px] p-6 overflow-hidden shadow-hero"
        >
          <div className="relative z-10 max-w-[60%]">
            <p className="text-xs text-white/60 font-heading uppercase tracking-wider">More fun</p>
            <h2 className="font-display text-3xl text-white mt-1 -tracking-wide leading-tight">Stay a bit longer?</h2>
            <p className="text-xs text-white/50 mt-2 font-heading">Hours auto-deduct at check-out</p>
          </div>
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2.8, repeat: Infinity }}
            className="absolute -bottom-2 -right-2"
          >
            <Icon3D name="clock" size={140} alt="" />
          </motion.div>
        </motion.div>

        <div>
          <p className="font-display text-base text-ink mb-3 px-1">How much longer?</p>
          <div className="grid grid-cols-4 gap-2.5">
            {HOUR_OPTIONS.map(opt => (
              <motion.button
                key={opt.value}
                whileTap={{ scale: 0.94 }}
                onClick={() => setHours(opt.value)}
                className={`py-6 rounded-[24px] transition-all ${
                  hours === opt.value
                    ? 'bg-coral text-white shadow-pop-coral'
                    : 'bg-card border border-border'
                }`}
              >
                <div className={`font-display text-2xl ${hours === opt.value ? 'text-white' : 'text-ink'}`}>{opt.label}</div>
                <div className={`text-[10px] uppercase tracking-wider mt-0.5 font-heading ${hours === opt.value ? 'text-white/80' : 'text-muted-foreground'}`}>
                  {opt.sub}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-[24px] p-4 space-y-2 shadow-soft border border-border">
          <div className="flex items-center justify-between text-sm font-heading">
            <span className="text-muted-foreground">Hours available</span>
            <span className="font-display text-mint">{totalRemaining}h</span>
          </div>
          <div className="flex items-center justify-between text-sm font-heading">
            <span className="text-muted-foreground">Extending by</span>
            <span className="font-display text-coral">+{hours < 1 ? `${hours * 60}m` : `${hours}h`}</span>
          </div>
          <div className="border-t border-border pt-2 flex items-center justify-between">
            <span className="text-ink font-display text-sm">Remaining after</span>
            <span className="font-display text-base text-ink">{Math.max(0, totalRemaining - hours)}h</span>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground text-center font-heading">
          Minimum 30 minutes deducted per extension. Partial time rounds up.
        </p>

        {!canExtend && (
          <div className="bg-coral/10 rounded-[20px] p-4">
            <p className="text-xs text-ink font-heading">
              Not enough hours. <button onClick={() => navigate('/menu')} className="underline font-display text-coral">Buy more</button>
            </p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border p-4">
        <div className="max-w-lg mx-auto">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleExtend}
            disabled={!canExtend || submitting}
            className="w-full py-4 bg-ink rounded-full font-display text-base text-white disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {submitting ? 'Extending…' : <><Plus size={16} strokeWidth={2.5} /> Extend by {hours < 1 ? `${hours * 60} mins` : `${hours}h`}</>}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ExtendSessionPage;
