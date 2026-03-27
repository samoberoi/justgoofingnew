import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CheckSquare, ToggleRight, ToggleLeft, IndianRupee, FolderInput } from 'lucide-react';

const inputClass = 'w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-secondary transition-colors';

interface Props {
  selectedIds: string[];
  categories: { id: string; name: string }[];
  onDone: () => void;
}

const BulkActions = ({ selectedIds, categories, onDone }: Props) => {
  const [action, setAction] = useState<'enable' | 'disable' | 'price' | 'category' | null>(null);
  const [priceAdjust, setPriceAdjust] = useState('');
  const [priceMode, setPriceMode] = useState<'set' | 'increase' | 'decrease'>('set');
  const [categoryId, setCategoryId] = useState('');
  const [applying, setApplying] = useState(false);

  if (selectedIds.length === 0) return null;

  const apply = async () => {
    setApplying(true);
    if (action === 'enable') {
      await supabase.from('menu_items').update({ is_available: true }).in('id', selectedIds);
    } else if (action === 'disable') {
      await supabase.from('menu_items').update({ is_available: false }).in('id', selectedIds);
    } else if (action === 'price' && priceAdjust) {
      const val = parseFloat(priceAdjust);
      if (priceMode === 'set') {
        await supabase.from('menu_items').update({ price: val, base_price: val }).in('id', selectedIds);
      } else {
        // Need to fetch current prices and update individually
        const { data: items } = await supabase.from('menu_items').select('id, price').in('id', selectedIds);
        if (items) {
          await Promise.all(items.map(item => {
            const newPrice = priceMode === 'increase' ? Number(item.price) + val : Math.max(0, Number(item.price) - val);
            return supabase.from('menu_items').update({ price: newPrice, base_price: newPrice }).eq('id', item.id);
          }));
        }
      }
    } else if (action === 'category' && categoryId) {
      const cat = categories.find(c => c.id === categoryId);
      await supabase.from('menu_items').update({ category_id: categoryId, category: cat?.name || null }).in('id', selectedIds);
    }
    setApplying(false);
    setAction(null);
    onDone();
  };

  return (
    <div className="bg-card border border-secondary/30 rounded-xl p-3 mb-3">
      <div className="flex items-center gap-2 mb-2">
        <CheckSquare size={14} className="text-secondary" />
        <span className="text-xs font-medium text-secondary">{selectedIds.length} items selected</span>
      </div>

      {!action ? (
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setAction('enable')} className="flex items-center gap-1.5 px-3 py-2 bg-green-500/10 text-green-400 rounded-lg text-xs font-medium">
            <ToggleRight size={14} /> Enable All
          </button>
          <button onClick={() => setAction('disable')} className="flex items-center gap-1.5 px-3 py-2 bg-destructive/10 text-destructive rounded-lg text-xs font-medium">
            <ToggleLeft size={14} /> Disable All
          </button>
          <button onClick={() => setAction('price')} className="flex items-center gap-1.5 px-3 py-2 bg-secondary/10 text-secondary rounded-lg text-xs font-medium">
            <IndianRupee size={14} /> Update Price
          </button>
          <button onClick={() => setAction('category')} className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-medium">
            <FolderInput size={14} /> Move Category
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {(action === 'enable' || action === 'disable') && (
            <p className="text-xs text-foreground">
              {action === 'enable' ? 'Enable' : 'Disable'} {selectedIds.length} items?
            </p>
          )}
          {action === 'price' && (
            <div className="space-y-2">
              <div className="flex gap-1.5">
                {(['set', 'increase', 'decrease'] as const).map(m => (
                  <button key={m} onClick={() => setPriceMode(m)} className={`flex-1 py-1.5 rounded text-[10px] font-medium ${priceMode === m ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
              <input type="number" value={priceAdjust} onChange={e => setPriceAdjust(e.target.value)} placeholder={`₹ Amount to ${priceMode}`} className={inputClass} />
            </div>
          )}
          {action === 'category' && (
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={inputClass}>
              <option value="">Select category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          <div className="flex gap-2">
            <button onClick={() => setAction(null)} className="flex-1 py-2 border border-border rounded-lg text-xs font-medium text-muted-foreground">Cancel</button>
            <button onClick={apply} disabled={applying || (action === 'price' && !priceAdjust) || (action === 'category' && !categoryId)} className="flex-1 py-2 bg-gradient-saffron rounded-lg text-xs font-medium text-primary-foreground disabled:opacity-40">
              {applying ? 'Applying...' : 'Apply'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkActions;
