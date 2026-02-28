import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Flame, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';

const StreakPage = () => {
  const navigate = useNavigate();
  const { currentStreak } = useAppStore();

  const weeks = [
    { week: 1, completed: true },
    { week: 2, completed: true },
    { week: 3, completed: false },
    { week: 4, completed: false },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-foreground" /></button>
          <h1 className="font-heading text-lg text-foreground">The Sultan's Streak</h1>
        </div>
      </header>

      <div className="px-4 pt-6 text-center">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="inline-block"
        >
          <Flame size={60} className="text-primary mx-auto" />
        </motion.div>
        <h2 className="font-heading text-2xl text-gradient-gold mt-4">Week {currentStreak} of 4</h2>
        <p className="text-muted-foreground text-sm mt-2">Order weekly to earn a FREE biryani!</p>
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
                  w.completed
                    ? 'bg-secondary/20 border-secondary'
                    : 'bg-muted border-border'
                }`}
              >
                {w.completed ? (
                  <Check size={24} className="text-secondary" />
                ) : (
                  <span className="text-muted-foreground text-xs font-heading">{w.week}</span>
                )}
              </motion.div>
              <span className="text-[10px] text-muted-foreground">Week {w.week}</span>
              {w.completed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-1.5 h-1.5 rounded-full bg-secondary"
                />
              )}
            </div>
          ))}
        </div>

        {/* Progress line */}
        <div className="relative mt-[-52px] mb-8 mx-7 h-0.5 bg-muted -z-10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(currentStreak / 4) * 100}%` }}
            transition={{ duration: 1, delay: 0.5 }}
            className="absolute h-full bg-secondary rounded-full"
          />
        </div>
      </div>

      {/* Rules */}
      <div className="px-4 mt-4 space-y-3">
        <h3 className="font-heading text-sm text-foreground">How It Works</h3>

        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-lg">🅰️</span>
            <div>
              <p className="text-sm text-foreground font-semibold">Option A</p>
              <p className="text-xs text-muted-foreground">1 order per week for 4 continuous weeks</p>
            </div>
          </div>
          <div className="border-t border-border" />
          <div className="flex items-start gap-3">
            <span className="text-lg">🅱️</span>
            <div>
              <p className="text-sm text-foreground font-semibold">Option B</p>
              <p className="text-xs text-muted-foreground">2 orders per week for 2 consecutive weeks</p>
            </div>
          </div>
        </div>

        <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-4 text-center">
          <p className="text-2xl mb-1">🎁</p>
          <p className="font-heading text-sm text-secondary">Reward: 5th Biryani FREE</p>
          <p className="text-[10px] text-muted-foreground mt-1">48-hour grace period before streak resets</p>
        </div>
      </div>
    </div>
  );
};

export default StreakPage;
