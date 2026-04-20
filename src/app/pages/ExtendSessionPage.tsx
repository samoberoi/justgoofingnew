import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Plus, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '../store';
import { toast } from 'sonner';

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
    // Stub: increment extended_hours on the session — actual deduction happens at check-out by staff
    const { error } = await supabase
      .from('play_sessions' as any)
      .update({ extended_hours: Number(session.extended_hours || 0) + hours })
      .eq('id', session.id);
    setSubmitting(false);
    if (error) {
      toast.error('Could not extend', { description: error.message });
      return;
    }
    toast.success(`Extended by ${hours} hour${hours > 1 ? 's' : ''}! 🎉`, {
      description: 'Show your QR to staff to confirm.',
    });
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-2xl border-b border-secondary/10">
        <div className="flex items-center gap-3 px-4 h-14 max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-full bg-secondary/8 border border-secondary/15">
            <ArrowLeft size={16} className="text-secondary" />
          </button>
          <h1 className="font-heading text-base text-foreground">Extend Session</h1>
        </div>
      </header>

      <div className="px-4 pt-6 max-w-lg mx-auto space-y-5">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-secondary/15 to-transparent border border-secondary/20 rounded-2xl p-5 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center">
            <Clock size={26} className="text-secondary" />
          </div>
          <p className="font-heading text-sm text-foreground mt-3">Add more time to your session</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Hours will be deducted from your active packs at check-out.
          </p>
        </motion.div>

        <div>
          <p className="font-heading text-xs uppercase tracking-wider text-muted-foreground mb-3">How many more hours?</p>
          <div className="grid grid-cols-3 gap-2.5">
            {HOUR_OPTIONS.map(h => (
              <motion.button
                key={h}
                whileTap={{ scale: 0.95 }}
                onClick={() => setHours(h)}
                className={`py-5 rounded-2xl border-2 transition-all ${
                  hours === h
                    ? 'border-secondary bg-secondary/15'
                    : 'border-border bg-card hover:border-secondary/30'
                }`}
              >
                <div className="font-heading text-2xl text-secondary">+{h}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">hour{h > 1 ? 's' : ''}</div>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Pack hours available</span>
            <span className="font-heading text-secondary">{totalRemaining} hrs</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Extend by</span>
            <span className="font-heading text-foreground">+{hours} hrs</span>
          </div>
          <div className="border-t border-border pt-2 flex items-center justify-between text-sm">
            <span className="text-foreground font-heading">Remaining after extend</span>
            <span className="font-heading text-secondary">{Math.max(0, totalRemaining - hours)} hrs</span>
          </div>
        </div>

        {!canExtend && (
          <div className="bg-accent/10 border border-accent/20 rounded-xl p-3">
            <p className="text-xs text-accent">
              Not enough hours in your packs. <button onClick={() => navigate('/menu')} className="underline font-heading">Buy more</button>
            </p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-t border-secondary/10 p-4">
        <div className="max-w-lg mx-auto">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleExtend}
            disabled={!canExtend || submitting}
            className="w-full py-4 bg-gradient-saffron rounded-xl font-heading text-sm uppercase tracking-widest text-primary-foreground shadow-saffron disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? 'Extending…' : <><Plus size={14} /> Extend by {hours} hour{hours > 1 ? 's' : ''}</>}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ExtendSessionPage;
