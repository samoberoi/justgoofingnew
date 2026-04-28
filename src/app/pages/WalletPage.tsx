import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSafeBack } from '../hooks/useSafeBack';
import { useAppStore } from '../store';
import BottomNav from '../components/BottomNav';
import Icon3D, { Icon3DName } from '../components/Icon3D';
import illusWallet from '@/assets/illus/illus-wallet.png';

const WalletPage = () => {
  const navigate = useNavigate();
  const { walletBalance, transactions } = useAppStore();

  const earnWays: { icon: Icon3DName; points: string; desc: string; bg: string }[] = [
    { icon: 'calendar', points: '2.5%', desc: 'Every booking', bg: 'bg-mint' },
    { icon: 'gift', points: '+100', desc: 'Refer a friend', bg: 'bg-coral' },
    { icon: 'streak', points: 'Bonus', desc: 'Streak reward', bg: 'bg-lavender' },
  ];

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-5 h-16 max-w-lg mx-auto">
          <motion.button whileTap={{ scale: 0.9 }} onClick={useSafeBack()}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft size={18} className="text-ink" strokeWidth={2.5} />
          </motion.button>
          <h1 className="font-display text-xl text-ink -tracking-wide">Goofy Points</h1>
        </div>
      </header>

      <div className="px-5 pt-4 max-w-lg mx-auto space-y-5">
        {/* Hero balance card */}
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative bg-ink rounded-[32px] p-6 overflow-hidden shadow-hero"
        >
          <div className="relative z-10 max-w-[55%]">
            <p className="text-xs text-white/60 font-heading uppercase tracking-wider">Your balance</p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="font-display text-6xl text-white -tracking-wide leading-none tabular-nums">{walletBalance}</span>
            </div>
            <p className="text-white/50 text-xs mt-2 font-heading">1 point = ₹1 · Redeem anytime</p>
          </div>
          <motion.img
            src={illusWallet}
            alt=""
            animate={{ y: [0, -6, 0], rotate: [0, 4, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute -bottom-4 -right-4 w-44 h-44 object-contain pointer-events-none"
          />
        </motion.div>

        {/* Earn ways */}
        <section>
          <h3 className="font-display text-base text-ink mb-3 px-1">Ways to earn</h3>
          <div className="grid grid-cols-3 gap-2.5">
            {earnWays.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`${item.bg} rounded-[24px] p-3 text-center overflow-hidden`}
              >
                <Icon3D name={item.icon} size={42} alt="" className="mx-auto" />
                <p className="font-display text-base text-ink mt-1">{item.points}</p>
                <p className="text-[10px] text-ink/70 mt-0.5 font-heading">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Transactions */}
        {transactions.length > 0 ? (
          <section>
            <h3 className="font-display text-base text-ink mb-3 px-1">History</h3>
            <div className="space-y-2">
              {transactions.map((tx, i) => {
                const positive = tx.amount > 0;
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="bg-card rounded-[20px] p-3.5 flex items-center gap-3 shadow-soft border border-border"
                  >
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${positive ? 'bg-mint/30' : 'bg-coral/20'}`}>
                      {positive ? <TrendingUp size={16} className="text-ink" strokeWidth={2.5} /> : <TrendingDown size={16} className="text-ink" strokeWidth={2.5} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-display text-ink truncate">{tx.description}</p>
                      <p className="text-[11px] text-muted-foreground font-heading">{tx.date}</p>
                    </div>
                    <span className={`font-display text-base tabular-nums ${positive ? 'text-mint' : 'text-coral'}`}>
                      {positive ? '+' : ''}{tx.amount}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </section>
        ) : (
          <div className="bg-muted rounded-[28px] p-8 text-center">
            <Icon3D name="wallet" size={80} alt="" className="mx-auto" />
            <p className="font-display text-lg text-ink mt-2">No history yet</p>
            <p className="text-xs text-muted-foreground mt-1 font-heading">Make your first booking to start earning</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default WalletPage;
