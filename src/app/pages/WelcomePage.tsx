import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '../store';
import Icon3D from '../components/Icon3D';
import illusWelcome from '@/assets/illus/illus-welcome.png';

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
      setReferralMsg("Hmm, that code doesn't work 🤔");
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
    <div className="fixed inset-0 bg-background flex flex-col overflow-y-auto">
      <div className="relative bg-ink px-6 pt-10 pb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-mint flex items-center justify-center">
              <span className="font-display text-ink text-sm leading-none">JG</span>
            </div>
            <span className="font-display text-white text-base">Goofing</span>
          </div>
          <button
            onClick={() => navigate('/home')}
            className="text-white/60 text-sm font-heading"
          >
            Skip
          </button>
        </div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto w-full max-w-[280px] aspect-square rounded-[32px] bg-coral overflow-hidden shadow-pop-coral"
        >
          <motion.img
            src={illusWelcome}
            alt="Welcome character"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute inset-0 w-full h-full object-contain object-bottom p-3"
          />
        </motion.div>
      </div>

      <div className="flex-1 bg-background -mt-6 rounded-t-[36px] px-6 pt-8 pb-10 space-y-6">
        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <h1 className="font-display text-4xl text-ink leading-[1.05] -tracking-wide">
            Welcome
            <br />
            <span className="text-gradient-rainbow">aboard!</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-2 font-heading">Let the goofing begin 🎈</p>
        </motion.div>

        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="bg-mint rounded-[28px] p-5 shadow-pop-mint flex items-center gap-4"
        >
          <Icon3D name="gift" size={56} alt="" />
          <div className="flex-1 min-w-0">
            <p className="font-display text-ink text-base leading-tight">1 Hour FREE</p>
            <p className="text-ink/70 text-xs mt-0.5">Auto-applied on first booking</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="bg-muted rounded-[28px] p-5 space-y-3"
        >
          <div className="flex items-center gap-2">
            <Icon3D name="gift" size={22} alt="" />
            <p className="text-sm text-ink font-heading">Got a friend's code?</p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={referralInput}
              onChange={e => setReferralInput(e.target.value.toUpperCase())}
              placeholder="GOOFY-A1B2C3"
              className="flex-1 px-4 py-3 bg-card rounded-2xl text-sm text-ink focus:outline-none focus:ring-2 focus:ring-mint font-mono tracking-wide"
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleApplyReferral}
              disabled={!referralInput.trim() || applying}
              className="px-5 py-3 bg-ink rounded-2xl text-xs font-display text-white disabled:opacity-40 shrink-0"
            >
              {applying ? '…' : 'Apply'}
            </motion.button>
          </div>
          {referralResult && (
            <p className={`text-xs font-heading ${referralResult === 'success' ? 'text-mint' : 'text-coral'}`}>
              {referralMsg}
            </p>
          )}
        </motion.div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/home')}
          className="w-full py-4 bg-ink rounded-full font-display text-base text-white flex items-center justify-center gap-2"
        >
          Get Started <ArrowRight size={18} />
        </motion.button>
      </div>
    </div>
  );
};

export default WelcomePage;
