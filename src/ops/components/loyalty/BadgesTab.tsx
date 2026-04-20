import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Award } from 'lucide-react';
import { toast } from 'sonner';

const CRITERIA = [
  { value: 'orders', label: 'Number of Orders' },
  { value: 'spend', label: 'Total Spend (₹)' },
  { value: 'streak', label: 'Streak Completion' },
  { value: 'manual', label: 'Manual Award' },
];

const ICONS = ['🌟', '🗺️', '👑', '💎', '🏆', '🔥', '⚡', '🎯', '🎖️', '💫', '🥇', '🏅'];

interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  criteria_type: string;
  criteria_value: number;
  tier_level: number;
  is_active: boolean;
  created_at: string;
}

const emptyBadge = {
  name: '', description: '', icon: '🌟', criteria_type: 'orders', criteria_value: 1, tier_level: 1, is_active: true,
};

const BadgesTab = () => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyBadge });

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from('badges').select('*').order('tier_level', { ascending: true }) as any;
    setBadges(data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Badge name required'); return; }
    const payload: any = {
      name: form.name.trim(), description: form.description || null, icon: form.icon,
      criteria_type: form.criteria_type, criteria_value: form.criteria_value,
      tier_level: form.tier_level, is_active: form.is_active,
    };
    if (editId) {
      await supabase.from('badges').update(payload).eq('id', editId) as any;
      toast.success('Badge updated');
    } else {
      await supabase.from('badges').insert(payload) as any;
      toast.success('Badge created');
    }
    setShowForm(false); setEditId(null); setForm({ ...emptyBadge }); fetch();
  };

  const handleEdit = (b: Badge) => {
    setEditId(b.id);
    setForm({ name: b.name, description: b.description || '', icon: b.icon,
      criteria_type: b.criteria_type, criteria_value: b.criteria_value,
      tier_level: b.tier_level, is_active: b.is_active });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('badges').delete().eq('id', id) as any;
    toast.success('Deleted'); fetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-sm text-foreground">Loyalty Badges</h2>
          <p className="text-[10px] text-muted-foreground">Gamify with collectible badges</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ ...emptyBadge }); }}
          className="flex items-center gap-1.5 px-3 py-2 bg-secondary/20 text-secondary rounded-lg text-xs font-medium">
          <Plus size={14} /> New Badge
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h3 className="font-heading text-sm text-foreground">{editId ? 'Edit' : 'Create'} Badge</h3>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Darbaar Regular" className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground" />
          <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Description..." className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground" />

          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Icon</label>
            <div className="flex gap-1 flex-wrap">
              {ICONS.map(ic => (
                <button key={ic} onClick={() => setForm(f => ({ ...f, icon: ic }))}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg ${form.icon === ic ? 'bg-secondary/20 ring-2 ring-secondary' : 'bg-muted'}`}>
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground">Criteria</label>
              <select value={form.criteria_type} onChange={e => setForm(f => ({ ...f, criteria_type: e.target.value }))}
                className="w-full px-2 py-2 bg-muted border border-border rounded-lg text-xs text-foreground">
                {CRITERIA.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Value</label>
              <input type="number" min={1} value={form.criteria_value} onChange={e => setForm(f => ({ ...f, criteria_value: +e.target.value }))}
                className="w-full px-2 py-2 bg-muted border border-border rounded-lg text-sm text-foreground" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Tier Level</label>
              <input type="number" min={1} max={10} value={form.tier_level} onChange={e => setForm(f => ({ ...f, tier_level: +e.target.value }))}
                className="w-full px-2 py-2 bg-muted border border-border rounded-lg text-sm text-foreground" />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="rounded border-border" />
            Active
          </label>

          <div className="flex gap-2 pt-2">
            <button onClick={handleSave} className="flex-1 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-heading">
              {editId ? 'Update' : 'Create'} Badge
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground">Cancel</button>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="text-center py-8"><div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : badges.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <Award size={32} className="text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No badges — create badges to reward loyalty</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {badges.map(b => (
            <motion.div key={b.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-xl p-3 text-center relative group">
              <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(b)} className="p-1 rounded hover:bg-muted"><Pencil size={12} className="text-muted-foreground" /></button>
                <button onClick={() => handleDelete(b.id)} className="p-1 rounded hover:bg-muted"><Trash2 size={12} className="text-accent" /></button>
              </div>
              <span className="text-3xl">{b.icon}</span>
              <p className="font-heading text-xs text-foreground mt-1">{b.name}</p>
              <p className="text-[9px] text-muted-foreground mt-0.5">{b.description}</p>
              <div className="flex items-center justify-center gap-1 mt-1.5">
                <span className="text-[9px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground capitalize">{b.criteria_type}</span>
                <span className="text-[9px] px-1.5 py-0.5 bg-secondary/10 text-secondary rounded">
                  {b.criteria_type === 'spend' ? `₹${b.criteria_value}` : b.criteria_value}
                </span>
              </div>
              {!b.is_active && <span className="text-[8px] text-accent mt-1 block">Inactive</span>}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BadgesTab;
