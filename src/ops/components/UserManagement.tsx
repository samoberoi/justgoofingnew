import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Users, ChevronDown, ChevronUp, Pencil, Upload, Camera, FileText, Calendar, IndianRupee } from 'lucide-react';

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
  designation: string;
  pan_number: string;
  aadhaar_number: string;
  start_date: string;
  salary: string;
}

const defaultUserForm: UserForm = {
  full_name: '',
  phone: '',
  password: '111111',
  role: 'store_manager',
  store_id: '',
  designation: '',
  pan_number: '',
  aadhaar_number: '',
  start_date: '',
  salary: '',
};

const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Record<string, any>>({});
  const [form, setForm] = useState<UserForm>(defaultUserForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const panInputRef = useRef<HTMLInputElement>(null);
  const aadhaarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [rolesRes, storesRes, profilesRes] = await Promise.all([
      supabase.from('user_roles').select('*').order('created_at'),
      supabase.from('stores').select('id, name').order('name'),
      supabase.from('profiles').select('user_id, full_name, phone, avatar_url, designation, pan_number, aadhaar_number, pan_document_url, aadhaar_document_url, start_date, salary'),
    ]);
    const profileMap = new Map((profilesRes.data || []).map(p => [p.user_id, p]));
    const merged = (rolesRes.data || []).map(r => ({
      ...r,
      profiles: profileMap.get(r.user_id) || { full_name: null, phone: null },
    }));
    setUsers(merged);
    setStores(storesRes.data || []);
  };

  const uploadFile = async (file: File, userId: string, type: 'avatar' | 'pan' | 'aadhaar'): Promise<string | null> => {
    setUploading(type);
    try {
      const ext = file.name.split('.').pop();
      const path = `${userId}/${type}-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('employee-documents').upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data } = supabase.storage.from('employee-documents').getPublicUrl(path);
      return data.publicUrl;
    } catch (err: any) {
      setError(`Upload failed: ${err.message}`);
      return null;
    } finally {
      setUploading(null);
    }
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
          designation: form.designation.trim() || null,
          pan_number: form.pan_number.trim() || null,
          aadhaar_number: form.aadhaar_number.trim() || null,
          start_date: form.start_date || null,
          salary: form.salary ? Number(form.salary) : null,
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

  const updateUser = async (user: any) => {
    setSaving(true);
    setError('');
    try {
      await supabase.from('user_roles').update({
        role: editFields.role as any,
        store_id: editFields.store_id || null,
        is_active: editFields.is_active,
      }).eq('id', user.id);

      await supabase.functions.invoke('update-ops-user', {
        body: {
          user_id: user.user_id,
          full_name: editFields.full_name?.trim(),
          phone: editFields.phone?.trim(),
          designation: editFields.designation?.trim() || null,
          pan_number: editFields.pan_number?.trim() || null,
          aadhaar_number: editFields.aadhaar_number?.trim() || null,
          start_date: editFields.start_date || null,
          salary: editFields.salary ? Number(editFields.salary) : null,
        },
      });

      setEditingId(null);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (file: File, userId: string, type: 'avatar' | 'pan' | 'aadhaar') => {
    const url = await uploadFile(file, userId, type);
    if (!url) return;
    const fieldMap = { avatar: 'avatar_url', pan: 'pan_document_url', aadhaar: 'aadhaar_document_url' };
    await supabase.functions.invoke('update-ops-user', {
      body: { user_id: userId, [fieldMap[type]]: url },
    });
    fetchData();
  };

  const toggleActive = async (roleId: string, current: boolean) => {
    await supabase.from('user_roles').update({ is_active: !current }).eq('id', roleId);
    fetchData();
  };

  const startEdit = (user: any) => {
    setEditingId(user.id);
    setEditFields({
      full_name: user.profiles?.full_name || '',
      phone: user.profiles?.phone || '',
      role: user.role,
      store_id: user.store_id || '',
      is_active: user.is_active,
      designation: user.profiles?.designation || '',
      pan_number: user.profiles?.pan_number || '',
      aadhaar_number: user.profiles?.aadhaar_number || '',
      start_date: user.profiles?.start_date || '',
      salary: user.profiles?.salary?.toString() || '',
    });
    setExpandedUser(null);
  };

  const setEdit = (key: string, val: any) => setEditFields(p => ({ ...p, [key]: val }));
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

  const renderFormFields = (values: any, onChange: (key: string, val: string) => void, isEdit = false) => (
    <>
      <div>
        <label className={labelClass}>Full Name *</label>
        <input value={values.full_name} onChange={e => onChange('full_name', e.target.value)} placeholder="e.g. Rahul Kumar" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Phone Number *</label>
        <input type="tel" value={values.phone} onChange={e => onChange('phone', e.target.value.replace(/[^\d]/g, ''))} placeholder="e.g. 9876543210" className={inputClass} />
      </div>
      {!isEdit && (
        <div>
          <label className={labelClass}>Login OTP / Password</label>
          <input value={values.password} onChange={e => onChange('password', e.target.value)} placeholder="Default: 111111" className={inputClass} />
          <p className="text-[10px] text-muted-foreground mt-1">This is the OTP they'll use to log in</p>
        </div>
      )}
      <div>
        <label className={labelClass}>Role *</label>
        <select value={values.role} onChange={e => onChange('role', e.target.value)} className={inputClass}>
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>
      {needsStore(values.role) && (
        <div>
          <label className={labelClass}>Assign to Store</label>
          <select value={values.store_id} onChange={e => onChange('store_id', e.target.value)} className={inputClass}>
            <option value="">— Select Store —</option>
            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}
      <div>
        <label className={labelClass}>Designation</label>
        <input value={values.designation} onChange={e => onChange('designation', e.target.value)} placeholder="e.g. Head Chef, Rider" className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}><Calendar size={12} className="inline mr-1" />Start Date</label>
          <input type="date" value={values.start_date} onChange={e => onChange('start_date', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}><IndianRupee size={12} className="inline mr-1" />Salary (₹)</label>
          <input type="number" value={values.salary} onChange={e => onChange('salary', e.target.value)} placeholder="e.g. 15000" className={inputClass} />
        </div>
      </div>
      <div>
        <label className={labelClass}>PAN Card Number</label>
        <input value={values.pan_number} onChange={e => onChange('pan_number', e.target.value.toUpperCase())} placeholder="e.g. ABCDE1234F" maxLength={10} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Aadhaar Card Number</label>
        <input value={values.aadhaar_number} onChange={e => onChange('aadhaar_number', e.target.value.replace(/[^\d]/g, ''))} placeholder="e.g. 123456789012" maxLength={12} className={inputClass} />
      </div>
    </>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-heading text-sm text-foreground flex items-center gap-2"><Users size={16} /> User Management</h2>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); }} className="flex items-center gap-1 px-3 py-1.5 bg-gradient-saffron rounded-lg text-xs font-medium text-primary-foreground">
          <Plus size={14} /> Add User
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 mb-4 space-y-3">
          <p className="font-heading text-sm text-foreground">New Employee</p>
          {error && <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
          {renderFormFields(form, (k, v) => setForm(p => ({ ...p, [k]: v })))}
          <div className="flex gap-2 pt-1">
            <button onClick={() => { setShowForm(false); setForm(defaultUserForm); setError(''); }} className="flex-1 py-2.5 border border-border rounded-lg text-xs font-medium text-muted-foreground">Cancel</button>
            <button onClick={addUser} disabled={!form.full_name.trim() || !form.phone.trim() || saving} className="flex-1 py-2.5 bg-gradient-saffron rounded-lg text-xs font-medium text-primary-foreground disabled:opacity-40">
              {saving ? 'Creating...' : 'Create Employee'}
            </button>
          </div>
        </div>
      )}

      {/* User List */}
      <div className="space-y-2">
        {users.map((u: any) => (
          <div key={u.id}>
            {editingId === u.id ? (
              <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                <p className="font-heading text-sm text-foreground">Edit — {u.profiles?.full_name || 'Unknown'}</p>
                {error && <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}

                {/* Avatar Upload */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {u.profiles?.avatar_url ? (
                      <img src={u.profiles.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-border" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-lg font-bold text-foreground">
                        {(u.profiles?.full_name || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 w-6 h-6 bg-secondary rounded-full flex items-center justify-center"
                      disabled={uploading === 'avatar'}
                    >
                      <Camera size={12} className="text-secondary-foreground" />
                    </button>
                    <input ref={avatarInputRef} type="file" accept="image/*" className="hidden"
                      onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0], u.user_id, 'avatar'); }} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Profile Photo</p>
                    {uploading === 'avatar' && <p className="text-[10px] text-secondary">Uploading...</p>}
                  </div>
                </div>

                {renderFormFields(editFields, (k, v) => setEdit(k, v), true)}

                {/* Document Uploads */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Documents</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => panInputRef.current?.click()} disabled={uploading === 'pan'}
                      className="flex items-center gap-2 px-3 py-2 bg-muted border border-border rounded-lg text-xs text-foreground">
                      <FileText size={14} />
                      {u.profiles?.pan_document_url ? '✓ PAN Uploaded' : 'Upload PAN'}
                      {uploading === 'pan' && '...'}
                    </button>
                    <button onClick={() => aadhaarInputRef.current?.click()} disabled={uploading === 'aadhaar'}
                      className="flex items-center gap-2 px-3 py-2 bg-muted border border-border rounded-lg text-xs text-foreground">
                      <FileText size={14} />
                      {u.profiles?.aadhaar_document_url ? '✓ Aadhaar Uploaded' : 'Upload Aadhaar'}
                      {uploading === 'aadhaar' && '...'}
                    </button>
                  </div>
                  <input ref={panInputRef} type="file" accept="image/*,.pdf" className="hidden"
                    onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0], u.user_id, 'pan'); }} />
                  <input ref={aadhaarInputRef} type="file" accept="image/*,.pdf" className="hidden"
                    onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0], u.user_id, 'aadhaar'); }} />
                </div>

                {/* Active toggle */}
                <div className="flex items-center justify-between py-1">
                  <label className="text-sm text-foreground">Active</label>
                  <button onClick={() => setEdit('is_active', !editFields.is_active)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${editFields.is_active ? 'bg-green-500' : 'bg-muted-foreground/30'}`}>
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${editFields.is_active ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>

                <div className="flex gap-2 pt-1">
                  <button onClick={() => { setEditingId(null); setError(''); }} className="flex-1 py-2.5 border border-border rounded-lg text-xs font-medium text-muted-foreground">Cancel</button>
                  <button onClick={() => updateUser(u)} disabled={saving} className="flex-1 py-2.5 bg-gradient-saffron rounded-lg text-xs font-medium text-primary-foreground disabled:opacity-40">
                    {saving ? 'Saving...' : 'Update Employee'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <button onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)} className="w-full p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {u.profiles?.avatar_url ? (
                      <img src={u.profiles.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground">
                        {(u.profiles?.full_name || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">{u.profiles?.full_name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">
                        {u.profiles?.designation || u.profiles?.phone || '—'}
                      </p>
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
                      <div className="text-muted-foreground">Phone: {u.profiles?.phone || '—'}</div>
                      <div className="text-muted-foreground">Store: {getStoreName(u.store_id)}</div>
                      <div className="text-muted-foreground">Designation: {u.profiles?.designation || '—'}</div>
                      <div className={u.is_active ? 'text-green-400' : 'text-destructive'}>{u.is_active ? 'Active' : 'Inactive'}</div>
                      {u.profiles?.start_date && <div className="text-muted-foreground">Start: {u.profiles.start_date}</div>}
                      {u.profiles?.salary && <div className="text-muted-foreground">Salary: ₹{Number(u.profiles.salary).toLocaleString('en-IN')}</div>}
                      {u.profiles?.pan_number && <div className="text-muted-foreground">PAN: {u.profiles.pan_number}</div>}
                      {u.profiles?.aadhaar_number && <div className="text-muted-foreground">Aadhaar: ••••{u.profiles.aadhaar_number.slice(-4)}</div>}
                    </div>
                    {/* Doc indicators */}
                    {(u.profiles?.pan_document_url || u.profiles?.aadhaar_document_url) && (
                      <div className="flex gap-2">
                        {u.profiles?.pan_document_url && <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full">✓ PAN Doc</span>}
                        {u.profiles?.aadhaar_document_url && <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full">✓ Aadhaar Doc</span>}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2">
                      <button onClick={() => startEdit(u)} className="flex items-center gap-1.5 text-xs text-secondary font-medium">
                        <Pencil size={13} /> Edit
                      </button>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-foreground">Active</span>
                        <button onClick={() => toggleActive(u.id, u.is_active)}
                          className={`relative w-12 h-6 rounded-full transition-colors ${u.is_active ? 'bg-green-500' : 'bg-muted-foreground/30'}`}>
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
