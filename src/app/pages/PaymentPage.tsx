import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Smartphone, CreditCard, Building2, Wallet, CheckCircle2, MapPin, Navigation, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { supabase } from '@/integrations/supabase/client';

const paymentMethods = [
  { id: 'upi', label: 'UPI', icon: Smartphone, desc: 'Google Pay, PhonePe, Paytm' },
  { id: 'card', label: 'Card', icon: CreditCard, desc: 'Credit or Debit Card' },
  { id: 'netbanking', label: 'Net Banking', icon: Building2, desc: 'All major banks' },
  { id: 'cod', label: 'Cash on Delivery', icon: Wallet, desc: 'Pay when delivered' },
];

const PaymentPage = () => {
  const navigate = useNavigate();
  const { cart, clearCart, userName, phoneNumber, savedAddresses, walletBalance, activeCampaigns, totalOrders, refreshUserData } = useAppStore();
  const [selected, setSelected] = useState('upi');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [orderId, setOrderId] = useState('');
  const [address, setAddress] = useState(savedAddresses[0] || '');
  const [usePoints, setUsePoints] = useState(false);
  const [locatingGPS, setLocatingGPS] = useState(false);
  const [locationPromptShown, setLocationPromptShown] = useState(false);

  // Delivery settings from DB
  const [deliveryFee, setDeliveryFee] = useState(30);
  const [freeDeliveryAbove, setFreeDeliveryAbove] = useState(500);

  useEffect(() => {
    const fetchDeliverySettings = async () => {
      const { data } = await supabase.from('delivery_settings' as any).select('*').limit(1).maybeSingle();
      if (data) {
        setDeliveryFee(Number((data as any).base_delivery_fee) || 30);
        setFreeDeliveryAbove(Number((data as any).free_delivery_above) || 500);
      }
    };
    fetchDeliverySettings();
  }, []);

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
  const computedDeliveryFee = subtotal > freeDeliveryAbove ? 0 : deliveryFee;
  const total = Math.max(0, subtotal + firstOrderDiscount + pointsDiscount + computedDeliveryFee);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationPromptShown(true);
      return;
    }
    setLocatingGPS(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          setAddress(data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        } catch {
          setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        }
        setLocatingGPS(false);
        setLocationPromptShown(true);
      },
      () => {
        setLocatingGPS(false);
        setLocationPromptShown(true);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePay = async () => {
    if (!address.trim() || processing) return;
    setProcessing(true);

    try {
      // Parallel fetch of settings + store
      const [storesRes, pointsRes] = await Promise.all([
        supabase.from('stores').select('id').eq('is_active', true).limit(1),
        supabase.from('points_settings').select('*').limit(1).maybeSingle(),
      ]);

      const storeId = storesRes.data?.[0]?.id;
      if (!storeId) {
        console.error('PLACE_ORDER: No active store found', storesRes.error);
        setProcessing(false);
        return;
      }

      const pointsSettings = (pointsRes.data as any) || null;

      // Insert order
      const orderPayload = {
        store_id: storeId,
        customer_name: userName || 'Guest',
        customer_phone: phoneNumber || null,
        customer_address: address,
        subtotal,
        discount: Math.abs(firstOrderDiscount) + Math.abs(pointsDiscount),
        tax: 0,
        total,
        payment_method: selected,
        payment_status: selected === 'cod' ? 'pending' : 'paid',
        status: 'new' as const,
        order_number: 'BRY-' + Math.floor(10000 + Math.random() * 90000),
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderPayload)
        .select('id, order_number')
        .maybeSingle();

      if (orderError || !order) {
        console.error('PLACE_ORDER: Order insert failed', orderError);
        setProcessing(false);
        return;
      }

      // Insert order items — use menu_item_id only if it's a valid UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const orderItems = cart.map(item => {
        const rawId = item.id.includes('_') ? item.id.split('_')[0] : item.id;
        return {
          order_id: order.id,
          menu_item_id: uuidRegex.test(rawId) ? rawId : null,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        };
      });

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) console.error('PLACE_ORDER: Items insert failed', itemsError);

      // Earn Biryan Points
      const { data: { user } } = await supabase.auth.getUser();
      if (user && pointsSettings?.earning_enabled) {
        const earnPercent = pointsSettings.earning_percent || 2.5;
        let pointsEarned = Math.floor(total * earnPercent / 100);
        if (pointsSettings.max_earn_per_order) {
          pointsEarned = Math.min(pointsEarned, pointsSettings.max_earn_per_order);
        }
        if (pointsEarned > 0) {
          const expiresAt = pointsSettings.expiry_days
            ? new Date(Date.now() + pointsSettings.expiry_days * 86400000).toISOString()
            : null;
          await supabase.from('points_transactions').insert({
            user_id: user.id,
            type: 'earned',
            amount: pointsEarned,
            balance_after: walletBalance + pointsEarned,
            description: `Earned from Order #${order.order_number}`,
            order_id: order.id,
            expires_at: expiresAt,
          } as any);
        }
      }

      // Deduct points if used
      if (usePoints && pointsDiscount < 0 && user) {
        await supabase.from('points_transactions').insert({
          user_id: user.id,
          type: 'spent',
          amount: pointsDiscount,
          balance_after: walletBalance + pointsDiscount,
          description: `Redeemed on Order #${order.order_number}`,
          order_id: order.id,
        } as any);
      }

      setOrderNumber(order.order_number);
      setOrderId(order.id);
      setProcessing(false);
      setSuccess(true);
      clearCart();
      refreshUserData();
    } catch (err) {
      console.error('Payment error:', err);
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 12 }}
          className="text-center space-y-6"
        >
          <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 1 }} className="inline-block">
            <CheckCircle2 size={80} className="text-secondary" />
          </motion.div>
          <h1 className="font-heading text-2xl text-gradient-gold leading-tight">
            Your Royal Dawat<br />Has Been Sealed
          </h1>
          <p className="text-muted-foreground text-sm">Order #{orderNumber}</p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/tracking', { state: { orderId } })}
            className="w-full py-4 bg-gradient-saffron rounded-xl font-heading text-sm uppercase tracking-widest text-primary-foreground"
          >
            Track My Biryani
          </motion.button>
          <button onClick={() => navigate('/home')} className="text-muted-foreground text-xs underline">
            Back to Menu
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-foreground" /></button>
          <h1 className="font-heading text-lg text-foreground">Checkout</h1>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-4">
        {/* Delivery address with GPS prompt */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><MapPin size={12} /> Delivery Address</label>

          {!locationPromptShown && !address && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleUseCurrentLocation}
              disabled={locatingGPS}
              className="w-full flex items-center gap-3 p-3.5 bg-secondary/10 border border-secondary/30 rounded-xl text-sm text-foreground transition-colors"
            >
              {locatingGPS ? (
                <Loader2 size={18} className="text-secondary animate-spin" />
              ) : (
                <Navigation size={18} className="text-secondary" />
              )}
              <div className="text-left">
                <p className="font-semibold text-sm">{locatingGPS ? 'Detecting location...' : 'Use Current Location'}</p>
                <p className="text-xs text-muted-foreground">Auto-fill address using GPS</p>
              </div>
            </motion.button>
          )}

          <textarea
            value={address}
            onChange={e => { setAddress(e.target.value); setLocationPromptShown(true); }}
            placeholder="Enter your full delivery address..."
            rows={2}
            className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-secondary resize-none"
          />

          {locationPromptShown && (
            <button
              onClick={handleUseCurrentLocation}
              disabled={locatingGPS}
              className="flex items-center gap-1.5 text-xs text-secondary font-medium"
            >
              {locatingGPS ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
              {locatingGPS ? 'Detecting...' : 'Re-detect location'}
            </button>
          )}
        </div>

        {/* Order summary */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground">Order Summary</h3>
          {cart.map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-foreground">{item.name} x{item.quantity}</span>
              <span className="text-foreground">₹{item.price * item.quantity}</span>
            </div>
          ))}
          <div className="border-t border-border pt-2 space-y-1">
            <div className="flex justify-between text-sm text-foreground"><span>Subtotal</span><span>₹{subtotal}</span></div>
            {firstOrderDiscount < 0 && <div className="flex justify-between text-sm text-green-500"><span>1+1 FREE</span><span>₹{firstOrderDiscount}</span></div>}
            {pointsDiscount < 0 && <div className="flex justify-between text-sm text-secondary"><span>Points</span><span>₹{pointsDiscount}</span></div>}
            <div className="flex justify-between text-sm text-muted-foreground"><span>Delivery</span><span>{computedDeliveryFee === 0 ? 'FREE' : `₹${computedDeliveryFee}`}</span></div>
            <div className="flex justify-between font-heading text-base text-foreground pt-1 border-t border-border">
              <span>Total</span><span className="text-secondary">₹{total}</span>
            </div>
          </div>
        </div>

        {/* Points toggle */}
        {walletBalance > 0 && (
          <button
            onClick={() => setUsePoints(!usePoints)}
            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors ${usePoints ? 'bg-secondary/10 border-secondary/30' : 'bg-card border-border'}`}
          >
            <span className="text-sm text-foreground">Use Biryan Points ({walletBalance} pts)</span>
            <div className={`w-10 h-5 rounded-full transition-colors ${usePoints ? 'bg-secondary' : 'bg-muted'} flex items-center`}>
              <div className={`w-4 h-4 rounded-full bg-foreground transition-transform ${usePoints ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
          </button>
        )}

        {/* Payment method */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Payment Method</p>
          {paymentMethods.map(method => (
            <motion.button
              key={method.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelected(method.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                selected === method.id ? 'bg-secondary/10 border-secondary/30' : 'bg-card border-border'
              }`}
            >
              <method.icon size={22} className={selected === method.id ? 'text-secondary' : 'text-muted-foreground'} />
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">{method.label}</p>
                <p className="text-xs text-muted-foreground">{method.desc}</p>
              </div>
              <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selected === method.id ? 'border-secondary' : 'border-muted-foreground/30'
              }`}>
                {selected === method.id && <div className="w-2.5 h-2.5 rounded-full bg-secondary" />}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border p-4">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handlePay}
          disabled={processing || !address.trim()}
          className="w-full py-4 bg-gradient-saffron rounded-xl font-heading text-sm uppercase tracking-widest text-primary-foreground shadow-saffron disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {processing ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full" />
          ) : (
            `Place Order • ₹${total}`
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default PaymentPage;
