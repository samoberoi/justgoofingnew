import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gift, ArrowRight, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '../store';

const WelcomePage = () => {
  const navigate = useNavigate();
  const { userId } = useAppStore();
  const [referralInput, setReferralInput] = useState('');
  const [applying, setApplying] = useState(false);
  const [referralResult, setReferralResult] = useState<'success' | 'error' | null>(null);
  const [referralMsg, setReferralMsg] = useState('');

  const handleApplyReferral = async () => {
    if (!referralInput.trim() || !userId) return;
    setApplying(true);
    setReferralResult(null);

    const code = referralInput.trim().toUpperCase();

    // Find the referral row with this code that is still pending
    const { data: referral } = await supabase
      .from('referrals')
      .select('*')
      .eq('referral_code', code)
      .eq('status', 'pending')
      .is('referee_id', null)
      .limit(1)
      .single();

    if (!referral) {
      setReferralResult('error');
      setReferralMsg('Invalid or already used referral code');
      setApplying(false);
      return;
    }

    // Can't refer yourself
    if (referral.referrer_id === userId) {
      setReferralResult('error');
      setReferralMsg("You can't use your own referral code");
      setApplying(false);
      return;
    }

    // Link referee
    await supabase
      .from('referrals')
      .update({ referee_id: userId, status: 'referred' })
      .eq('id', referral.id);

    setReferralResult('success');
    setReferralMsg('Referral applied! You will both earn points on your first order.');
    setApplying(false);
  };

  const handleContinue = () => {
    navigate('/home');
  };

  return (
    <div className="fixed inset-0 bg-background mughal-pattern flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Background particles */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: -20, x: Math.random() * 400 - 200, opacity: 0 }}
          animate={{ y: window.innerHeight + 20, opacity: [0, 0.6, 0.6, 0], rotate: Math.random() * 720 }}
          transition={{ duration: 4 + Math.random() * 3, delay: Math.random() * 2, repeat: Infinity }}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{ background: i % 3 === 0 ? 'hsl(43 80% 55%)' : i % 3 === 1 ? 'hsl(30 90% 50%)' : 'hsl(5 70% 40%)' }}
        />
      ))}

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 text-center space-y-6 max-w-sm w-full"
      >
        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-6xl">
          👑
        </motion.div>

        <div className="space-y-2">
          <h1 className="font-heading text-2xl text-gradient-gold leading-tight">
            Welcome to the<br />Sultanat of Biryani
          </h1>
          <p className="text-muted-foreground text-sm">Your royal feast awaits. Every bite, a coronation.</p>
        </div>

        {/* First Order Offer */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-secondary/15 to-secondary/5 border border-secondary/25 rounded-2xl p-5 space-y-2"
        >
          <div className="flex items-center justify-center gap-2">
            <Sparkles size={16} className="text-secondary" />
            <h2 className="font-heading text-base text-secondary">1+1 Biryani FREE</h2>
            <Sparkles size={16} className="text-secondary" />
          </div>
          <p className="text-muted-foreground text-xs">On your first order. Auto-applied at checkout.</p>
          <span className="inline-block px-3 py-1 bg-secondary/10 rounded-full text-[10px] text-secondary font-semibold uppercase tracking-wider">
            First Order Exclusive
          </span>
        </motion.div>

        {/* Referral Code Input */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-card border border-border rounded-2xl p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <Gift size={16} className="text-secondary" />
            <p className="text-sm text-foreground font-semibold">Have a Referral Code?</p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={referralInput}
              onChange={e => setReferralInput(e.target.value.toUpperCase())}
              placeholder="e.g. BIRYAAN-A1B2C3"
              className="flex-1 px-3 py-2.5 bg-muted border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-secondary/50 transition-colors font-mono tracking-wide"
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleApplyReferral}
              disabled={!referralInput.trim() || applying}
              className="px-4 py-2.5 bg-gradient-saffron rounded-xl text-xs font-heading text-primary-foreground uppercase tracking-wider disabled:opacity-40 shrink-0"
            >
              {applying ? '...' : 'Apply'}
            </motion.button>
          </div>
          {referralResult && (
            <p className={`text-xs ${referralResult === 'success' ? 'text-green-500' : 'text-accent'}`}>
              {referralMsg}
            </p>
          )}
          <p className="text-[10px] text-muted-foreground">Both you and your friend earn Biryan Points!</p>
        </motion.div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleContinue}
          className="w-full py-4 bg-gradient-saffron rounded-xl font-heading text-sm uppercase tracking-widest text-primary-foreground shadow-saffron flex items-center justify-center gap-2"
        >
          Begin My Dawat <ArrowRight size={16} />
        </motion.button>
      </motion.div>
    </div>
  );
};

export default WelcomePage;
