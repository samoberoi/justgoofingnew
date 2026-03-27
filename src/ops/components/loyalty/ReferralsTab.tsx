import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Save, Share2, Users, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface ReferralConfig {
  id: string;
  referrer_points: number;
  referee_points: number;
  referee_discount_percent: number | null;
  max_referrals_per_user: number | null;
  require_first_order: boolean;
  is_active: boolean;
}

const ReferralsTab = () => {
  const [config, setConfig] = useState<ReferralConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, pointsAwarded: 0 });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [settingsRes, referralsRes] = await Promise.all([
      supabase.from('referral_settings').select('*').limit(1).single() as any,
      supabase.from('referrals').select('status, points_awarded') as any,
    ]);
    setConfig(settingsRes.data);

    const refs = referralsRes.data || [];
    setStats({
      total: refs.length,
      completed: refs.filter((r: any) => r.status === 'completed').length,
      pending: refs.filter((r: any) => r.status === 'pending').length,
      pointsAwarded: refs.reduce((s: number, r: any) => s + Number(r.points_awarded || 0), 0),
    });
    setLoading(false);
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    const { id, ...rest } = config;
    await supabase.from('referral_settings').update({ ...rest, updated_at: new Date().toISOString() }).eq('id', id) as any;
    toast.success('Referral settings updated');
    setSaving(false);
  };

  if (loading) return <div className="text-center py-8"><div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin mx-auto" /></div>;
  if (!config) return <p className="text-sm text-muted-foreground text-center py-8">No settings found</p>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-sm text-foreground">Referral Engine</h2>
        <p className="text-[10px] text-muted-foreground">Drive growth through word of mouth</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Total Referrals', value: stats.total, icon: Share2, color: 'text-secondary' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-green-400' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-yellow-400' },
          { label: 'Points Awarded', value: stats.pointsAwarded, icon: Users, color: 'text-blue-400' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              <s.icon size={14} className={s.color} />
            </div>
            <div>
              <p className="font-heading text-sm text-foreground">{s.value}</p>
              <p className="text-[9px] text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Settings */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="font-heading text-xs text-foreground">Reward Configuration</h3>

        <label className="flex items-center justify-between">
          <span className="text-xs text-foreground">Referral System Active</span>
          <button onClick={() => setConfig({ ...config, is_active: !config.is_active })}
            className={`w-10 h-5 rounded-full transition-colors ${config.is_active ? 'bg-green-500' : 'bg-muted'} flex items-center`}>
            <div className={`w-4 h-4 rounded-full bg-card transition-transform ${config.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </label>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-muted-foreground">Referrer Points</label>
            <input type="number" min={0} value={config.referrer_points}
              onChange={e => setConfig({ ...config, referrer_points: +e.target.value })}
              className="w-full px-2 py-2 bg-muted border border-border rounded-lg text-sm text-foreground" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground">Referee Points</label>
            <input type="number" min={0} value={config.referee_points}
              onChange={e => setConfig({ ...config, referee_points: +e.target.value })}
              className="w-full px-2 py-2 bg-muted border border-border rounded-lg text-sm text-foreground" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-muted-foreground">Referee Discount %</label>
            <input type="number" min={0} max={100} value={config.referee_discount_percent || ''}
              onChange={e => setConfig({ ...config, referee_discount_percent: +e.target.value || null })}
              className="w-full px-2 py-2 bg-muted border border-border rounded-lg text-sm text-foreground" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground">Max Referrals/User</label>
            <input type="number" min={0} value={config.max_referrals_per_user || ''}
              onChange={e => setConfig({ ...config, max_referrals_per_user: +e.target.value || null })}
              placeholder="Unlimited" className="w-full px-2 py-2 bg-muted border border-border rounded-lg text-sm text-foreground" />
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
          <input type="checkbox" checked={config.require_first_order}
            onChange={e => setConfig({ ...config, require_first_order: e.target.checked })}
            className="rounded border-border" />
          Require first order from referee before rewarding
        </label>
      </motion.div>

      <button onClick={handleSave} disabled={saving}
        className="w-full py-3 bg-secondary text-secondary-foreground rounded-xl text-sm font-heading flex items-center justify-center gap-2 disabled:opacity-50">
        <Save size={16} /> {saving ? 'Saving...' : 'Save Referral Settings'}
      </button>
    </div>
  );
};

export default ReferralsTab;
