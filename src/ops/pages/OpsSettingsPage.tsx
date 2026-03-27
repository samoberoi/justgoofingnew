import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../hooks/useAuth';
import OpsBottomNav from '../components/OpsBottomNav';
import { Plus, Store, Users, Trash2 } from 'lucide-react';

const OpsSettingsPage = () => {
  const { role } = useAuth();
  const [stores, setStores] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [showStoreForm, setShowStoreForm] = useState(false);
  const [storeForm, setStoreForm] = useState({ name: '', address: '', phone: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [storesRes, rolesRes] = await Promise.all([
      supabase.from('stores').select('*').order('created_at'),
      supabase.from('user_roles').select('*, profiles(full_name, phone)').order('created_at'),
    ]);
    setStores(storesRes.data || []);
    setRoles(rolesRes.data || []);
  };

  const addStore = async () => {
    if (!storeForm.name) return;
    await supabase.from('stores').insert(storeForm);
    setStoreForm({ name: '', address: '', phone: '' });
    setShowStoreForm(false);
    fetchData();
  };

  if (role !== 'super_admin') return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Access denied</div>;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border px-4 py-3">
        <h1 className="font-heading text-lg text-gradient-gold">Settings</h1>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* Stores Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-sm text-foreground flex items-center gap-2"><Store size={16} /> Stores</h2>
            <button onClick={() => setShowStoreForm(!showStoreForm)} className="flex items-center gap-1 px-3 py-1.5 bg-gradient-saffron rounded-lg text-xs font-medium text-primary-foreground">
              <Plus size={14} /> Add Store
            </button>
          </div>

          {showStoreForm && (
            <div className="bg-card border border-border rounded-lg p-3 mb-3 space-y-2">
              <input value={storeForm.name} onChange={e => setStoreForm(p => ({ ...p, name: e.target.value }))} placeholder="Store name" className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-secondary" />
              <input value={storeForm.address} onChange={e => setStoreForm(p => ({ ...p, address: e.target.value }))} placeholder="Address" className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-secondary" />
              <input value={storeForm.phone} onChange={e => setStoreForm(p => ({ ...p, phone: e.target.value }))} placeholder="Phone" className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-secondary" />
              <button onClick={addStore} className="w-full py-2 bg-gradient-saffron rounded-lg text-xs font-medium text-primary-foreground">Save Store</button>
            </div>
          )}

          <div className="space-y-2">
            {stores.map(store => (
              <div key={store.id} className="bg-card border border-border rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{store.name}</p>
                  <p className="text-xs text-muted-foreground">{store.address || 'No address'}</p>
                </div>
                <div className={`w-2 h-2 rounded-full ${store.is_active ? 'bg-green-500' : 'bg-destructive'}`} />
              </div>
            ))}
            {stores.length === 0 && <p className="text-center text-sm text-muted-foreground py-6">No stores yet</p>}
          </div>
        </div>

        {/* Team Roles Section */}
        <div>
          <h2 className="font-heading text-sm text-foreground flex items-center gap-2 mb-3"><Users size={16} /> Team Roles</h2>
          <div className="space-y-2">
            {roles.map((r: any) => (
              <div key={r.id} className="bg-card border border-border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{(r as any).profiles?.full_name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">{r.role.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</p>
                  </div>
                  <div className={`px-2 py-0.5 rounded text-xs ${r.is_active ? 'bg-green-500/20 text-green-400' : 'bg-destructive/20 text-destructive'}`}>
                    {r.is_active ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>
            ))}
            {roles.length === 0 && <p className="text-center text-sm text-muted-foreground py-6">No team members yet</p>}
          </div>
        </div>
      </div>

      <OpsBottomNav />
    </div>
  );
};

export default OpsSettingsPage;
