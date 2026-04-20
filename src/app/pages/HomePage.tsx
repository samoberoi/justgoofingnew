import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, ShoppingCart, Flame, Star, ChefHat, Sparkles, Gift, MapPin, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RoyalHeader from '../components/RoyalHeader';
import BottomNav from '../components/BottomNav';
import { useAppStore } from '../store';
import { useMenu, MenuItem } from '../hooks/useMenu';
import { useStoreSelection } from '../hooks/useStoreSelection';
import { supabase } from '@/integrations/supabase/client';

const SpiceIndicator = ({ level }: { level: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <Flame key={i} size={9} className={i <= level ? 'text-destructive fill-destructive' : 'text-muted-foreground/20'} />
    ))}
  </div>
);

const VegBadge = ({ isVeg }: { isVeg: boolean }) => (
  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
    isVeg
      ? 'text-green-500 border-green-500/40 bg-green-500/10'
      : 'text-red-500 border-red-500/40 bg-red-500/10'
  }`}>
    {isVeg ? '●  VEG' : '●  NON-VEG'}
  </span>
);

const ItemCard = ({ item, index }: { item: MenuItem; index: number }) => {
  const { cart, addToCart, updateQuantity } = useAppStore();

  const defaultVariant = item.variants.find(v => v.id === item.default_variant_id) || item.variants[0];
  const [selectedVariant, setSelectedVariant] = useState(defaultVariant || null);

  const displayPrice = selectedVariant?.price || item.discounted_price || item.price;
  const originalPrice = item.base_price && item.base_price > displayPrice ? item.base_price : null;
  const cartKey = selectedVariant ? `${item.id}_${selectedVariant.id}` : item.id;
  const qty = cart.find(c => c.id === cartKey)?.quantity || 0;

  const handleAdd = () => {
    addToCart({
      id: cartKey,
      name: selectedVariant ? `${item.name} (${selectedVariant.name})` : item.name,
      description: item.description || '',
      price: displayPrice,
      image: item.image_url || '',
      tags: item.tags || [],
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="bg-card border border-border rounded-2xl overflow-hidden group hover:border-secondary/20 transition-colors"
    >
      <div className="flex gap-0">
        {/* Image */}
        <div className="w-28 h-full min-h-[120px] shrink-0 overflow-hidden bg-muted relative">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary/10 to-muted">
              <span className="text-3xl opacity-50">🍛</span>
            </div>
          )}
          {/* Badges overlay */}
          <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
            {item.is_bestseller && (
              <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-secondary/90 text-primary-foreground font-bold flex items-center gap-0.5 backdrop-blur-sm">
                <Star size={7} fill="currentColor" /> BEST
              </span>
            )}
            {item.is_new && (
              <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-primary/90 text-primary-foreground font-bold flex items-center gap-0.5 backdrop-blur-sm">
                <Sparkles size={7} /> NEW
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-3 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <VegBadge isVeg={item.is_veg} />
                <h3 className="font-heading text-sm text-foreground leading-snug">{item.name}</h3>
              </div>
            </div>
            {item.is_chefs_special && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent/15 text-accent-foreground font-semibold inline-flex items-center gap-0.5 mt-1">
                <ChefHat size={8} /> Chef's Special
              </span>
            )}
            {item.spice_level && item.spice_level > 0 && (
              <div className="mt-1"><SpiceIndicator level={item.spice_level} /></div>
            )}
            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
          </div>

          {item.variants.length > 1 && (
            <div className="flex gap-1 mt-2 overflow-x-auto no-scrollbar">
              {item.variants.map(v => (
                <button key={v.id} onClick={() => setSelectedVariant(v)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap border transition-all ${
                    selectedVariant?.id === v.id
                      ? 'border-secondary bg-secondary/10 text-secondary'
                      : 'border-border/60 text-muted-foreground hover:border-border'
                  }`}>
                  {v.name} · ₹{v.price}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-2.5">
            <div className="flex items-baseline gap-1.5">
              <span className="font-heading text-base text-secondary">₹{displayPrice}</span>
              {originalPrice && (
                <span className="text-[10px] text-muted-foreground line-through">₹{originalPrice}</span>
              )}
            </div>
            {qty === 0 ? (
              <motion.button whileTap={{ scale: 0.92 }} onClick={handleAdd}
                className="px-4 py-2 bg-gradient-saffron rounded-xl text-[11px] font-heading uppercase tracking-wider text-primary-foreground shadow-sm">
                ADD
              </motion.button>
            ) : (
              <div className="flex items-center gap-0 bg-gradient-saffron rounded-xl overflow-hidden">
                <button onClick={() => updateQuantity(cartKey, qty - 1)} className="px-2.5 py-2 text-primary-foreground"><Minus size={13} /></button>
                <span className="font-bold text-sm text-primary-foreground w-5 text-center">{qty}</span>
                <button onClick={() => updateQuantity(cartKey, qty + 1)} className="px-2.5 py-2 text-primary-foreground"><Plus size={13} /></button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ACTIVE_STATUS_LABELS: Record<string, { label: string; emoji: string }> = {
  new: { label: 'Order placed — waiting for kitchen', emoji: '📝' },
  accepted: { label: 'Kitchen accepted your order!', emoji: '✅' },
  preparing: { label: 'Your biryani is being prepared 🔥', emoji: '🔥' },
  ready: { label: 'Your order is ready for pickup!', emoji: '✨' },
  assigned: { label: 'A rider has been assigned', emoji: '🏇' },
  picked_up: { label: 'Rider picked up your order', emoji: '📦' },
  out_for_delivery: { label: 'Your food is on the way!', emoji: '🛵' },
};

const HomePage = () => {
  const navigate = useNavigate();
  const { cart, activeCampaigns, totalOrders, userId, vegMode, setVegMode } = useAppStore();
  const { selectedStore, outOfArea, locationLoading } = useStoreSelection();
  const { categories, grouped, uncategorized, loading, items } = useMenu(selectedStore?.id);
  const [vegFilter, setVegFilter] = useState<'all' | 'veg' | 'nonveg'>(vegMode ? 'veg' : 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [activeCatId, setActiveCatId] = useState<string | null>(null);
  const catScrollRef = useRef<HTMLDivElement>(null);

  // Sync vegMode from profile toggle
  useEffect(() => {
    if (vegMode) setVegFilter('veg');
    else setVegFilter('all');
  }, [vegMode]);

  useEffect(() => {
    if (!userId) return;
    const fetchActive = async () => {
      const { data } = await (supabase
        .from('orders')
        .select('id, order_number, status, created_at') as any)
        .eq('user_id', userId)
        .not('status', 'in', '("delivered","cancelled")')
        .order('created_at', { ascending: false });
      setActiveOrders(data || []);
    };
    fetchActive();

    const channel = supabase
      .channel('home-active-order')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchActive())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const applicableCampaign = activeCampaigns.find(c => {
    if (c.category === 'first_order' && totalOrders > 0) return false;
    if (c.target_audience === 'new_users' && totalOrders > 0) return false;
    return true;
  });

  const filterItems = (list: MenuItem[]) => {
    let result = list;
    if (vegFilter === 'veg') result = result.filter(i => i.is_veg);
    else if (vegFilter === 'nonveg') result = result.filter(i => !i.is_veg);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i => i.name.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q));
    }
    return result;
  };

  if (locationLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-2 border-secondary border-t-transparent rounded-full mb-4" />
        <p className="text-sm text-muted-foreground font-heading">Detecting your location…</p>
      </div>
    );
  }

  if (outOfArea) {
    return (
      <div className="min-h-screen bg-background mughal-pattern flex flex-col items-center justify-center p-8 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="w-20 h-20 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center mx-auto mb-5">
            <MapPin size={36} className="text-secondary" />
          </div>
          <h2 className="font-heading text-xl text-foreground mb-2">We're Not in Your Area Yet</h2>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Just Goofing is currently not available in your location. We're expanding fast — check back soon!
          </p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => window.location.reload()}
            className="mt-6 px-8 py-3.5 bg-gradient-saffron rounded-xl font-heading text-sm text-primary-foreground shadow-saffron"
          >
            Retry Location
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const visibleCategories = categories.filter(c => {
    const catItems = filterItems(grouped.get(c.id) || []);
    return catItems.length > 0;
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <RoyalHeader />

      {/* Active Order Banners */}
      <AnimatePresence>
        {activeOrders.length > 0 && (
          <div className="px-4 pt-3 space-y-2">
            {activeOrders.filter(o => ACTIVE_STATUS_LABELS[o.status]).map(order => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onClick={() => navigate(`/tracking/${order.id}`)}
                className="bg-gradient-to-r from-secondary/12 to-secondary/5 border border-secondary/20 rounded-xl p-3 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
              >
                <span className="text-xl">{ACTIVE_STATUS_LABELS[order.status].emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-heading text-[11px] text-secondary">{order.order_number}</p>
                  <p className="text-xs text-foreground truncate">{ACTIVE_STATUS_LABELS[order.status].label}</p>
                </div>
                <span className="text-xs text-secondary font-heading shrink-0">Track →</span>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Campaign Banner */}
      {applicableCampaign && (
        <div className="px-4 pt-3">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-secondary/15 via-secondary/8 to-primary/10 border border-secondary/15 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary/15 flex items-center justify-center shrink-0">
                <Gift size={18} className="text-secondary" />
              </div>
              <div>
                <p className="font-heading text-sm text-secondary">{applicableCampaign.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {applicableCampaign.auto_apply ? 'Auto-applied at checkout' : `Use code: ${applicableCampaign.coupon_code}`}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Search Bar */}
      <div className="px-4 pt-4">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search the menu…"
            className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-secondary/30 transition-colors"
          />
        </div>
      </div>

      {/* Category Pills + Veg Filter */}
      <div className="px-4 pt-3 space-y-2">
        <div className="flex gap-2">
          {(vegMode ? (['veg'] as const) : (['all', 'veg', 'nonveg'] as const)).map(f => (
            <button key={f} onClick={() => setVegFilter(f)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
                vegFilter === f
                  ? f === 'veg' ? 'bg-green-500/15 text-green-500 border-green-500/30'
                    : f === 'nonveg' ? 'bg-red-500/15 text-red-500 border-red-500/30'
                    : 'bg-secondary/15 text-secondary border-secondary/25'
                  : 'bg-card text-muted-foreground border-border hover:border-muted-foreground/30'
              }`}>
              {f === 'all' ? 'All' : f === 'veg' ? '● Veg' : '● Non-Veg'}
            </button>
          ))}
        </div>

        {/* Category scroller */}
        {visibleCategories.length > 1 && (
          <div ref={catScrollRef} className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {visibleCategories.map(cat => (
              <button key={cat.id}
                onClick={() => {
                  setActiveCatId(cat.id);
                  document.getElementById(`cat-${cat.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`px-3 py-1.5 rounded-full text-[11px] font-heading whitespace-nowrap border transition-all ${
                  activeCatId === cat.id
                    ? 'bg-secondary/15 text-secondary border-secondary/25'
                    : 'bg-card text-muted-foreground border-border'
                }`}>
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Menu Section Title */}
      <div className="px-4 pt-4 pb-1">
        <h2 className="font-heading text-base text-foreground">The Menu</h2>
        {selectedStore && (
          <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
            <MapPin size={10} /> Serving from {selectedStore.name}
          </p>
        )}
      </div>

      {loading ? (
        <div className="px-4 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-card border border-border rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="px-4 space-y-5 pt-2">
          {visibleCategories.map(cat => {
            const catItems = filterItems(grouped.get(cat.id) || []);
            return (
              <div key={cat.id} id={`cat-${cat.id}`}>
                <div className="flex items-center gap-2 mb-2.5">
                  {cat.image_url && <img src={cat.image_url} className="w-6 h-6 rounded-lg object-cover" alt="" />}
                  <h3 className="font-heading text-xs text-secondary uppercase tracking-[0.15em]">{cat.name}</h3>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[10px] text-muted-foreground">{catItems.length}</span>
                </div>
                {cat.description && <p className="text-[11px] text-muted-foreground -mt-1 mb-2.5">{cat.description}</p>}
                <div className="space-y-2.5">
                  {catItems.map((item, idx) => (
                    <ItemCard key={item.id} item={item} index={idx} />
                  ))}
                </div>
              </div>
            );
          })}

          {filterItems(uncategorized).length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <h3 className="font-heading text-xs text-muted-foreground uppercase tracking-[0.15em]">More</h3>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="space-y-2.5">
                {filterItems(uncategorized).map((item, idx) => (
                  <ItemCard key={item.id} item={item} index={idx} />
                ))}
              </div>
            </div>
          )}

          {items.length > 0 && filterItems(items).length === 0 && (
            <div className="text-center py-10">
              <p className="text-muted-foreground text-sm">No items match your filter</p>
            </div>
          )}
        </div>
      )}

      {/* Floating Cart */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.button
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            onClick={() => navigate('/cart')}
            className="fixed bottom-20 left-4 right-4 max-w-lg mx-auto bg-gradient-saffron rounded-2xl py-4 px-6 flex items-center justify-between shadow-saffron z-40"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary-foreground/15 flex items-center justify-center">
                <ShoppingCart size={16} className="text-primary-foreground" />
              </div>
              <span className="font-heading text-sm text-primary-foreground">{cartCount} item{cartCount > 1 ? 's' : ''}</span>
            </div>
            <span className="font-heading text-sm text-primary-foreground">View Cart →</span>
          </motion.button>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
};

export default HomePage;
