import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

const inputClass = 'w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-secondary transition-colors';
const labelClass = 'text-xs font-medium text-muted-foreground mb-1 block';

interface AddonGroup {
  id: string;
  name: string;
  min_selections: number;
  max_selections: number;
  is_active: boolean;
  addons?: Addon[];
}

interface Addon {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
  display_order: number;
}

interface Props {
  onRefresh: () => void;
}

const AddonManager = ({ onRefresh }: Props) => {
  const [groups, setGroups] = useState<AddonGroup[]>([]);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupForm, setGroupForm] = useState({ name: '', min_selections: '0', max_selections: '5' });
  const [addonForm, setAddonForm] = useState({ name: '', price: '' });
  const [addingToGroup, setAddingToGroup] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchGroups(); }, []);

  const fetchGroups = async () => {
    const { data: groupsData } = await supabase.from('menu_addon_groups').select('*').order('created_at');
    if (!groupsData) return;

    const { data: addonsData } = await supabase.from('menu_addons').select('*').order('display_order');
    const addonsByGroup = new Map<string, Addon[]>();
    (addonsData || []).forEach(a => {
      const list = addonsByGroup.get(a.group_id) || [];
      list.push(a);
      addonsByGroup.set(a.group_id, list);
    });

    setGroups(groupsData.map(g => ({ ...g, addons: addonsByGroup.get(g.id) || [] })));
  };

  const resetGroupForm = () => { setGroupForm({ name: '', min_selections: '0', max_selections: '5' }); setEditingGroupId(null); setShowGroupForm(false); };

  const startEditGroup = (g: AddonGroup) => {
    setEditingGroupId(g.id);
    setGroupForm({ name: g.name, min_selections: g.min_selections.toString(), max_selections: g.max_selections.toString() });
    setShowGroupForm(true);
  };

  const saveGroup = async () => {
    if (!groupForm.name.trim()) return;
    setSaving(true);
    const payload = {
      name: groupForm.name.trim(),
      min_selections: parseInt(groupForm.min_selections) || 0,
      max_selections: parseInt(groupForm.max_selections) || 5,
    };
    if (editingGroupId) {
      await supabase.from('menu_addon_groups').update(payload).eq('id', editingGroupId);
    } else {
      await supabase.from('menu_addon_groups').insert(payload);
    }
    resetGroupForm();
    fetchGroups();
    onRefresh();
    setSaving(false);
  };

  const deleteGroup = async (id: string) => {
    if (!confirm('Delete this add-on group and all its add-ons?')) return;
    await supabase.from('menu_addon_groups').delete().eq('id', id);
    fetchGroups();
    onRefresh();
  };

  const saveAddon = async (groupId: string) => {
    if (!addonForm.name.trim()) return;
    setSaving(true);
    await supabase.from('menu_addons').insert({
      group_id: groupId,
      name: addonForm.name.trim(),
      price: parseFloat(addonForm.price) || 0,
    });
    setAddonForm({ name: '', price: '' });
    setAddingToGroup(null);
    fetchGroups();
    setSaving(false);
  };

  const deleteAddon = async (id: string) => {
    await supabase.from('menu_addons').delete().eq('id', id);
    fetchGroups();
  };

  const toggleAddonActive = async (id: string, current: boolean) => {
    await supabase.from('menu_addons').update({ is_active: !current }).eq('id', id);
    fetchGroups();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-heading text-foreground">Add-on Groups</h3>
        <button onClick={() => { resetGroupForm(); setShowGroupForm(true); }} className="flex items-center gap-1 px-3 py-1.5 bg-gradient-saffron rounded-lg text-xs font-medium text-primary-foreground">
          <Plus size={14} /> New Group
        </button>
      </div>

      {showGroupForm && (
        <div className="bg-card border border-border rounded-xl p-4 mb-4 space-y-3">
          <p className="font-heading text-sm text-foreground">{editingGroupId ? 'Edit' : 'New'} Add-on Group</p>
          <div>
            <label className={labelClass}>Group Name *</label>
            <input value={groupForm.name} onChange={e => setGroupForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Extras, Beverages, Sides" className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Min Selections</label>
              <input type="number" value={groupForm.min_selections} onChange={e => setGroupForm(p => ({ ...p, min_selections: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Max Selections</label>
              <input type="number" value={groupForm.max_selections} onChange={e => setGroupForm(p => ({ ...p, max_selections: e.target.value }))} className={inputClass} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={resetGroupForm} className="flex-1 py-2.5 border border-border rounded-lg text-xs font-medium text-muted-foreground">Cancel</button>
            <button onClick={saveGroup} disabled={!groupForm.name.trim() || saving} className="flex-1 py-2.5 bg-gradient-saffron rounded-lg text-xs font-medium text-primary-foreground disabled:opacity-40">
              {saving ? 'Saving...' : editingGroupId ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {groups.map(g => (
          <div key={g.id} className="bg-card border border-border rounded-xl overflow-hidden">
            <button onClick={() => setExpandedGroup(expandedGroup === g.id ? null : g.id)} className="w-full p-3 flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">{g.name}</p>
                <p className="text-[10px] text-muted-foreground">Min: {g.min_selections} • Max: {g.max_selections} • {g.addons?.length || 0} items</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={e => { e.stopPropagation(); startEditGroup(g); }} className="p-1.5 text-muted-foreground"><Pencil size={13} /></button>
                <button onClick={e => { e.stopPropagation(); deleteGroup(g.id); }} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 size={13} /></button>
                {expandedGroup === g.id ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
              </div>
            </button>

            {expandedGroup === g.id && (
              <div className="px-3 pb-3 border-t border-border pt-3 space-y-2">
                {g.addons?.map(a => (
                  <div key={a.id} className="flex items-center justify-between py-1.5 px-2 bg-muted rounded-lg">
                    <div>
                      <span className="text-xs font-medium text-foreground">{a.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">₹{a.price}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => toggleAddonActive(a.id, a.is_active)} className={`text-[10px] px-1.5 py-0.5 rounded ${a.is_active ? 'text-green-400' : 'text-muted-foreground'}`}>
                        {a.is_active ? 'On' : 'Off'}
                      </button>
                      <button onClick={() => deleteAddon(a.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))}

                {addingToGroup === g.id ? (
                  <div className="flex gap-2 items-end">
                    <input value={addonForm.name} onChange={e => setAddonForm(p => ({ ...p, name: e.target.value }))} placeholder="Add-on name" className={inputClass + ' flex-1'} />
                    <input type="number" value={addonForm.price} onChange={e => setAddonForm(p => ({ ...p, price: e.target.value }))} placeholder="₹" className={inputClass + ' w-20'} />
                    <button onClick={() => saveAddon(g.id)} disabled={!addonForm.name.trim()} className="px-3 py-2.5 bg-gradient-saffron rounded-lg text-xs font-medium text-primary-foreground disabled:opacity-40">Add</button>
                  </div>
                ) : (
                  <button onClick={() => { setAddingToGroup(g.id); setAddonForm({ name: '', price: '' }); }} className="w-full py-2 border border-dashed border-border rounded-lg text-xs text-muted-foreground flex items-center justify-center gap-1 hover:border-secondary hover:text-secondary transition-colors">
                    <Plus size={12} /> Add Item
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        {groups.length === 0 && <p className="text-center text-sm text-muted-foreground py-6">No add-on groups yet</p>}
      </div>
    </div>
  );
};

export default AddonManager;
