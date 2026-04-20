import { useState } from 'react';
import { motion } from 'framer-motion';
import OpsBottomNav from '../components/OpsBottomNav';
import CampaignsTab from '../components/loyalty/CampaignsTab';
import StreaksTab from '../components/loyalty/StreaksTab';
import BadgesTab from '../components/loyalty/BadgesTab';
import PointsSettingsTab from '../components/loyalty/PointsSettingsTab';
import ReferralsTab from '../components/loyalty/ReferralsTab';
import { Ticket, Flame, Award, Coins, Share2 } from 'lucide-react';

const TABS = [
  { key: 'campaigns', label: 'Campaigns', icon: Ticket },
  { key: 'streaks', label: 'Streaks', icon: Flame },
  { key: 'badges', label: 'Badges', icon: Award },
  { key: 'points', label: 'Points', icon: Coins },
  { key: 'referrals', label: 'Referrals', icon: Share2 },
] as const;

type TabKey = typeof TABS[number]['key'];

const LoyaltyEnginePage = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('campaigns');

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border">
        <div className="px-4 py-3">
          <h1 className="font-heading text-lg text-gradient-gold">Rewards & Loyalty</h1>
          <p className="text-muted-foreground text-[10px]">Manage campaigns, streaks, badges & points</p>
        </div>
        <div className="flex overflow-x-auto px-2 pb-2 gap-1 no-scrollbar">
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive ? 'bg-secondary/20 text-secondary' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
                {isActive && (
                  <motion.div layoutId="loyaltyTab" className="absolute bottom-0 left-2 right-2 h-0.5 bg-secondary rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-4">
        {activeTab === 'campaigns' && <CampaignsTab />}
        {activeTab === 'streaks' && <StreaksTab />}
        {activeTab === 'badges' && <BadgesTab />}
        {activeTab === 'points' && <PointsSettingsTab />}
        {activeTab === 'referrals' && <ReferralsTab />}
      </div>

      <OpsBottomNav />
    </div>
  );
};

export default LoyaltyEnginePage;
