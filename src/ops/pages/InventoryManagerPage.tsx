import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import OpsBottomNav from '../components/OpsBottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import {
  Search, Plus, Trash2, Package, AlertTriangle, ArrowLeft,
  TrendingDown, TrendingUp, BarChart3, Boxes, ArrowUpDown,
  Phone, User, StickyNote, Edit, PackagePlus, PackageMinus,
  History, ChevronRight
} from 'lucide-react';

interface InventoryCategory {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
}

interface InventoryItem {
  id: string;
  name: string;
  category_id: string | null;
  unit: string;
  current_stock: number;
  min_stock_level: number;
  max_stock_level: number | null;
  cost_per_unit: number;
  supplier_name: string | null;
  supplier_phone: string | null;
  notes: string | null;
  is_active: boolean;
}

interface InventoryTransaction {
  id: string;
  inventory_item_id: string;
  type: string;
  quantity: number;
  unit_cost: number | null;
  total_cost: number | null;
  reference_note: string | null;
  stock_after: number;
  created_at: string;
}

const UNITS = ['kg', 'grams', 'litres', 'ml', 'pieces', 'packets', 'boxes', 'dozen', 'nos'];
const TRANSACTION_TYPES = [
  { value: 'received', label: 'Stock Received', icon: PackagePlus, color: 'text-green-500' },
  { value: 'consumed', label: 'Consumed', icon: PackageMinus, color: 'text-orange-500' },
  { value: 'wastage', label: 'Wastage', icon: Trash2, color: 'text-destructive' },
  { value: 'adjusted', label: 'Adjustment', icon: ArrowUpDown, color: 'text-blue-500' },
];

type ViewMode = 'list' | 'dashboard' | 'editor' | 'transactions';

const InventoryManagerPage = () => {
  const { role } = useAuth();
  const isReadOnly = role === 'store_manager' || role === 'kitchen_manager';

  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStock, setFilterStock] = useState<string>('all'); // all | low | out

  // Editor state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editItem, setEditItem] = useState<Partial<InventoryItem>>({});
  const [saving, setSaving] = useState(false);

  // Transaction state
  const [txDialogOpen, setTxDialogOpen] = useState(false);
  const [txItem, setTxItem] = useState<InventoryItem | null>(null);
  const [txType, setTxType] = useState('received');
  const [txQty, setTxQty] = useState<number>(0);
  const [txUnitCost, setTxUnitCost] = useState<number>(0);
  const [txNote, setTxNote] = useState('');
  const [txSaving, setTxSaving] = useState(false);

  // History state
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const [catsRes, itemsRes] = await Promise.all([
      supabase.from('inventory_categories').select('*').eq('is_active', true).order('display_order'),
      supabase.from('inventory_items').select('*').eq('is_active', true).order('name'),
    ]);
    setCategories((catsRes.data as any[]) || []);
    setItems((itemsRes.data as any[]) || []);
    setLoading(false);
  };

  // Dashboard stats
  const dashStats = useMemo(() => {
    const totalItems = items.length;
    const totalCategories = new Set(items.map(i => i.category_id).filter(Boolean)).size;
    const lowStock = items.filter(i => i.current_stock > 0 && i.current_stock <= i.min_stock_level);
    const outOfStock = items.filter(i => i.current_stock <= 0);
    const totalValue = items.reduce((s, i) => s + (i.current_stock * i.cost_per_unit), 0);
    const sorted = [...items].sort((a, b) => a.current_stock - b.current_stock);
    const lowestStock = sorted.slice(0, 5);
    const highestStock = sorted.slice(-5).reverse();

    // Category-wise breakdown
    const catBreakdown = categories.map(cat => {
      const catItems = items.filter(i => i.category_id === cat.id);
      return {
        ...cat,
        itemCount: catItems.length,
        lowCount: catItems.filter(i => i.current_stock > 0 && i.current_stock <= i.min_stock_level).length,
        outCount: catItems.filter(i => i.current_stock <= 0).length,
        totalValue: catItems.reduce((s, i) => s + (i.current_stock * i.cost_per_unit), 0),
      };
    }).filter(c => c.itemCount > 0);

    return { totalItems, totalCategories, lowStock, outOfStock, totalValue, lowestStock, highestStock, catBreakdown };
  }, [items, categories]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCategory !== 'all' && item.category_id !== filterCategory) return false;
      if (filterStock === 'low' && !(item.current_stock > 0 && item.current_stock <= item.min_stock_level)) return false;
      if (filterStock === 'out' && item.current_stock > 0) return false;
      return true;
    });
  }, [items, search, filterCategory, filterStock]);

  const getCategoryName = (id: string | null) => categories.find(c => c.id === id)?.name || 'Uncategorized';

  const openEditor = (item?: InventoryItem) => {
    setEditItem(item || { unit: 'kg', current_stock: 0, min_stock_level: 0, cost_per_unit: 0, is_active: true });
    setViewMode('editor');
  };

  const saveItem = async () => {
    if (!editItem.name?.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (editItem.id) {
        await supabase.from('inventory_items').update({
          name: editItem.name,
          category_id: editItem.category_id || null,
          unit: editItem.unit || 'kg',
          min_stock_level: editItem.min_stock_level || 0,
          max_stock_level: editItem.max_stock_level || null,
          cost_per_unit: editItem.cost_per_unit || 0,
          supplier_name: editItem.supplier_name || null,
          supplier_phone: editItem.supplier_phone || null,
          notes: editItem.notes || null,
        } as any).eq('id', editItem.id);
      } else {
        await supabase.from('inventory_items').insert({
          name: editItem.name,
          category_id: editItem.category_id || null,
          unit: editItem.unit || 'kg',
          current_stock: editItem.current_stock || 0,
          min_stock_level: editItem.min_stock_level || 0,
          max_stock_level: editItem.max_stock_level || null,
          cost_per_unit: editItem.cost_per_unit || 0,
          supplier_name: editItem.supplier_name || null,
          supplier_phone: editItem.supplier_phone || null,
          notes: editItem.notes || null,
        } as any);
      }
      toast.success(editItem.id ? 'Item updated!' : 'Item added!');
      setViewMode('list');
      fetchAll();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const deleteItem = async (id: string) => {
    await supabase.from('inventory_items').update({ is_active: false } as any).eq('id', id);
    toast.success('Item removed');
    fetchAll();
  };

  // Stock transaction
  const openTxDialog = (item: InventoryItem) => {
    setTxItem(item);
    setTxType('received');
    setTxQty(0);
    setTxUnitCost(item.cost_per_unit || 0);
    setTxNote('');
    setTxDialogOpen(true);
  };

  const saveTx = async () => {
    if (!txItem || txQty <= 0) { toast.error('Enter a valid quantity'); return; }
    setTxSaving(true);
    try {
      let newStock = txItem.current_stock;
      if (txType === 'received') newStock += txQty;
      else if (txType === 'consumed' || txType === 'wastage') newStock = Math.max(0, newStock - txQty);
      else newStock = txQty; // adjusted = set to exact value

      // Insert transaction
      await supabase.from('inventory_transactions').insert({
        inventory_item_id: txItem.id,
        type: txType,
        quantity: txQty,
        unit_cost: txUnitCost || null,
        total_cost: txQty * (txUnitCost || 0),
        reference_note: txNote || null,
        stock_after: newStock,
      } as any);

      // Update current stock
      await supabase.from('inventory_items').update({
        current_stock: newStock,
        cost_per_unit: txType === 'received' && txUnitCost > 0 ? txUnitCost : txItem.cost_per_unit,
      } as any).eq('id', txItem.id);

      toast.success(`Stock ${txType === 'received' ? 'added' : 'updated'}!`);
      setTxDialogOpen(false);
      fetchAll();
    } catch { toast.error('Failed to update stock'); }
    finally { setTxSaving(false); }
  };

  // Transaction history
  const openHistory = async (item: InventoryItem) => {
    setHistoryItem(item);
    const { data } = await supabase
      .from('inventory_transactions')
      .select('*')
      .eq('inventory_item_id', item.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setTransactions((data as any[]) || []);
    setViewMode('transactions');
  };

  const getStockBadge = (item: InventoryItem) => {
    if (item.current_stock <= 0) return <Badge variant="destructive" className="text-[9px] px-1.5 py-0">Out of Stock</Badge>;
    if (item.current_stock <= item.min_stock_level) return <Badge className="text-[9px] px-1.5 py-0 bg-yellow-500/20 text-yellow-600 border-yellow-500/30">Low Stock</Badge>;
    return <Badge variant="secondary" className="text-[9px] px-1.5 py-0">In Stock</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ===== EDITOR VIEW =====
  if (viewMode === 'editor') {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setViewMode('list')}><ArrowLeft size={20} className="text-foreground" /></button>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-foreground">{editItem.id ? 'Edit Item' : 'Add Item'}</h2>
              <p className="text-[11px] text-muted-foreground">Inventory Item</p>
            </div>
            {!isReadOnly && (
              <Button size="sm" onClick={saveItem} disabled={saving} className="bg-secondary text-secondary-foreground">
                {saving ? 'Saving…' : 'Save'}
              </Button>
            )}
          </div>
        </div>

        <div className="p-4 space-y-4">
          <Card className="p-4 space-y-3 bg-card border-border">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Details</h3>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">Item Name *</label>
              <Input value={editItem.name || ''} onChange={e => setEditItem(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Basmati Rice" disabled={isReadOnly} className="text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">Category</label>
                <Select value={editItem.category_id || 'none'} onValueChange={v => setEditItem(p => ({ ...p, category_id: v === 'none' ? null : v }))} disabled={isReadOnly}>
                  <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Category</SelectItem>
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">Unit</label>
                <Select value={editItem.unit || 'kg'} onValueChange={v => setEditItem(p => ({ ...p, unit: v }))} disabled={isReadOnly}>
                  <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">Min Stock Level</label>
                <Input type="number" value={editItem.min_stock_level || ''} onChange={e => setEditItem(p => ({ ...p, min_stock_level: Number(e.target.value) }))}
                  placeholder="5" disabled={isReadOnly} className="text-sm" />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">Max Stock</label>
                <Input type="number" value={editItem.max_stock_level || ''} onChange={e => setEditItem(p => ({ ...p, max_stock_level: Number(e.target.value) || null }))}
                  placeholder="100" disabled={isReadOnly} className="text-sm" />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">Cost/Unit (₹)</label>
                <Input type="number" value={editItem.cost_per_unit || ''} onChange={e => setEditItem(p => ({ ...p, cost_per_unit: Number(e.target.value) }))}
                  placeholder="0" disabled={isReadOnly} className="text-sm" />
              </div>
            </div>
          </Card>

          <Card className="p-4 space-y-3 bg-card border-border">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Supplier Info</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">Supplier Name</label>
                <Input value={editItem.supplier_name || ''} onChange={e => setEditItem(p => ({ ...p, supplier_name: e.target.value }))}
                  placeholder="Vendor name" disabled={isReadOnly} className="text-sm" />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">Supplier Phone</label>
                <Input value={editItem.supplier_phone || ''} onChange={e => setEditItem(p => ({ ...p, supplier_phone: e.target.value }))}
                  placeholder="+91..." disabled={isReadOnly} className="text-sm" />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">Notes</label>
              <Textarea value={editItem.notes || ''} onChange={e => setEditItem(p => ({ ...p, notes: e.target.value }))}
                placeholder="Any notes..." rows={2} disabled={isReadOnly} className="text-sm" />
            </div>
          </Card>
        </div>
        <OpsBottomNav />
      </div>
    );
  }

  // ===== TRANSACTION HISTORY VIEW =====
  if (viewMode === 'transactions' && historyItem) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setViewMode('list')}><ArrowLeft size={20} className="text-foreground" /></button>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-foreground">{historyItem.name}</h2>
              <p className="text-[11px] text-muted-foreground">Stock History • Current: {historyItem.current_stock} {historyItem.unit}</p>
            </div>
          </div>
        </div>
        <div className="p-4 space-y-2">
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <History size={32} className="mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">No transactions yet</p>
            </div>
          ) : transactions.map(tx => {
            const typeInfo = TRANSACTION_TYPES.find(t => t.value === tx.type) || TRANSACTION_TYPES[0];
            const Icon = typeInfo.icon;
            return (
              <Card key={tx.id} className="p-3 bg-card border-border">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-muted/50`}>
                    <Icon size={16} className={typeInfo.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{typeInfo.label}</span>
                      <span className={`text-xs font-bold ${tx.type === 'received' ? 'text-green-500' : tx.type === 'adjusted' ? 'text-blue-500' : 'text-destructive'}`}>
                        {tx.type === 'received' ? '+' : tx.type === 'adjusted' ? '=' : '-'}{tx.quantity}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {tx.reference_note && ` • ${tx.reference_note}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">After</p>
                    <p className="text-sm font-bold text-foreground">{tx.stock_after}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
        <OpsBottomNav />
      </div>
    );
  }

  // ===== DASHBOARD VIEW =====
  if (viewMode === 'dashboard') {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setViewMode('list')}><ArrowLeft size={20} className="text-foreground" /></button>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-foreground">Inventory Dashboard</h2>
              <p className="text-[11px] text-muted-foreground">Stock overview & alerts</p>
            </div>
          </div>
        </div>
        <div className="p-4 space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-2">
            <Card className="p-3 bg-card border-border text-center">
              <Boxes size={18} className="mx-auto mb-1 text-secondary" />
              <p className="font-heading text-xl text-foreground">{dashStats.totalItems}</p>
              <p className="text-[10px] text-muted-foreground">Total Items</p>
            </Card>
            <Card className="p-3 bg-card border-border text-center">
              <Package size={18} className="mx-auto mb-1 text-blue-400" />
              <p className="font-heading text-xl text-foreground">{dashStats.totalCategories}</p>
              <p className="text-[10px] text-muted-foreground">Categories</p>
            </Card>
            <Card className="p-3 bg-card border-border text-center">
              <AlertTriangle size={18} className="mx-auto mb-1 text-yellow-500" />
              <p className="font-heading text-xl text-yellow-500">{dashStats.lowStock.length}</p>
              <p className="text-[10px] text-muted-foreground">Low Stock</p>
            </Card>
            <Card className="p-3 bg-card border-border text-center">
              <TrendingDown size={18} className="mx-auto mb-1 text-destructive" />
              <p className="font-heading text-xl text-destructive">{dashStats.outOfStock.length}</p>
              <p className="text-[10px] text-muted-foreground">Out of Stock</p>
            </Card>
          </div>

          {/* Total Value */}
          <Card className="p-4 bg-gradient-to-r from-secondary/10 to-primary/10 border-secondary/20">
            <p className="text-[10px] text-muted-foreground mb-1">Total Inventory Value</p>
            <p className="font-heading text-2xl text-foreground">₹{dashStats.totalValue.toLocaleString('en-IN')}</p>
          </Card>

          {/* Lowest Stock Items */}
          {dashStats.lowestStock.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <TrendingDown size={12} className="text-destructive" /> Lowest Stock
              </h3>
              <div className="space-y-1.5">
                {dashStats.lowestStock.map(item => (
                  <Card key={item.id} className="p-3 bg-card border-border flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground">{getCategoryName(item.category_id)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${item.current_stock <= 0 ? 'text-destructive' : item.current_stock <= item.min_stock_level ? 'text-yellow-500' : 'text-foreground'}`}>
                        {item.current_stock} {item.unit}
                      </p>
                      <p className="text-[10px] text-muted-foreground">min: {item.min_stock_level}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Highest Stock Items */}
          {dashStats.highestStock.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <TrendingUp size={12} className="text-green-500" /> Highest Stock
              </h3>
              <div className="space-y-1.5">
                {dashStats.highestStock.map(item => (
                  <Card key={item.id} className="p-3 bg-card border-border flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground">{getCategoryName(item.category_id)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-500">{item.current_stock} {item.unit}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Category Breakdown */}
          {dashStats.catBreakdown.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BarChart3 size={12} /> By Category
              </h3>
              <div className="space-y-1.5">
                {dashStats.catBreakdown.map(cat => (
                  <Card key={cat.id} className="p-3 bg-card border-border">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-foreground">{cat.name}</p>
                      <span className="text-xs text-muted-foreground">{cat.itemCount} items</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px]">
                      <span className="text-muted-foreground">₹{cat.totalValue.toLocaleString('en-IN')}</span>
                      {cat.lowCount > 0 && <span className="text-yellow-500">⚠ {cat.lowCount} low</span>}
                      {cat.outCount > 0 && <span className="text-destructive">✗ {cat.outCount} out</span>}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
        <OpsBottomNav />
      </div>
    );
  }

  // ===== LIST VIEW (DEFAULT) =====
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Package size={20} className="text-secondary" /> Inventory
            </h1>
            <p className="text-[11px] text-muted-foreground">
              {items.length} items • {dashStats.lowStock.length + dashStats.outOfStock.length > 0
                ? <span className="text-destructive font-medium">{dashStats.lowStock.length + dashStats.outOfStock.length} need attention</span>
                : 'All stocked'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setViewMode('dashboard')}>
              <BarChart3 size={14} className="mr-1" /> Dashboard
            </Button>
            {!isReadOnly && (
              <Button size="sm" className="h-8 text-xs bg-secondary text-secondary-foreground" onClick={() => openEditor()}>
                <Plus size={14} className="mr-1" /> Add
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..."
              className="pl-8 text-sm h-9" />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-28 text-xs h-9"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Stock filter pills */}
        <div className="flex gap-2 mt-2">
          {[
            { key: 'all', label: 'All', count: items.length },
            { key: 'low', label: '⚠ Low', count: dashStats.lowStock.length },
            { key: 'out', label: '✗ Out', count: dashStats.outOfStock.length },
          ].map(f => (
            <button key={f.key} onClick={() => setFilterStock(f.key)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                filterStock === f.key
                  ? 'bg-secondary/20 text-secondary border-secondary/30'
                  : 'bg-muted/30 text-muted-foreground border-border'
              }`}>
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      </div>

      {/* Items list */}
      <div className="p-4 space-y-2">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Package size={32} className="mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">{items.length === 0 ? 'No inventory items yet' : 'No items match filters'}</p>
          </div>
        ) : filteredItems.map(item => (
          <Card key={item.id} className="p-3 bg-card border-border">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                item.current_stock <= 0 ? 'bg-destructive/10' : item.current_stock <= item.min_stock_level ? 'bg-yellow-500/10' : 'bg-green-500/10'
              }`}>
                <Package size={18} className={
                  item.current_stock <= 0 ? 'text-destructive' : item.current_stock <= item.min_stock_level ? 'text-yellow-500' : 'text-green-500'
                } />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-foreground truncate">{item.name}</span>
                  {getStockBadge(item)}
                </div>
                <p className="text-[10px] text-muted-foreground">{getCategoryName(item.category_id)} • ₹{item.cost_per_unit}/{item.unit}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-sm font-bold ${
                    item.current_stock <= 0 ? 'text-destructive' : item.current_stock <= item.min_stock_level ? 'text-yellow-500' : 'text-foreground'
                  }`}>
                    {item.current_stock} {item.unit}
                  </span>
                  <span className="text-[10px] text-muted-foreground">/ min: {item.min_stock_level}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                {!isReadOnly && (
                  <Button size="sm" variant="outline" className="h-7 text-[10px] px-2" onClick={() => openTxDialog(item)}>
                    <PackagePlus size={12} className="mr-0.5" /> Stock
                  </Button>
                )}
                <Button size="sm" variant="ghost" className="h-7 text-[10px] px-2" onClick={() => openHistory(item)}>
                  <History size={12} className="mr-0.5" /> Log
                </Button>
                {!isReadOnly && (
                  <Button size="sm" variant="ghost" className="h-7 text-[10px] px-2" onClick={() => openEditor(item)}>
                    <Edit size={12} className="mr-0.5" /> Edit
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Stock Transaction Dialog */}
      <Dialog open={txDialogOpen} onOpenChange={setTxDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <PackagePlus size={18} /> Update Stock — {txItem?.name}
            </DialogTitle>
          </DialogHeader>
          {txItem && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                Current: <strong className="text-foreground">{txItem.current_stock} {txItem.unit}</strong>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Transaction Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {TRANSACTION_TYPES.map(t => (
                    <button key={t.value} onClick={() => setTxType(t.value)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                        txType === t.value ? 'bg-secondary/20 text-secondary border-secondary/30' : 'bg-muted/30 text-foreground border-border'
                      }`}>
                      <t.icon size={14} className={t.color} /> {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    {txType === 'adjusted' ? `New Stock (${txItem.unit})` : `Quantity (${txItem.unit})`}
                  </label>
                  <Input type="number" value={txQty || ''} onChange={e => setTxQty(Number(e.target.value))} className="text-sm" />
                </div>
                {txType === 'received' && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Unit Cost (₹)</label>
                    <Input type="number" value={txUnitCost || ''} onChange={e => setTxUnitCost(Number(e.target.value))} className="text-sm" />
                  </div>
                )}
              </div>

              {txType !== 'adjusted' && txQty > 0 && (
                <div className="bg-muted/30 rounded-lg p-3 text-sm">
                  New stock will be: <strong className="text-foreground">
                    {txType === 'received' ? txItem.current_stock + txQty : Math.max(0, txItem.current_stock - txQty)} {txItem.unit}
                  </strong>
                </div>
              )}

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Note (optional)</label>
                <Input value={txNote} onChange={e => setTxNote(e.target.value)} placeholder="e.g. PO #123, vendor delivery" className="text-sm" />
              </div>

              <Button onClick={saveTx} disabled={txSaving} className="w-full bg-secondary text-secondary-foreground">
                {txSaving ? 'Updating…' : 'Update Stock'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <OpsBottomNav />
    </div>
  );
};

export default InventoryManagerPage;
