import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Store, Check, X, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface StoreMenuMappingProps {
  items: any[];
  onRefresh: () => void;
}

const StoreMenuMapping = ({ items, onRefresh }: StoreMenuMappingProps) => {
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [overrides, setOverrides] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchStores = useCallback(async () => {
    const { data } = await supabase.from('stores').select('*').eq('is_active', true).order('name');
    setStores(data || []);
    if (data && data.length > 0 && !selectedStore) {
      setSelectedStore(data[0].id);
    }
    setLoading(false);
  }, [selectedStore]);

  useEffect(() => { fetchStores(); }, [fetchStores]);

  // Fetch overrides for selected store
  useEffect(() => {
    if (!selectedStore) return;
    const fetchOverrides = async () => {
      const { data } = await supabase
        .from('menu_store_overrides')
        .select('*')
        .eq('store_id', selectedStore);
      const map = new Map<string, any>();
      (data || []).forEach((o: any) => map.set(o.menu_item_id, o));
      setOverrides(map);
    };
    fetchOverrides();
  }, [selectedStore]);

  const toggleItemForStore = async (itemId: string) => {
    setSaving(itemId);
    const existing = overrides.get(itemId);

    if (existing) {
      // Toggle availability
      await supabase
        .from('menu_store_overrides')
        .update({ is_available: !existing.is_available })
        .eq('id', existing.id);
      setOverrides(prev => {
        const next = new Map(prev);
        next.set(itemId, { ...existing, is_available: !existing.is_available });
        return next;
      });
    } else {
      // Create override — item is now explicitly available at this store
      const { data } = await supabase
        .from('menu_store_overrides')
        .insert({ menu_item_id: itemId, store_id: selectedStore, is_available: true })
        .select()
        .maybeSingle();
      if (data) {
        setOverrides(prev => {
          const next = new Map(prev);
          next.set(itemId, data);
          return next;
        });
      }
    }
    setSaving(null);
  };

  const isItemAvailable = (itemId: string) => {
    const override = overrides.get(itemId);
    if (!override) return false; // No override = not mapped to this store
    return override.is_available;
  };

  const availableCount = items.filter(i => isItemAvailable(i.id)).length;

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-secondary" size={24} /></div>;
  }

  if (stores.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Store size={40} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm">No active stores found</p>
        <p className="text-xs mt-1">Create stores in Settings first</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Store selector */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Select Store</label>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {stores.map(store => (
            <button
              key={store.id}
              onClick={() => setSelectedStore(store.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap border transition-colors ${
                selectedStore === store.id
                  ? 'bg-secondary/20 border-secondary/40 text-secondary'
                  : 'bg-card border-border text-muted-foreground'
              }`}
            >
              <Store size={14} />
              {store.name}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-card border border-border rounded-xl p-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {availableCount} of {items.length} items mapped to this store
        </span>
        <span className="text-xs font-heading text-secondary">{Math.round((availableCount / Math.max(items.length, 1)) * 100)}%</span>
      </div>

      {/* Items list */}
      <div className="space-y-1.5">
        {items.map((item, idx) => {
          const available = isItemAvailable(item.id);
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.02 }}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                available ? 'bg-card border-secondary/20' : 'bg-muted/30 border-border'
              }`}
            >
              <button
                onClick={() => toggleItemForStore(item.id)}
                disabled={saving === item.id}
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  available ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'
                }`}
              >
                {saving === item.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : available ? (
                  <Check size={14} />
                ) : (
                  <X size={14} />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-1 py-0.5 rounded font-semibold border ${
                    item.is_veg ? 'text-green-600 border-green-600 bg-green-600/10' : 'text-red-600 border-red-600 bg-red-600/10'
                  }`}>
                    {item.is_veg ? 'V' : 'NV'}
                  </span>
                  <p className={`text-sm font-medium truncate ${available ? 'text-foreground' : 'text-muted-foreground'}`}>{item.name}</p>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">₹{item.price}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default StoreMenuMapping;
