import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '../store';
import { useStoreSelection } from '../hooks/useStoreSelection';
import Icon3D, { Icon3DName } from '../components/Icon3D';
import { toast } from 'sonner';
import partyBasic from '@/assets/party-basic.jpg';
import partyBash from '@/assets/party-bash.jpg';
import partyBonanza from '@/assets/party-bonanza.jpg';
import packPlayDate from '@/assets/pack-playdate.jpg';
import pack5h from '@/assets/pack-5h.jpg';
import pack10h from '@/assets/pack-10h.jpg';
import pack20h from '@/assets/pack-20h.jpg';
import pack30h from '@/assets/pack-30h.jpg';
import pack60h from '@/assets/pack-60h.jpg';

const matchPartyImage = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('bonanza')) return partyBonanza;
  if (n.includes('bash')) return partyBash;
  return partyBasic;
};

const matchPackImage = (packType: string, hours: number, name: string): string | null => {
  if (packType === 'party') return matchPartyImage(name);
  if (packType === 'play_date') return packPlayDate;
  if (packType !== 'hour_pack') return null;
  if (hours <= 5) return pack5h;
  if (hours <= 10) return pack10h;
  if (hours <= 20) return pack20h;
  if (hours <= 30) return pack30h;
  return pack60h;
};

const validityFor = (packType: string, hours: number) => {
  if (packType === 'play_date') return 'Single visit · Inclusive of GST';
  if (packType !== 'hour_pack') return null;
  return hours <= 10 ? '2 month validity' : '3 month validity';
};

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
  const isParty = pack.pack_type === 'party';
  const isHourPack = pack.pack_type === 'hour_pack';
  const isPlayDate = pack.pack_type === 'play_date';
  const perHour = isHourPack && pack.total_hours > 1 ? Math.round(pack.price / pack.total_hours) : null;
  const heroImg = matchPackImage(pack.pack_type, pack.total_hours, pack.name);
  const validity = validityFor(pack.pack_type, pack.total_hours);

  // Parse description: split on blank lines into sections; bullet lines start with •
  const sections = (pack.description || '')
    .split(/\n\s*\n/)
    .map(s => s.trim())
    .filter(Boolean);

  const renderSection = (text: string, key: number) => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const allBullets = lines.every(l => l.startsWith('•'));
    if (allBullets) {
      return (
        <ul key={key} className="space-y-1.5">
          {lines.map((l, i) => (
            <li key={i} className="text-sm text-ink/80 font-heading flex gap-2 leading-relaxed">
              <span className="text-coral mt-0.5">•</span>
              <span>{l.replace(/^•\s*/, '')}</span>
            </li>
          ))}
        </ul>
      );
    }
    return (
      <div key={key} className="space-y-1">
        {lines.map((l, i) => {
          const isBullet = l.startsWith('•');
          return (
            <p key={i} className={`text-sm leading-relaxed font-heading ${isBullet ? 'text-ink/80 pl-2' : 'text-ink/75'}`}>
              {l}
            </p>
          );
        })}
      </div>
    );
  };

  const headerLabel = isFree
    ? 'Free hour'
    : isParty
      ? 'Birthday party'
      : isPlayDate
        ? 'Play date'
        : 'Hour pack';

  const heroEyebrow = isParty ? 'Party package' : isPlayDate ? 'Single visit pack' : `${pack.total_hours} hour pack`;
  const priceSuffix = isParty ? '/kid' : isPlayDate ? ' onwards' : perHour ? `≈ ₹${perHour}/hr` : '';

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-5 h-16 max-w-lg mx-auto">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft size={18} className="text-ink" strokeWidth={2.5} />
          </motion.button>
          <h1 className="font-display text-xl text-ink -tracking-wide">{headerLabel}</h1>
        </div>
      </header>

      <div className="px-5 pt-4 max-w-lg mx-auto space-y-5">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="relative bg-ink rounded-[32px] p-6 overflow-hidden shadow-hero"
        >
          <div className="relative z-10 max-w-[60%]">
            <p className="text-xs text-white/60 font-heading uppercase tracking-wider">{heroEyebrow}</p>
            <h2 className="font-display text-3xl text-white mt-1 -tracking-wide leading-tight">{pack.name}</h2>
            {validity && (
              <span className="inline-block mt-2 text-[10px] px-2.5 py-1 rounded-full bg-white/15 text-white/85 font-display">
                {validity}
              </span>
            )}
            <div className="mt-4 flex items-baseline gap-2 flex-wrap">
              <span className="font-display text-4xl text-mint -tracking-wide">
                {isFree ? 'FREE' : `₹${pack.price.toLocaleString('en-IN')}`}
              </span>
              {priceSuffix && <span className="text-xs text-white/55 font-heading">{priceSuffix}</span>}
            </div>
          </div>
          {heroImg ? (
            <motion.img
              src={heroImg}
              alt={pack.name}
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.8, repeat: Infinity }}
              className="absolute -bottom-3 -right-3 w-40 h-40 rounded-3xl object-cover shadow-soft"
            />
          ) : (
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.8, repeat: Infinity }}
              className="absolute -bottom-2 -right-2"
            >
              <Icon3D name={isFree ? 'gift' : 'clock'} size={150} alt="" />
            </motion.div>
          )}
        </motion.div>

        {/* Description (parsed) */}
        {sections.length > 0 && (
          <div className="bg-card rounded-[24px] p-5 space-y-4 shadow-soft border border-border">
            <h3 className="font-display text-sm text-ink">What's included</h3>
            {sections.map((s, i) => renderSection(s, i))}
          </div>
        )}

        {/* Quick facts */}
        <div className="bg-card rounded-[24px] p-5 space-y-3 shadow-soft border border-border">
          <h3 className="font-display text-sm text-ink">Good to know</h3>
          {isHourPack && <Row icon="clock" label={`${pack.total_hours} hour${pack.total_hours > 1 ? 's' : ''} of play time`} />}
          {isHourPack && <Row icon="calendar" label={validity || 'Use within validity'} />}
          {isHourPack && <Row icon="badge" label="Group of up to 5 kids at one time" />}
          {isParty && <Row icon="clock" label={`${pack.total_hours} hour celebration`} />}
          {isParty && <Row icon="gift" label="Up to 10 kids · extras at per-kid price" />}
          {isPlayDate && <Row icon="clock" label={`${pack.total_hours} hours of play`} />}
          {isPlayDate && <Row icon="gift" label="Includes meal pack" />}
          <Row icon="qr" label="Walk in at your store, no booking needed" />
        </div>

        {alreadyClaimed && (
          <div className="bg-butter/40 rounded-[20px] p-4">
            <p className="text-sm text-ink font-display">You've already claimed your FREE hour. Check your dashboard!</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border p-4">
        <div className="max-w-lg mx-auto">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handlePurchase}
            disabled={purchasing || alreadyClaimed}
            className="w-full py-4 bg-ink rounded-full font-display text-base text-white disabled:opacity-40"
          >
            {purchasing ? 'Adding…' : alreadyClaimed ? 'Already claimed' : isFree ? 'Claim my free hour 🎁' : `Reserve for ₹${pack.price} · Pay at venue`}
          </motion.button>
          <p className="text-[11px] text-muted-foreground text-center mt-2 font-heading">
            {isFree ? 'No payment needed ✨' : "You'll see your pack as Pending. Visit the centre to pay & activate."}
          </p>
        </div>
      </div>
    </div>
  );
};

const Row = ({ icon, label }: { icon: Icon3DName; label: string }) => (
  <div className="flex items-center gap-3">
    <Icon3D name={icon} size={36} alt="" />
    <span className="text-sm text-ink font-heading">{label}</span>
  </div>
);

export default BuyPackPage;
