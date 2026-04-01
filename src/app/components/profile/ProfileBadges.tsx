import { Award } from 'lucide-react';

interface ProfileBadgesProps {
  badges: { id: string; name: string; icon: string; description: string | null; earned_at?: string }[];
}

const ProfileBadges = ({ badges }: ProfileBadgesProps) => {
  if (badges.length === 0) return null;

  return (
    <div className="px-4 pt-4">
      <p className="text-sm text-foreground font-heading mb-2 flex items-center gap-1.5">
        <Award size={14} className="text-secondary" /> Earned Badges
      </p>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {badges.map(b => (
          <div key={b.id} className="bg-gradient-to-br from-secondary/10 to-card border border-secondary/15 rounded-xl p-3 text-center min-w-[80px] shrink-0">
            <span className="text-2xl">{b.icon}</span>
            <p className="text-[10px] font-medium text-foreground mt-1">{b.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileBadges;
