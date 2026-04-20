import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Phone, Check, Edit3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProfileParentsProps {
  userId: string | null;
}

interface Parents {
  parent1_name: string;
  parent1_phone: string;
  parent2_name: string;
  parent2_phone: string;
}

const empty: Parents = { parent1_name: '', parent1_phone: '', parent2_name: '', parent2_phone: '' };

const ProfileParents = ({ userId }: ProfileParentsProps) => {
  const [data, setData] = useState<Parents>(empty);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    supabase.from('profiles')
      .select('parent1_name, parent1_phone, parent2_name, parent2_phone')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data: d }: any) => {
        if (d) {
          setData({
            parent1_name: d.parent1_name || '',
            parent1_phone: d.parent1_phone || '',
            parent2_name: d.parent2_name || '',
            parent2_phone: d.parent2_phone || '',
          });
        }
        setLoading(false);
      });
  }, [userId]);

  const save = async () => {
    if (!userId) return;
    setSaving(true);
    const payload = {
      parent1_name: data.parent1_name.trim() || null,
      parent1_phone: data.parent1_phone.trim() || null,
      parent2_name: data.parent2_name.trim() || null,
      parent2_phone: data.parent2_phone.trim() || null,
    };
    const { error } = await supabase.from('profiles').update(payload as any).eq('user_id', userId);
    setSaving(false);
    if (error) {
      toast.error('Could not save');
    } else {
      toast.success('Parents saved! 🎉');
      setEditing(false);
    }
  };

  const hasAny = data.parent1_name || data.parent1_phone || data.parent2_name || data.parent2_phone;

  return (
    <div className="px-4 pt-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-heading text-ink flex items-center gap-1.5">
          <User size={16} className="text-coral" /> Parents / Guardians
        </p>
        {!editing && hasAny && (
          <button
            onClick={() => setEditing(true)}
            className="text-[11px] font-heading text-coral flex items-center gap-1"
          >
            <Edit3 size={11} /> Edit
          </button>
        )}
      </div>

      {loading ? (
        <div className="h-24 bg-card rounded-3xl animate-pulse" />
      ) : !editing && !hasAny ? (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setEditing(true)}
          className="w-full bg-card border-2 border-dashed border-coral/30 rounded-3xl p-5 flex items-center gap-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-coral flex items-center justify-center text-2xl shadow-pop-coral">
            👨‍👩‍👧
          </div>
          <div className="flex-1 text-left">
            <p className="font-heading text-sm text-ink">Add parent details</p>
            <p className="text-[11px] text-ink/50 mt-0.5">So we can reach you for any kid you bring</p>
          </div>
        </motion.button>
      ) : !editing ? (
        <div className="bg-card border-2 border-ink/8 rounded-3xl p-4 shadow-pop space-y-3">
          {(data.parent1_name || data.parent1_phone) && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-coral flex items-center justify-center text-white font-display text-sm shadow-pop-coral">
                {(data.parent1_name || 'P').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-heading text-coral uppercase tracking-wider">Parent 1</p>
                <p className="font-heading text-sm text-ink truncate">{data.parent1_name || 'Unnamed'}</p>
                {data.parent1_phone && (
                  <p className="text-[12px] text-ink/60 flex items-center gap-1 mt-0.5">
                    <Phone size={10} /> +91 {data.parent1_phone}
                  </p>
                )}
              </div>
            </div>
          )}
          {(data.parent2_name || data.parent2_phone) && (
            <div className="flex items-center gap-3 pt-3 border-t border-ink/5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-mint flex items-center justify-center text-white font-display text-sm shadow-pop-mint">
                {(data.parent2_name || 'P').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-heading text-mint uppercase tracking-wider">Parent 2</p>
                <p className="font-heading text-sm text-ink truncate">{data.parent2_name || 'Unnamed'}</p>
                {data.parent2_phone && (
                  <p className="text-[12px] text-ink/60 flex items-center gap-1 mt-0.5">
                    <Phone size={10} /> +91 {data.parent2_phone}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border-2 border-ink/8 rounded-3xl p-4 space-y-3 shadow-pop"
        >
          {/* Parent 1 */}
          <div className="bg-coral/5 rounded-2xl p-3 space-y-2 border-2 border-coral/15">
            <p className="text-[10px] font-heading text-coral uppercase tracking-wider flex items-center gap-1">
              <User size={10} /> Parent 1
            </p>
            <input
              value={data.parent1_name}
              onChange={e => setData({ ...data, parent1_name: e.target.value })}
              placeholder="Parent name"
              className="w-full px-3.5 py-2.5 bg-card border-2 border-ink/8 rounded-xl text-sm text-ink placeholder:text-ink/35 focus:outline-none focus:border-coral transition-colors"
            />
            <div className="flex items-center gap-2 bg-card border-2 border-ink/8 rounded-xl px-3.5 py-2.5 focus-within:border-coral transition-colors">
              <Phone size={13} className="text-coral shrink-0" />
              <span className="text-sm text-ink/50">+91</span>
              <input
                type="tel" inputMode="numeric" maxLength={10}
                value={data.parent1_phone}
                onChange={e => setData({ ...data, parent1_phone: e.target.value.replace(/\D/g, '') })}
                placeholder="98765 43210"
                className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink/35 focus:outline-none"
              />
            </div>
          </div>

          {/* Parent 2 */}
          <div className="bg-mint/5 rounded-2xl p-3 space-y-2 border-2 border-mint/15">
            <p className="text-[10px] font-heading text-mint uppercase tracking-wider flex items-center gap-1">
              <User size={10} /> Parent 2 <span className="text-ink/40 normal-case">(optional)</span>
            </p>
            <input
              value={data.parent2_name}
              onChange={e => setData({ ...data, parent2_name: e.target.value })}
              placeholder="Parent name"
              className="w-full px-3.5 py-2.5 bg-card border-2 border-ink/8 rounded-xl text-sm text-ink placeholder:text-ink/35 focus:outline-none focus:border-mint transition-colors"
            />
            <div className="flex items-center gap-2 bg-card border-2 border-ink/8 rounded-xl px-3.5 py-2.5 focus-within:border-mint transition-colors">
              <Phone size={13} className="text-mint shrink-0" />
              <span className="text-sm text-ink/50">+91</span>
              <input
                type="tel" inputMode="numeric" maxLength={10}
                value={data.parent2_phone}
                onChange={e => setData({ ...data, parent2_phone: e.target.value.replace(/\D/g, '') })}
                placeholder="98765 43210"
                className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink/35 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setEditing(false)}
              className="flex-1 py-3 rounded-2xl border-2 border-ink/10 text-sm font-heading text-ink/60"
            >
              Cancel
            </button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={save}
              disabled={saving}
              className="flex-1 py-3 bg-gradient-coral rounded-2xl font-heading text-sm text-white shadow-pop-coral flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <Check size={14} /> {saving ? 'Saving…' : 'Save'}
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ProfileParents;
