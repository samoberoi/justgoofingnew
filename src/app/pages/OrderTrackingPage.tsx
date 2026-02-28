import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const stages = [
  { title: 'Your Dawat Has Been Accepted', description: 'The royal kitchen acknowledges your order.', icon: '📜' },
  { title: 'The Dum Ceremony Has Begun', description: 'Spices layered, rice arranged. Patience rewards.', icon: '🔥' },
  { title: 'Fragrance Rises Across the Sultanat', description: 'The aroma signals near perfection.', icon: '✨' },
  { title: 'The Royal Rider Has Departed', description: 'Your biryani is on its way to you.', icon: '🏇' },
  { title: 'Dawat Delivered', description: 'Enjoy your royal feast. Long live the Sultanat!', icon: '👑' },
];

const OrderTrackingPage = () => {
  const navigate = useNavigate();
  const [currentStage, setCurrentStage] = useState(0);

  // Simulate progress
  useEffect(() => {
    if (currentStage < 4) {
      const timer = setTimeout(() => setCurrentStage(prev => prev + 1), 5000);
      return () => clearTimeout(timer);
    }
  }, [currentStage]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/app')}><ArrowLeft size={20} className="text-foreground" /></button>
            <h1 className="font-heading text-lg text-foreground">Track Order</h1>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/10 rounded-full text-xs text-secondary font-medium">
            <Phone size={12} /> Call
          </button>
        </div>
      </header>

      {/* Animated current stage */}
      <div className="px-6 pt-8 pb-6 text-center">
        <motion.div
          key={currentStage}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-6xl mb-4"
        >
          {stages[currentStage].icon}
        </motion.div>
        <motion.h2
          key={`title-${currentStage}`}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="font-heading text-xl text-gradient-gold"
        >
          {stages[currentStage].title}
        </motion.h2>
        <motion.p
          key={`desc-${currentStage}`}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground text-sm mt-2"
        >
          {stages[currentStage].description}
        </motion.p>
      </div>

      {/* Progress bar */}
      <div className="px-6 mb-8">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${((currentStage + 1) / 5) * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-gradient-saffron rounded-full"
          />
        </div>
        <div className="flex justify-between mt-2">
          {stages.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${i <= currentStage ? 'bg-secondary' : 'bg-muted'}`} />
          ))}
        </div>
      </div>

      {/* Stage list */}
      <div className="px-6 space-y-0">
        {stages.map((stage, i) => (
          <div key={i} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                i <= currentStage ? 'bg-secondary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {i < currentStage ? '✓' : i + 1}
              </div>
              {i < 4 && <div className={`w-0.5 h-12 ${i < currentStage ? 'bg-secondary' : 'bg-muted'}`} />}
            </div>
            <div className="pb-8">
              <p className={`text-sm font-semibold ${i <= currentStage ? 'text-foreground' : 'text-muted-foreground'}`}>
                {stage.title}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{stage.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderTrackingPage;
