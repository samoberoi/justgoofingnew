import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Icon3D from '../components/Icon3D';
import BottomNav from '../components/BottomNav';
import partyBasic from '@/assets/party-basic.jpg';
import partyBash from '@/assets/party-bash.jpg';
import partyBonanza from '@/assets/party-bonanza.jpg';

interface PartyPack {
  id: string;
  name: string;
  description: string | null;
  price: number;
  total_hours: number;
}

const accents = [
  { bg: 'bg-butter', icon: 'gift' as const, image: partyBasic },
  { bg: 'bg-lavender', icon: 'streak' as const, image: partyBash },
  { bg: 'bg-coral', icon: 'badge' as const, image: partyBonanza },
];

const matchImage = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('bonanza')) return partyBonanza;
  if (n.includes('bash')) return partyBash;
  return partyBasic;
};

const PartiesPage = () => {
  const navigate = useNavigate();
  const [packs, setPacks] = useState<PartyPack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('play_packs' as any)
        .select('*')
        .eq('is_active', true)
        .eq('pack_type', 'party')
        .order('display_order', { ascending: true });
      setPacks((data as any) || []);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-5 h-16 max-w-lg mx-auto">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft size={18} className="text-ink" strokeWidth={2.5} />
          </motion.button>
          <div>
            <h1 className="font-display text-xl text-ink -tracking-wide leading-none">Birthday parties</h1>
            <p className="text-xs text-muted-foreground font-heading mt-0.5">One-off party bookings</p>
          </div>
        </div>
      </header>

      <div className="px-5 pt-4 max-w-lg mx-auto space-y-5">
        {/* Hero banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-ink rounded-[32px] p-6 overflow-hidden shadow-hero"
        >
          <div className="relative z-10 max-w-[65%]">
            <p className="text-xs text-white/60 font-heading uppercase tracking-wider">Pick a vibe</p>
            <h2 className="font-display text-3xl text-white mt-1 -tracking-wide leading-tight">Throw an unforgettable party 🎉</h2>
            <p className="text-xs text-white/60 mt-2 leading-relaxed font-heading">2.5 hours of pure goofing — food, decor &amp; entertainment included.</p>
          </div>
          <motion.div
            animate={{ y: [0, -6, 0], rotate: [0, 4, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute -bottom-3 -right-3"
          >
            <Icon3D name="gift" size={140} alt="" />
          </motion.div>
        </motion.div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-coral border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && packs.length === 0 && (
          <div className="bg-card rounded-[24px] p-6 text-center border border-border">
            <p className="font-heading text-sm text-muted-foreground">No party packages available yet.</p>
          </div>
        )}

        <div className="space-y-4">
          {packs.map((pack, i) => {
            const a = accents[i % accents.length];
            const img = matchImage(pack.name);
            const tagline = (pack.description || '').split('\n')[0];
            return (
              <motion.button
                key={pack.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/buy-pack/${pack.id}`)}
                className={`relative w-full text-left ${a.bg} rounded-[28px] p-5 shadow-pop overflow-hidden`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-2xl text-ink -tracking-wide leading-tight truncate">{pack.name}</h3>
                    {tagline && (
                      <p className="text-[11px] text-ink/65 font-heading mt-1 line-clamp-1">{tagline}</p>
                    )}
                    <div className="mt-3 flex items-baseline gap-1.5">
                      <span className="font-display text-3xl text-ink -tracking-wide">₹{pack.price.toLocaleString('en-IN')}</span>
                      <span className="text-xs text-ink/55 font-heading">/kid onwards</span>
                    </div>
                    <div className="mt-3 inline-flex items-center gap-1 px-3 h-7 rounded-full bg-ink/10">
                      <span className="text-[11px] font-display text-ink">View full details</span>
                    </div>
                  </div>
                  <motion.img
                    src={img}
                    alt={pack.name}
                    width={120}
                    height={120}
                    loading="lazy"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.2 }}
                    className="w-28 h-28 rounded-2xl object-cover shadow-soft flex-shrink-0"
                  />
                </div>
              </motion.button>
            );
          })}
        </div>

        <div className="bg-card rounded-[24px] p-5 border border-border space-y-3">
          <h3 className="font-display text-sm text-ink">Need help planning?</h3>
          <p className="text-xs text-muted-foreground font-heading leading-relaxed">
            Tap any package to see the full breakdown — inclusions, pricing for adults &amp; kids buffet, plus add-on activities.
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default PartiesPage;
