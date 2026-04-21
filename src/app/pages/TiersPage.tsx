import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import Icon3D from '../components/Icon3D';
import illusTier from '@/assets/illus/illus-tier.png';

const tiers = [
  { name: 'Rookie', orders: 0, perks: ['Base earning rate'], bg: 'bg-muted' },
  { name: 'Pro', orders: 10, perks: ['5% extra Goofy Points'], bg: 'bg-mint' },
  { name: 'Elite', orders: 25, perks: ['10% extra points', 'Early flash deal access'], bg: 'bg-lavender' },
  { name: 'Legend', orders: 50, perks: ['15% extra points', 'Priority booking', 'Exclusive offers'], bg: 'bg-coral' },
];

const TiersPage = () => {
  const navigate = useNavigate();
  const { totalOrders } = useAppStore();

  const currentTierIndex = totalOrders >= 50 ? 3 : totalOrders >= 25 ? 2 : totalOrders >= 10 ? 1 : 0;
  const currentTier = tiers[currentTierIndex];
  const next = tiers[currentTierIndex + 1];

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-5 h-16 max-w-lg mx-auto">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft size={18} className="text-ink" strokeWidth={2.5} />
          </motion.button>
          <h1 className="font-display text-xl text-ink -tracking-wide">Tiers</h1>
        </div>
      </header>

      <div className="px-5 pt-4 max-w-lg mx-auto space-y-5">
        {/* Current tier hero — dark card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-ink rounded-[32px] p-6 overflow-hidden shadow-hero"
        >
          <div className="relative z-10 max-w-[55%]">
            <p className="text-xs text-white/60 font-heading uppercase tracking-wider">Current Tier</p>
            <h2 className="font-display text-4xl text-white mt-1 -tracking-wide">{currentTier.name}</h2>
            <p className="text-xs text-white/50 mt-2 font-heading">{totalOrders} sessions completed</p>

            {next && (
              <div className="mt-5">
                <div className="h-2 bg-white/15 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (totalOrders / next.orders) * 100)}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="h-full bg-mint rounded-full"
                  />
                </div>
                <p className="text-[11px] text-white/60 mt-2 font-heading">
                  {next.orders - totalOrders} to <span className="text-mint font-display">{next.name}</span>
                </p>
              </div>
            )}
          </div>
          <motion.img
            src={illusTier}
            alt=""
            animate={{ y: [0, -6, 0], rotate: [0, 3, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute -bottom-4 -right-4 w-44 h-44 object-contain pointer-events-none"
          />
        </motion.div>

        {/* Tier list */}
        <div className="space-y-2.5">
          {tiers.map((t, i) => {
            const unlocked = i <= currentTierIndex;
            const isCurrent = i === currentTierIndex;
            return (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`rounded-[24px] p-4 ${isCurrent ? 'bg-card border-2 border-ink shadow-pop' : 'bg-card border border-border shadow-soft'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl ${t.bg} flex items-center justify-center shrink-0`}>
                    {unlocked
                      ? <Icon3D name="tier" size={36} alt="" />
                      : <Lock size={18} className="text-ink/40" strokeWidth={2.5} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-base text-ink">{t.name}</span>
                      {isCurrent && <span className="text-[9px] px-2 py-0.5 rounded-full bg-mint text-ink font-display">CURRENT</span>}
                    </div>
                    <p className="text-[11px] text-muted-foreground font-heading">{t.orders} sessions</p>
                  </div>
                </div>
                <div className="mt-3 pl-15 space-y-1">
                  {t.perks.map(perk => (
                    <p key={perk} className={`text-xs flex items-center gap-1.5 font-heading ${unlocked ? 'text-ink' : 'text-muted-foreground'}`}>
                      <Check size={11} strokeWidth={2.5} className={unlocked ? 'text-mint' : 'text-muted-foreground/50'} /> {perk}
                    </p>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TiersPage;
