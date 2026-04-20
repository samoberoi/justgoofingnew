import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Minus, Plus, Trash2, Ticket, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { useState } from 'react';

const CartPage = () => {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, walletBalance, activeCampaigns, totalOrders } = useAppStore();
  const [usePoints, setUsePoints] = useState(false);

  const subtotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);

  const freeItemCampaign = activeCampaigns.find(c =>
    c.type === 'free_item' && c.is_active && c.auto_apply &&
    (c.target_audience === 'all' || (c.target_audience === 'new_users' && totalOrders === 0)) &&
    (c.category === 'first_order' ? totalOrders === 0 : true)
  );

  const firstOrderDiscount = freeItemCampaign && cart.length > 0
    ? -Math.min(...cart.map(c => c.price))
    : 0;

  const pointsDiscount = usePoints ? -Math.min(walletBalance, subtotal + firstOrderDiscount) : 0;
  const deliveryFee = subtotal > 500 ? 0 : 30;
  const total = subtotal + firstOrderDiscount + pointsDiscount + deliveryFee;

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-5">
          <ShoppingBag size={32} className="text-muted-foreground/40" />
        </div>
        <h2 className="font-heading text-lg text-foreground">Your Cart is Empty</h2>
        <p className="text-muted-foreground text-sm mt-2">Add some items to start your order</p>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/home')}
          className="mt-6 px-8 py-3.5 bg-gradient-saffron rounded-xl font-heading text-sm text-primary-foreground shadow-saffron">
          Browse Menu
        </motion.button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-2xl border-b border-secondary/10">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-foreground" /></button>
          <h1 className="font-heading text-lg text-foreground">Your Cart</h1>
          <span className="ml-auto text-xs text-muted-foreground">{cart.length} item{cart.length > 1 ? 's' : ''}</span>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-2.5">
        <AnimatePresence>
          {cart.map(item => (
            <motion.div key={item.id} layout exit={{ opacity: 0, x: -100 }}
              className="bg-card border border-border rounded-2xl p-4 flex gap-3">
              <div className="w-14 h-14 rounded-xl shrink-0 overflow-hidden bg-muted">
                {item.image?.startsWith('http') ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary/10 to-muted">
                    <span className="text-2xl">🍛</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <h3 className="font-heading text-sm text-foreground leading-snug">{item.name}</h3>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => removeFromCart(item.id)}
                    className="p-1 rounded-lg hover:bg-accent/10 transition-colors">
                    <Trash2 size={13} className="text-muted-foreground hover:text-accent transition-colors" />
                  </motion.button>
                </div>
                <div className="flex items-center justify-between mt-2.5">
                  <span className="text-secondary font-heading text-sm">₹{item.price * item.quantity}</span>
                  <div className="flex items-center gap-0 bg-gradient-saffron rounded-xl overflow-hidden">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-2.5 py-1.5 text-primary-foreground"><Minus size={12} /></button>
                    <span className="text-xs font-bold text-primary-foreground w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-2.5 py-1.5 text-primary-foreground"><Plus size={12} /></button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Campaign offer */}
      {freeItemCampaign && firstOrderDiscount < 0 && (
        <div className="mx-4 mt-3 bg-green-500/8 border border-green-500/15 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-500/15 flex items-center justify-center shrink-0">
            <Ticket size={14} className="text-green-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-green-500">{freeItemCampaign.name}</p>
            <p className="text-[10px] text-muted-foreground">Cheapest biryani is free!</p>
          </div>
        </div>
      )}

      {/* Use points */}
      {walletBalance > 0 && (
        <div className="mx-4 mt-2.5">
          <button
            onClick={() => setUsePoints(!usePoints)}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all ${usePoints ? 'bg-secondary/10 border-secondary/25' : 'bg-card border-border'}`}
          >
            <span className="text-sm text-foreground">Use Goofy Points ({walletBalance} pts)</span>
            <div className={`w-11 h-6 rounded-full transition-colors ${usePoints ? 'bg-secondary' : 'bg-muted'} flex items-center px-0.5`}>
              <div className={`w-5 h-5 rounded-full bg-card shadow-sm transition-transform ${usePoints ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
          </button>
        </div>
      )}

      {/* Price breakdown */}
      <div className="mx-4 mt-3 bg-card border border-border rounded-2xl p-4 space-y-2.5">
        <div className="flex justify-between text-sm text-foreground">
          <span>Subtotal</span><span className="tabular-nums">₹{subtotal}</span>
        </div>
        {firstOrderDiscount < 0 && (
          <div className="flex justify-between text-sm text-green-500">
            <span>1+1 FREE Discount</span><span className="tabular-nums">-₹{Math.abs(firstOrderDiscount)}</span>
          </div>
        )}
        {pointsDiscount < 0 && (
          <div className="flex justify-between text-sm text-secondary">
            <span>Points Redeemed</span><span className="tabular-nums">-₹{Math.abs(pointsDiscount)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Delivery</span><span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
        </div>
        <div className="border-t border-border pt-2.5 flex justify-between font-heading text-base text-foreground">
          <span>Total</span><span className="text-secondary tabular-nums">₹{Math.max(0, total)}</span>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-2xl border-t border-secondary/10 p-4">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/payment')}
          className="w-full py-4 bg-gradient-saffron rounded-2xl font-heading text-sm uppercase tracking-widest text-primary-foreground shadow-saffron"
        >
          Continue to Payment • ₹{Math.max(0, total)}
        </motion.button>
      </div>
    </div>
  );
};

export default CartPage;
