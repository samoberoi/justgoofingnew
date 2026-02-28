import { Bell, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';

const tierColors: Record<string, string> = {
  Sipahi: 'bg-muted text-muted-foreground',
  Wazir: 'bg-secondary/20 text-secondary',
  Nawab: 'bg-primary/20 text-primary',
  Sultan: 'bg-accent/20 text-accent',
};

const RoyalHeader = () => {
  const { walletBalance, tier } = useAppStore();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <span className="font-display text-lg text-gradient-gold">BIRYAAN</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app/wallet')}
            className="flex items-center gap-1.5 bg-secondary/10 px-3 py-1 rounded-full"
          >
            <span className="text-xs text-secondary font-semibold">💰 {walletBalance} pts</span>
          </button>
          <button className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${tierColors[tier]}`}>
            <Crown size={12} />
            {tier}
          </button>
          <button onClick={() => navigate('/app/notifications')} className="relative">
            <Bell size={20} className="text-muted-foreground" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default RoyalHeader;
