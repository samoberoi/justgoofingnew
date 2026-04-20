import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gift, ArrowRight, Sparkles, PartyPopper } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '../store';
import { Star, Sparkle, Cloud, Heart } from '../components/Stickers';

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
      setReferralMsg('Hmm, that code doesn\'t work 🤔');
      setApplying(false);
      return;
    }
    if (referral.referrer_id === userId) {
      setReferralResult('error');
      setReferralMsg("Can't use your own code 😉");
      setApplying(false);
      return;
    }
    await supabase.from('referrals').update({ referee_id: userId, status: 'referred' }).eq('id', referral.id);
    setReferralResult('success');
    setReferralMsg('Yay! Both of you earn Goofy Points 🎉');
    setApplying(false);
  };

  return (
    <div className="fixed inset-0 bg-background bg-confetti flex flex-col items-center justify-center px-6 overflow-y-auto py-8">
      {/* Decorative stickers */}
      <Star className="absolute top-16 left-8 w-10 h-10 text-butter opacity-60 animate-wobble" />
      <Sparkle className="absolute top-28 right-10 w-8 h-8 text-coral opacity-60 animate-bounce-soft" />
      <Cloud className="absolute bottom-32 left-6 w-14 h-14 text-mint opacity-40 animate-bounce-soft" />
      <Heart className="absolute bottom-40 right-8 w-9 h-9 text-bubblegum opacity-50 animate-wobble" />

      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 text-center space-y-5 max-w-sm w-full"
      >
        <motion.img
          src="/logo.png"
          alt="Just Goofing"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="w-32 mx-auto"
        />

        <div className="space-y-1.5">
          <h1 className="font-display text-3xl text-ink leading-tight">Welcome aboard!</h1>
          <p className="text-ink/55 text-sm">Let the goofing begin 🎈</p>
        </div>

        {/* Free hour */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="bg-gradient-butter rounded-3xl p-5 space-y-2 shadow-pop-butter relative overflow-hidden"
        >
          <Sparkle className="absolute top-2 right-3 w-5 h-5 text-white/60 animate-wobble" />
          <div className="flex items-center justify-center gap-2">
            <Sparkles size={18} className="text-ink" />
            <h2 className="font-display text-lg text-ink">1 Hour FREE Playtime!</h2>
          </div>
          <p className="text-ink/70 text-xs">Auto-applied on your first booking. No code needed.</p>
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/40 rounded-full text-[11px] text-ink font-heading">
            <PartyPopper size={11} /> Welcome Goofers
          </span>
        </motion.div>

        {/* Referral */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-card border-2 border-ink/8 rounded-3xl p-4 space-y-3 shadow-pop"
        >
          <div className="flex items-center justify-center gap-2">
            <Gift size={16} className="text-coral" />
            <p className="text-sm text-ink font-heading">Got a Friend's Code?</p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={referralInput}
              onChange={e => setReferralInput(e.target.value.toUpperCase())}
              placeholder="GOOFY-A1B2C3"
              className="flex-1 px-3 py-3 bg-background border-2 border-ink/8 rounded-2xl text-sm text-ink focus:outline-none focus:border-coral font-mono tracking-wide"
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleApplyReferral}
              disabled={!referralInput.trim() || applying}
              className="px-4 py-3 bg-gradient-mint rounded-2xl text-xs font-heading text-ink shadow-pop-mint disabled:opacity-40 shrink-0"
            >
              {applying ? '…' : 'Apply'}
            </motion.button>
          </div>
          {referralResult && (
            <p className={`text-xs font-heading ${referralResult === 'success' ? 'text-mint' : 'text-coral'}`}>{referralMsg}</p>
          )}
        </motion.div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/home')}
          className="w-full py-4 bg-gradient-coral rounded-2xl font-display text-base text-white shadow-pop-coral flex items-center justify-center gap-2"
        >
          Let's Go Have Fun! <ArrowRight size={18} />
        </motion.button>
      </motion.div>
    </div>
  );
};

export default WelcomePage;
