import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, Check, Sparkles, Infinity as InfinityIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '../store';
import { useStoreSelection } from '../hooks/useStoreSelection';
import { Star, Heart, Sparkle } from '../components/Stickers';
import { toast } from 'sonner';

interface PlayPack {
  id: string;
  name: string;
  description: string | null;
  pack_type: string;
  total_hours: number;
  price: number;
}

const BuyPackPage = () => {
  const { packId } = useParams<{ packId: string }>();
  const navigate = useNavigate();
  const { userId } = useAppStore();
  const { selectedStore } = useStoreSelection();
  const [pack, setPack] = useState<PlayPack | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!packId) return;
      const { data } = await supabase.from('play_packs' as any).select('*').eq('id', packId).single();
      setPack(data as any);
      if ((data as any)?.pack_type === 'welcome_free' && userId) {
        const { data: existing } = await supabase
          .from('user_packs' as any)
          .select('id')
          .eq('user_id', userId)
          .eq('is_free_welcome', true)
          .limit(1);
        if (existing && (existing as any).length > 0) setAlreadyClaimed(true);
      }
      setLoading(false);
    };
    load();
  }, [packId, userId]);

  const handlePurchase = async () => {
    if (!pack || !userId) return;
    setPurchasing(true);
    const isFree = pack.pack_type === 'welcome_free';

    // Free welcome packs activate immediately. Paid packs are pending until staff settles payment at venue.
    const { data: newPack, error } = await supabase.from('user_packs' as any).insert({
      user_id: userId,
      pack_id: pack.id,
      pack_name: pack.name,
      total_hours: pack.total_hours,
      amount_paid: isFree ? 0 : pack.price,
      status: isFree ? 'active' : 'pending',
      payment_status: isFree ? 'paid' : 'pending',
      payment_method: isFree ? 'free' : null,
      paid_at: isFree ? new Date().toISOString() : null,
      is_free_welcome: isFree,
      store_id: selectedStore?.id || null,
    } as any).select().single();

    if (error) {
      toast.error('Could not add pack', { description: error.message });
      setPurchasing(false);
      return;
    }

    // Goofy Points are awarded only when the admin settles payment (not on reservation).
    let earned = 0;
    if (false && !isFree && pack.price > 0) {
      const { data: settings } = await supabase
        .from('points_settings')
        .select('earning_enabled, earning_percent, max_earn_per_order, expiry_days')
        .limit(1)
        .maybeSingle();
      if (settings?.earning_enabled) {
        earned = Math.floor((Number(pack.price) * Number(settings.earning_percent)) / 100);
        if (settings.max_earn_per_order) earned = Math.min(earned, Number(settings.max_earn_per_order));
        if (earned > 0) {
          const { data: prevTx } = await supabase
            .from('points_transactions')
            .select('balance_after')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          const balanceAfter = Number(prevTx?.balance_after || 0) + earned;
          const expiresAt = settings.expiry_days
            ? new Date(Date.now() + Number(settings.expiry_days) * 86400000).toISOString()
            : null;
          await supabase.from('points_transactions').insert({
            user_id: userId,
            type: 'earned',
            amount: earned,
            balance_after: balanceAfter,
            description: `Earned on ${pack.name}`,
            expires_at: expiresAt,
          });
        }
      }
    }

    if (isFree) {
      toast.success('1 Hour FREE Claimed! 🎉');
    } else {
      toast.success('Pack reserved! 🎟️', {
        description: 'Visit the centre and pay to activate. Cash / UPI / Card accepted.',
        duration: 6000,
      });
    }
    navigate('/home');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-coral border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!pack) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground font-medium">Pack not found</p>
      </div>
    );
  }

  const isFree = pack.pack_type === 'welcome_free';
  const perHour = pack.total_hours > 1 ? Math.round(pack.price / pack.total_hours) : null;

  return (
    <div className="min-h-screen bg-background bg-confetti pb-32">
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 h-16 max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full bg-card border-2 border-ink/10 shadow-soft">
            <ArrowLeft size={18} className="text-ink" strokeWidth={2.5} />
          </button>
          <h1 className="font-display text-xl text-ink">{isFree ? 'Free Hour 🎁' : 'Get Pack'}</h1>
        </div>
      </header>

      <div className="px-4 pt-4 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="relative bg-gradient-coral rounded-[32px] p-7 text-center shadow-pop-coral border-2 border-ink/8 overflow-hidden"
        >
          <div className="absolute top-4 left-4 animate-wobble">
            <Star size={28} color="hsl(var(--butter))" />
          </div>
          <div className="absolute top-6 right-6 animate-bounce-soft">
            <Heart size={22} color="hsl(var(--card))" />
          </div>
          <div className="absolute bottom-4 left-8">
            <Sparkle size={16} color="hsl(var(--card))" />
          </div>

          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="w-28 h-28 mx-auto rounded-3xl bg-card border-4 border-ink/10 flex flex-col items-center justify-center shadow-pop relative z-10"
          >
            <span className="font-display text-4xl text-ink leading-none">{pack.total_hours}</span>
            <span className="text-[10px] font-display text-ink/70 uppercase mt-1">hours</span>
          </motion.div>
          <h2 className="font-display text-2xl text-ink mt-5 relative z-10">{pack.name}</h2>
          {pack.description && (
            <p className="text-sm text-ink/80 mt-2 leading-relaxed font-medium relative z-10">{pack.description}</p>
          )}
          <div className="mt-5 relative z-10">
            <span className="font-display text-4xl text-ink">{isFree ? 'FREE' : `₹${pack.price}`}</span>
            {perHour && <p className="text-xs text-ink/70 mt-1 font-medium">≈ ₹{perHour} per hour</p>}
          </div>
        </motion.div>

        <div className="mt-5 bg-card rounded-[24px] p-5 space-y-3 shadow-soft border-2 border-ink/8">
          <h3 className="font-display text-sm text-ink">What you get</h3>
          <Row icon={<Package size={14} className="text-ink" strokeWidth={2.5} />} color="butter" label={`${pack.total_hours} hour${pack.total_hours > 1 ? 's' : ''} of play time`} />
          <Row icon={<InfinityIcon size={14} className="text-ink" strokeWidth={2.5} />} color="mint" label="No expiry — use whenever" />
          <Row icon={<Check size={14} className="text-ink" strokeWidth={3} />} color="lavender" label="Walk in anytime, no booking needed" />
          <Row icon={<Sparkles size={14} className="text-ink" strokeWidth={2.5} />} color="coral" label="Earn Goofy Points every visit" />
        </div>

        {alreadyClaimed && (
          <div className="mt-4 bg-butter/30 border-2 border-ink/8 rounded-2xl p-4">
            <p className="text-sm text-ink font-display">You've already claimed your FREE hour. Check your dashboard!</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-t-2 border-ink/8 p-4">
        <div className="max-w-lg mx-auto">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handlePurchase}
            disabled={purchasing || alreadyClaimed}
            className="w-full py-4 bg-gradient-coral rounded-2xl font-display text-base text-ink shadow-pop-coral border-2 border-ink/10 disabled:opacity-40"
          >
            {purchasing ? 'Adding…' : alreadyClaimed ? 'Already Claimed' : isFree ? 'Claim My Free Hour 🎁' : `Get for ₹${pack.price} · Pay at Venue`}
          </motion.button>
          <p className="text-[11px] text-muted-foreground text-center mt-2 font-medium">
            {isFree ? 'No payment needed ✨' : 'Online payment coming soon. Cash/UPI at venue for now.'}
          </p>
        </div>
      </div>
    </div>
  );
};

const colorMap: Record<string, string> = {
  coral: 'bg-coral/20',
  mint: 'bg-mint/30',
  butter: 'bg-butter/30',
  lavender: 'bg-lavender/30',
};

const Row = ({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) => (
  <div className="flex items-center gap-3">
    <div className={`w-9 h-9 rounded-xl ${colorMap[color]} border-2 border-ink/8 flex items-center justify-center shrink-0`}>{icon}</div>
    <span className="text-sm text-ink font-medium">{label}</span>
  </div>
);

export default BuyPackPage;
