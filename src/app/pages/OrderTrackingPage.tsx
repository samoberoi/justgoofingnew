import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Phone, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';

const stages = [
  { title: 'Your Dawat Has Been Accepted', description: 'The royal kitchen acknowledges your order.', icon: '📜' },
  { title: 'The Dum Ceremony Has Begun', description: 'Spices layered, rice arranged. Patience rewards.', icon: '🔥' },
  { title: 'Fragrance Rises Across the Sultanat', description: 'The aroma signals near perfection.', icon: '✨' },
  { title: 'The Royal Rider Has Departed', description: 'Your biryani is on its way to you.', icon: '🏇' },
  { title: 'Dawat Delivered', description: 'Enjoy your royal feast. Long live the Sultanat!', icon: '👑' },
];

const OrderTrackingPage = () => {
  const navigate = useNavigate();
  const { earnPoints } = useAppStore();
  const [currentStage, setCurrentStage] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);

  useEffect(() => {
    if (currentStage < 4) {
      const timer = setTimeout(() => setCurrentStage(prev => prev + 1), 5000);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => setShowReview(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [currentStage]);

  const handleReviewSubmit = () => {
    earnPoints(50, 'Review Bonus – 50 Sultanat Points');
    setReviewSubmitted(true);
  };

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

      {/* Review overlay */}
      <AnimatePresence>
        {showReview && !reviewSubmitted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 20 }}
              className="w-full max-w-sm text-center"
            >
              <div className="text-6xl mb-4">👑</div>
              <h2 className="font-heading text-2xl text-gradient-gold mb-2">Your Dawat is Complete!</h2>
              <p className="text-muted-foreground text-sm mb-6">Rate your royal experience and earn Sultanat Points</p>

              {/* Star rating */}
              <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map(star => (
                  <motion.button
                    key={star}
                    whileTap={{ scale: 1.3 }}
                    onClick={() => setSelectedRating(star)}
                    className="p-1"
                  >
                    <Star
                      size={36}
                      className={star <= selectedRating ? 'text-secondary fill-secondary' : 'text-muted-foreground'}
                    />
                  </motion.button>
                ))}
              </div>

              <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-4 mb-6">
                <p className="font-heading text-lg text-secondary">+50 Sultanat Points</p>
                <p className="text-xs text-muted-foreground mt-1">Earned instantly when you leave a review</p>
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleReviewSubmit}
                disabled={selectedRating === 0}
                className="w-full py-4 bg-gradient-saffron rounded-xl font-heading text-sm uppercase tracking-widest text-primary-foreground shadow-saffron disabled:opacity-40"
              >
                Submit Review & Earn Points
              </motion.button>

              <button
                onClick={() => setShowReview(false)}
                className="mt-4 text-xs text-muted-foreground underline"
              >
                Skip for now
              </button>
            </motion.div>
          </motion.div>
        )}

        {reviewSubmitted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              className="text-center"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
                className="text-7xl mb-4"
              >🎉</motion.div>
              <h2 className="font-heading text-2xl text-gradient-gold mb-2">+50 Sultanat Points!</h2>
              <p className="text-muted-foreground text-sm mb-8">Thank you for your royal review</p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/app')}
                className="px-8 py-4 bg-gradient-saffron rounded-xl font-heading text-sm uppercase tracking-widest text-primary-foreground shadow-saffron"
              >
                Back to Home
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
