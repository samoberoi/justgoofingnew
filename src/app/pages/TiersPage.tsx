import { motion } from 'framer-motion';
import { ArrowLeft, Crown, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';

const tiers = [
  { name: 'Sipahi', orders: 0, perks: ['Base earning rate'], color: 'bg-muted', textColor: 'text-muted-foreground', icon: '⚔️' },
  { name: 'Wazir', orders: 10, perks: ['5% extra points'], color: 'bg-secondary/20', textColor: 'text-secondary', icon: '🏛️' },
  { name: 'Nawab', orders: 25, perks: ['10% extra points', 'Early Flash Dawat access'], color: 'bg-primary/20', textColor: 'text-primary', icon: '🏰' },
  { name: 'Sultan', orders: 50, perks: ['15% extra points', 'Priority preparation', 'Exclusive offers'], color: 'bg-accent/20', textColor: 'text-accent', icon: '👑' },
];

const TiersPage = () => {
  const navigate = useNavigate();
  const { totalOrders, tier } = useAppStore();

  const currentTierIndex = tiers.findIndex(t => t.name === tier);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-foreground" /></button>
          <h1 className="font-heading text-lg text-foreground">Royalty Tiers</h1>
        </div>
      </header>

      {/* Current progress */}
      <div className="px-4 pt-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-secondary/20 rounded-2xl p-6 text-center"
        >
          <p className="text-4xl mb-2">{tiers[currentTierIndex]?.icon}</p>
          <p className="font-heading text-xl text-gradient-gold">{tier}</p>
          <p className="text-xs text-muted-foreground mt-2">{totalOrders} orders completed</p>

          {currentTierIndex < 3 && (
            <div className="mt-4">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(totalOrders / tiers[currentTierIndex + 1].orders) * 100}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="h-full bg-gradient-saffron rounded-full"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {tiers[currentTierIndex + 1].orders - totalOrders} orders to <span className="text-secondary">{tiers[currentTierIndex + 1].name}</span>
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* All tiers */}
      <div className="px-4 pt-6 space-y-3">
        {tiers.map((t, i) => {
          const isUnlocked = i <= currentTierIndex;
          const isCurrent = t.name === tier;
          return (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`border rounded-xl p-4 ${isCurrent ? 'border-secondary/30 bg-secondary/5' : 'border-border bg-card'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${t.color}`}>
                  {isUnlocked ? t.icon : <Lock size={16} className="text-muted-foreground" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-heading text-sm ${isUnlocked ? t.textColor : 'text-muted-foreground'}`}>{t.name}</span>
                    {isCurrent && <span className="text-[10px] px-2 py-0.5 bg-secondary/20 text-secondary rounded-full">Current</span>}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{t.orders} orders required</p>
                </div>
              </div>
              <div className="mt-2 ml-13 space-y-1">
                {t.perks.map(perk => (
                  <p key={perk} className={`text-xs ${isUnlocked ? 'text-foreground' : 'text-muted-foreground'}`}>• {perk}</p>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Elite Sultan note */}
      <div className="px-4 pt-6 pb-8">
        <div className="bg-card border border-accent/20 rounded-xl p-4 text-center">
          <p className="text-2xl mb-1">🏆</p>
          <p className="font-heading text-sm text-accent">Elite Sultan</p>
          <p className="text-[10px] text-muted-foreground mt-1">Maintain Sultan tier for 3 streak cycles to unlock</p>
        </div>
      </div>
    </div>
  );
};

export default TiersPage;
