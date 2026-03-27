import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { X, ChevronRight, ChevronLeft, Leaf, Drumstick, Upload, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const inputClass = 'w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-secondary transition-colors';
const labelClass = 'text-xs font-medium text-muted-foreground mb-1 block';

interface Category { id: string; name: string; }
interface AddonGroup { id: string; name: string; }

interface Props {
  item?: any;
  categories: Category[];
  addonGroups: AddonGroup[];
  onClose: () => void;
  onSaved: () => void;
}

const STEPS = ['Basic Info', 'Pricing & Ops', 'Variants', 'Add-ons', 'Media & Tags'];

const ItemFormModal = ({ item, categories, addonGroups, onClose, onSaved }: Props) => {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Basic
  const [name, setName] = useState(item?.name || '');
  const [description, setDescription] = useState(item?.description || '');
  const [categoryId, setCategoryId] = useState(item?.category_id || '');
  const [isVeg, setIsVeg] = useState(item?.is_veg ?? false);
  const [spiceLevel, setSpiceLevel] = useState(item?.spice_level ?? 1);

  // Pricing
  const [basePrice, setBasePrice] = useState(item?.base_price?.toString() || item?.price?.toString() || '');
  const [discountedPrice, setDiscountedPrice] = useState(item?.discounted_price?.toString() || '');
  const [prepTime, setPrepTime] = useState(item?.prep_time?.toString() || '15');
  const [isAvailable, setIsAvailable] = useState(item?.is_available ?? true);
  const [isActive, setIsActive] = useState(item?.is_active ?? true);

  // Variants
  const [variants, setVariants] = useState<{ id?: string; name: string; price: string; prep_time_override: string }[]>([]);

  // Add-ons
  const [selectedAddonGroups, setSelectedAddonGroups] = useState<string[]>([]);

  // Media & Tags
  const [imageUrl, setImageUrl] = useState(item?.image_url || '');
  const [isBestseller, setIsBestseller] = useState(item?.is_bestseller ?? false);
  const [isChefsSpecial, setIsChefsSpecial] = useState(item?.is_chefs_special ?? false);
  const [isNew, setIsNew] = useState(item?.is_new ?? false);

  useEffect(() => {
    if (item) {
      loadVariants();
      loadAddonLinks();
    }
  }, [item]);

  const loadVariants = async () => {
    if (!item) return;
    const { data } = await supabase.from('menu_variants').select('*').eq('menu_item_id', item.id).order('display_order');
    if (data) setVariants(data.map(v => ({ id: v.id, name: v.name, price: v.price.toString(), prep_time_override: v.prep_time_override?.toString() || '' })));
  };

  const loadAddonLinks = async () => {
    if (!item) return;
    const { data } = await supabase.from('menu_item_addon_groups').select('addon_group_id').eq('menu_item_id', item.id);
    if (data) setSelectedAddonGroups(data.map(d => d.addon_group_id));
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `items/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('menu-images').upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from('menu-images').getPublicUrl(path);
      setImageUrl(data.publicUrl);
    }
    setUploading(false);
  };

  const addVariant = () => setVariants(p => [...p, { name: '', price: '', prep_time_override: '' }]);
  const removeVariant = (idx: number) => setVariants(p => p.filter((_, i) => i !== idx));
  const updateVariant = (idx: number, key: string, val: string) => setVariants(p => p.map((v, i) => i === idx ? { ...v, [key]: val } : v));

  const toggleAddonGroup = (gid: string) => {
    setSelectedAddonGroups(p => p.includes(gid) ? p.filter(x => x !== gid) : [...p, gid]);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);

    const price = parseFloat(basePrice) || 0;
    const payload: Record<string, any> = {
      name: name.trim(),
      description: description.trim() || null,
      category_id: categoryId || null,
      category: categories.find(c => c.id === categoryId)?.name || null,
      is_veg: isVeg,
      spice_level: spiceLevel,
      price,
      base_price: price,
      discounted_price: discountedPrice ? parseFloat(discountedPrice) : null,
      prep_time: parseInt(prepTime) || 15,
      is_available: isAvailable,
      is_active: isActive,
      image_url: imageUrl || null,
      is_bestseller: isBestseller,
      is_chefs_special: isChefsSpecial,
      is_new: isNew,
    };

    let itemId = item?.id;

    if (item) {
      await supabase.from('menu_items').update(payload).eq('id', item.id);
    } else {
      const { data } = await supabase.from('menu_items').insert(payload as any).select('id').single();
      itemId = data?.id;
    }

    if (itemId) {
      // Variants
      if (item) await supabase.from('menu_variants').delete().eq('menu_item_id', itemId);
      const validVariants = variants.filter(v => v.name.trim() && v.price);
      if (validVariants.length > 0) {
        const variantRows = validVariants.map((v, i) => ({
          menu_item_id: itemId!,
          name: v.name.trim(),
          price: parseFloat(v.price),
          prep_time_override: v.prep_time_override ? parseInt(v.prep_time_override) : null,
          display_order: i,
        }));
        await supabase.from('menu_variants').insert(variantRows);
      }

      // Addon group links
      if (item) await supabase.from('menu_item_addon_groups').delete().eq('menu_item_id', itemId);
      if (selectedAddonGroups.length > 0) {
        await supabase.from('menu_item_addon_groups').insert(selectedAddonGroups.map(gid => ({
          menu_item_id: itemId,
          addon_group_id: gid,
        })));
      }
    }

    setSaving(false);
    onSaved();
  };

  const canProceed = step === 0 ? name.trim().length > 0 : true;

  return (
    <div className="fixed inset-0 z-[55] bg-background/95 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-card/95 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center justify-between z-10">
        <button onClick={onClose} className="p-1"><X size={20} className="text-muted-foreground" /></button>
        <h2 className="font-heading text-sm text-foreground">{item ? 'Edit' : 'Add'} Item</h2>
        <div className="w-6" />
      </div>

      {/* Step indicator */}
      <div className="px-4 py-3 flex gap-1.5">
        {STEPS.map((s, i) => (
          <button key={s} onClick={() => i <= step && setStep(i)} className="flex-1 flex flex-col items-center gap-1">
            <div className={`h-1 w-full rounded-full transition-colors ${i <= step ? 'bg-secondary' : 'bg-muted'}`} />
            <span className={`text-[9px] ${i === step ? 'text-secondary font-medium' : 'text-muted-foreground'}`}>{s}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 pt-2">
            {step === 0 && (
              <>
                <div>
                  <label className={labelClass}>Item Name *</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Hyderabadi Chicken Biryani" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Description</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Aromatic basmati rice with tender chicken..." rows={3} className={inputClass + ' resize-none'} />
                </div>
                <div>
                  <label className={labelClass}>Category</label>
                  <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={inputClass}>
                    <option value="">— Uncategorized —</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Type</label>
                  <div className="flex gap-3">
                    <button onClick={() => setIsVeg(true)} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-medium transition-colors ${isVeg ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-border text-muted-foreground'}`}>
                      <Leaf size={16} /> Veg
                    </button>
                    <button onClick={() => setIsVeg(false)} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-medium transition-colors ${!isVeg ? 'border-accent bg-accent/10 text-accent-foreground' : 'border-border text-muted-foreground'}`}>
                      <Drumstick size={16} /> Non-Veg
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Spice Level</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(l => (
                      <button key={l} onClick={() => setSpiceLevel(l)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${spiceLevel >= l ? 'bg-accent/20 text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>
                        {'🌶️'.repeat(l)}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div>
                  <label className={labelClass}>Base Price (₹) *</label>
                  <input type="number" value={basePrice} onChange={e => setBasePrice(e.target.value)} placeholder="e.g. 299" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Discounted Price (₹)</label>
                  <input type="number" value={discountedPrice} onChange={e => setDiscountedPrice(e.target.value)} placeholder="Leave empty if no discount" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Prep Time (minutes)</label>
                  <input type="number" value={prepTime} onChange={e => setPrepTime(e.target.value)} placeholder="15" className={inputClass} />
                </div>
                <div className="flex items-center justify-between py-2">
                  <label className="text-sm text-foreground">Available</label>
                  <button onClick={() => setIsAvailable(!isAvailable)} className={`relative w-12 h-6 rounded-full transition-colors ${isAvailable ? 'bg-green-500' : 'bg-muted-foreground/30'}`}>
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isAvailable ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between py-2">
                  <label className="text-sm text-foreground">Active (visible on menu)</label>
                  <button onClick={() => setIsActive(!isActive)} className={`relative w-12 h-6 rounded-full transition-colors ${isActive ? 'bg-green-500' : 'bg-muted-foreground/30'}`}>
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <p className="text-xs text-muted-foreground">Add size or serving variants (e.g., Half / Full)</p>
                {variants.map((v, idx) => (
                  <div key={idx} className="bg-card border border-border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">Variant {idx + 1}</span>
                      <button onClick={() => removeVariant(idx)} className="text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                    </div>
                    <input value={v.name} onChange={e => updateVariant(idx, 'name', e.target.value)} placeholder="e.g. Half, Full, Family Pack" className={inputClass} />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" value={v.price} onChange={e => updateVariant(idx, 'price', e.target.value)} placeholder="Price ₹" className={inputClass} />
                      <input type="number" value={v.prep_time_override} onChange={e => updateVariant(idx, 'prep_time_override', e.target.value)} placeholder="Prep time (opt)" className={inputClass} />
                    </div>
                  </div>
                ))}
                <button onClick={addVariant} className="w-full py-3 border-2 border-dashed border-border rounded-lg text-xs text-muted-foreground flex items-center justify-center gap-1.5 hover:border-secondary hover:text-secondary transition-colors">
                  <Plus size={14} /> Add Variant
                </button>
              </>
            )}

            {step === 3 && (
              <>
                <p className="text-xs text-muted-foreground">Link add-on groups to this item</p>
                {addonGroups.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-6">No add-on groups created yet. Create them from the Add-ons tab.</p>
                ) : (
                  <div className="space-y-2">
                    {addonGroups.map(g => (
                      <button key={g.id} onClick={() => toggleAddonGroup(g.id)} className={`w-full p-3 rounded-lg border text-left text-sm transition-colors ${selectedAddonGroups.includes(g.id) ? 'border-secondary bg-secondary/10 text-foreground' : 'border-border text-muted-foreground'}`}>
                        <span className="font-medium">{g.name}</span>
                        {selectedAddonGroups.includes(g.id) && <span className="ml-2 text-secondary text-xs">✓ Linked</span>}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {step === 4 && (
              <>
                <div>
                  <label className={labelClass}>Item Image</label>
                  {imageUrl && <img src={imageUrl} className="w-full h-40 rounded-lg object-cover mb-2" />}
                  <label className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-border rounded-lg text-xs text-muted-foreground cursor-pointer hover:border-secondary hover:text-secondary transition-colors">
                    <Upload size={14} /> {imageUrl ? 'Change Image' : 'Upload Image'}
                    <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
                  </label>
                  {uploading && <p className="text-[10px] text-secondary mt-1">Uploading...</p>}
                </div>
                <div>
                  <label className={labelClass}>Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'bestseller', label: '🏆 Bestseller', val: isBestseller, set: setIsBestseller },
                      { key: 'chefs', label: '👨‍🍳 Chef\'s Special', val: isChefsSpecial, set: setIsChefsSpecial },
                      { key: 'new', label: '✨ New', val: isNew, set: setIsNew },
                    ].map(t => (
                      <button key={t.key} onClick={() => t.set(!t.val)} className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${t.val ? 'bg-secondary/20 text-secondary border border-secondary' : 'bg-muted text-muted-foreground border border-border'}`}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border px-4 py-3 flex gap-3 z-[60]">
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-1 px-4 py-2.5 border border-border rounded-lg text-xs font-medium text-muted-foreground">
            <ChevronLeft size={14} /> Back
          </button>
        )}
        <div className="flex-1" />
        {step < STEPS.length - 1 ? (
          <button onClick={() => setStep(s => s + 1)} disabled={!canProceed} className="flex items-center gap-1 px-6 py-2.5 bg-gradient-saffron rounded-lg text-xs font-medium text-primary-foreground disabled:opacity-40">
            Next <ChevronRight size={14} />
          </button>
        ) : (
          <button onClick={handleSave} disabled={!name.trim() || saving} className="flex items-center gap-1 px-6 py-2.5 bg-gradient-saffron rounded-lg text-xs font-medium text-primary-foreground disabled:opacity-40">
            {saving ? 'Saving...' : item ? 'Update Item' : 'Create Item'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ItemFormModal;
