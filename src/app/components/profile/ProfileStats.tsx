import { motion } from 'framer-motion';

interface ProfileStatsProps {
  totalOrders: number;
  walletBalance: number;
  badgeCount: number;
}

const ProfileStats = ({ totalOrders, walletBalance, badgeCount }: ProfileStatsProps) => {
  const stats = [
    { label: 'Orders', value: totalOrders.toString(), icon: '📦', color: 'from-primary/10 to-primary/5' },
    { label: 'Goofy Points', value: `${walletBalance}`, icon: '💰', color: 'from-secondary/10 to-secondary/5' },
    { label: 'Badges', value: badgeCount.toString(), icon: '🏅', color: 'from-accent/10 to-accent/5' },
  ];

  return (
    <div className="px-4 pt-4 grid grid-cols-3 gap-2">
      {stats.map((stat, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
          className={`bg-gradient-to-br ${stat.color} border border-border rounded-xl p-3 text-center`}>
          <p className="text-xl">{stat.icon}</p>
          <p className="font-heading text-base text-foreground mt-1">{stat.value}</p>
          <p className="text-[10px] text-muted-foreground">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  );
};

export default ProfileStats;
