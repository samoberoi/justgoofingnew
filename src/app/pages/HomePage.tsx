import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, ShoppingCart, Flame, Star, ChefHat, Sparkles, Gift, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RoyalHeader from '../components/RoyalHeader';
import BottomNav from '../components/BottomNav';
import { useAppStore } from '../store';
import { useMenu, MenuItem } from '../hooks/useMenu';
import { supabase } from '@/integrations/supabase/client';

const SpiceIndicator = ({ level }: { level: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <Flame key={i} size={10} className={i <= level ? 'text-destructive fill-destructive' : 'text-muted-foreground/30'} />
    ))}
  </div>
);

const VegBadge = ({ isVeg }: { isVeg: boolean }) => (
  <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${
    isVeg
      ? 'text-green-600 border-green-600 bg-green-600/10'
      : 'text-red-600 border-red-600 bg-red-600/10'
  }`}>
    {isVeg ? 'VEG' : 'NON-VEG'}
  </span>
);

const ItemCard = ({ item, index }: { item: MenuItem; index: number }) => {
  const { cart, addToCart, updateQuantity } = useAppStore();

  const defaultVariant = item.variants.find(v => v.id === item.default_variant_id) || item.variants[0];
  const [selectedVariant, setSelectedVariant] = useState(defaultVariant || null);

  const displayPrice = selectedVariant?.price || item.discounted_price || item.price;
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-card border border-border rounded-xl p-4 flex gap-4"
    >
      <div className="w-20 h-20 rounded-lg shrink-0 overflow-hidden bg-muted">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No img</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <VegBadge isVeg={item.is_veg} />
            <h3 className="font-heading text-sm text-foreground leading-tight">{item.name}</h3>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {item.is_bestseller && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-medium flex items-center gap-0.5"><Star size={8} />Bestseller</span>
          )}
          {item.is_chefs_special && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent-foreground font-medium flex items-center gap-0.5"><ChefHat size={8} />Chef's</span>
          )}
          {item.is_new && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium flex items-center gap-0.5"><Sparkles size={8} />New</span>
          )}
        </div>
        {item.spice_level && item.spice_level > 0 && (
          <div className="mt-1"><SpiceIndicator level={item.spice_level} /></div>
        )}
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>

        {item.variants.length > 1 && (
          <div className="flex gap-1.5 mt-2 overflow-x-auto no-scrollbar">
            {item.variants.map(v => (
              <button key={v.id} onClick={() => setSelectedVariant(v)}
                className={`px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap border transition-colors ${
                  selectedVariant?.id === v.id
                    ? 'border-secondary bg-secondary/10 text-secondary'
                    : 'border-border text-muted-foreground'
                }`}>
                {v.name} · ₹{v.price}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          <span className="font-heading text-base text-secondary">₹{displayPrice}</span>
          {qty === 0 ? (
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleAdd}
              className="px-4 py-2 bg-gradient-saffron rounded-lg text-xs font-heading uppercase tracking-wider text-primary-foreground">
              Add to Dawat
            </motion.button>
          ) : (
            <div className="flex items-center gap-3 bg-muted rounded-lg">
              <button onClick={() => updateQuantity(cartKey, qty - 1)} className="p-2 text-secondary"><Minus size={14} /></button>
              <span className="font-bold text-sm text-foreground w-4 text-center">{qty}</span>
              <button onClick={() => updateQuantity(cartKey, qty + 1)} className="p-2 text-secondary"><Plus size={14} /></button>
            </div>
          )}
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
  const { cart, activeCampaigns, totalOrders, userId } = useAppStore();
  const { categories, grouped, uncategorized, loading, items } = useMenu();
  const [vegFilter, setVegFilter] = useState<'all' | 'veg' | 'nonveg'>('all');
  const [activeOrder, setActiveOrder] = useState<any>(null);

  // Fetch latest active order for this user
  useEffect(() => {
    if (!userId) return;
    const fetchActive = async () => {
      const { data } = await (supabase
        .from('orders')
        .select('id, order_number, status, created_at') as any)
        .eq('user_id', userId)
        .not('status', 'in', '("delivered","cancelled")')
        .order('created_at', { ascending: false })
        .limit(1);
      setActiveOrder(data?.[0] || null);
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
    if (vegFilter === 'all') return list;
    return list.filter(i => vegFilter === 'veg' ? i.is_veg : !i.is_veg);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <RoyalHeader />

      {/* Dynamic Campaign Banner */}
      {applicableCampaign && (
        <div className="px-4 pt-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-secondary/20 to-primary/20 border border-secondary/20 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <Gift size={18} className="text-secondary shrink-0" />
              <div>
                <p className="font-heading text-sm text-secondary">{applicableCampaign.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {applicableCampaign.auto_apply ? 'Auto-applied at checkout' : `Use code: ${applicableCampaign.coupon_code}`}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Menu Header + Veg/Non-Veg Filter */}
      <div className="px-4 pt-6 pb-2">
        <h2 className="font-heading text-lg text-foreground">The Royal Menu</h2>
        <p className="text-xs text-muted-foreground mt-1">Crafted with 500 years of tradition</p>
        <div className="flex gap-2 mt-3">
          {(['all', 'veg', 'nonveg'] as const).map(f => (
            <button key={f} onClick={() => setVegFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                vegFilter === f
                  ? f === 'veg' ? 'bg-green-600/20 text-green-600 border-green-600/30'
                    : f === 'nonveg' ? 'bg-red-600/20 text-red-600 border-red-600/30'
                    : 'bg-secondary/20 text-secondary border-secondary/30'
                  : 'bg-card text-muted-foreground border-border'
              }`}>
              {f === 'all' ? 'All' : f === 'veg' ? '🟢 Veg' : '🔴 Non-Veg'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="px-4 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="px-4 space-y-6">
          {categories.filter(c => grouped.has(c.id)).map(cat => {
            const catItems = filterItems(grouped.get(cat.id) || []);
            if (catItems.length === 0) return null;
            return (
              <div key={cat.id}>
                <div className="flex items-center gap-2 mb-3">
                  {cat.image_url && <img src={cat.image_url} className="w-6 h-6 rounded object-cover" alt="" />}
                  <h3 className="font-heading text-sm text-secondary uppercase tracking-wider">{cat.name}</h3>
                </div>
                {cat.description && <p className="text-xs text-muted-foreground -mt-2 mb-3">{cat.description}</p>}
                <div className="space-y-3">
                  {catItems.map((item, idx) => (
                    <ItemCard key={item.id} item={item} index={idx} />
                  ))}
                </div>
              </div>
            );
          })}

          {filterItems(uncategorized).length > 0 && (
            <div>
              <h3 className="font-heading text-sm text-muted-foreground uppercase tracking-wider mb-3">More</h3>
              <div className="space-y-3">
                {filterItems(uncategorized).map((item, idx) => (
                  <ItemCard key={item.id} item={item} index={idx} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {cartCount > 0 && (
        <motion.button initial={{ y: 100 }} animate={{ y: 0 }} onClick={() => navigate('/cart')}
          className="fixed bottom-20 left-4 right-4 max-w-lg mx-auto bg-gradient-saffron rounded-xl py-4 px-6 flex items-center justify-between shadow-saffron z-40">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-primary-foreground" />
            <span className="font-heading text-sm text-primary-foreground">{cartCount} item{cartCount > 1 ? 's' : ''}</span>
          </div>
          <span className="font-heading text-sm text-primary-foreground">View Cart →</span>
        </motion.button>
      )}

      <BottomNav />
    </div>
  );
};

export default HomePage;
