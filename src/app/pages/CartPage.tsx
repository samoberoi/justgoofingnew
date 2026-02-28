import { motion } from 'framer-motion';
import { ArrowLeft, Minus, Plus, Trash2, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { useState } from 'react';

const CartPage = () => {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, walletBalance, isFirstTime } = useAppStore();
  const [usePoints, setUsePoints] = useState(false);

  const subtotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const firstOrderDiscount = isFirstTime ? -Math.min(...cart.map(c => c.price)) : 0;
  const pointsDiscount = usePoints ? -Math.min(walletBalance, subtotal + firstOrderDiscount) : 0;
  const deliveryFee = subtotal > 500 ? 0 : 30;
  const total = subtotal + firstOrderDiscount + pointsDiscount + deliveryFee;

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="text-6xl mb-4">🍽️</div>
        <h2 className="font-heading text-xl text-foreground">Your Dawat is Empty</h2>
        <p className="text-muted-foreground text-sm mt-2">Add biryani to begin your royal feast</p>
        <button onClick={() => navigate('/app')} className="mt-6 px-6 py-3 bg-gradient-saffron rounded-lg font-heading text-sm text-primary-foreground">
          Browse Menu
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-foreground" /></button>
          <h1 className="font-heading text-lg text-foreground">Your Dawat</h1>
        </div>
      </header>

      {/* Items */}
      <div className="px-4 pt-4 space-y-3">
        {cart.map(item => (
          <motion.div key={item.id} layout className="bg-card border border-border rounded-xl p-4 flex gap-4">
            <div className="text-3xl w-12 h-12 flex items-center justify-center bg-muted rounded-lg shrink-0">{item.image}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <h3 className="font-heading text-sm text-foreground">{item.name}</h3>
                <button onClick={() => removeFromCart(item.id)}><Trash2 size={14} className="text-muted-foreground" /></button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-secondary font-heading text-sm">₹{item.price * item.quantity}</span>
                <div className="flex items-center gap-2 bg-muted rounded-lg">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1.5 text-secondary"><Minus size={12} /></button>
                  <span className="text-xs font-bold text-foreground w-3 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1.5 text-secondary"><Plus size={12} /></button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* First order offer */}
      {isFirstTime && (
        <div className="mx-4 mt-4 bg-secondary/10 border border-secondary/20 rounded-xl p-3 flex items-center gap-3">
          <Ticket size={18} className="text-secondary shrink-0" />
          <div>
            <p className="text-xs font-semibold text-secondary">1+1 FREE Applied! 🎉</p>
            <p className="text-[10px] text-muted-foreground">Cheapest biryani is free</p>
          </div>
        </div>
      )}

      {/* Use points */}
      {walletBalance > 0 && (
        <div className="mx-4 mt-3">
          <button
            onClick={() => setUsePoints(!usePoints)}
            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors ${usePoints ? 'bg-secondary/10 border-secondary/30' : 'bg-card border-border'}`}
          >
            <span className="text-sm text-foreground">Use Biryani Points ({walletBalance} pts)</span>
            <div className={`w-10 h-5 rounded-full transition-colors ${usePoints ? 'bg-secondary' : 'bg-muted'} flex items-center`}>
              <div className={`w-4 h-4 rounded-full bg-foreground transition-transform ${usePoints ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
          </button>
        </div>
      )}

      {/* Price breakdown */}
      <div className="mx-4 mt-4 bg-card border border-border rounded-xl p-4 space-y-2">
        <div className="flex justify-between text-sm text-foreground">
          <span>Subtotal</span><span>₹{subtotal}</span>
        </div>
        {firstOrderDiscount < 0 && (
          <div className="flex justify-between text-sm text-green-500">
            <span>1+1 FREE Discount</span><span>₹{firstOrderDiscount}</span>
          </div>
        )}
        {pointsDiscount < 0 && (
          <div className="flex justify-between text-sm text-secondary">
            <span>Points Redeemed</span><span>₹{pointsDiscount}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Delivery</span><span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
        </div>
        <div className="border-t border-border pt-2 flex justify-between font-heading text-base text-foreground">
          <span>Total</span><span className="text-secondary">₹{Math.max(0, total)}</span>
        </div>
      </div>

      {/* CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border p-4">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/app/payment')}
          className="w-full py-4 bg-gradient-saffron rounded-xl font-heading text-sm uppercase tracking-widest text-primary-foreground shadow-saffron"
        >
          Continue to Payment • ₹{Math.max(0, total)}
        </motion.button>
      </div>
    </div>
  );
};

export default CartPage;
