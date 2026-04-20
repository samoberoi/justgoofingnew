import { motion } from 'framer-motion';
import { Baby, Plus, ChevronRight, GraduationCap, Cake } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useKids, calcAge } from '../../hooks/useKids';

const KID_COLORS = [
  'bg-gradient-coral shadow-pop-coral',
  'bg-gradient-mint shadow-pop-mint',
  'bg-gradient-butter shadow-pop-butter',
  'bg-gradient-lavender shadow-pop-lavender',
  'bg-gradient-sky shadow-pop',
  'bg-gradient-bubblegum shadow-pop',
];

interface ProfileKidsProps {
  userId: string | null;
}

const ProfileKids = ({ userId }: ProfileKidsProps) => {
  const navigate = useNavigate();
  const { kids, loading } = useKids(userId);

  return (
    <div className="px-4 pt-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-heading text-ink flex items-center gap-1.5">
          <Baby size={16} className="text-coral" /> My Kids
          {kids.length > 0 && (
            <span className="text-[11px] text-ink/50 font-body ml-1">({kids.length})</span>
          )}
        </p>
        <button
          onClick={() => navigate('/kids')}
          className="text-[11px] font-heading text-coral flex items-center gap-1"
        >
          Manage <ChevronRight size={12} />
        </button>
      </div>

      {loading ? (
        <div className="h-24 bg-card rounded-3xl animate-pulse" />
      ) : kids.length === 0 ? (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/kids?add=1')}
          className="w-full bg-card border-2 border-dashed border-coral/30 rounded-3xl p-5 flex items-center gap-3 active:scale-[0.98] transition-transform"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-coral flex items-center justify-center text-2xl shadow-pop-coral">
            👶
          </div>
          <div className="flex-1 text-left">
            <p className="font-heading text-sm text-ink">Add your first kid</p>
            <p className="text-[11px] text-ink/50 mt-0.5">Quick check-ins, birthday treats & more</p>
          </div>
          <Plus size={18} className="text-coral" />
        </motion.button>
      ) : (
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
          {kids.map((k, i) => {
            const age = calcAge(k.date_of_birth);
            const initial = k.name.charAt(0).toUpperCase();
            const colorClass = KID_COLORS[i % KID_COLORS.length];
            return (
              <motion.button
                key={k.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/kids')}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-3xl p-3 border-2 border-ink/8 min-w-[140px] shrink-0 text-left active:scale-95 transition-transform"
              >
                <div className={`w-14 h-14 rounded-2xl ${colorClass} flex items-center justify-center text-white font-display text-xl mb-2`}>
                  {initial}
                </div>
                <p className="font-heading text-sm text-ink truncate">{k.name}</p>
                {age !== null && (
                  <p className="text-[11px] text-ink/55 mt-0.5 flex items-center gap-1">
                    <Cake size={10} /> {age}{age === 1 ? ' yr' : ' yrs'}
                  </p>
                )}
                {k.school && (
                  <p className="text-[10px] text-ink/45 mt-0.5 flex items-center gap-1 truncate">
                    <GraduationCap size={10} className="shrink-0" /> <span className="truncate">{k.school}</span>
                  </p>
                )}
              </motion.button>
            );
          })}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/kids?add=1')}
            className="bg-card border-2 border-dashed border-coral/40 rounded-3xl p-3 min-w-[120px] shrink-0 flex flex-col items-center justify-center gap-2"
          >
            <div className="w-12 h-12 rounded-2xl bg-coral/10 flex items-center justify-center">
              <Plus size={20} className="text-coral" />
            </div>
            <p className="text-[11px] font-heading text-coral">Add Kid</p>
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default ProfileKids;
