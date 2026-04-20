import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Coins, Save, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface PointsConfig {
  id: string;
  earning_enabled: boolean;
  earning_percent: number;
  max_earn_per_order: number | null;
  redemption_enabled: boolean;
  points_to_currency: number;
  max_redemption_percent: number;
  min_order_for_redemption: number | null;
  expiry_days: number | null;
}

const PointsSettingsTab = () => {
  const [config, setConfig] = useState<PointsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [txStats, setTxStats] = useState({ totalEarned: 0, totalSpent: 0, totalUsers: 0 });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [settingsRes, txRes] = await Promise.all([
      supabase.from('points_settings').select('*').limit(1).single() as any,
      supabase.from('points_transactions').select('type, amount') as any,
    ]);
    setConfig(settingsRes.data);

    const txs = txRes.data || [];
    const earned = txs.filter((t: any) => t.type === 'earned' || t.type === 'bonus' || t.type === 'referral')
      .reduce((s: number, t: any) => s + Math.abs(Number(t.amount)), 0);
    const spent = txs.filter((t: any) => t.type === 'spent')
      .reduce((s: number, t: any) => s + Math.abs(Number(t.amount)), 0);
    const users = new Set(txs.map((t: any) => t.user_id)).size;
    setTxStats({ totalEarned: earned, totalSpent: spent, totalUsers: users });
    setLoading(false);
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    const { id, ...rest } = config;
    await supabase.from('points_settings').update({ ...rest, updated_at: new Date().toISOString() }).eq('id', id) as any;
    toast.success('Goofy Points settings updated');
    setSaving(false);
  };

  if (loading) return <div className="text-center py-8"><div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin mx-auto" /></div>;
  if (!config) return <p className="text-sm text-muted-foreground text-center py-8">No settings found</p>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-sm text-foreground">Goofy Points Configuration</h2>
        <p className="text-[10px] text-muted-foreground">Configure earning, redemption & expiry rules</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Total Earned', value: txStats.totalEarned, icon: TrendingUp, color: 'text-green-400' },
          { label: 'Total Spent', value: txStats.totalSpent, icon: TrendingDown, color: 'text-accent' },
          { label: 'Users', value: txStats.totalUsers, icon: Coins, color: 'text-secondary' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-3 text-center">
            <s.icon size={16} className={`${s.color} mx-auto mb-1`} />
            <p className="font-heading text-sm text-foreground">{s.value.toLocaleString()}</p>
            <p className="text-[9px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Earning Rules */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="font-heading text-xs text-foreground flex items-center gap-1.5">
          <TrendingUp size={14} className="text-green-400" /> Earning Rules
        </h3>
        <label className="flex items-center justify-between">
          <span className="text-xs text-foreground">Enable Earning</span>
          <button onClick={() => setConfig({ ...config, earning_enabled: !config.earning_enabled })}
            className={`w-10 h-5 rounded-full transition-colors ${config.earning_enabled ? 'bg-green-500' : 'bg-muted'} flex items-center`}>
            <div className={`w-4 h-4 rounded-full bg-card transition-transform ${config.earning_enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-muted-foreground">Earning % per order</label>
            <input type="number" step="0.1" min={0} max={100} value={config.earning_percent}
              onChange={e => setConfig({ ...config, earning_percent: +e.target.value })}
              className="w-full px-2 py-2 bg-muted border border-border rounded-lg text-sm text-foreground" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground">Max earn/order (cap)</label>
            <input type="number" min={0} value={config.max_earn_per_order || ''}
              onChange={e => setConfig({ ...config, max_earn_per_order: +e.target.value || null })}
              placeholder="No limit" className="w-full px-2 py-2 bg-muted border border-border rounded-lg text-sm text-foreground" />
          </div>
        </div>
      </motion.div>

      {/* Redemption Rules */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="font-heading text-xs text-foreground flex items-center gap-1.5">
          <TrendingDown size={14} className="text-accent" /> Redemption Rules
        </h3>
        <label className="flex items-center justify-between">
          <span className="text-xs text-foreground">Enable Redemption</span>
          <button onClick={() => setConfig({ ...config, redemption_enabled: !config.redemption_enabled })}
            className={`w-10 h-5 rounded-full transition-colors ${config.redemption_enabled ? 'bg-green-500' : 'bg-muted'} flex items-center`}>
            <div className={`w-4 h-4 rounded-full bg-card transition-transform ${config.redemption_enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </label>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] text-muted-foreground">Pts → ₹ rate</label>
            <input type="number" step="0.1" min={0} value={config.points_to_currency}
              onChange={e => setConfig({ ...config, points_to_currency: +e.target.value })}
              className="w-full px-2 py-2 bg-muted border border-border rounded-lg text-sm text-foreground" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground">Max redeem %</label>
            <input type="number" min={0} max={100} value={config.max_redemption_percent}
              onChange={e => setConfig({ ...config, max_redemption_percent: +e.target.value })}
              className="w-full px-2 py-2 bg-muted border border-border rounded-lg text-sm text-foreground" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground">Min order ₹</label>
            <input type="number" min={0} value={config.min_order_for_redemption || ''}
              onChange={e => setConfig({ ...config, min_order_for_redemption: +e.target.value || null })}
              className="w-full px-2 py-2 bg-muted border border-border rounded-lg text-sm text-foreground" />
          </div>
        </div>
      </motion.div>

      {/* Expiry */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="font-heading text-xs text-foreground flex items-center gap-1.5">
          <Clock size={14} className="text-yellow-400" /> Point Expiry
        </h3>
        <div>
          <label className="text-[10px] text-muted-foreground">Expiry (days after earning)</label>
          <input type="number" min={0} value={config.expiry_days || ''}
            onChange={e => setConfig({ ...config, expiry_days: +e.target.value || null })}
            placeholder="Never expires" className="w-full px-2 py-2 bg-muted border border-border rounded-lg text-sm text-foreground" />
          <p className="text-[9px] text-muted-foreground mt-1">Set to 0 or leave empty for no expiry</p>
        </div>
      </motion.div>

      <button onClick={handleSave} disabled={saving}
        className="w-full py-3 bg-secondary text-secondary-foreground rounded-xl text-sm font-heading flex items-center justify-center gap-2 disabled:opacity-50">
        <Save size={16} /> {saving ? 'Saving...' : 'Save Points Settings'}
      </button>
    </div>
  );
};

export default PointsSettingsTab;
