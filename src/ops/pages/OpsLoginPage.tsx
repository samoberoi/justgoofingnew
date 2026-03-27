import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, Shield, ChefHat, UserPlus } from 'lucide-react';

const OpsLoginPage = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError('');
    setSuccess('');

    if (mode === 'signup') {
      const { error: err } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (err) {
        setError(err.message);
      } else {
        setSuccess('Account created! You are now logged in.');
      }
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (err) {
        setError(err.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-background mughal-pattern flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-8 text-center"
      >
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <ChefHat className="text-secondary" size={28} />
            <span className="font-display text-2xl text-gradient-gold">BIRYAAN OPS</span>
          </div>
          <p className="text-muted-foreground text-sm">Operations Command Center</p>
        </div>

        <div className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email address"
            className="w-full px-4 py-4 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-secondary transition-colors"
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className="w-full px-4 py-4 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-secondary transition-colors"
          />

          {error && <p className="text-destructive text-sm">{error}</p>}
          {success && <p className="text-green-500 text-sm">{success}</p>}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            disabled={!email || !password || loading}
            className="w-full py-4 bg-gradient-saffron rounded-lg font-heading text-sm uppercase tracking-widest text-primary-foreground disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            <ArrowRight size={16} />
          </motion.button>

          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess(''); }}
            className="text-secondary text-sm underline"
          >
            {mode === 'login' ? 'First time? Create an account' : 'Already have an account? Sign in'}
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs">
          <Shield size={12} /> Staff access only
        </div>

        <div className="bg-card/50 border border-border rounded-lg p-3 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground mb-1">🚀 First-time setup</p>
          <p>The first account created will automatically be assigned <span className="text-secondary font-bold">Super Admin</span> role.</p>
        </div>
      </motion.div>
    </div>
  );
};

export default OpsLoginPage;
