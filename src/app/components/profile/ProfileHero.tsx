import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Crown, Phone } from 'lucide-react';
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

const ProfileHero = ({ userId, userName, phoneNumber, tierName, tierEmoji, totalOrders, avatarUrl, setAvatarUrl }: ProfileHeroProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${userId}/avatar.${ext}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(path);

      // Update profile
      await supabase.from('profiles')
        .update({ avatar_url: publicUrl + '?t=' + Date.now() })
        .eq('user_id', userId);

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
    <div className="px-4 pt-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-secondary/10 via-card to-card border border-secondary/15 rounded-2xl p-6 relative overflow-hidden"
      >
        {/* Decorative pattern */}
        <div className="absolute inset-0 mughal-pattern opacity-30" />

        <div className="relative z-10 flex items-center gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-secondary/30 shadow-gold"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-secondary/30 to-secondary/10 flex items-center justify-center text-3xl">
                  {tierEmoji}
                </div>
              )}
              {/* Camera overlay */}
              <div className="absolute inset-0 bg-background/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Camera size={18} className="text-secondary" />
              </div>
              {uploading && (
                <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </motion.button>
            {/* Camera badge */}
            <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-secondary rounded-full flex items-center justify-center border-2 border-card">
              <Camera size={10} className="text-primary-foreground" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {phoneNumber && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-coral/10 rounded-full mb-1.5">
                <Phone size={10} className="text-coral shrink-0" />
                <span className="text-[12px] text-coral font-heading tracking-wide">{formatPhone(phoneNumber)}</span>
              </div>
            )}
            <p className="font-display text-xl text-ink truncate">{userName || 'Royal Guest'}</p>

            <div className="flex items-center gap-1.5 mt-1.5">
              <Crown size={12} className="text-secondary" />
              <span className="text-xs text-secondary font-heading uppercase tracking-wider">{tierName}</span>
              <span className="text-[10px] text-muted-foreground ml-1">• {totalOrders} orders</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfileHero;
