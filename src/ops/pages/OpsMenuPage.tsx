import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import OpsBottomNav from '../components/OpsBottomNav';
import { useAuth } from '../hooks/useAuth';
import { Plus, Edit, ToggleLeft, ToggleRight, Leaf, Drumstick } from 'lucide-react';

const OpsMenuPage = () => {
  const { role } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', category: '', is_veg: false, is_available: true });

  useEffect(() => { fetchMenu(); }, []);

  const fetchMenu = async () => {
    const { data } = await supabase.from('menu_items').select('*').order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  const toggleAvailability = async (id: string, current: boolean) => {
    await supabase.from('menu_items').update({ is_available: !current }).eq('id', id);
    fetchMenu();
  };

  const handleSave = async () => {
    const payload = {
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      category: form.category,
      is_veg: form.is_veg,
      is_available: form.is_available,
    };
    if (editItem) {
      await supabase.from('menu_items').update(payload).eq('id', editItem.id);
    } else {
      await supabase.from('menu_items').insert(payload);
    }
    setShowForm(false);
    setEditItem(null);
    setForm({ name: '', description: '', price: '', category: '', is_veg: false, is_available: true });
    fetchMenu();
  };

  const startEdit = (item: any) => {
    setEditItem(item);
    setForm({
      name: item.name,
      description: item.description || '',
      price: String(item.price),
      category: item.category || '',
      is_veg: item.is_veg,
      is_available: item.is_available,
    });
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="font-heading text-lg text-gradient-gold">Menu</h1>
        {role === 'super_admin' && (
          <button
            onClick={() => { setShowForm(true); setEditItem(null); setForm({ name: '', description: '', price: '', category: '', is_veg: false, is_available: true }); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-saffron rounded-lg text-xs font-medium text-primary-foreground"
          >
            <Plus size={14} /> Add Item
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="px-4 py-4 border-b border-border bg-card">
          <div className="space-y-3">
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Item name" className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-secondary" />
            <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Description" className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-secondary" />
            <div className="flex gap-3">
              <input value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="Price" type="number" className="flex-1 px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-secondary" />
              <input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="Category" className="flex-1 px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-secondary" />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={form.is_veg} onChange={e => setForm(p => ({ ...p, is_veg: e.target.checked }))} className="rounded" />
                Vegetarian
              </label>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} className="flex-1 py-2.5 bg-gradient-saffron rounded-lg text-xs font-medium text-primary-foreground">{editItem ? 'Update' : 'Add'} Item</button>
              <button onClick={() => { setShowForm(false); setEditItem(null); }} className="px-4 py-2.5 bg-muted text-muted-foreground rounded-lg text-xs font-medium">Cancel</button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="px-4 py-4 space-y-2">
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-card border border-border rounded-lg animate-pulse" />)}</div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground"><p className="text-sm">No menu items yet</p></div>
        ) : (
          items.map(item => (
            <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-lg p-3 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {item.is_veg ? <Leaf size={14} className="text-green-400" /> : <Drumstick size={14} className="text-accent" />}
                  <span className="font-medium text-sm text-foreground">{item.name}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">₹{Number(item.price)} • {item.category || 'Uncategorized'}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleAvailability(item.id, item.is_available)} className="p-1.5">
                  {item.is_available ? <ToggleRight size={22} className="text-green-400" /> : <ToggleLeft size={22} className="text-muted-foreground" />}
                </button>
                {role === 'super_admin' && (
                  <button onClick={() => startEdit(item)} className="p-1.5"><Edit size={16} className="text-muted-foreground" /></button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      <OpsBottomNav />
    </div>
  );
};

export default OpsMenuPage;
