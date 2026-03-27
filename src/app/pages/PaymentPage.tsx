import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Smartphone, CreditCard, Building2, Wallet, CheckCircle2, MapPin, Navigation, Loader2, Home, User, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { supabase } from '@/integrations/supabase/client';

const paymentMethods = [
  { id: 'upi', label: 'UPI', icon: Smartphone, desc: 'Google Pay, PhonePe, Paytm' },
  { id: 'card', label: 'Card', icon: CreditCard, desc: 'Credit or Debit Card' },
  { id: 'netbanking', label: 'Net Banking', icon: Building2, desc: 'All major banks' },
  { id: 'cod', label: 'Cash on Delivery', icon: Wallet, desc: 'Pay when delivered' },
];

interface SavedAddress {
  id: string;
  formatted_address: string;
  house_number: string | null;
  label: string | null;
}

const PaymentPage = () => {
  const navigate = useNavigate();
  const { cart, clearCart, userName, phoneNumber, savedAddresses, walletBalance, activeCampaigns, totalOrders, refreshUserData } = useAppStore();
  const [selected, setSelected] = useState('upi');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [orderId, setOrderId] = useState('');
  const [address, setAddress] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [customerName, setCustomerName] = useState(userName || '');
  const [usePoints, setUsePoints] = useState(false);
  const [locatingGPS, setLocatingGPS] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);

  // Saved addresses from DB
  const [dbAddresses, setDbAddresses] = useState<SavedAddress[]>([]);
  const [showAddressPicker, setShowAddressPicker] = useState(false);

  // Delivery settings from DB
  const [deliveryFee, setDeliveryFee] = useState(30);
  const [freeDeliveryAbove, setFreeDeliveryAbove] = useState(500);

  useEffect(() => {
    const init = async () => {
      const [deliveryRes, authRes] = await Promise.all([
        supabase.from('delivery_settings' as any).select('*').limit(1).maybeSingle(),
        supabase.auth.getUser(),
      ]);

      if (deliveryRes.data) {
        setDeliveryFee(Number((deliveryRes.data as any).base_delivery_fee) || 30);
        setFreeDeliveryAbove(Number((deliveryRes.data as any).free_delivery_above) || 500);
      }

      const user = authRes.data?.user;
      if (user) {
        // Fetch saved addresses
        const { data: addrs } = await supabase
          .from('addresses' as any)
          .select('id, formatted_address, house_number, label')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (addrs && addrs.length > 0) {
          const seen = new Set<string>();
          const unique = (addrs as unknown as SavedAddress[]).filter(a => {
            if (seen.has(a.formatted_address)) return false;
            seen.add(a.formatted_address);
            return true;
          });
          setDbAddresses(unique);
        }

        // Fetch name from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .maybeSingle();
        if (profile?.full_name) {
          setCustomerName(profile.full_name);
        }
      }
    };
    init();
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
    if (!navigator.geolocation) return;
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
        setLocationDetected(true);
      },
      () => { setLocatingGPS(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSelectSavedAddress = (addr: SavedAddress) => {
    setAddress(addr.formatted_address);
    setHouseNumber(addr.house_number || '');
    setShowAddressPicker(false);
    setLocationDetected(true);
  };

  const fullAddress = houseNumber ? `${houseNumber}, ${address}` : address;

  const handlePay = async () => {
    if (!address.trim() || !customerName.trim() || processing) return;
    setProcessing(true);

    try {
      const [storesRes, pointsRes, authRes] = await Promise.all([
        supabase.from('stores').select('id').eq('is_active', true).limit(1),
        supabase.from('points_settings').select('*').limit(1).maybeSingle(),
        supabase.auth.getUser(),
      ]);

      const storeId = storesRes.data?.[0]?.id;
      if (!storeId) { setProcessing(false); return; }

      const user = authRes.data?.user;
      const pointsSettings = (pointsRes.data as any) || null;

      const orderPayload = {
        store_id: storeId,
        user_id: user?.id || null,
        customer_name: customerName.trim(),
        customer_phone: phoneNumber || user?.phone || null,
        customer_address: fullAddress,
        house_number: houseNumber || null,
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
        .insert(orderPayload as any)
        .select('id, order_number')
        .maybeSingle();

      if (orderError || !order) {
        console.error('PLACE_ORDER: Order insert failed', orderError);
        setProcessing(false);
        return;
      }

      // Insert order items
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

      await supabase.from('order_items').insert(orderItems);

      // Save address for user (avoid duplicates by formatted_address + house_number combo)
      if (user && address.trim()) {
        const alreadySaved = dbAddresses.some(
          a => a.formatted_address === address && (a.house_number || '') === (houseNumber || '')
        );
        if (!alreadySaved) {
          await supabase.from('addresses' as any).insert({
            user_id: user.id,
            formatted_address: address,
            house_number: houseNumber || null,
            label: 'Delivery',
          });
        }
      }

      // Save name to profile
      if (user && customerName.trim()) {
        await supabase.from('profiles').update({ full_name: customerName.trim() }).eq('user_id', user.id);
      }

      // Earn Biryan Points
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
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }} className="text-center space-y-6">
          <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 1 }} className="inline-block">
            <CheckCircle2 size={80} className="text-secondary" />
          </motion.div>
          <h1 className="font-heading text-2xl text-gradient-gold leading-tight">Your Royal Dawat<br />Has Been Sealed</h1>
          <p className="text-muted-foreground text-sm">Order #{orderNumber}</p>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/tracking', { state: { orderId } })}
            className="w-full py-4 bg-gradient-saffron rounded-xl font-heading text-sm uppercase tracking-widest text-primary-foreground">
            Track My Biryani
          </motion.button>
          <button onClick={() => navigate('/home')} className="text-muted-foreground text-xs underline">Back to Menu</button>
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
        {/* Customer Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><User size={12} /> Your Name</label>
          <input
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            placeholder="Enter your full name *"
            className={`w-full px-3 py-2.5 bg-muted border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-secondary ${
              !customerName.trim() ? 'border-destructive/50' : 'border-border'
            }`}
          />
          {!customerName.trim() && (
            <p className="text-[11px] text-destructive">Name is required to place an order</p>
          )}
        </div>

        {/* Delivery address */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><MapPin size={12} /> Delivery Address</label>

          {/* Saved addresses */}
          {dbAddresses.length > 0 && (
            <div className="space-y-1.5">
              <button
                onClick={() => setShowAddressPicker(!showAddressPicker)}
                className="w-full flex items-center justify-between p-3 bg-card border border-border rounded-xl text-sm text-foreground"
              >
                <span className="text-muted-foreground">📍 Saved Addresses ({dbAddresses.length})</span>
                <ChevronDown size={14} className={`text-muted-foreground transition-transform ${showAddressPicker ? 'rotate-180' : ''}`} />
              </button>
              {showAddressPicker && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-1.5">
                  {dbAddresses.map(addr => (
                    <button
                      key={addr.id}
                      onClick={() => handleSelectSavedAddress(addr)}
                      className="w-full text-left p-3 bg-muted/50 border border-border rounded-lg text-sm text-foreground hover:border-secondary/50 transition-colors"
                    >
                      <p className="font-medium text-xs">{addr.label || 'Delivery'}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                        {addr.house_number ? `${addr.house_number}, ` : ''}{addr.formatted_address}
                      </p>
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          )}

          {/* Use current location button */}
          {!locationDetected && !address && (
            <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileTap={{ scale: 0.97 }}
              onClick={handleUseCurrentLocation} disabled={locatingGPS}
              className="w-full flex items-center gap-3 p-3.5 bg-secondary/10 border border-secondary/30 rounded-xl text-sm text-foreground transition-colors">
              {locatingGPS ? <Loader2 size={18} className="text-secondary animate-spin" /> : <Navigation size={18} className="text-secondary" />}
              <div className="text-left">
                <p className="font-semibold text-sm">{locatingGPS ? 'Detecting location...' : 'Use Current Location'}</p>
                <p className="text-xs text-muted-foreground">Auto-fill address using GPS</p>
              </div>
            </motion.button>
          )}

          <textarea value={address} onChange={e => setAddress(e.target.value)}
            placeholder="Enter your full delivery address..."
            rows={2}
            className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-secondary resize-none" />

          <div className="relative">
            <Home size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={houseNumber}
              onChange={e => setHouseNumber(e.target.value)}
              placeholder="House / Flat / Floor number (e.g. B-204, 2nd Floor)"
              className="w-full pl-9 pr-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-secondary"
            />
          </div>

          {address && (
            <button onClick={handleUseCurrentLocation} disabled={locatingGPS}
              className="flex items-center gap-1.5 text-xs text-secondary font-medium">
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
          <button onClick={() => setUsePoints(!usePoints)}
            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors ${usePoints ? 'bg-secondary/10 border-secondary/30' : 'bg-card border-border'}`}>
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
            <motion.button key={method.id} whileTap={{ scale: 0.98 }} onClick={() => setSelected(method.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                selected === method.id ? 'bg-secondary/10 border-secondary/30' : 'bg-card border-border'
              }`}>
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
        <motion.button whileTap={{ scale: 0.97 }} onClick={handlePay} disabled={processing || !address.trim() || !customerName.trim()}
          className="w-full py-4 bg-gradient-saffron rounded-xl font-heading text-sm uppercase tracking-widest text-primary-foreground shadow-saffron disabled:opacity-60 flex items-center justify-center gap-2">
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
