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
  Search, Plus, Trash2, ChefHat, Clock, Droplets, Link2,
  Printer, X, GripVertical, ArrowLeft, StickyNote, Scale
} from 'lucide-react';

interface Recipe {
  id: string;
  menu_item_id: string;
  base_servings: string;
  cooking_time_minutes: number | null;
  water_quantity: string | null;
  instructions: string | null;
  video_url: string | null;
  notes: string | null;
}

interface RecipeIngredient {
  id: string;
  recipe_id: string;
  name: string;
  quantity: number;
  unit: string;
  display_order: number;
}

interface MenuItem {
  id: string;
  name: string;
  category_id: string | null;
  is_veg: boolean;
  variants: { id: string; name: string; price: number }[];
}

interface MenuCategory {
  id: string;
  name: string;
}

const UNITS = ['grams', 'kg', 'ml', 'litres', 'cups', 'tbsp', 'tsp', 'pieces', 'pinch', 'nos'];

const RecipeManagerPage = () => {
  const { role } = useAuth();
  const isReadOnly = role === 'store_manager' || role === 'kitchen_manager';

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [recipes, setRecipes] = useState<Map<string, Recipe>>(new Map());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Editor state
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [editRecipe, setEditRecipe] = useState<Partial<Recipe>>({});
  const [editIngredients, setEditIngredients] = useState<Partial<RecipeIngredient>[]>([]);
  const [saving, setSaving] = useState(false);

  // Scale/print dialog
  const [scaleDialogItem, setScaleDialogItem] = useState<string | null>(null);
  const [scaleMultiplier, setScaleMultiplier] = useState(1);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const [itemsRes, catsRes, recipesRes] = await Promise.all([
      supabase.from('menu_items').select('id, name, category_id, is_veg').eq('is_active', true).order('display_order'),
      supabase.from('menu_categories').select('id, name').eq('is_active', true).order('display_order'),
      supabase.from('recipes').select('*'),
    ]);

    // Fetch variants for all items
    const { data: variants } = await supabase.from('menu_variants').select('id, menu_item_id, name, price').eq('is_active', true).order('display_order');

    const variantsByItem = new Map<string, { id: string; name: string; price: number }[]>();
    (variants || []).forEach(v => {
      const list = variantsByItem.get(v.menu_item_id) || [];
      list.push({ id: v.id, name: v.name, price: v.price });
      variantsByItem.set(v.menu_item_id, list);
    });

    const items: MenuItem[] = (itemsRes.data || []).map(i => ({
      ...i,
      variants: variantsByItem.get(i.id) || [],
    }));

    const recipeMap = new Map<string, Recipe>();
    (recipesRes.data || []).forEach((r: any) => recipeMap.set(r.menu_item_id, r));

    setMenuItems(items);
    setCategories(catsRes.data || []);
    setRecipes(recipeMap);
    setLoading(false);
  };

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCategory !== 'all' && item.category_id !== filterCategory) return false;
      return true;
    });
  }, [menuItems, search, filterCategory]);

  const getSmallestVariant = (itemId: string) => {
    const item = menuItems.find(i => i.id === itemId);
    if (!item || item.variants.length === 0) return null;
    return [...item.variants].sort((a, b) => a.price - b.price)[0];
  };

  const openEditor = async (itemId: string) => {
    const existing = recipes.get(itemId);
    const smallest = getSmallestVariant(itemId);
    const baseServing = smallest ? smallest.name : '1 serving';
    if (existing) {
      setEditRecipe({ ...existing, base_servings: baseServing });
      // Fetch ingredients
      const { data } = await supabase
        .from('recipe_ingredients')
        .select('*')
        .eq('recipe_id', existing.id)
        .order('display_order');
      setEditIngredients(data || []);
    } else {
      setEditRecipe({ menu_item_id: itemId, base_servings: baseServing });
      setEditIngredients([]);
    }
    setSelectedItemId(itemId);
  };

  const addIngredient = () => {
    setEditIngredients(prev => [...prev, { name: '', quantity: 0, unit: 'grams', display_order: prev.length }]);
  };

  const updateIngredient = (idx: number, field: string, value: any) => {
    setEditIngredients(prev => prev.map((ing, i) => i === idx ? { ...ing, [field]: value } : ing));
  };

  const removeIngredient = (idx: number) => {
    setEditIngredients(prev => prev.filter((_, i) => i !== idx));
  };

  const saveRecipe = async () => {
    if (!selectedItemId) return;
    setSaving(true);

    try {
      let recipeId = editRecipe.id;

      if (recipeId) {
        // Update
        await supabase.from('recipes').update({
          base_servings: editRecipe.base_servings || '1',
          cooking_time_minutes: editRecipe.cooking_time_minutes || null,
          water_quantity: editRecipe.water_quantity || null,
          instructions: editRecipe.instructions || null,
          video_url: editRecipe.video_url || null,
          notes: editRecipe.notes || null,
        } as any).eq('id', recipeId);
      } else {
        // Insert
        const { data } = await supabase.from('recipes').insert({
          menu_item_id: selectedItemId,
          base_servings: editRecipe.base_servings || '1',
          cooking_time_minutes: editRecipe.cooking_time_minutes || null,
          water_quantity: editRecipe.water_quantity || null,
          instructions: editRecipe.instructions || null,
          video_url: editRecipe.video_url || null,
          notes: editRecipe.notes || null,
        } as any).select().single();
        recipeId = (data as any)?.id;
      }

      if (recipeId) {
        // Delete existing ingredients and re-insert
        await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipeId);

        const validIngredients = editIngredients.filter(ing => ing.name?.trim());
        if (validIngredients.length > 0) {
          await supabase.from('recipe_ingredients').insert(
            validIngredients.map((ing, idx) => ({
              recipe_id: recipeId!,
              name: ing.name!,
              quantity: Number(ing.quantity) || 0,
              unit: ing.unit || 'grams',
              display_order: idx,
            }))
          );
        }
      }

      toast.success('Recipe saved!');
      setSelectedItemId(null);
      fetchAll();
    } catch (err) {
      toast.error('Failed to save recipe');
    } finally {
      setSaving(false);
    }
  };

  const openScaleDialog = async (itemId: string) => {
    const recipe = recipes.get(itemId);
    if (!recipe) {
      toast.error('No recipe found for this item');
      return;
    }
    // Fetch ingredients
    const { data } = await supabase
      .from('recipe_ingredients')
      .select('*')
      .eq('recipe_id', recipe.id)
      .order('display_order');
    setEditIngredients(data || []);
    setEditRecipe(recipe);
    setScaleMultiplier(1);
    setScaleDialogItem(itemId);
  };

  const getVariantMultipliers = (itemId: string) => {
    const item = menuItems.find(i => i.id === itemId);
    if (!item || item.variants.length < 2) return [];
    const sorted = [...item.variants].sort((a, b) => a.price - b.price);
    const basePrice = sorted[0].price;
    return sorted.map((v, i) => ({
      ...v,
      multiplier: i === 0 ? 1 : Math.round((v.price / basePrice) * 100) / 100,
    }));
  };

  const printRecipe = () => {
    window.print();
  };

  const selectedItem = selectedItemId ? menuItems.find(i => i.id === selectedItemId) : null;
  const scaleItem = scaleDialogItem ? menuItems.find(i => i.id === scaleDialogItem) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Editor view
  if (selectedItemId && selectedItem) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedItemId(null)}>
              <ArrowLeft size={20} className="text-foreground" />
            </button>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-foreground">{selectedItem.name}</h2>
              <p className="text-[11px] text-muted-foreground">Recipe Editor</p>
            </div>
            {!isReadOnly && (
              <Button size="sm" onClick={saveRecipe} disabled={saving} className="bg-secondary text-secondary-foreground">
                {saving ? 'Saving…' : 'Save'}
              </Button>
            )}
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Meta fields */}
          <Card className="p-4 space-y-3 bg-card border-border">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">Base Serving (smallest variant)</label>
                <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-muted/30 text-sm text-foreground">
                  <Scale size={14} className="text-muted-foreground" />
                  <span className="font-medium">{editRecipe.base_servings || '—'}</span>
                </div>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">Cooking Time (min)</label>
                <Input
                  type="number"
                  value={editRecipe.cooking_time_minutes || ''}
                  onChange={e => setEditRecipe(p => ({ ...p, cooking_time_minutes: Number(e.target.value) || null }))}
                  placeholder="30"
                  disabled={isReadOnly}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">Water Quantity</label>
                <Input
                  value={editRecipe.water_quantity || ''}
                  onChange={e => setEditRecipe(p => ({ ...p, water_quantity: e.target.value }))}
                  placeholder="e.g. 2 cups"
                  disabled={isReadOnly}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">Video / Link</label>
                <Input
                  value={editRecipe.video_url || ''}
                  onChange={e => setEditRecipe(p => ({ ...p, video_url: e.target.value }))}
                  placeholder="https://..."
                  disabled={isReadOnly}
                  className="text-sm"
                />
              </div>
            </div>
          </Card>

          {/* Ingredients */}
          <Card className="p-4 space-y-3 bg-card border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Ingredients</h3>
              {!isReadOnly && (
                <Button size="sm" variant="outline" onClick={addIngredient} className="text-xs h-7">
                  <Plus size={14} className="mr-1" /> Add
                </Button>
              )}
            </div>
            {editIngredients.length === 0 && (
              <p className="text-xs text-muted-foreground py-4 text-center">No ingredients added yet</p>
            )}
            <div className="space-y-2">
              {editIngredients.map((ing, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <GripVertical size={14} className="text-muted-foreground flex-shrink-0" />
                  <Input
                    value={ing.name || ''}
                    onChange={e => updateIngredient(idx, 'name', e.target.value)}
                    placeholder="Ingredient"
                    disabled={isReadOnly}
                    className="text-sm flex-1"
                  />
                  <Input
                    type="number"
                    value={ing.quantity || ''}
                    onChange={e => updateIngredient(idx, 'quantity', Number(e.target.value))}
                    placeholder="Qty"
                    disabled={isReadOnly}
                    className="text-sm w-20"
                  />
                  <Select
                    value={ing.unit || 'grams'}
                    onValueChange={v => updateIngredient(idx, 'unit', v)}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger className="w-24 text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map(u => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!isReadOnly && (
                    <button onClick={() => removeIngredient(idx)}>
                      <Trash2 size={14} className="text-destructive" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Instructions */}
          <Card className="p-4 space-y-3 bg-card border-border">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Instructions</h3>
            <Textarea
              value={editRecipe.instructions || ''}
              onChange={e => setEditRecipe(p => ({ ...p, instructions: e.target.value }))}
              placeholder="Step-by-step cooking instructions..."
              rows={8}
              disabled={isReadOnly}
              className="text-sm"
            />
          </Card>

          {/* Notes */}
          <Card className="p-4 space-y-3 bg-card border-border">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Notes</h3>
            <Textarea
              value={editRecipe.notes || ''}
              onChange={e => setEditRecipe(p => ({ ...p, notes: e.target.value }))}
              placeholder="Chef tips, variations..."
              rows={3}
              disabled={isReadOnly}
              className="text-sm"
            />
          </Card>
        </div>

        <OpsBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <ChefHat size={20} className="text-secondary" /> Recipe Manager
            </h1>
            <p className="text-[11px] text-muted-foreground">
              {recipes.size} / {menuItems.length} items have recipes
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search dishes..."
              className="pl-8 text-sm h-9"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-32 text-xs h-9">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Items list */}
      <div className="p-4 space-y-2">
        {filteredItems.map(item => {
          const hasRecipe = recipes.has(item.id);
          const recipe = recipes.get(item.id);
          return (
            <Card key={item.id} className="p-3 bg-card border-border">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.is_veg ? 'bg-green-500' : 'bg-red-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground truncate">{item.name}</span>
                    {hasRecipe ? (
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0">✓ Recipe</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-muted-foreground">No Recipe</Badge>
                    )}
                  </div>
                  {hasRecipe && recipe && (
                    <div className="flex items-center gap-3 mt-0.5">
                      {recipe.cooking_time_minutes && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Clock size={10} /> {recipe.cooking_time_minutes}m
                        </span>
                      )}
                      {recipe.water_quantity && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Droplets size={10} /> {recipe.water_quantity}
                        </span>
                      )}
                      {recipe.video_url && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Link2 size={10} /> Link
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-1.5">
                  {hasRecipe && (
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => openScaleDialog(item.id)}>
                      <Scale size={14} />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant={hasRecipe ? 'outline' : 'default'}
                    className={`h-7 text-xs ${!hasRecipe ? 'bg-secondary text-secondary-foreground' : ''}`}
                    onClick={() => openEditor(item.id)}
                  >
                    {hasRecipe ? 'Edit' : '+ Add'}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Scale & Print Dialog */}
      <Dialog open={!!scaleDialogItem} onOpenChange={() => setScaleDialogItem(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto print-content">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Scale size={18} /> {scaleItem?.name} — Scaled Recipe
            </DialogTitle>
          </DialogHeader>

          {scaleItem && (
            <div className="space-y-4">
              {/* Variant quick-select */}
              <p className="text-xs text-muted-foreground mb-2">Base: {getSmallestVariant(scaleItem.id)?.name || 'default'}</p>
              {scaleItem.variants.length >= 2 && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Scale by variant</label>
                  <div className="flex flex-wrap gap-2">
                    {getVariantMultipliers(scaleItem.id).map(v => (
                      <button
                        key={v.id}
                        onClick={() => setScaleMultiplier(v.multiplier)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          scaleMultiplier === v.multiplier
                            ? 'bg-secondary text-secondary-foreground border-secondary'
                            : 'bg-muted/50 text-foreground border-border hover:border-secondary/50'
                        }`}
                      >
                        {v.name} (×{v.multiplier})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom multiplier */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Custom multiplier</label>
                <Input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={scaleMultiplier}
                  onChange={e => setScaleMultiplier(Number(e.target.value) || 1)}
                  className="w-24 text-sm"
                />
              </div>

              {/* Recipe details */}
              {editRecipe.cooking_time_minutes && (
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Clock size={14} className="text-muted-foreground" />
                  Cooking Time: <strong>{Math.round(editRecipe.cooking_time_minutes * scaleMultiplier)} min</strong>
                </div>
              )}
              {editRecipe.water_quantity && (
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Droplets size={14} className="text-muted-foreground" />
                  Water: <strong>{editRecipe.water_quantity} × {scaleMultiplier}</strong>
                </div>
              )}

              {/* Scaled ingredients table */}
              <div>
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Ingredients (×{scaleMultiplier})</h4>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left py-2 px-3 text-xs font-semibold text-foreground">Ingredient</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-foreground">Base</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-foreground">Scaled</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-foreground">Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editIngredients.map((ing, idx) => (
                        <tr key={idx} className="border-t border-border">
                          <td className="py-2 px-3 text-foreground">{ing.name}</td>
                          <td className="py-2 px-3 text-right text-muted-foreground">{ing.quantity}</td>
                          <td className="py-2 px-3 text-right font-semibold text-secondary">
                            {Math.round(Number(ing.quantity || 0) * scaleMultiplier * 100) / 100}
                          </td>
                          <td className="py-2 px-3 text-muted-foreground">{ing.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Instructions */}
              {editRecipe.instructions && (
                <div>
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Instructions</h4>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{editRecipe.instructions}</p>
                </div>
              )}

              {/* Print button */}
              <Button onClick={printRecipe} className="w-full bg-secondary text-secondary-foreground no-print">
                <Printer size={16} className="mr-2" /> Print Recipe
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <OpsBottomNav />

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-content, .print-content * { visibility: visible; }
          .print-content { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default RecipeManagerPage;
