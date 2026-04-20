import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Flame } from 'lucide-react';
import { toast } from 'sonner';

interface StreakCampaign {
  id: string;
  name: string;
  type: string;
  min_orders_per_week: number;
  duration_weeks: number;
  grace_period_hours: number | null;
  auto_reset: boolean;
  is_active: boolean;
  created_at: string;
}

const emptyStreak = {
  name: '', type: 'weekly', min_orders_per_week: 1, duration_weeks: 4,
  grace_period_hours: 48, auto_reset: true, is_active: true,
};

const StreaksTab = () => {
  const [streaks, setStreaks] = useState<StreakCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyStreak });

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from('streak_campaigns').select('*').order('created_at', { ascending: false }) as any;
    setStreaks(data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Streak name required'); return; }
    const payload: any = {
      name: form.name.trim(), type: form.type, min_orders_per_week: form.min_orders_per_week,
      duration_weeks: form.duration_weeks, grace_period_hours: form.grace_period_hours,
      auto_reset: form.auto_reset, is_active: form.is_active,
    };
    if (editId) {
      await supabase.from('streak_campaigns').update(payload).eq('id', editId) as any;
      toast.success('Streak updated');
    } else {
      await supabase.from('streak_campaigns').insert(payload) as any;
      toast.success('Streak created');
    }
    setShowForm(false); setEditId(null); setForm({ ...emptyStreak }); fetch();
  };

  const handleEdit = (s: StreakCampaign) => {
    setEditId(s.id);
    setForm({ name: s.name, type: s.type, min_orders_per_week: s.min_orders_per_week,
      duration_weeks: s.duration_weeks, grace_period_hours: s.grace_period_hours || 48,
      auto_reset: s.auto_reset, is_active: s.is_active });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('streak_campaigns').delete().eq('id', id) as any;
    toast.success('Deleted'); fetch();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('streak_campaigns').update({ is_active: !current }).eq('id', id) as any;
    fetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-sm text-foreground">Streak Campaigns</h2>
          <p className="text-[10px] text-muted-foreground">Drive habit formation with weekly streaks</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ ...emptyStreak }); }}
          className="flex items-center gap-1.5 px-3 py-2 bg-secondary/20 text-secondary rounded-lg text-xs font-medium">
          <Plus size={14} /> New Streak
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h3 className="font-heading text-sm text-foreground">{editId ? 'Edit' : 'Create'} Streak</h3>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Weekly Streak Challenge" className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground" />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground">Min Orders/Week</label>
              <input type="number" min={1} value={form.min_orders_per_week} onChange={e => setForm(f => ({ ...f, min_orders_per_week: +e.target.value }))}
                className="w-full px-2 py-2 bg-muted border border-border rounded-lg text-sm text-foreground" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Duration (weeks)</label>
              <input type="number" min={1} value={form.duration_weeks} onChange={e => setForm(f => ({ ...f, duration_weeks: +e.target.value }))}
                className="w-full px-2 py-2 bg-muted border border-border rounded-lg text-sm text-foreground" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground">Grace Period (hours)</label>
              <input type="number" min={0} value={form.grace_period_hours || ''} onChange={e => setForm(f => ({ ...f, grace_period_hours: +e.target.value }))}
                className="w-full px-2 py-2 bg-muted border border-border rounded-lg text-sm text-foreground" />
            </div>
            <div className="flex items-end gap-4 pb-1">
              <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                <input type="checkbox" checked={form.auto_reset} onChange={e => setForm(f => ({ ...f, auto_reset: e.target.checked }))} className="rounded border-border" />
                Auto-reset
              </label>
              <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="rounded border-border" />
                Active
              </label>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={handleSave} className="flex-1 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-heading">
              {editId ? 'Update' : 'Create'} Streak
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground">Cancel</button>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="text-center py-8"><div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : streaks.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <Flame size={32} className="text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No streak campaigns — create one to drive weekly habit</p>
        </div>
      ) : (
        <div className="space-y-2">
          {streaks.map(s => (
            <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔥</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {s.min_orders_per_week} order/week × {s.duration_weeks} weeks
                      {s.grace_period_hours ? ` • ${s.grace_period_hours}h grace` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleActive(s.id, s.is_active)} className="p-1.5 rounded-lg hover:bg-muted">
                    {s.is_active ? <ToggleRight size={16} className="text-green-500" /> : <ToggleLeft size={16} className="text-muted-foreground" />}
                  </button>
                  <button onClick={() => handleEdit(s)} className="p-1.5 rounded-lg hover:bg-muted"><Pencil size={14} className="text-muted-foreground" /></button>
                  <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg hover:bg-muted"><Trash2 size={14} className="text-accent" /></button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StreaksTab;
