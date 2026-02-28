import { motion } from 'framer-motion';
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RoyalHeader from '../components/RoyalHeader';
import BottomNav from '../components/BottomNav';
import { useAppStore, BIRYANI_MENU } from '../store';

const HomePage = () => {
  const navigate = useNavigate();
  const { cart, addToCart, updateQuantity } = useAppStore();

  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const getCartQty = (id: string) => cart.find(c => c.id === id)?.quantity || 0;

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

      <div className="px-4 space-y-4">
        {BIRYANI_MENU.map((item, i) => {
          const qty = getCartQty(item.id);
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-card border border-border rounded-xl p-4 flex gap-4"
            >
              <div className="text-4xl w-16 h-16 flex items-center justify-center bg-muted rounded-lg shrink-0">
                {item.image}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-heading text-sm text-foreground leading-tight">{item.name}</h3>
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {item.tags.map(tag => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{item.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="font-heading text-base text-secondary">₹{item.price}</span>
                  {qty === 0 ? (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => addToCart(item)}
                      className="px-4 py-2 bg-gradient-saffron rounded-lg text-xs font-heading uppercase tracking-wider text-primary-foreground"
                    >
                      Add to Dawat
                    </motion.button>
                  ) : (
                    <div className="flex items-center gap-3 bg-muted rounded-lg">
                      <button onClick={() => updateQuantity(item.id, qty - 1)} className="p-2 text-secondary">
                        <Minus size={14} />
                      </button>
                      <span className="font-bold text-sm text-foreground w-4 text-center">{qty}</span>
                      <button onClick={() => updateQuantity(item.id, qty + 1)} className="p-2 text-secondary">
                        <Plus size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Floating Cart Button */}
      {cartCount > 0 && (
        <motion.button
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          onClick={() => navigate('/app/cart')}
          className="fixed bottom-20 left-4 right-4 max-w-lg mx-auto bg-gradient-saffron rounded-xl py-4 px-6 flex items-center justify-between shadow-saffron z-40"
        >
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-primary-foreground" />
            <span className="font-heading text-sm text-primary-foreground">{cartCount} item{cartCount > 1 ? 's' : ''}</span>
          </div>
          <span className="font-heading text-sm text-primary-foreground">
            View Cart →
          </span>
        </motion.button>
      )}

      <BottomNav />
    </div>
  );
};

export default HomePage;
