import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Flame, Check, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '../components/BottomNav';

const StreakPage = () => {
  const navigate = useNavigate();
  const [streakCampaigns, setStreakCampaigns] = useState<any[]>([]);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [campaignsRes, userRes] = await Promise.all([
        supabase.from('streak_campaigns').select('*').eq('is_active', true),
        supabase.auth.getUser(),
      ]);
      setStreakCampaigns(campaignsRes.data || []);

      const userId = userRes.data.user?.id;
      const campaign = campaignsRes.data?.[0];
      if (userId && campaign) {
        // Compute weeks completed: count distinct ISO weeks since campaign-relevant activity
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
        // Group by week-of-year, count weeks where activity >= min_orders_per_week
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
    fetch();
  }, []);

  const campaign = streakCampaigns[0];
  const durationWeeks = campaign?.duration_weeks || 4;

  const weeks = Array.from({ length: durationWeeks }, (_, i) => ({
    week: i + 1,
    completed: i < currentWeek,
    active: i === currentWeek,
  }));

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-2xl border-b border-secondary/10">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-foreground" /></button>
          <h1 className="font-heading text-lg text-foreground">Order Streak</h1>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !campaign ? (
        <div className="px-4 pt-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Flame size={32} className="text-muted-foreground/40" />
          </div>
          <p className="font-heading text-base text-foreground">No Active Streaks</p>
          <p className="text-muted-foreground text-sm mt-1">Check back soon for new streak campaigns!</p>
        </div>
      ) : (
        <>
          {/* Hero */}
          <div className="px-4 pt-8 text-center">
            <motion.div
              animate={{ scale: [1, 1.08, 1], rotate: [0, -3, 3, 0] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="inline-block"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 flex items-center justify-center mx-auto">
                <Flame size={40} className="text-primary" />
              </div>
            </motion.div>
            <h2 className="font-heading text-xl text-gradient-gold mt-5">{campaign.name}</h2>
            <p className="text-muted-foreground text-sm mt-2">
              Order {campaign.min_orders_per_week}× per week for {durationWeeks} weeks
            </p>
          </div>

          {/* Weekly Progress */}
          <div className="px-6 pt-8">
            <div className="flex items-center justify-between relative">
              {/* Connecting line */}
              <div className="absolute top-7 left-8 right-8 h-0.5 bg-border" />
              <div className="absolute top-7 left-8 h-0.5 bg-secondary/50" style={{ width: `${(currentWeek / (durationWeeks - 1)) * 100}%`, maxWidth: 'calc(100% - 4rem)' }} />

              {weeks.map((w, i) => (
                <div key={i} className="flex flex-col items-center gap-2 relative z-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.12, type: 'spring' }}
                    className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all ${
                      w.completed
                        ? 'bg-secondary/20 border-secondary shadow-gold'
                        : w.active
                          ? 'bg-primary/10 border-primary/50 ring-2 ring-primary/20'
                          : 'bg-muted border-border'
                    }`}
                  >
                    {w.completed ? (
                      <Check size={22} className="text-secondary" />
                    ) : w.active ? (
                      <Flame size={20} className="text-primary" />
                    ) : (
                      <Lock size={14} className="text-muted-foreground/40" />
                    )}
                  </motion.div>
                  <span className={`text-[10px] font-heading ${w.completed ? 'text-secondary' : w.active ? 'text-primary' : 'text-muted-foreground'}`}>
                    Wk {w.week}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* How It Works */}
          <div className="px-4 mt-8 space-y-3">
            <h3 className="font-heading text-xs text-secondary uppercase tracking-[0.15em]">How It Works</h3>
            <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
              {[
                { emoji: '📦', title: `${campaign.min_orders_per_week} Order${campaign.min_orders_per_week > 1 ? 's' : ''}/Week`, desc: `Place at least ${campaign.min_orders_per_week} order each week` },
                { emoji: '🔥', title: `${durationWeeks} Weeks Straight`, desc: 'Maintain your streak for the full duration' },
                ...(campaign.grace_period_hours ? [{ emoji: '⏰', title: `${campaign.grace_period_hours}h Grace Period`, desc: 'A little breathing room before your streak resets' }] : []),
              ].map((rule, i) => (
                <div key={i}>
                  {i > 0 && <div className="border-t border-border -mt-1 mb-3" />}
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{rule.emoji}</span>
                    <div>
                      <p className="text-sm text-foreground font-semibold">{rule.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{rule.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-gradient-to-r from-secondary/12 to-secondary/5 border border-secondary/15 rounded-2xl p-5 text-center">
              <p className="text-3xl mb-2">🎁</p>
              <p className="font-heading text-sm text-secondary">Complete the streak for a royal reward!</p>
              <p className="text-[11px] text-muted-foreground mt-1">Exclusive discounts and free items await</p>
            </motion.div>
          </div>
        </>
      )}

      <BottomNav />
    </div>
  );
};

export default StreakPage;
