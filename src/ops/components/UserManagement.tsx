import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Users, ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react';

const inputClass = 'w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-secondary transition-colors';
const labelClass = 'text-xs font-medium text-muted-foreground mb-1 block';

const ROLES = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'store_manager', label: 'Store Manager' },
  { value: 'kitchen_manager', label: 'Kitchen Manager' },
  { value: 'delivery_partner', label: 'Delivery Partner' },
] as const;

interface UserForm {
  full_name: string;
  phone: string;
  password: string;
  role: string;
  store_id: string;
}

const defaultUserForm: UserForm = {
  full_name: '',
  phone: '',
  password: '111111',
  role: 'store_manager',
  store_id: '',
};

const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState('');
  const [editStoreId, setEditStoreId] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [form, setForm] = useState<UserForm>(defaultUserForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [rolesRes, storesRes] = await Promise.all([
      supabase.from('user_roles').select('*, profiles(full_name, phone)').order('created_at'),
      supabase.from('stores').select('id, name').order('name'),
    ]);
    setUsers(rolesRes.data || []);
    setStores(storesRes.data || []);
  };

  const addUser = async () => {
    if (!form.full_name.trim() || !form.phone.trim()) return;
    setSaving(true);
    setError('');

    try {
      const { data, error: fnErr } = await supabase.functions.invoke('create-ops-user', {
        body: {
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          password: form.password || '111111',
          role: form.role,
          store_id: form.store_id || null,
        },
      });

      if (fnErr) throw new Error(fnErr.message || 'Failed to create user');
      if (data?.error) throw new Error(data.error);

      setForm(defaultUserForm);
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const updateRole = async (roleId: string) => {
    setSaving(true);
    await supabase.from('user_roles').update({
      role: editRole as any,
      store_id: editStoreId || null,
      is_active: editIsActive,
    }).eq('id', roleId);
    setEditingId(null);
    setSaving(false);
    fetchData();
  };

  const toggleActive = async (roleId: string, current: boolean) => {
    await supabase.from('user_roles').update({ is_active: !current }).eq('id', roleId);
    fetchData();
  };

  const startEdit = (user: any) => {
    setEditingId(user.id);
    setEditRole(user.role);
    setEditStoreId(user.store_id || '');
    setEditIsActive(user.is_active);
    setExpandedUser(null);
  };

  const needsStore = (role: string) => role === 'store_manager' || role === 'kitchen_manager' || role === 'delivery_partner';

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-yellow-500/20 text-yellow-400';
      case 'store_manager': return 'bg-blue-500/20 text-blue-400';
      case 'kitchen_manager': return 'bg-orange-500/20 text-orange-400';
      case 'delivery_partner': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStoreName = (storeId: string | null) => {
    if (!storeId) return '—';
    return stores.find(s => s.id === storeId)?.name || '—';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-heading text-sm text-foreground flex items-center gap-2"><Users size={16} /> User Management</h2>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); }} className="flex items-center gap-1 px-3 py-1.5 bg-gradient-saffron rounded-lg text-xs font-medium text-primary-foreground">
          <Plus size={14} /> Add User
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 mb-4 space-y-3">
          <p className="font-heading text-sm text-foreground">New User</p>

          {error && <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}

          <div>
            <label className={labelClass}>Full Name *</label>
            <input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} placeholder="e.g. Rahul Kumar" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Phone Number *</label>
            <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value.replace(/[^\d]/g, '') }))} placeholder="e.g. 9876543210" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Login OTP / Password</label>
            <input value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Default: 111111" className={inputClass} />
            <p className="text-[10px] text-muted-foreground mt-1">This is the OTP they'll use to log in</p>
          </div>

          <div>
            <label className={labelClass}>Role *</label>
            <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className={inputClass}>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          {needsStore(form.role) && (
            <div>
              <label className={labelClass}>Assign to Store</label>
              <select value={form.store_id} onChange={e => setForm(p => ({ ...p, store_id: e.target.value }))} className={inputClass}>
                <option value="">— Select Store —</option>
                {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button onClick={() => { setShowForm(false); setForm(defaultUserForm); setError(''); }} className="flex-1 py-2.5 border border-border rounded-lg text-xs font-medium text-muted-foreground">
              Cancel
            </button>
            <button onClick={addUser} disabled={!form.full_name.trim() || !form.phone.trim() || saving} className="flex-1 py-2.5 bg-gradient-saffron rounded-lg text-xs font-medium text-primary-foreground disabled:opacity-40">
              {saving ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {users.map((u: any) => (
          <div key={u.id}>
            {editingId === u.id ? (
              <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                <p className="font-heading text-sm text-foreground">Edit Role — {u.profiles?.full_name || 'Unknown'}</p>

                <div>
                  <label className={labelClass}>Role</label>
                  <select value={editRole} onChange={e => setEditRole(e.target.value)} className={inputClass}>
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>

                {needsStore(editRole) && (
                  <div>
                    <label className={labelClass}>Assign to Store</label>
                    <select value={editStoreId} onChange={e => setEditStoreId(e.target.value)} className={inputClass}>
                      <option value="">— Select Store —</option>
                      {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                )}

                <div className="flex items-center justify-between py-1">
                  <label className="text-sm text-foreground">Active</label>
                  <button
                    onClick={() => setEditIsActive(!editIsActive)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${editIsActive ? 'bg-green-500' : 'bg-muted-foreground/30'}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${editIsActive ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>

                <div className="flex gap-2 pt-1">
                  <button onClick={() => setEditingId(null)} className="flex-1 py-2.5 border border-border rounded-lg text-xs font-medium text-muted-foreground">
                    Cancel
                  </button>
                  <button onClick={() => updateRole(u.id)} disabled={saving} className="flex-1 py-2.5 bg-gradient-saffron rounded-lg text-xs font-medium text-primary-foreground disabled:opacity-40">
                    {saving ? 'Saving...' : 'Update Role'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                  className="w-full p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground`}>
                      {(u.profiles?.full_name || '?')[0].toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">{u.profiles?.full_name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{u.profiles?.phone || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getRoleColor(u.role)}`}>
                      {u.role.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                    </span>
                    {expandedUser === u.id ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                  </div>
                </button>

                {expandedUser === u.id && (
                  <div className="px-3 pb-3 border-t border-border pt-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-muted-foreground">Store: {getStoreName(u.store_id)}</div>
                      <div className={u.is_active ? 'text-green-400' : 'text-destructive'}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <button onClick={() => startEdit(u)} className="flex items-center gap-1.5 text-xs text-secondary font-medium">
                        <Pencil size={13} /> Edit Role
                      </button>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-foreground">Active</span>
                        <button
                          onClick={() => toggleActive(u.id, u.is_active)}
                          className={`relative w-12 h-6 rounded-full transition-colors ${u.is_active ? 'bg-green-500' : 'bg-muted-foreground/30'}`}
                        >
                          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${u.is_active ? 'translate-x-6' : 'translate-x-0.5'}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {users.length === 0 && <p className="text-center text-sm text-muted-foreground py-6">No team members yet</p>}
      </div>
    </div>
  );
};

export default UserManagement;
