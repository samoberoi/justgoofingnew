import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera } from 'lucide-react';
import Icon3D from '../Icon3D';
import { supabase } from '@/integrations/supabase/client';

interface ProfileHeroProps {
  userId: string | null;
  userName: string;
  phoneNumber: string;
  tierName: string;
  tierEmoji: string;
  totalOrders: number;
  avatarUrl: string | null;
  setAvatarUrl: (url: string | null) => void;
}

const ProfileHero = ({ userId, userName, phoneNumber, tierName, avatarUrl, setAvatarUrl }: ProfileHeroProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${userId}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from('profile-pictures').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('profile-pictures').getPublicUrl(path);
      await supabase.from('profiles').update({ avatar_url: publicUrl + '?t=' + Date.now() }).eq('user_id', userId);
      setAvatarUrl(publicUrl + '?t=' + Date.now());
    } catch (err) {
      console.error('Avatar upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const formatPhone = (phone: string) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    if (digits.length > 10) return `+${digits.slice(0, digits.length - 10)} ${digits.slice(-10, -5)} ${digits.slice(-5)}`;
    return phone;
  };

  return (
    <div className="px-4 pt-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-ink rounded-[32px] p-5 relative overflow-hidden shadow-hero"
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute top-4 right-5 w-2 h-2 rounded-full bg-mint"
        />
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2.8, repeat: Infinity }}
          className="absolute bottom-6 right-12 w-3 h-3 rounded-full bg-coral"
        />

        <div className="relative z-10 flex items-center gap-4">
          <div className="relative shrink-0">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="relative w-20 h-20 rounded-3xl overflow-hidden bg-mint shadow-pop-mint"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Icon3D name="user" size={48} alt="" />
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-ink/60 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </motion.button>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-coral rounded-full flex items-center justify-center border-2 border-ink">
              <Camera size={11} className="text-white" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-display text-2xl text-white truncate -tracking-wide leading-tight">{userName || 'Goofer'}</p>
            {phoneNumber && (
              <p className="text-[12px] text-white/60 font-heading mt-0.5">{formatPhone(phoneNumber)}</p>
            )}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 mt-2 rounded-full bg-mint">
              <Icon3D name="tier" size={14} alt="" />
              <span className="text-[10px] text-ink font-display uppercase tracking-wider">{tierName}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfileHero;
