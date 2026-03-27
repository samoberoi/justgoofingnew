import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../hooks/useAuth';
import OpsBottomNav from '../components/OpsBottomNav';
import UserManagement from '../components/UserManagement';
import { Plus, Store, Clock, MapPin, Phone, ChevronDown, ChevronUp, Pencil, ExternalLink } from 'lucide-react';

interface StoreForm {
  name: string;
  address: string;
  phone: string;
  opening_time: string;
  closing_time: string;
  delivery_radius: string;
  default_prep_time: string;
  tax_percent: string;
  latitude: string;
  longitude: string;
  google_maps_url: string;
  is_active: boolean;
}

const defaultForm: StoreForm = {
  name: '',
  address: '',
  phone: '',
  opening_time: '09:00',
  closing_time: '23:00',
  delivery_radius: '5',
  default_prep_time: '30',
  tax_percent: '5',
  latitude: '',
  longitude: '',
  google_maps_url: '',
  is_active: true,
};

const inputClass = 'w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-secondary transition-colors';
const labelClass = 'text-xs font-medium text-muted-foreground mb-1 block';

const StoreFormFields = ({ form, setForm, onSave, onCancel, saving, submitLabel }: {
  form: StoreForm;
  setForm: React.Dispatch<React.SetStateAction<StoreForm>>;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  submitLabel: string;
}) => (
  <div className="bg-card border border-border rounded-xl p-4 mb-4 space-y-3">
    <div>
      <label className={labelClass}>Store Name *</label>
      <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. BIRYAAN HSR Layout" className={inputClass} />
    </div>
    <div>
      <label className={labelClass}>Full Address</label>
      <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Full address with pin code" className={inputClass} />
    </div>
    <div>
      <label className={labelClass}>Phone Number</label>
      <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value.replace(/[^\d+\-\s]/g, '') }))} placeholder="+91 XXXXX XXXXX" className={inputClass} />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className={labelClass}>Open Time</label>
        <input type="time" value={form.opening_time} onChange={e => setForm(p => ({ ...p, opening_time: e.target.value }))} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Close Time</label>
        <input type="time" value={form.closing_time} onChange={e => setForm(p => ({ ...p, closing_time: e.target.value }))} className={inputClass} />
      </div>
    </div>
    <div className="grid grid-cols-3 gap-3">
      <div>
        <label className={labelClass}>Delivery Radius (km)</label>
        <input type="number" min="1" max="50" value={form.delivery_radius} onChange={e => setForm(p => ({ ...p, delivery_radius: e.target.value }))} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Prep Time (min)</label>
        <input type="number" min="5" max="120" value={form.default_prep_time} onChange={e => setForm(p => ({ ...p, default_prep_time: e.target.value }))} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>GST %</label>
        <input type="number" min="0" max="28" step="0.5" value={form.tax_percent} onChange={e => setForm(p => ({ ...p, tax_percent: e.target.value }))} className={inputClass} />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className={labelClass}>Latitude</label>
        <input type="number" step="any" value={form.latitude} onChange={e => setForm(p => ({ ...p, latitude: e.target.value }))} placeholder="e.g. 12.9716" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Longitude</label>
        <input type="number" step="any" value={form.longitude} onChange={e => setForm(p => ({ ...p, longitude: e.target.value }))} placeholder="e.g. 77.5946" className={inputClass} />
      </div>
    </div>
    <div>
      <label className={labelClass}>Google Maps Link (optional)</label>
      <input value={form.google_maps_url} onChange={e => setForm(p => ({ ...p, google_maps_url: e.target.value }))} placeholder="Paste Google Maps URL here" className={inputClass} />
    </div>
    {(form.latitude && form.longitude) && (
      <div className="space-y-2">
        <div className="rounded-lg overflow-hidden border border-border">
          <iframe
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(form.longitude) - 0.005},${parseFloat(form.latitude) - 0.003},${parseFloat(form.longitude) + 0.005},${parseFloat(form.latitude) + 0.003}&layer=mapnik&marker=${form.latitude},${form.longitude}`}
            className="w-full h-36"
            style={{ border: 0 }}
          />
        </div>
        <a
          href={form.google_maps_url?.trim() || `https://www.google.com/maps?q=${form.latitude},${form.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-secondary font-medium"
        >
          <ExternalLink size={12} /> Open in Google Maps
        </a>
      </div>
    )}
    <div className="flex items-center justify-between py-1">
      <label className="text-sm text-foreground">Store Status</label>
      <button
        onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}
        className={`relative w-12 h-6 rounded-full transition-colors ${form.is_active ? 'bg-green-500' : 'bg-muted-foreground/30'}`}
      >
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.is_active ? 'translate-x-6' : 'translate-x-0.5'}`} />
      </button>
    </div>
    <div className="flex gap-2 pt-1">
      <button onClick={onCancel} className="flex-1 py-2.5 border border-border rounded-lg text-xs font-medium text-muted-foreground">
        Cancel
      </button>
      <button onClick={onSave} disabled={!form.name.trim() || saving} className="flex-1 py-2.5 bg-gradient-saffron rounded-lg text-xs font-medium text-primary-foreground disabled:opacity-40">
        {saving ? 'Saving...' : submitLabel}
      </button>
    </div>
  </div>
);

const OpsSettingsPage = () => {
  const { role } = useAuth();
  const [stores, setStores] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [showStoreForm, setShowStoreForm] = useState(false);
  const [storeForm, setStoreForm] = useState<StoreForm>(defaultForm);
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<StoreForm>(defaultForm);
  const [expandedStore, setExpandedStore] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [storesRes, rolesRes] = await Promise.all([
      supabase.from('stores').select('*').order('created_at'),
      supabase.from('user_roles').select('*, profiles(full_name, phone)').order('created_at'),
    ]);
    setStores(storesRes.data || []);
    setRoles(rolesRes.data || []);
  };

  const storePayload = (form: StoreForm) => ({
    name: form.name.trim(),
    address: form.address.trim() || null,
    phone: form.phone.trim() || null,
    opening_time: form.opening_time || '09:00',
    closing_time: form.closing_time || '23:00',
    delivery_radius: parseFloat(form.delivery_radius) || 5,
    default_prep_time: parseInt(form.default_prep_time) || 30,
    tax_percent: parseFloat(form.tax_percent) || 5,
    latitude: form.latitude ? parseFloat(form.latitude) : null,
    longitude: form.longitude ? parseFloat(form.longitude) : null,
    google_maps_url: form.google_maps_url.trim() || null,
    is_active: form.is_active,
  });

  const addStore = async () => {
    if (!storeForm.name.trim()) return;
    setSaving(true);
    await supabase.from('stores').insert(storePayload(storeForm));
    setStoreForm(defaultForm);
    setShowStoreForm(false);
    setSaving(false);
    fetchData();
  };

  const startEdit = (store: any) => {
    setEditingStoreId(store.id);
    setExpandedStore(null);
    setEditForm({
      name: store.name || '',
      address: store.address || '',
      phone: store.phone || '',
      opening_time: store.opening_time?.slice(0, 5) || '09:00',
      closing_time: store.closing_time?.slice(0, 5) || '23:00',
      delivery_radius: String(store.delivery_radius ?? 5),
      default_prep_time: String(store.default_prep_time ?? 30),
      tax_percent: String(store.tax_percent ?? 5),
      latitude: store.latitude ? String(store.latitude) : '',
      longitude: store.longitude ? String(store.longitude) : '',
      google_maps_url: store.google_maps_url || '',
      is_active: store.is_active,
    });
  };

  const saveEdit = async () => {
    if (!editingStoreId || !editForm.name.trim()) return;
    setSaving(true);
    await supabase.from('stores').update(storePayload(editForm)).eq('id', editingStoreId);
    setEditingStoreId(null);
    setSaving(false);
    fetchData();
  };

  const toggleStoreStatus = async (storeId: string, currentStatus: boolean) => {
    await supabase.from('stores').update({ is_active: !currentStatus }).eq('id', storeId);
    fetchData();
  };

  if (role !== 'super_admin') return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Access denied</div>;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border px-4 py-3">
        <h1 className="font-heading text-lg text-gradient-gold">Settings</h1>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* Stores */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-sm text-foreground flex items-center gap-2"><Store size={16} /> Stores</h2>
            <button onClick={() => { setShowStoreForm(!showStoreForm); setEditingStoreId(null); }} className="flex items-center gap-1 px-3 py-1.5 bg-gradient-saffron rounded-lg text-xs font-medium text-primary-foreground">
              <Plus size={14} /> Add Store
            </button>
          </div>

          {showStoreForm && !editingStoreId && (
            <>
              <p className="font-heading text-sm text-foreground mb-2">New Store</p>
              <StoreFormFields form={storeForm} setForm={setStoreForm} onSave={addStore} onCancel={() => { setShowStoreForm(false); setStoreForm(defaultForm); }} saving={saving} submitLabel="Save Store" />
            </>
          )}

          <div className="space-y-2">
            {stores.map(store => (
              <div key={store.id}>
                {editingStoreId === store.id ? (
                  <>
                    <p className="font-heading text-sm text-foreground mb-2">Edit Store</p>
                    <StoreFormFields form={editForm} setForm={setEditForm} onSave={saveEdit} onCancel={() => setEditingStoreId(null)} saving={saving} submitLabel="Update Store" />
                  </>
                ) : (
                  <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedStore(expandedStore === store.id ? null : store.id)}
                      className="w-full p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${store.is_active ? 'bg-green-500' : 'bg-destructive'}`} />
                        <div className="text-left">
                          <p className="text-sm font-medium text-foreground">{store.name}</p>
                          <p className="text-xs text-muted-foreground">{store.address || 'No address'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${store.is_active ? 'bg-green-500/20 text-green-400' : 'bg-destructive/20 text-destructive'}`}>
                          {store.is_active ? 'Open' : 'Closed'}
                        </span>
                        {expandedStore === store.id ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                      </div>
                    </button>

                    {expandedStore === store.id && (
                      <div className="px-3 pb-3 border-t border-border pt-3 space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1.5 text-muted-foreground"><Phone size={12} /><span>{store.phone || '—'}</span></div>
                          <div className="flex items-center gap-1.5 text-muted-foreground"><Clock size={12} /><span>{store.opening_time?.slice(0, 5) || '09:00'} – {store.closing_time?.slice(0, 5) || '23:00'}</span></div>
                          <div className="flex items-center gap-1.5 text-muted-foreground"><MapPin size={12} /><span>{store.delivery_radius || 5} km radius</span></div>
                          <div className="text-muted-foreground">Prep: {store.default_prep_time || 30} min</div>
                          <div className="text-muted-foreground">GST: {store.tax_percent || 5}%</div>
                        </div>
                        {store.latitude && store.longitude && (
                          <div className="space-y-2">
                            <div className="rounded-lg overflow-hidden border border-border">
                              <iframe
                                src={`https://www.openstreetmap.org/export/embed.html?bbox=${store.longitude - 0.005},${store.latitude - 0.003},${store.longitude + 0.005},${store.latitude + 0.003}&layer=mapnik&marker=${store.latitude},${store.longitude}`}
                                className="w-full h-36"
                                style={{ border: 0 }}
                              />
                            </div>
                            <a
                              href={store.google_maps_url || `https://www.google.com/maps?q=${store.latitude},${store.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs text-secondary font-medium"
                            >
                              <ExternalLink size={12} /> Open in Google Maps
                            </a>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2">
                          <button onClick={() => startEdit(store)} className="flex items-center gap-1.5 text-xs text-secondary font-medium">
                            <Pencil size={13} /> Edit Store
                          </button>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-foreground">Quick Toggle</span>
                            <button
                              onClick={() => toggleStoreStatus(store.id, store.is_active)}
                              className={`relative w-12 h-6 rounded-full transition-colors ${store.is_active ? 'bg-green-500' : 'bg-muted-foreground/30'}`}
                            >
                              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${store.is_active ? 'translate-x-6' : 'translate-x-0.5'}`} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {stores.length === 0 && <p className="text-center text-sm text-muted-foreground py-6">No stores yet</p>}
          </div>
        </div>

        {/* Team Roles */}
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
