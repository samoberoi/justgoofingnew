import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, Check, Sparkles, Infinity as InfinityIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '../store';
import { useStoreSelection } from '../hooks/useStoreSelection';
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
      const { data } = await supabase
        .from('play_packs' as any)
        .select('*')
        .eq('id', packId)
        .single();
      setPack(data as any);

      // For free welcome pack, check if user already claimed one
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

    const { data, error } = await supabase
      .from('user_packs' as any)
      .insert({
        user_id: userId,
        pack_id: pack.id,
        pack_name: pack.name,
        total_hours: pack.total_hours,
        amount_paid: pack.price,
        status: 'active',
        is_free_welcome: isFree,
        store_id: selectedStore?.id || null,
      })
      .select()
      .single();

    if (error) {
      toast.error('Could not add pack', { description: error.message });
      setPurchasing(false);
      return;
    }

    toast.success(isFree ? '1 Hour FREE Claimed! 🎉' : `${pack.total_hours} hours added to your account!`);
    navigate('/home');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!pack) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Pack not found</p>
      </div>
    );
  }

  const isFree = pack.pack_type === 'welcome_free';
  const perHour = pack.total_hours > 1 ? Math.round(pack.price / pack.total_hours) : null;

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-2xl border-b border-secondary/10">
        <div className="flex items-center gap-3 px-4 h-14 max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-full bg-secondary/8 border border-secondary/15">
            <ArrowLeft size={16} className="text-secondary" />
          </button>
          <h1 className="font-heading text-base text-foreground">{isFree ? 'Claim Free Hour' : 'Buy Pack'}</h1>
        </div>
      </header>

      <div className="px-4 pt-6 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-secondary/15 via-secondary/5 to-transparent border border-secondary/25 rounded-3xl p-6 text-center"
        >
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-secondary/30 to-secondary/10 border border-secondary/30 flex flex-col items-center justify-center">
            <span className="font-heading text-2xl text-secondary leading-none">{pack.total_hours}</span>
            <span className="text-[10px] text-secondary/80 uppercase tracking-wider mt-1">hours</span>
          </div>
          <h2 className="font-heading text-xl text-foreground mt-4">{pack.name}</h2>
          {pack.description && (
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{pack.description}</p>
          )}
          <div className="mt-5">
            <span className="font-heading text-3xl text-secondary">{isFree ? 'FREE' : `₹${pack.price}`}</span>
            {perHour && <p className="text-xs text-muted-foreground mt-1">≈ ₹{perHour} per hour</p>}
          </div>
        </motion.div>

        <div className="mt-5 bg-card border border-border rounded-2xl p-4 space-y-3">
          <h3 className="font-heading text-xs uppercase tracking-wider text-muted-foreground">What's Included</h3>
          <Row icon={<Package size={14} className="text-secondary" />} label={`${pack.total_hours} hour${pack.total_hours > 1 ? 's' : ''} of play time`} />
          <Row icon={<InfinityIcon size={14} className="text-secondary" />} label="No expiry — use whenever you want" />
          <Row icon={<Check size={14} className="text-secondary" />} label="Walk in anytime, no pre-booking needed" />
          <Row icon={<Sparkles size={14} className="text-secondary" />} label="Earn Goofy Points on every visit" />
        </div>

        {alreadyClaimed && (
          <div className="mt-4 bg-accent/10 border border-accent/20 rounded-xl p-3">
            <p className="text-xs text-accent font-heading">You've already claimed your FREE hour. Check your dashboard!</p>
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-t border-secondary/10 p-4">
        <div className="max-w-lg mx-auto">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handlePurchase}
            disabled={purchasing || alreadyClaimed}
            className="w-full py-4 bg-gradient-saffron rounded-xl font-heading text-sm uppercase tracking-widest text-primary-foreground shadow-saffron disabled:opacity-50"
          >
            {purchasing ? 'Adding…' : alreadyClaimed ? 'Already Claimed' : isFree ? 'Claim My Free Hour' : `Buy for ₹${pack.price} · Pay at Venue`}
          </motion.button>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            {isFree ? '🎁 No payment needed' : 'Online payment coming soon. Pay cash/UPI at venue for now.'}
          </p>
        </div>
      </div>
    </div>
  );
};

const Row = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div className="flex items-center gap-2.5">
    <div className="w-7 h-7 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">{icon}</div>
    <span className="text-sm text-foreground">{label}</span>
  </div>
);

export default BuyPackPage;
