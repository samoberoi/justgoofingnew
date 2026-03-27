import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import OpsBottomNav from '../components/OpsBottomNav';
import { useAuth } from '../hooks/useAuth';
import CategoryManager from '../components/menu/CategoryManager';
import AddonManager from '../components/menu/AddonManager';
import MenuItemCard from '../components/menu/MenuItemCard';
import ItemFormModal from '../components/menu/ItemFormModal';
import BulkActions from '../components/menu/BulkActions';
import { Plus, Search, Filter, CheckSquare, X, BarChart3, Leaf, Drumstick } from 'lucide-react';

type Tab = 'items' | 'categories' | 'addons' | 'analytics';

const OpsMenuPage = () => {
  const { role } = useAuth();
  const [tab, setTab] = useState<Tab>('items');
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [addonGroups, setAddonGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterVeg, setFilterVeg] = useState<'all' | 'veg' | 'nonveg'>('all');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);

  const fetchAll = useCallback(async () => {
    const [itemsRes, catsRes, addonsRes] = await Promise.all([
      supabase.from('menu_items').select('*').order('display_order').order('created_at', { ascending: false }),
      supabase.from('menu_categories').select('*').order('display_order'),
      supabase.from('menu_addon_groups').select('*').order('created_at'),
    ]);
    setItems(itemsRes.data || []);
    setCategories(catsRes.data || []);
    setAddonGroups(addonsRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase.channel('menu-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_categories' }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAll]);

  const toggleAvailability = async (id: string, current: boolean) => {
    await supabase.from('menu_items').update({ is_available: !current }).eq('id', id);
  };

  const loadAnalytics = async () => {
    // Fetch basic order analytics per menu item
    const { data } = await supabase.from('order_items').select('menu_item_id, quantity, price');
    const map = new Map<string, { orders: number; revenue: number }>();
    (data || []).forEach(oi => {
      if (!oi.menu_item_id) return;
      const existing = map.get(oi.menu_item_id) || { orders: 0, revenue: 0 };
      existing.orders += oi.quantity;
      existing.revenue += Number(oi.price) * oi.quantity;
      map.set(oi.menu_item_id, existing);
    });
    setAnalytics(Array.from(map.entries()).map(([id, stats]) => ({
      item: items.find(i => i.id === id),
      ...stats,
    })).filter(a => a.item).sort((a, b) => b.revenue - a.revenue));
  };

  useEffect(() => { if (tab === 'analytics') loadAnalytics(); }, [tab, items]);

  const toggleSelect = (id: string) => {
    setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  };

  // Filter items
  const filteredItems = items.filter(item => {
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterCategory && item.category_id !== filterCategory) return false;
    if (filterVeg === 'veg' && !item.is_veg) return false;
    if (filterVeg === 'nonveg' && item.is_veg) return false;
    return true;
  });

  // Group by category
  const grouped = new Map<string, any[]>();
  const uncategorized: any[] = [];
  filteredItems.forEach(item => {
    if (item.category_id) {
      const list = grouped.get(item.category_id) || [];
      list.push(item);
      grouped.set(item.category_id, list);
    } else {
      uncategorized.push(item);
    }
  });

  const TABS: { key: Tab; label: string }[] = [
    { key: 'items', label: 'Items' },
    { key: 'categories', label: 'Categories' },
    { key: 'addons', label: 'Add-ons' },
    { key: 'analytics', label: 'Analytics' },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="font-heading text-lg text-gradient-gold">Menu</h1>
          <div className="flex items-center gap-2">
            {tab === 'items' && role === 'super_admin' && (
              <>
                <button onClick={() => { setSelectionMode(!selectionMode); setSelectedIds([]); }}
                  className={`p-2 rounded-lg text-xs ${selectionMode ? 'bg-secondary/20 text-secondary' : 'text-muted-foreground'}`}>
                  {selectionMode ? <X size={16} /> : <CheckSquare size={16} />}
                </button>
                <button onClick={() => { setEditItem(null); setShowItemForm(true); }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gradient-saffron rounded-lg text-xs font-medium text-primary-foreground">
                  <Plus size={14} /> Add Item
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 flex gap-1 pb-2">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${tab === t.key ? 'bg-secondary/20 text-secondary' : 'text-muted-foreground'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Search + Filter (items tab only) */}
        {tab === 'items' && (
          <div className="px-4 pb-3 space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search items..."
                className="w-full pl-9 pr-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-secondary" />
            </div>
            <div className="flex gap-2">
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-muted border border-border rounded-lg text-xs text-foreground">
                <option value="">All Categories</option>
                {categories.filter(c => c.is_active).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className="flex rounded-lg border border-border overflow-hidden">
                {[
                  { key: 'all' as const, label: 'All' },
                  { key: 'veg' as const, icon: <Leaf size={12} /> },
                  { key: 'nonveg' as const, icon: <Drumstick size={12} /> },
                ].map(f => (
                  <button key={f.key} onClick={() => setFilterVeg(f.key)}
                    className={`px-3 py-1.5 text-[10px] font-medium flex items-center gap-1 ${filterVeg === f.key ? 'bg-secondary/20 text-secondary' : 'text-muted-foreground'}`}>
                    {f.icon || f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {tab === 'items' && (
          <>
            {selectionMode && (
              <BulkActions selectedIds={selectedIds} categories={categories} onDone={() => { setSelectionMode(false); setSelectedIds([]); fetchAll(); }} />
            )}

            {loading ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-card border border-border rounded-lg animate-pulse" />)}</div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground"><p className="text-sm">No menu items found</p></div>
            ) : (
              <div className="space-y-4">
                {/* Grouped by category */}
                {categories.filter(c => c.is_active && grouped.has(c.id)).sort((a, b) => a.display_order - b.display_order).map(cat => (
                  <div key={cat.id}>
                    <div className="flex items-center gap-2 mb-2">
                      {cat.image_url && <img src={cat.image_url} className="w-6 h-6 rounded object-cover" />}
                      <h3 className="text-xs font-heading text-secondary uppercase tracking-wider">{cat.name}</h3>
                      <span className="text-[10px] text-muted-foreground">({grouped.get(cat.id)?.length})</span>
                    </div>
                    <div className="space-y-1.5">
                      {grouped.get(cat.id)?.map(item => (
                        <MenuItemCard key={item.id} item={item} isSelected={selectedIds.includes(item.id)} selectionMode={selectionMode}
                          onToggleAvailability={toggleAvailability} onEdit={i => { setEditItem(i); setShowItemForm(true); }} onSelect={toggleSelect} role={role || ''} />
                      ))}
                    </div>
                  </div>
                ))}

                {/* Uncategorized */}
                {uncategorized.length > 0 && (
                  <div>
                    <h3 className="text-xs font-heading text-muted-foreground uppercase tracking-wider mb-2">Uncategorized</h3>
                    <div className="space-y-1.5">
                      {uncategorized.map(item => (
                        <MenuItemCard key={item.id} item={item} isSelected={selectedIds.includes(item.id)} selectionMode={selectionMode}
                          onToggleAvailability={toggleAvailability} onEdit={i => { setEditItem(i); setShowItemForm(true); }} onSelect={toggleSelect} role={role || ''} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {tab === 'categories' && role === 'super_admin' && (
          <CategoryManager categories={categories} onRefresh={fetchAll} />
        )}

        {tab === 'addons' && role === 'super_admin' && (
          <AddonManager onRefresh={fetchAll} />
        )}

        {tab === 'analytics' && (
          <div>
            <h3 className="text-sm font-heading text-foreground mb-3 flex items-center gap-2"><BarChart3 size={16} /> Menu Performance</h3>
            {analytics.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">No order data yet</p>
            ) : (
              <div className="space-y-2">
                {analytics.map((a, idx) => (
                  <div key={a.item.id} className="bg-card border border-border rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-muted-foreground w-5">#{idx + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{a.item.name}</p>
                        <p className="text-[10px] text-muted-foreground">{a.orders} orders</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-secondary">₹{a.revenue.toLocaleString('en-IN')}</p>
                      <p className="text-[10px] text-muted-foreground">revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Item Form Modal */}
      {showItemForm && (
        <ItemFormModal
          item={editItem}
          categories={categories.filter(c => c.is_active)}
          addonGroups={addonGroups}
          onClose={() => { setShowItemForm(false); setEditItem(null); }}
          onSaved={() => { setShowItemForm(false); setEditItem(null); fetchAll(); }}
        />
      )}

      <OpsBottomNav />
    </div>
  );
};

export default OpsMenuPage;
