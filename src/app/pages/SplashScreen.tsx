import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import illusWelcome from '@/assets/illus/illus-welcome.png';

const SplashScreen = () => {
  const navigate = useNavigate();
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const fadeT = setTimeout(() => setExiting(true), 2100);
    const navT = setTimeout(() => navigate('/login'), 2500);
    return () => { clearTimeout(fadeT); clearTimeout(navT); };
  }, [navigate]);

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[100] bg-ink overflow-hidden flex flex-col"
        >
      <div className="flex items-center justify-between px-7 pt-12 z-10">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2"
        >
          <div className="w-9 h-9 rounded-xl bg-mint flex items-center justify-center">
            <span className="font-display text-ink text-sm leading-none">JG</span>
          </div>
        </motion.div>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-white/60 text-sm font-heading"
        >
          Loading…
        </motion.span>
      </div>

      <div className="flex-1 flex items-center justify-center px-7 -mt-4">
        <motion.div
          initial={{ scale: 0.85, opacity: 0, rotate: -6 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-[320px] aspect-[3/4] rounded-[40px] bg-lavender overflow-hidden shadow-hero"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute top-6 right-6 w-3 h-3 rounded-full bg-mint"
          />
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="absolute bottom-10 left-6 w-4 h-4 rounded-full bg-butter"
          />
          <motion.img
            src={illusWelcome}
            alt="Just Goofing mascot"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 w-full h-full object-contain object-bottom p-4"
          />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="px-7 pb-16"
      >
        <h1 className="font-display text-5xl text-white leading-[0.95] -tracking-wide">
          Get ready to
          <br />
          <span className="text-gradient-rainbow">Goof Around</span>
        </h1>
        <p className="text-white/55 text-sm mt-3 font-heading">Where the fun never stops ✨</p>
      </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
