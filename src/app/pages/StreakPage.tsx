import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSafeBack } from '../hooks/useSafeBack';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '../components/BottomNav';
import Icon3D from '../components/Icon3D';
import illusStreak from '@/assets/illus/illus-streak.png';

const StreakPage = () => {
  const navigate = useNavigate();
  const [streakCampaigns, setStreakCampaigns] = useState<any[]>([]);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [campaignsRes, userRes] = await Promise.all([
        supabase.from('streak_campaigns').select('*').eq('is_active', true),
        supabase.auth.getUser(),
      ]);
      setStreakCampaigns(campaignsRes.data || []);

      const userId = userRes.data.user?.id;
      const campaign = campaignsRes.data?.[0];
      if (userId && campaign) {
        const startMs = Date.now() - campaign.duration_weeks * 7 * 24 * 60 * 60 * 1000;
        const startIso = new Date(startMs).toISOString();
        const [packsRes, bookingsRes, ordersRes] = await Promise.all([
          supabase.from('user_packs').select('purchased_at').eq('user_id', userId).gte('purchased_at', startIso),
          supabase.from('bookings').select('created_at').eq('user_id', userId).gte('created_at', startIso),
          supabase.from('orders').select('created_at').eq('user_id', userId).gte('created_at', startIso),
        ]);
        const allDates: string[] = [
          ...(packsRes.data || []).map(r => r.purchased_at),
          ...(bookingsRes.data || []).map(r => r.created_at),
          ...(ordersRes.data || []).map(r => r.created_at),
        ];
        const weekCounts: Record<string, number> = {};
        allDates.forEach(d => {
          const date = new Date(d);
          const year = date.getFullYear();
          const oneJan = new Date(year, 0, 1);
          const week = Math.ceil(((date.getTime() - oneJan.getTime()) / 86400000 + oneJan.getDay() + 1) / 7);
          const key = `${year}-${week}`;
          weekCounts[key] = (weekCounts[key] || 0) + 1;
        });
        const completedWeeks = Object.values(weekCounts).filter(c => c >= (campaign.min_orders_per_week || 1)).length;
        setCurrentWeek(Math.min(completedWeeks, campaign.duration_weeks));
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const campaign = streakCampaigns[0];
  const durationWeeks = campaign?.duration_weeks || 4;
  const weeks = Array.from({ length: durationWeeks }, (_, i) => ({
    week: i + 1,
    completed: i < currentWeek,
    active: i === currentWeek,
  }));

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-5 h-16 max-w-lg mx-auto">
          <motion.button whileTap={{ scale: 0.9 }} onClick={useSafeBack()}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft size={18} className="text-ink" strokeWidth={2.5} />
          </motion.button>
          <h1 className="font-display text-xl text-ink -tracking-wide">Streak</h1>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-coral border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !campaign ? (
        <div className="px-5 pt-12 max-w-lg mx-auto text-center">
          <Icon3D name="streak" size={120} alt="" className="mx-auto opacity-50" />
          <p className="font-display text-lg text-ink mt-3">No active streaks</p>
          <p className="text-sm text-muted-foreground mt-1 font-heading">Check back soon for new challenges!</p>
        </div>
      ) : (
        <div className="px-5 pt-4 max-w-lg mx-auto space-y-5">
          {/* Hero card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-ink rounded-[32px] p-6 overflow-hidden shadow-hero"
          >
            <div className="relative z-10 max-w-[55%]">
              <p className="text-xs text-white/60 font-heading uppercase tracking-wider">Current Streak</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-display text-6xl text-white -tracking-wide leading-none">{currentWeek}</span>
                <span className="font-display text-xl text-coral">/{durationWeeks}</span>
              </div>
              <p className="text-[11px] text-white/50 mt-2 font-heading">{campaign.name}</p>
            </div>
            <motion.img
              src={illusStreak}
              alt=""
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2.8, repeat: Infinity }}
              className="absolute -bottom-2 -right-4 w-40 h-40 object-contain pointer-events-none"
            />
          </motion.div>

          {/* Week dots */}
          <div className="bg-card rounded-[24px] p-5 shadow-soft border border-border">
            <p className="font-display text-base text-ink mb-4">Weekly progress</p>
            <div className="flex items-center justify-between relative">
              <div className="absolute top-6 left-6 right-6 h-0.5 bg-border" />
              <div
                className="absolute top-6 left-6 h-0.5 bg-mint"
                style={{ width: `calc((100% - 3rem) * ${currentWeek / Math.max(1, durationWeeks - 1)})` }}
              />
              {weeks.map((w, i) => (
                <div key={i} className="flex flex-col items-center gap-2 relative z-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.1, type: 'spring' }}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                      w.completed ? 'bg-mint shadow-pop-mint' : w.active ? 'bg-coral/15 ring-2 ring-coral' : 'bg-muted'
                    }`}
                  >
                    {w.completed
                      ? <Check size={20} className="text-ink" strokeWidth={3} />
                      : w.active
                        ? <Icon3D name="streak" size={28} alt="" />
                        : <Lock size={14} className="text-muted-foreground/50" strokeWidth={2.5} />}
                  </motion.div>
                  <span className={`text-[10px] font-display ${w.completed ? 'text-ink' : w.active ? 'text-coral' : 'text-muted-foreground'}`}>
                    Wk {w.week}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Rules */}
          <div className="bg-card rounded-[24px] p-5 shadow-soft border border-border space-y-3">
            <p className="font-display text-base text-ink">How it works</p>
            {[
              { icon: 'calendar' as const, title: `${campaign.min_orders_per_week} session/week`, desc: `Visit at least ${campaign.min_orders_per_week} time per week` },
              { icon: 'streak' as const, title: `${durationWeeks} weeks straight`, desc: 'Keep the fire going' },
              ...(campaign.grace_period_hours ? [{ icon: 'clock' as const, title: `${campaign.grace_period_hours}h grace period`, desc: 'A little breathing room' }] : []),
            ].map((rule, i) => (
              <div key={i} className="flex items-start gap-3">
                <Icon3D name={rule.icon} size={36} alt="" />
                <div className="flex-1">
                  <p className="font-display text-sm text-ink">{rule.title}</p>
                  <p className="text-xs text-muted-foreground font-heading">{rule.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Reward callout */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-butter rounded-[24px] p-5 flex items-center gap-3 shadow-pop-butter"
          >
            <Icon3D name="gift" size={48} alt="" />
            <div>
              <p className="font-display text-sm text-ink">Complete the streak</p>
              <p className="text-[11px] text-ink/70 font-heading">Unlock an exclusive reward</p>
            </div>
          </motion.div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default StreakPage;
