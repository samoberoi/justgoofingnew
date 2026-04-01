import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Share2, Check, Copy, Link } from 'lucide-react';

interface ProfileReferralProps {
  referralCode: string;
}

const ProfileReferral = ({ referralCode }: ProfileReferralProps) => {
  const [copied, setCopied] = useState(false);

  const appLink = 'https://biryaan.lovable.app';

  const handleShare = () => {
    const shareText = [
      `🍛👑 Join BIRYAAN — the Sultanat of Biryani!`,
      ``,
      `Use my referral code ${referralCode} when you sign up and we both earn Biryan Points!`,
      ``,
      `🔗 Order now: ${appLink}`,
      ``,
      `Download the app & start your royal feast today! 🏰`,
    ].join('\n');

    if (navigator.share) {
      navigator.share({
        title: 'BIRYAAN — Royal Biryani, Delivered',
        text: shareText,
        url: appLink,
      }).catch(() => {
        navigator.clipboard.writeText(shareText);
        setCopied(true);
      });
    } else {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
    }
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
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

        {/* Referral code */}
        <div className="flex items-center gap-2 bg-muted/60 rounded-xl p-3 border border-border">
          <span className="text-sm font-mono text-secondary font-bold flex-1 tracking-wider">{referralCode}</span>
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <Check size={16} className="text-green-500" />
              </motion.div>
            ) : (
              <motion.button key="copy" whileTap={{ scale: 0.9 }} onClick={handleCopyCode}
                className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                <Copy size={12} className="text-muted-foreground" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Share button with link preview */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleShare}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-saffron rounded-xl"
        >
          <Share2 size={14} className="text-primary-foreground" />
          <span className="text-sm font-heading text-primary-foreground">Share Invite with Friends</span>
        </motion.button>

        <div className="flex items-center gap-1.5 justify-center">
          <Link size={10} className="text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">Your friends will get the app link to order instantly</span>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfileReferral;
