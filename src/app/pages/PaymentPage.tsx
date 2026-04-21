import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Navigation, Loader2, Home, User, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { supabase } from '@/integrations/supabase/client';
import Icon3D, { Icon3DName } from '../components/Icon3D';

const paymentMethods: { id: string; label: string; icon: Icon3DName; desc: string }[] = [
  { id: 'upi', label: 'UPI', icon: 'payment', desc: 'Google Pay, PhonePe, Paytm' },
  { id: 'card', label: 'Card', icon: 'wallet', desc: 'Credit or Debit Card' },
  { id: 'netbanking', label: 'Net Banking', icon: 'wallet', desc: 'All major banks' },
  { id: 'cod', label: 'Pay on arrival', icon: 'pin', desc: 'Pay when you arrive' },
];

interface SavedAddress {
  id: string;
  formatted_address: string;
  house_number: string | null;
  label: string | null;
}

const PaymentPage = () => {
  const navigate = useNavigate();
  const { cart, clearCart, userName, phoneNumber, walletBalance, activeCampaigns, totalOrders, refreshUserData } = useAppStore();
  const [selected, setSelected] = useState('upi');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [address, setAddress] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [customerName, setCustomerName] = useState(userName || '');
  const [usePoints, setUsePoints] = useState(false);
  const [locatingGPS, setLocatingGPS] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);

  const [dbAddresses, setDbAddresses] = useState<SavedAddress[]>([]);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
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
        const { data: addrs } = await supabase
          .from('addresses' as any)
          .select('id, formatted_address, house_number, label')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (addrs) {
          const seen = new Set<string>();
          const unique = (addrs as unknown as SavedAddress[]).filter(a => {
            const key = `${a.formatted_address}||${a.house_number || ''}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          setDbAddresses(unique);
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .maybeSingle();
        if (profile?.full_name) setCustomerName(profile.full_name);
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

  const firstOrderDiscount = freeItemCampaign && cart.length > 0 ? -Math.min(...cart.map(c => c.price)) : 0;
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

      let resolvedPhone = phoneNumber || user?.phone || null;
      if (!resolvedPhone && user) {
        const { data: prof } = await supabase.from('profiles').select('phone').eq('user_id', user.id).maybeSingle();
        if (prof?.phone) resolvedPhone = prof.phone;
      }

      const orderPayload = {
        store_id: storeId,
        user_id: user?.id || null,
        customer_name: customerName.trim(),
        customer_phone: resolvedPhone,
        customer_address: address.trim(),
        house_number: houseNumber.trim() || null,
        subtotal,
        discount: Math.abs(firstOrderDiscount) + Math.abs(pointsDiscount),
        tax: 0,
        total,
        payment_method: selected,
        payment_status: selected === 'cod' ? 'pending' : 'paid',
        status: 'new' as const,
        order_number: 'GOOF-' + Math.floor(10000 + Math.random() * 90000),
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
      if (user && customerName.trim()) {
        await supabase.from('profiles').update({ full_name: customerName.trim() }).eq('user_id', user.id);
      }

      if (user && pointsSettings?.earning_enabled) {
        const earnPercent = pointsSettings.earning_percent || 2.5;
        let pointsEarned = Math.floor(total * earnPercent / 100);
        if (pointsSettings.max_earn_per_order) pointsEarned = Math.min(pointsEarned, pointsSettings.max_earn_per_order);
        if (pointsEarned > 0) {
          const expiresAt = pointsSettings.expiry_days ? new Date(Date.now() + pointsSettings.expiry_days * 86400000).toISOString() : null;
          await supabase.from('points_transactions').insert({
            user_id: user.id, type: 'earned', amount: pointsEarned,
            balance_after: walletBalance + pointsEarned,
            description: `Earned from Order #${order.order_number}`,
            order_id: order.id, expires_at: expiresAt,
          } as any);
        }
      }

      if (usePoints && pointsDiscount < 0 && user) {
        await supabase.from('points_transactions').insert({
          user_id: user.id, type: 'spent', amount: pointsDiscount,
          balance_after: walletBalance + pointsDiscount,
          description: `Redeemed on Order #${order.order_number}`,
          order_id: order.id,
        } as any);
      }

      setOrderNumber(order.order_number);
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
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }} className="text-center space-y-6 max-w-sm w-full">
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }} className="inline-block">
            <Icon3D name="gift" size={120} alt="" />
          </motion.div>
          <div>
            <h1 className="font-display text-3xl text-ink leading-tight -tracking-wide">Booking confirmed!</h1>
            <p className="text-muted-foreground text-sm font-heading mt-2">Order #{orderNumber}</p>
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/orders')}
            className="w-full py-4 bg-ink rounded-full font-display text-base text-white">
            View my booking
          </motion.button>
          <button onClick={() => navigate('/home')} className="text-muted-foreground text-xs underline font-heading">Back to home</button>
        </motion.div>
      </div>
    );
  }

  const fullAddressDisplay = houseNumber ? `${houseNumber}, ${address}` : address;

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-5 h-16 max-w-lg mx-auto">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft size={18} className="text-ink" strokeWidth={2.5} />
          </motion.button>
          <h1 className="font-display text-xl text-ink -tracking-wide">Checkout</h1>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-4 max-w-lg mx-auto">
        {/* Customer Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-heading text-ink/70 flex items-center gap-1"><User size={12} /> Your Name</label>
          <input
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            placeholder="Enter your full name *"
            className={`w-full px-4 py-3.5 bg-card border-2 rounded-2xl text-sm text-ink placeholder:text-ink/35 focus:outline-none focus:border-coral transition-colors ${
              !customerName.trim() ? 'border-destructive/40' : 'border-ink/8'
            }`}
          />
        </div>

        {/* Address */}
        <div className="space-y-2">
          <label className="text-xs font-heading text-ink/70 flex items-center gap-1"><MapPin size={12} /> Delivery Address</label>

          {dbAddresses.length > 0 && (
            <div className="space-y-1.5">
              <button
                onClick={() => setShowAddressPicker(!showAddressPicker)}
                className="w-full flex items-center justify-between p-3.5 bg-card border-2 border-ink/8 rounded-2xl text-sm text-ink"
              >
                <span className="text-ink/60 font-heading">📍 Saved addresses ({dbAddresses.length})</span>
                <ChevronDown size={14} className={`text-ink/40 transition-transform ${showAddressPicker ? 'rotate-180' : ''}`} />
              </button>
              {showAddressPicker && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-1.5">
                  {dbAddresses.map(addr => (
                    <button
                      key={addr.id}
                      onClick={() => handleSelectSavedAddress(addr)}
                      className="w-full text-left p-3 bg-muted border-2 border-ink/5 rounded-2xl text-sm text-ink hover:border-coral/40 transition-colors"
                    >
                      <p className="font-display text-xs">{addr.label || 'Delivery'}</p>
                      <p className="text-[11px] text-ink/55 mt-0.5 line-clamp-2 font-heading">
                        {addr.house_number ? `${addr.house_number}, ` : ''}{addr.formatted_address}
                      </p>
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          )}

          {!locationDetected && !address && (
            <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileTap={{ scale: 0.97 }}
              onClick={handleUseCurrentLocation} disabled={locatingGPS}
              className="w-full flex items-center gap-3 p-3.5 bg-mint/15 border-2 border-mint/30 rounded-2xl text-sm text-ink">
              {locatingGPS ? <Loader2 size={18} className="text-ink animate-spin" /> : <Navigation size={18} className="text-ink" />}
              <div className="text-left">
                <p className="font-display text-sm">{locatingGPS ? 'Detecting location…' : 'Use Current Location'}</p>
                <p className="text-xs text-ink/55 font-heading">Auto-fill address using GPS</p>
              </div>
            </motion.button>
          )}

          <textarea value={address} onChange={e => setAddress(e.target.value)}
            placeholder="Enter your full delivery address…" rows={2}
            className="w-full px-4 py-3 bg-card border-2 border-ink/8 rounded-2xl text-sm text-ink placeholder:text-ink/35 focus:outline-none focus:border-coral resize-none transition-colors" />

          <div className="relative">
            <Home size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              value={houseNumber}
              onChange={e => setHouseNumber(e.target.value)}
              placeholder="House / Flat / Floor (e.g. B-204)"
              className="w-full pl-10 pr-4 py-3.5 bg-card border-2 border-ink/8 rounded-2xl text-sm text-ink placeholder:text-ink/35 focus:outline-none focus:border-coral transition-colors"
            />
          </div>

          {fullAddressDisplay && (
            <p className="text-[10px] text-ink/50 px-1 font-heading line-clamp-2">📍 {fullAddressDisplay}</p>
          )}
        </div>

        {/* Payment methods */}
        <div className="space-y-2">
          <label className="text-xs font-heading text-ink/70">Pay with</label>
          <div className="grid grid-cols-2 gap-2">
            {paymentMethods.map(m => {
              const sel = selected === m.id;
              return (
                <motion.button
                  key={m.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setSelected(m.id)}
                  className={`p-3 rounded-2xl border-2 text-left transition-all ${sel ? 'border-coral bg-coral/5 shadow-pop-coral' : 'border-ink/8 bg-card'}`}
                >
                  <Icon3D name={m.icon} size={28} alt="" />
                  <p className="font-display text-sm text-ink mt-1.5">{m.label}</p>
                  <p className="text-[10px] text-ink/55 font-heading mt-0.5 line-clamp-1">{m.desc}</p>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Use points */}
        {walletBalance > 0 && (
          <button
            onClick={() => setUsePoints(!usePoints)}
            className="w-full flex items-center justify-between p-3.5 bg-card border-2 border-ink/8 rounded-2xl"
          >
            <div className="flex items-center gap-3">
              <Icon3D name="wallet" size={28} alt="" />
              <div className="text-left">
                <p className="font-display text-sm text-ink">Use Goofy Points</p>
                <p className="text-[11px] text-ink/55 font-heading">{walletBalance} pts available</p>
              </div>
            </div>
            <div className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors ${usePoints ? 'bg-mint' : 'bg-ink/15'}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${usePoints ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
          </button>
        )}

        {/* Summary */}
        <div className="bg-card border-2 border-ink/8 rounded-2xl p-4 space-y-2">
          <div className="flex justify-between text-sm text-ink font-heading"><span>Subtotal</span><span className="tabular-nums">₹{subtotal}</span></div>
          {firstOrderDiscount < 0 && <div className="flex justify-between text-sm text-mint font-heading"><span>Welcome offer</span><span>−₹{Math.abs(firstOrderDiscount)}</span></div>}
          {pointsDiscount < 0 && <div className="flex justify-between text-sm text-mint font-heading"><span>Points</span><span>−₹{Math.abs(pointsDiscount)}</span></div>}
          <div className="flex justify-between text-sm text-ink font-heading"><span>Delivery</span><span className="tabular-nums">{computedDeliveryFee === 0 ? 'FREE' : `₹${computedDeliveryFee}`}</span></div>
          <div className="border-t-2 border-ink/5 pt-2 flex justify-between font-display text-lg text-ink">
            <span>Total</span><span className="text-coral tabular-nums">₹{total}</span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t-2 border-ink/5 p-4">
        <motion.button whileTap={{ scale: 0.97 }} onClick={handlePay} disabled={!customerName.trim() || !address.trim() || processing}
          className="w-full py-4 bg-ink rounded-full font-display text-base text-white shadow-pop disabled:opacity-40 max-w-lg mx-auto block">
          {processing ? 'Placing order…' : `Pay ₹${total}`}
        </motion.button>
      </div>
    </div>
  );
};

export default PaymentPage;
