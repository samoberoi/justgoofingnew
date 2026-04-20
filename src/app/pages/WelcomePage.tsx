import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gift, ArrowRight, Sparkles, PartyPopper } from 'lucide-react';
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

    if (referral.referrer_id === userId) {
      setReferralResult('error');
      setReferralMsg("You can't use your own referral code");
      setApplying(false);
      return;
    }

    await supabase
      .from('referrals')
      .update({ referee_id: userId, status: 'referred' })
      .eq('id', referral.id);

    setReferralResult('success');
    setReferralMsg('Referral applied! You both earn Goofy Points after first booking.');
    setApplying(false);
  };

  const handleContinue = () => navigate('/home');

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center px-6 overflow-y-auto py-8">
      {/* Background confetti */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: -20, x: Math.random() * 400 - 200, opacity: 0 }}
          animate={{ y: window.innerHeight + 20, opacity: [0, 0.7, 0.7, 0], rotate: Math.random() * 720 }}
          transition={{ duration: 4 + Math.random() * 3, delay: Math.random() * 2, repeat: Infinity }}
          className="absolute w-2 h-2 rounded-sm"
          style={{ background: ['#FFD700', '#FF6B9D', '#4ECDC4', '#FFA940', '#7CFC00'][i % 5] }}
        />
      ))}

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 text-center space-y-6 max-w-sm w-full"
      >
        <motion.img
          src="/logo.png"
          alt="Just Goofing"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-40 mx-auto"
        />

        <div className="space-y-2">
          <h1 className="font-heading text-2xl text-gradient-gold leading-tight">
            Welcome to<br />Just Goofing
          </h1>
          <p className="text-muted-foreground text-sm">Where fun meets innovation. Let the goofing begin!</p>
        </div>

        {/* Free Hour Offer */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-secondary/15 to-secondary/5 border border-secondary/25 rounded-2xl p-5 space-y-2"
        >
          <div className="flex items-center justify-center gap-2">
            <Sparkles size={16} className="text-secondary" />
            <h2 className="font-heading text-base text-secondary">1 Hour FREE Playtime</h2>
            <Sparkles size={16} className="text-secondary" />
          </div>
          <p className="text-muted-foreground text-xs">On your first booking. Auto-applied. No code needed.</p>
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-secondary/10 rounded-full text-[10px] text-secondary font-semibold uppercase tracking-wider">
            <PartyPopper size={10} /> Welcome Goofers
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
              placeholder="e.g. GOOFY-A1B2C3"
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
          <p className="text-[10px] text-muted-foreground">Both you and your friend earn Goofy Points!</p>
        </motion.div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleContinue}
          className="w-full py-4 bg-gradient-saffron rounded-xl font-heading text-sm uppercase tracking-widest text-primary-foreground shadow-saffron flex items-center justify-center gap-2"
        >
          Let's Goof Around <ArrowRight size={16} />
        </motion.button>
      </motion.div>
    </div>
  );
};

export default WelcomePage;
