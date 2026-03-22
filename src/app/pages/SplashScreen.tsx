import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';

const SplashScreen = () => {
  const navigate = useNavigate();
  const [musicMuted, setMusicMuted] = useState(false);
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(() => navigate('/login'), 600);
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background mughal-pattern overflow-hidden"
        >
          {/* Mute toggle */}
          <button
            onClick={() => setMusicMuted(!musicMuted)}
            className="absolute top-6 right-6 z-10 p-2 rounded-full bg-card/50 backdrop-blur"
          >
            {musicMuted ? <VolumeX size={18} className="text-muted-foreground" /> : <Volume2 size={18} className="text-secondary" />}
          </button>

          {/* Radial glow */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.15 }}
              transition={{ duration: 2, ease: 'easeOut' }}
              className="w-[500px] h-[500px] rounded-full bg-gradient-radial from-secondary via-transparent to-transparent"
              style={{ background: 'radial-gradient(circle, hsl(43 80% 55% / 0.2) 0%, transparent 70%)' }}
            />
          </div>

          {/* Decorative lines */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 1.2, ease: 'easeOut' }}
            className="absolute top-1/2 -translate-y-20 w-48 h-px bg-gradient-to-r from-transparent via-secondary to-transparent"
          />

          {/* Logo */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 text-center"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <span className="font-display text-5xl md:text-6xl text-gradient-gold tracking-wider">
                BIRYAAN
              </span>
            </motion.div>
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="mt-3 text-sm font-heading text-secondary/70 tracking-[0.3em] uppercase"
            >
              Sultanat of Biryani
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 1.2, ease: 'easeOut' }}
            className="absolute top-1/2 translate-y-12 w-48 h-px bg-gradient-to-r from-transparent via-secondary to-transparent"
          />

          {/* Crown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="absolute bottom-20 text-4xl"
          >
            👑
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
