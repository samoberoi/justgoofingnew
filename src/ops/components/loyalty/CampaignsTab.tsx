import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Ticket, Tag, Gift, Users, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const TYPES = [
  { value: 'flat', label: 'Flat Discount (₹)' },
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'free_item', label: 'Free Item' },
];

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'first_order', label: 'First Order' },
  { value: 'birthday', label: 'Birthday / Anniversary' },
  { value: 'festival', label: 'Festival' },
  { value: 'comeback', label: 'Comeback Users' },
];

const AUDIENCES = [
  { value: 'all', label: 'All Users' },
  { value: 'new_users', label: 'New Users' },
  { value: 'existing_users', label: 'Existing Users' },
  { value: 'badge_holders', label: 'Badge Holders' },
];

interface Campaign {
  id: string;
  name: string;
  type: string;
  category: string;
  coupon_code: string | null;
  auto_apply: boolean;
  discount_value: number;
  min_order_value: number | null;
  max_discount: number | null;
  usage_limit: number | null;
  per_user_limit: number | null;
  used_count: number;
  valid_from: string | null;
  valid_until: string | null;
  target_audience: string;
  is_active: boolean;
  created_at: string;
}

const emptyCampaign = {
  name: '', type: 'percentage', category: 'general', coupon_code: '',
  auto_apply: false, discount_value: 10, min_order_value: 0, max_discount: null as number | null,
  usage_limit: null as number | null, per_user_limit: 1,
  valid_from: new Date().toISOString().slice(0, 16), valid_until: '',
  target_audience: 'all', is_active: true,
};

const CampaignsTab = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyCampaign });

  useEffect(() => { fetchCampaigns(); }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    const { data } = await supabase.from('loyalty_campaigns').select('*').order('created_at', { ascending: false }) as any;
    setCampaigns(data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Campaign name is required'); return; }
    const payload: any = {
      name: form.name.trim(),
      type: form.type,
      category: form.category,
      coupon_code: form.coupon_code?.trim() || null,
      auto_apply: form.auto_apply,
      discount_value: form.discount_value,
      min_order_value: form.min_order_value || 0,
      max_discount: form.max_discount || null,
      usage_limit: form.usage_limit || null,
      per_user_limit: form.per_user_limit || 1,
      valid_from: form.valid_from || null,
      valid_until: form.valid_until || null,
      target_audience: form.target_audience,
      is_active: form.is_active,
    };

    if (editId) {
      await supabase.from('loyalty_campaigns').update(payload).eq('id', editId) as any;
      toast.success('Campaign updated');
    } else {
      await supabase.from('loyalty_campaigns').insert(payload) as any;
      toast.success('Campaign created');
    }
    setShowForm(false);
    setEditId(null);
    setForm({ ...emptyCampaign });
    fetchCampaigns();
  };

  const handleEdit = (c: Campaign) => {
    setEditId(c.id);
    setForm({
      name: c.name, type: c.type, category: c.category,
      coupon_code: c.coupon_code || '', auto_apply: c.auto_apply,
      discount_value: c.discount_value, min_order_value: c.min_order_value || 0,
      max_discount: c.max_discount, usage_limit: c.usage_limit,
      per_user_limit: c.per_user_limit || 1,
      valid_from: c.valid_from?.slice(0, 16) || '', valid_until: c.valid_until?.slice(0, 16) || '',
      target_audience: c.target_audience, is_active: c.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('loyalty_campaigns').delete().eq('id', id) as any;
    toast.success('Campaign deleted');
    fetchCampaigns();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('loyalty_campaigns').update({ is_active: !current }).eq('id', id) as any;
    fetchCampaigns();
  };

  const typeIcon = (t: string) => t === 'free_item' ? '🎁' : t === 'flat' ? '₹' : '%';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-sm text-foreground">Campaigns & Offers</h2>
          <p className="text-[10px] text-muted-foreground">{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm({ ...emptyCampaign }); }}
          className="flex items-center gap-1.5 px-3 py-2 bg-secondary/20 text-secondary rounded-lg text-xs font-medium"
        >
          <Plus size={14} /> New Campaign
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h3 className="font-heading text-sm text-foreground">{editId ? 'Edit' : 'Create'} Campaign</h3>

          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Campaign Name" className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground" />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full px-2 py-2 bg-muted border border-border rounded-lg text-sm text-foreground">
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-2 py-2 bg-muted border border-border rounded-lg text-sm text-foreground">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground">Discount Value</label>
              <input type="number" value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: +e.target.value }))}
                className="w-full px-2 py-2 bg-muted border border-border rounded-lg text-sm text-foreground" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Min Order Value</label>
              <input type="number" value={form.min_order_value || ''} onChange={e => setForm(f => ({ ...f, min_order_value: +e.target.value || 0 }))}
                className="w-full px-2 py-2 bg-muted border border-border rounded-lg text-sm text-foreground" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground">Coupon Code (optional)</label>
              <input value={form.coupon_code || ''} onChange={e => setForm(f => ({ ...f, coupon_code: e.target.value.toUpperCase() }))}
                placeholder="e.g. SULTAN20" className="w-full px-2 py-2 bg-muted border border-border rounded-lg text-sm text-foreground font-mono" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Max Discount (cap)</label>
              <input type="number" value={form.max_discount || ''} onChange={e => setForm(f => ({ ...f, max_discount: +e.target.value || null }))}
                className="w-full px-2 py-2 bg-muted border border-border rounded-lg text-sm text-foreground" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground">Valid From</label>
              <input type="datetime-local" value={form.valid_from} onChange={e => setForm(f => ({ ...f, valid_from: e.target.value }))}
                className="w-full px-2 py-2 bg-muted border border-border rounded-lg text-xs text-foreground" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Valid Until</label>
              <input type="datetime-local" value={form.valid_until} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))}
                className="w-full px-2 py-2 bg-muted border border-border rounded-lg text-xs text-foreground" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground">Usage Limit (total)</label>
              <input type="number" value={form.usage_limit || ''} onChange={e => setForm(f => ({ ...f, usage_limit: +e.target.value || null }))}
                className="w-full px-2 py-2 bg-muted border border-border rounded-lg text-sm text-foreground" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Per User Limit</label>
              <input type="number" value={form.per_user_limit || ''} onChange={e => setForm(f => ({ ...f, per_user_limit: +e.target.value || 1 }))}
                className="w-full px-2 py-2 bg-muted border border-border rounded-lg text-sm text-foreground" />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground">Target Audience</label>
            <select value={form.target_audience} onChange={e => setForm(f => ({ ...f, target_audience: e.target.value }))}
              className="w-full px-2 py-2 bg-muted border border-border rounded-lg text-sm text-foreground">
              {AUDIENCES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
              <input type="checkbox" checked={form.auto_apply} onChange={e => setForm(f => ({ ...f, auto_apply: e.target.checked }))}
                className="rounded border-border" />
              Auto-apply
            </label>
            <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                className="rounded border-border" />
              Active
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={handleSave} className="flex-1 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-heading">
              {editId ? 'Update' : 'Create'} Campaign
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null); }}
              className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground">Cancel</button>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="text-center py-8"><div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : campaigns.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <Ticket size={32} className="text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No campaigns yet — create your first royal offer</p>
        </div>
      ) : (
        <div className="space-y-2">
          {campaigns.map(c => (
            <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-card border border-border rounded-xl p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg">{typeIcon(c.type)}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground capitalize">{c.category.replace('_', ' ')}</span>
                      {c.coupon_code && <span className="text-[10px] px-1.5 py-0.5 bg-secondary/10 text-secondary font-mono rounded">{c.coupon_code}</span>}
                      {c.auto_apply && <span className="text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-500 rounded">Auto</span>}
                      <span className="text-[10px] text-muted-foreground">{c.used_count} used</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => toggleActive(c.id, c.is_active)} className="p-1.5 rounded-lg hover:bg-muted">
                    {c.is_active ? <ToggleRight size={16} className="text-green-500" /> : <ToggleLeft size={16} className="text-muted-foreground" />}
                  </button>
                  <button onClick={() => handleEdit(c)} className="p-1.5 rounded-lg hover:bg-muted">
                    <Pencil size={14} className="text-muted-foreground" />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-muted">
                    <Trash2 size={14} className="text-accent" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                <span className="font-heading text-secondary text-xs">
                  {c.type === 'flat' ? `₹${c.discount_value} off` : c.type === 'percentage' ? `${c.discount_value}% off` : 'Free Item'}
                </span>
                {c.min_order_value ? <span>Min ₹{c.min_order_value}</span> : null}
                {c.valid_until && <span>Until {new Date(c.valid_until).toLocaleDateString()}</span>}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CampaignsTab;
