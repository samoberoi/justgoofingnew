import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Volume2 } from 'lucide-react';
import { Star, Sparkle, Cloud, Heart } from '../components/Stickers';

const SplashScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => navigate('/login'), 2400);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background bg-confetti overflow-hidden">
      {/* Floating stickers */}
      <motion.div initial={{ y: -200, x: -100 }} animate={{ y: 0, x: 0 }} transition={{ duration: 1, ease: 'easeOut' }} className="absolute top-20 left-12">
        <Star className="w-12 h-12 text-butter animate-wobble" />
      </motion.div>
      <motion.div initial={{ y: -200, x: 100 }} animate={{ y: 0, x: 0 }} transition={{ duration: 1.2, ease: 'easeOut' }} className="absolute top-32 right-16">
        <Sparkle className="w-10 h-10 text-coral animate-bounce-soft" />
      </motion.div>
      <motion.div initial={{ y: 200, x: -50 }} animate={{ y: 0, x: 0 }} transition={{ duration: 1.4, ease: 'easeOut' }} className="absolute bottom-32 left-10">
        <Cloud className="w-16 h-16 text-mint animate-bounce-soft" />
      </motion.div>
      <motion.div initial={{ y: 200, x: 80 }} animate={{ y: 0, x: 0 }} transition={{ duration: 1.6, ease: 'easeOut' }} className="absolute bottom-24 right-12">
        <Heart className="w-9 h-9 text-bubblegum animate-wobble" />
      </motion.div>

      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 text-center"
      >
        <motion.img
          src="/logo.png"
          alt="Just Goofing"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-44 mx-auto mb-4"
        />
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="font-display text-4xl text-gradient-rainbow"
        >
          Just Goofing
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="font-heading text-sm text-ink/60 mt-2"
        >
          Where Fun Meets Innovation ✨
        </motion.p>
      </motion.div>
    </div>
  );
};

export default SplashScreen;
