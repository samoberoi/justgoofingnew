import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Share2, Check } from 'lucide-react';

interface ProfileReferralProps {
  referralCode: string;
}

const ProfileReferral = ({ referralCode }: ProfileReferralProps) => {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const shareText = `Join BIRYAAN — the Sultanat of Biryani! 🍛👑\n\nUse my referral code ${referralCode} when you sign up and we both earn Biryan Points!\n\nOrder now: https://biryaan.lovable.app`;
    if (navigator.share) {
      navigator.share({ title: 'BIRYAAN Referral', text: shareText }).catch(() => {
        navigator.clipboard.writeText(shareText);
        setCopied(true);
      });
    } else {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
    }
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="px-4 pt-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-secondary/12 to-card border border-secondary/20 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Gift size={16} className="text-secondary" />
          <p className="text-sm font-heading text-foreground">Refer & Earn</p>
        </div>
        <p className="text-xs text-muted-foreground">Share your code — both you and your friend earn Biryan Points on their first order!</p>
        <div className="flex items-center gap-2 bg-muted/60 rounded-xl p-3 border border-border">
          <span className="text-sm font-mono text-secondary font-bold flex-1 tracking-wider">{referralCode}</span>
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <Check size={16} className="text-green-500" />
              </motion.div>
            ) : (
              <motion.button key="copy" whileTap={{ scale: 0.9 }} onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-saffron rounded-lg">
                <Share2 size={12} className="text-primary-foreground" />
                <span className="text-[10px] font-heading text-primary-foreground uppercase">Share</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfileReferral;
