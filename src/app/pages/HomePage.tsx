import { motion } from 'framer-motion';
import { Plus, Minus, ShoppingCart, Leaf, Drumstick, Flame, Star, ChefHat, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RoyalHeader from '../components/RoyalHeader';
import BottomNav from '../components/BottomNav';
import { useAppStore } from '../store';
import { useMenu, MenuItem } from '../hooks/useMenu';

const SpiceIndicator = ({ level }: { level: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <Flame key={i} size={10} className={i <= level ? 'text-destructive fill-destructive' : 'text-muted-foreground/30'} />
    ))}
  </div>
);

const ItemCard = ({ item, index }: { item: MenuItem; index: number }) => {
  const { cart, addToCart, updateQuantity } = useAppStore();
  const qty = cart.find(c => c.id === item.id)?.quantity || 0;

  const handleAdd = () => {
    addToCart({
      id: item.id,
      name: item.name,
      description: item.description || '',
      price: item.discounted_price || item.price,
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
          <div className="flex items-center gap-1.5">
            {item.is_veg ? <Leaf size={12} className="text-green-500 shrink-0" /> : <Drumstick size={12} className="text-destructive shrink-0" />}
            <h3 className="font-heading text-sm text-foreground leading-tight">{item.name}</h3>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {item.is_bestseller && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-medium flex items-center gap-0.5"><Star size={8} />Bestseller</span>
          )}
          {item.is_chefs_special && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent-foreground font-medium flex items-center gap-0.5"><ChefHat size={8} />Chef's Special</span>
          )}
          {item.is_new && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium flex items-center gap-0.5"><Sparkles size={8} />New</span>
          )}
          {(item.tags || []).filter(t => !['Bestseller', 'Non-Veg', 'Veg', 'New'].includes(t)).map(tag => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-medium">{tag}</span>
          ))}
        </div>
        {item.spice_level && item.spice_level > 0 && (
          <div className="mt-1"><SpiceIndicator level={item.spice_level} /></div>
        )}
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <span className="font-heading text-base text-secondary">₹{item.discounted_price || item.price}</span>
            {item.discounted_price && item.discounted_price < item.price && (
              <span className="text-xs text-muted-foreground line-through">₹{item.price}</span>
            )}
          </div>
          {qty === 0 ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleAdd}
              className="px-4 py-2 bg-gradient-saffron rounded-lg text-xs font-heading uppercase tracking-wider text-primary-foreground"
            >
              Add to Dawat
            </motion.button>
          ) : (
            <div className="flex items-center gap-3 bg-muted rounded-lg">
              <button onClick={() => updateQuantity(item.id, qty - 1)} className="p-2 text-secondary"><Minus size={14} /></button>
              <span className="font-bold text-sm text-foreground w-4 text-center">{qty}</span>
              <button onClick={() => updateQuantity(item.id, qty + 1)} className="p-2 text-secondary"><Plus size={14} /></button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const HomePage = () => {
  const navigate = useNavigate();
  const { cart } = useAppStore();
  const { categories, grouped, uncategorized, loading } = useMenu();

  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  return (
    <div className="min-h-screen bg-background pb-20">
      <RoyalHeader />

      {/* Banner */}
      <div className="px-4 pt-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-secondary/20 to-primary/20 border border-secondary/20 rounded-xl p-4"
        >
          <p className="font-heading text-sm text-secondary">🔥 1+1 FREE on your first order!</p>
          <p className="text-xs text-muted-foreground mt-1">Auto-applied at checkout</p>
        </motion.div>
      </div>

      {/* Menu */}
      <div className="px-4 pt-6 pb-2">
        <h2 className="font-heading text-lg text-foreground">The Royal Menu</h2>
        <p className="text-xs text-muted-foreground mt-1">Crafted with 500 years of tradition</p>
      </div>

      {loading ? (
        <div className="px-4 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="px-4 space-y-6">
          {categories.filter(c => grouped.has(c.id)).map(cat => (
            <div key={cat.id}>
              <div className="flex items-center gap-2 mb-3">
                {cat.image_url && <img src={cat.image_url} className="w-6 h-6 rounded object-cover" alt="" />}
                <h3 className="font-heading text-sm text-secondary uppercase tracking-wider">{cat.name}</h3>
              </div>
              {cat.description && <p className="text-xs text-muted-foreground -mt-2 mb-3">{cat.description}</p>}
              <div className="space-y-3">
                {grouped.get(cat.id)?.map((item, idx) => (
                  <ItemCard key={item.id} item={item} index={idx} />
                ))}
              </div>
            </div>
          ))}

          {uncategorized.length > 0 && (
            <div>
              <h3 className="font-heading text-sm text-muted-foreground uppercase tracking-wider mb-3">More</h3>
              <div className="space-y-3">
                {uncategorized.map((item, idx) => (
                  <ItemCard key={item.id} item={item} index={idx} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Cart Button */}
      {cartCount > 0 && (
        <motion.button
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          onClick={() => navigate('/cart')}
          className="fixed bottom-20 left-4 right-4 max-w-lg mx-auto bg-gradient-saffron rounded-xl py-4 px-6 flex items-center justify-between shadow-saffron z-40"
        >
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
