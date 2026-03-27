import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Flame, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const StreakPage = () => {
  const navigate = useNavigate();
  const [streakCampaigns, setStreakCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('streak_campaigns').select('*').eq('is_active', true) as any;
      setStreakCampaigns(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const campaign = streakCampaigns[0]; // Show first active streak
  const currentWeek = 0; // Will be tracked via user_streaks table
  const durationWeeks = campaign?.duration_weeks || 4;

  const weeks = Array.from({ length: durationWeeks }, (_, i) => ({
    week: i + 1,
    completed: i < currentWeek,
  }));

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-foreground" /></button>
          <h1 className="font-heading text-lg text-foreground">The Sultan's Streak</h1>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !campaign ? (
        <div className="px-4 pt-12 text-center">
          <Flame size={48} className="text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">No active streak campaigns right now. Check back soon!</p>
        </div>
      ) : (
        <>
          <div className="px-4 pt-6 text-center">
            <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }} className="inline-block">
              <Flame size={60} className="text-primary mx-auto" />
            </motion.div>
            <h2 className="font-heading text-2xl text-gradient-gold mt-4">{campaign.name}</h2>
            <p className="text-muted-foreground text-sm mt-2">
              Order {campaign.min_orders_per_week}× per week for {durationWeeks} weeks!
            </p>
          </div>

          {/* Weekly seals */}
          <div className="px-8 pt-8">
            <div className="flex items-center justify-between">
              {weeks.map((w, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.15, type: 'spring' }}
                    className={`w-14 h-14 rounded-full flex items-center justify-center border-2 ${
                      w.completed ? 'bg-secondary/20 border-secondary' : 'bg-muted border-border'
                    }`}
                  >
                    {w.completed ? (
                      <Check size={24} className="text-secondary" />
                    ) : (
                      <span className="text-muted-foreground text-xs font-heading">{w.week}</span>
                    )}
                  </motion.div>
                  <span className="text-[10px] text-muted-foreground">Week {w.week}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rules */}
          <div className="px-4 mt-8 space-y-3">
            <h3 className="font-heading text-sm text-foreground">How It Works</h3>
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-lg">📦</span>
                <div>
                  <p className="text-sm text-foreground font-semibold">{campaign.min_orders_per_week} Order{campaign.min_orders_per_week > 1 ? 's' : ''}/Week</p>
                  <p className="text-xs text-muted-foreground">Place at least {campaign.min_orders_per_week} order each week</p>
                </div>
              </div>
              <div className="border-t border-border" />
              <div className="flex items-start gap-3">
                <span className="text-lg">🔥</span>
                <div>
                  <p className="text-sm text-foreground font-semibold">{durationWeeks} Weeks Straight</p>
                  <p className="text-xs text-muted-foreground">Maintain your streak for the full duration</p>
                </div>
              </div>
              {campaign.grace_period_hours && (
                <>
                  <div className="border-t border-border" />
                  <div className="flex items-start gap-3">
                    <span className="text-lg">⏰</span>
                    <div>
                      <p className="text-sm text-foreground font-semibold">{campaign.grace_period_hours}h Grace Period</p>
                      <p className="text-xs text-muted-foreground">A little breathing room before your streak resets</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-4 text-center">
              <p className="text-2xl mb-1">🎁</p>
              <p className="font-heading text-sm text-secondary">Complete the streak for a royal reward!</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StreakPage;
