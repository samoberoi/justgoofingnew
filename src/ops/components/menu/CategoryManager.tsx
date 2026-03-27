import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plus, GripVertical, Pencil, Trash2, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react';

const inputClass = 'w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-secondary transition-colors';
const labelClass = 'text-xs font-medium text-muted-foreground mb-1 block';

interface Category {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
}

interface Props {
  categories: Category[];
  onRefresh: () => void;
}

const CategoryManager = ({ categories, onRefresh }: Props) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', image_url: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const resetForm = () => { setForm({ name: '', description: '', image_url: '' }); setEditingId(null); setShowForm(false); };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({ name: cat.name, description: cat.description || '', image_url: cat.image_url || '' });
    setShowForm(true);
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `categories/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('menu-images').upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from('menu-images').getPublicUrl(path);
      setForm(p => ({ ...p, image_url: data.publicUrl }));
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      image_url: form.image_url || null,
    };
    if (editingId) {
      await supabase.from('menu_categories').update(payload).eq('id', editingId);
    } else {
      const maxOrder = categories.length > 0 ? Math.max(...categories.map(c => c.display_order)) + 1 : 0;
      await supabase.from('menu_categories').insert({ ...payload, display_order: maxOrder });
    }
    resetForm();
    onRefresh();
    setSaving(false);
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('menu_categories').update({ is_active: !current }).eq('id', id);
    onRefresh();
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Delete this category? Items will become uncategorized.')) return;
    await supabase.from('menu_categories').delete().eq('id', id);
    onRefresh();
  };

  const moveCategory = async (id: string, direction: 'up' | 'down') => {
    const sorted = [...categories].sort((a, b) => a.display_order - b.display_order);
    const idx = sorted.findIndex(c => c.id === id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const updates = [
      supabase.from('menu_categories').update({ display_order: sorted[swapIdx].display_order }).eq('id', sorted[idx].id),
      supabase.from('menu_categories').update({ display_order: sorted[idx].display_order }).eq('id', sorted[swapIdx].id),
    ];
    await Promise.all(updates);
    onRefresh();
  };

  const sorted = [...categories].sort((a, b) => a.display_order - b.display_order);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-heading text-foreground">Categories</h3>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-1 px-3 py-1.5 bg-gradient-saffron rounded-lg text-xs font-medium text-primary-foreground">
          <Plus size={14} /> Add
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 mb-4 space-y-3">
          <p className="font-heading text-sm text-foreground">{editingId ? 'Edit' : 'New'} Category</p>
          <div>
            <label className={labelClass}>Name *</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Biryanis, Starters" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Short description" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Image</label>
            {form.image_url && <img src={form.image_url} className="w-16 h-16 rounded-lg object-cover mb-2" />}
            <input type="file" accept="image/*" className="text-xs text-muted-foreground" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
            {uploading && <p className="text-[10px] text-secondary mt-1">Uploading...</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={resetForm} className="flex-1 py-2.5 border border-border rounded-lg text-xs font-medium text-muted-foreground">Cancel</button>
            <button onClick={handleSave} disabled={!form.name.trim() || saving} className="flex-1 py-2.5 bg-gradient-saffron rounded-lg text-xs font-medium text-primary-foreground disabled:opacity-40">
              {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {sorted.map((cat, idx) => (
          <div key={cat.id} className={`bg-card border border-border rounded-lg p-3 flex items-center justify-between ${!cat.is_active ? 'opacity-50' : ''}`}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex flex-col gap-0.5">
                <button onClick={() => moveCategory(cat.id, 'up')} disabled={idx === 0} className="text-muted-foreground disabled:opacity-20"><ChevronUp size={14} /></button>
                <button onClick={() => moveCategory(cat.id, 'down')} disabled={idx === sorted.length - 1} className="text-muted-foreground disabled:opacity-20"><ChevronDown size={14} /></button>
              </div>
              {cat.image_url ? (
                <img src={cat.image_url} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0"><ImageIcon size={16} className="text-muted-foreground" /></div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{cat.name}</p>
                {cat.description && <p className="text-[10px] text-muted-foreground truncate">{cat.description}</p>}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => toggleActive(cat.id, cat.is_active)} className={`px-2 py-1 rounded text-[10px] font-medium ${cat.is_active ? 'bg-green-500/15 text-green-400' : 'bg-muted text-muted-foreground'}`}>
                {cat.is_active ? 'Active' : 'Off'}
              </button>
              <button onClick={() => startEdit(cat)} className="p-1.5 text-muted-foreground hover:text-foreground"><Pencil size={13} /></button>
              <button onClick={() => deleteCategory(cat.id)} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
        {categories.length === 0 && <p className="text-center text-sm text-muted-foreground py-6">No categories yet</p>}
      </div>
    </div>
  );
};

export default CategoryManager;
