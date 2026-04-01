import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cake, Heart, CalendarDays, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, parse } from 'date-fns';

interface ProfileDatesProps {
  userId: string | null;
  birthday: string | null;
  anniversary: string | null;
  setBirthday: (v: string | null) => void;
  setAnniversary: (v: string | null) => void;
}

const ProfileDates = ({ userId, birthday, anniversary, setBirthday, setAnniversary }: ProfileDatesProps) => {
  const [editingBirthday, setEditingBirthday] = useState(false);
  const [editingAnniversary, setEditingAnniversary] = useState(false);
  const [tempBirthday, setTempBirthday] = useState('');
  const [tempAnniversary, setTempAnniversary] = useState('');

  const saveDate = async (field: 'birthday' | 'anniversary', value: string) => {
    if (!userId || !value) return;
    const update = { [field]: value } as any;
    await supabase.from('profiles').update(update).eq('user_id', userId);
    if (field === 'birthday') { setBirthday(value); setEditingBirthday(false); }
    else { setAnniversary(value); setEditingAnniversary(false); }
  };

  const formatDisplayDate = (d: string | null) => {
    if (!d) return null;
    try { return format(new Date(d), 'dd MMM yyyy'); } catch { return d; }
  };

  return (
    <div className="px-4 pt-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-gradient-to-br from-secondary/8 to-card border border-secondary/15 rounded-2xl p-4 space-y-3"
      >
        <div className="flex items-center gap-2 mb-1">
          <CalendarDays size={14} className="text-secondary" />
          <p className="text-sm font-heading text-foreground">Special Dates</p>
          <span className="text-[10px] text-muted-foreground ml-auto">We'll surprise you! 🎉</span>
        </div>

        {/* Birthday */}
        <div className="flex items-center gap-3 bg-muted/40 rounded-xl p-3 border border-border">
          <div className="w-9 h-9 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
            <Cake size={16} className="text-secondary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-heading">Birthday</p>
            {editingBirthday ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="date"
                  value={tempBirthday}
                  onChange={e => setTempBirthday(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="bg-background border border-border rounded-lg px-2 py-1 text-sm text-foreground flex-1"
                />
                <button onClick={() => saveDate('birthday', tempBirthday)}
                  className="w-7 h-7 rounded-full bg-secondary/20 flex items-center justify-center">
                  <Check size={12} className="text-secondary" />
                </button>
                <button onClick={() => setEditingBirthday(false)}
                  className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                  <X size={12} className="text-muted-foreground" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setTempBirthday(birthday || ''); setEditingBirthday(true); }}
                className="text-sm text-foreground mt-0.5 hover:text-secondary transition-colors text-left"
              >
                {formatDisplayDate(birthday) || <span className="text-muted-foreground italic">Tap to add</span>}
              </button>
            )}
          </div>
        </div>

        {/* Anniversary */}
        <div className="flex items-center gap-3 bg-muted/40 rounded-xl p-3 border border-border">
          <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
            <Heart size={16} className="text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-heading">Anniversary</p>
            {editingAnniversary ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="date"
                  value={tempAnniversary}
                  onChange={e => setTempAnniversary(e.target.value)}
                  className="bg-background border border-border rounded-lg px-2 py-1 text-sm text-foreground flex-1"
                />
                <button onClick={() => saveDate('anniversary', tempAnniversary)}
                  className="w-7 h-7 rounded-full bg-secondary/20 flex items-center justify-center">
                  <Check size={12} className="text-secondary" />
                </button>
                <button onClick={() => setEditingAnniversary(false)}
                  className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                  <X size={12} className="text-muted-foreground" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setTempAnniversary(anniversary || ''); setEditingAnniversary(true); }}
                className="text-sm text-foreground mt-0.5 hover:text-secondary transition-colors text-left"
              >
                {formatDisplayDate(anniversary) || <span className="text-muted-foreground italic">Tap to add</span>}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfileDates;
