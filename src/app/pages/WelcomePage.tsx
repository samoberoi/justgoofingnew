import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const WelcomePage = () => {
  const navigate = useNavigate();

  const handleContinue = () => {
    navigate('/home');
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center px-6 overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: -20, x: Math.random() * 400 - 200, opacity: 0 }}
          animate={{ y: window.innerHeight + 20, opacity: [0, 1, 1, 0], rotate: Math.random() * 720 }}
          transition={{ duration: 3 + Math.random() * 2, delay: Math.random() * 2, repeat: Infinity }}
          className="absolute w-2 h-2 rounded-full"
          style={{ background: i % 3 === 0 ? 'hsl(43 80% 55%)' : i % 3 === 1 ? 'hsl(30 90% 50%)' : 'hsl(5 70% 40%)' }}
        />
      ))}

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 text-center space-y-8 max-w-sm"
      >
        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-7xl">
          👑
        </motion.div>

        <div className="space-y-3">
          <h1 className="font-heading text-2xl md:text-3xl text-gradient-gold leading-tight">
            Welcome to the<br />Sultanat of Biryani
          </h1>
          <p className="text-muted-foreground text-sm">Your royal feast awaits. Every bite, a coronation.</p>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-secondary/30 rounded-xl p-6 space-y-3"
        >
          <div className="text-2xl">🔥</div>
          <h2 className="font-heading text-lg text-secondary">1+1 Biryani FREE</h2>
          <p className="text-muted-foreground text-xs">On your first order. Auto-applied at checkout.</p>
          <div className="inline-block px-3 py-1 bg-secondary/10 rounded-full text-xs text-secondary font-medium">
            First Order Exclusive
          </div>
        </motion.div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleContinue}
          className="w-full py-4 bg-gradient-saffron rounded-xl font-heading text-sm uppercase tracking-widest text-primary-foreground shadow-saffron"
        >
          Begin My Dawat
        </motion.button>
      </motion.div>
    </div>
  );
};

export default WelcomePage;
