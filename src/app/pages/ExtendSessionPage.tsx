import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '../store';
import { toast } from 'sonner';
import { Star, Sparkle } from '../components/Stickers';

const HOUR_OPTIONS = [1, 2, 3];

const ExtendSessionPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { userId } = useAppStore();
  const [session, setSession] = useState<any>(null);
  const [packs, setPacks] = useState<any[]>([]);
  const [hours, setHours] = useState(1);
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
    toast.success(`+${hours}h added! 🎉`, { description: 'Show your QR to staff to confirm.' });
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-background pb-32 relative overflow-hidden">
      <Star className="absolute top-24 right-8 w-7 h-7 text-butter opacity-50 animate-wobble" />
      <Sparkle className="absolute top-64 left-6 w-6 h-6 text-coral opacity-50 animate-bounce-soft" />

      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl border-b-2 border-ink/5">
        <div className="flex items-center gap-3 px-4 h-16 max-w-lg mx-auto">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl bg-card border-2 border-ink/8 shadow-soft flex items-center justify-center">
            <ArrowLeft size={18} className="text-ink" />
          </motion.button>
          <h1 className="font-display text-xl text-ink">Extend Session ⏰</h1>
        </div>
      </header>

      <div className="px-4 pt-6 max-w-lg mx-auto space-y-5 relative z-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-mint rounded-3xl p-5 text-center text-ink shadow-pop-mint">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white/30 flex items-center justify-center mb-2">
            <Clock size={26} />
          </div>
          <p className="font-display text-lg">More fun, more time! 🎈</p>
          <p className="text-[11px] text-ink/70 mt-1">Hours auto-deduct from your packs at check-out.</p>
        </motion.div>

        <div>
          <p className="font-display text-base text-ink mb-3">How many more hours?</p>
          <div className="grid grid-cols-3 gap-2.5">
            {HOUR_OPTIONS.map(h => (
              <motion.button
                key={h}
                whileTap={{ scale: 0.94 }}
                onClick={() => setHours(h)}
                className={`py-5 rounded-3xl border-2 transition-all ${
                  hours === h
                    ? 'border-coral bg-coral/10 shadow-pop-coral'
                    : 'border-ink/8 bg-card'
                }`}
              >
                <div className="font-display text-3xl text-coral">+{h}</div>
                <div className="text-[10px] text-ink/55 uppercase tracking-wider mt-0.5">hour{h > 1 ? 's' : ''}</div>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="bg-card border-2 border-ink/8 rounded-3xl p-4 space-y-2 shadow-soft">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink/60">Pack hours available</span>
            <span className="font-display text-mint">{totalRemaining}h</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink/60">Extending by</span>
            <span className="font-display text-coral">+{hours}h</span>
          </div>
          <div className="border-t-2 border-ink/5 pt-2 flex items-center justify-between">
            <span className="text-ink font-heading text-sm">Remaining after</span>
            <span className="font-display text-base text-ink">{Math.max(0, totalRemaining - hours)}h</span>
          </div>
        </div>

        {!canExtend && (
          <div className="bg-coral/10 border-2 border-coral/25 rounded-2xl p-3.5">
            <p className="text-xs text-ink">
              Not enough hours. <button onClick={() => navigate('/menu')} className="underline font-heading text-coral">Buy more</button>
            </p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-t-2 border-ink/5 p-4">
        <div className="max-w-lg mx-auto">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleExtend}
            disabled={!canExtend || submitting}
            className="w-full py-4 bg-gradient-coral rounded-2xl font-display text-base text-white shadow-pop-coral disabled:opacity-40 disabled:shadow-none flex items-center justify-center gap-2"
          >
            {submitting ? 'Extending…' : <><Plus size={16} /> Extend by {hours}h</>}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ExtendSessionPage;
