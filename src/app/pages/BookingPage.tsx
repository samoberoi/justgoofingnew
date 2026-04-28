import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSafeBack } from '../hooks/useSafeBack';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Plus, Car, Utensils } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '../store';
import { useStoreSelection } from '../hooks/useStoreSelection';
import { useKids, calcAge } from '../hooks/useKids';
import Icon3D from '../components/Icon3D';

const SLOTS = ['11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

// Pricing matrix per package name
const PRICING: Record<string, { playNoCar: number; playWithCar: number; kidsBuffet: number; adultBuffet: number }> = {
  'Basic Party':   { playNoCar: 800,  playWithCar: 1000, kidsBuffet: 600, adultBuffet: 1000 },
  'Bash Party':    { playNoCar: 1000, playWithCar: 1200, kidsBuffet: 800, adultBuffet: 1250 },
  'Bonanza Party': { playNoCar: 1200, playWithCar: 1400, kidsBuffet: 900, adultBuffet: 1400 },
};

const BookingPage = () => {
  const navigate = useNavigate();
  const { itemId } = useParams<{ itemId: string }>();
  const { userId, phoneNumber, userName, refreshUserData } = useAppStore();
  const { selectedStore } = useStoreSelection();
  const { kids } = useKids(userId);

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [slot, setSlot] = useState<string>('11:00');
  const [selectedKidIds, setSelectedKidIds] = useState<string[]>([]);
  const [extraKids, setExtraKids] = useState(0);
  const [adults, setAdults] = useState(0);
  const [withCar, setWithCar] = useState<boolean>(false);
  const [kidsBuffet, setKidsBuffet] = useState<boolean>(false);
  const [adultBuffet, setAdultBuffet] = useState<boolean>(false);
  const [discount, setDiscount] = useState<number>(0);
  const [discountInput, setDiscountInput] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [contactName, setContactName] = useState(userName || '');
  const [contactPhone, setContactPhone] = useState(phoneNumber || '');

  useEffect(() => {
    setContactName(userName || '');
    setContactPhone(phoneNumber || '');
  }, [userName, phoneNumber]);

  useEffect(() => {
    const fetchItem = async () => {
      if (!itemId) return;
      const { data } = await supabase.from('menu_items').select('*').eq('id', itemId).maybeSingle();
      setItem(data);
      setLoading(false);
    };
    fetchItem();
  }, [itemId]);

  const numKids = selectedKidIds.length + extraKids;
  const pricing = item ? PRICING[item.name] : null;

  const breakdown = useMemo(() => {
    if (!pricing) return { playPerKid: 0, playSubtotal: 0, kidsBuffetSubtotal: 0, adultBuffetSubtotal: 0, subtotal: 0 };
    const playPerKid = withCar ? pricing.playWithCar : pricing.playNoCar;
    const playSubtotal = playPerKid * numKids;
    const kidsBuffetSubtotal = kidsBuffet ? pricing.kidsBuffet * numKids : 0;
    const adultBuffetSubtotal = adultBuffet ? pricing.adultBuffet * adults : 0;
    const subtotal = playSubtotal + kidsBuffetSubtotal + adultBuffetSubtotal;
    return { playPerKid, playSubtotal, kidsBuffetSubtotal, adultBuffetSubtotal, subtotal };
  }, [pricing, withCar, kidsBuffet, adultBuffet, numKids, adults]);

  const safeDiscount = Math.max(0, Math.min(discount, breakdown.subtotal));
  const total = Math.max(0, breakdown.subtotal - safeDiscount);

  const today = new Date().toISOString().split('T')[0];
  const maxDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const canSubmit = item && contactName.trim() && contactPhone.trim() && date && slot && numKids >= 1 && !submitting;

  const toggleKid = (id: string) => {
    setSelectedKidIds(prev => prev.includes(id) ? prev.filter(k => k !== id) : [...prev, id]);
  };

  const applyDiscount = () => {
    const v = parseFloat(discountInput);
    setDiscount(isNaN(v) || v < 0 ? 0 : v);
  };

  const handleConfirm = async () => {
    if (!canSubmit || !userId || !item || !selectedStore) return;
    setSubmitting(true);
    const firstKid = kids.find(k => k.id === selectedKidIds[0]);
    const kidNames = selectedKidIds.map(id => kids.find(k => k.id === id)?.name).filter(Boolean).join(', ');

    const optionsLine = [
      withCar ? 'With Car' : 'Without Car',
      kidsBuffet ? `Kids Buffet (${numKids})` : null,
      adultBuffet ? `Adult Buffet (${adults})` : null,
    ].filter(Boolean).join(' · ');
    const fullNotes = [optionsLine, notes.trim()].filter(Boolean).join('\n');

    const { data: booking, error } = await supabase
      .from('bookings' as any)
      .insert({
        user_id: userId,
        store_id: selectedStore.id,
        menu_item_id: item.id,
        package_name: item.name,
        package_price: breakdown.playPerKid,
        customer_name: contactName.trim(),
        customer_phone: contactPhone.trim(),
        kid_name: kidNames || null,
        kid_age: firstKid ? calcAge(firstKid.date_of_birth) : null,
        num_kids: numKids,
        booking_date: date,
        slot_time: slot,
        duration_hours: 2.5,
        special_instructions: fullNotes || null,
        total_amount: total,
        discount: safeDiscount,
        is_free_welcome: false,
        payment_method: 'pay_at_venue',
        payment_status: 'pending',
        status: 'booked',
      })
      .select()
      .single();

    if (error || !booking) {
      console.error('Booking failed', error);
      setSubmitting(false);
      return;
    }
    await refreshUserData();
    navigate(`/booking-confirmed/${(booking as any).id}`);
  };

  if (loading || !item) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-coral border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-5 h-16 max-w-lg mx-auto">
          <motion.button whileTap={{ scale: 0.9 }} onClick={useSafeBack()}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft size={18} className="text-ink" strokeWidth={2.5} />
          </motion.button>
          <h1 className="font-display text-xl text-ink -tracking-wide">Book a Party</h1>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-4 relative z-10">
        {/* Package summary */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border-2 border-ink/8 rounded-3xl p-4 flex gap-3 shadow-pop">
          <div className="w-16 h-16 rounded-2xl shrink-0 overflow-hidden bg-butter flex items-center justify-center">
            {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> : <Icon3D name="gift" size={36} alt="" />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-base text-ink">{item.name}</h3>
            <p className="text-[11px] text-ink/55 mt-0.5">2.5 hour party</p>
            {pricing && (
              <p className="font-display text-base text-coral mt-1">
                ₹{breakdown.playPerKid}<span className="text-[11px] text-ink/55 font-heading">/kid</span>
              </p>
            )}
          </div>
        </motion.div>

        {/* CAR OPTION */}
        {pricing && (
          <div className="bg-card border-2 border-ink/8 rounded-3xl p-4 space-y-3 shadow-soft">
            <label className="font-display text-base text-ink flex items-center gap-2">
              <Car size={20} /> Play Option
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setWithCar(false)}
                className={`p-3 rounded-2xl border-2 text-left transition-all ${
                  !withCar ? 'border-coral bg-coral/10 shadow-pop-coral' : 'border-ink/8 bg-background'
                }`}>
                <p className="font-heading text-sm text-ink">Without Car</p>
                <p className="font-display text-base text-coral mt-1">₹{pricing.playNoCar}<span className="text-[10px] text-ink/55 font-heading">/kid</span></p>
              </button>
              <button onClick={() => setWithCar(true)}
                className={`p-3 rounded-2xl border-2 text-left transition-all ${
                  withCar ? 'border-coral bg-coral/10 shadow-pop-coral' : 'border-ink/8 bg-background'
                }`}>
                <p className="font-heading text-sm text-ink">With Car 🚗</p>
                <p className="font-display text-base text-coral mt-1">₹{pricing.playWithCar}<span className="text-[10px] text-ink/55 font-heading">/kid</span></p>
              </button>
            </div>
          </div>
        )}

        {/* Pick kids */}
        <div className="bg-card border-2 border-ink/8 rounded-3xl p-4 space-y-3 shadow-soft">
          <div className="flex items-center justify-between">
            <label className="font-display text-base text-ink flex items-center gap-2">
              <Icon3D name="kid" size={22} alt="" /> Who's coming?
            </label>
            <button onClick={() => navigate('/kids')} className="text-[11px] font-heading text-coral flex items-center gap-1">
              <Plus size={12} /> Manage Kids
            </button>
          </div>

          {kids.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {kids.map(kid => {
                const sel = selectedKidIds.includes(kid.id);
                const age = calcAge(kid.date_of_birth);
                return (
                  <motion.button
                    key={kid.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleKid(kid.id)}
                    className={`p-3 rounded-2xl border-2 text-left transition-all ${
                      sel ? 'border-coral bg-coral/10 shadow-pop-coral' : 'border-ink/8 bg-card'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-display text-base text-white ${
                        sel ? 'bg-gradient-coral' : 'bg-gradient-mint'
                      }`}>
                        {kid.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-heading text-sm text-ink truncate">{kid.name}</p>
                        {age !== null && <p className="text-[10px] text-ink/55">{age} yrs</p>}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* Extra (friends) */}
          <div className="flex items-center justify-between bg-butter/15 rounded-2xl p-3 border border-butter/30">
            <div>
              <p className="text-sm font-heading text-ink">+ Extra kids</p>
              <p className="text-[11px] text-ink/55">Friends & guests</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setExtraKids(Math.max(0, extraKids - 1))}
                className="w-8 h-8 rounded-xl bg-card border-2 border-ink/8 font-display text-ink active:scale-90">−</button>
              <span className="font-display text-lg text-ink w-8 text-center tabular-nums">{extraKids}</span>
              <button onClick={() => setExtraKids(extraKids + 1)}
                className="w-8 h-8 rounded-xl bg-coral text-white font-display active:scale-90">+</button>
            </div>
          </div>

          {/* Adults */}
          <div className="flex items-center justify-between bg-mint/15 rounded-2xl p-3 border border-mint/30">
            <div>
              <p className="text-sm font-heading text-ink">Adults</p>
              <p className="text-[11px] text-ink/55">Parents & guests</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setAdults(Math.max(0, adults - 1))}
                className="w-8 h-8 rounded-xl bg-card border-2 border-ink/8 font-display text-ink active:scale-90">−</button>
              <span className="font-display text-lg text-ink w-8 text-center tabular-nums">{adults}</span>
              <button onClick={() => setAdults(adults + 1)}
                className="w-8 h-8 rounded-xl bg-mint text-ink font-display active:scale-90">+</button>
            </div>
          </div>

          <p className="text-[11px] text-ink/55 text-center">
            Total kids: <span className="font-display text-coral">{numKids}</span> · Adults: <span className="font-display text-mint">{adults}</span>
          </p>
        </div>

        {/* BUFFET OPTIONS */}
        {pricing && (
          <div className="bg-card border-2 border-ink/8 rounded-3xl p-4 space-y-3 shadow-soft">
            <label className="font-display text-base text-ink flex items-center gap-2">
              <Utensils size={20} /> Add Buffet (Optional)
            </label>
            <button onClick={() => setKidsBuffet(!kidsBuffet)}
              className={`w-full p-3 rounded-2xl border-2 flex items-center justify-between transition-all ${
                kidsBuffet ? 'border-coral bg-coral/10' : 'border-ink/8 bg-background'
              }`}>
              <div className="text-left">
                <p className="font-heading text-sm text-ink">Kids Buffet 🍱</p>
                <p className="text-[10px] text-ink/55">₹{pricing.kidsBuffet} × {numKids} kid{numKids !== 1 ? 's' : ''}</p>
              </div>
              <div className="text-right">
                <p className="font-display text-base text-coral">₹{kidsBuffet ? pricing.kidsBuffet * numKids : 0}</p>
                <div className={`w-10 h-6 rounded-full transition-all ${kidsBuffet ? 'bg-coral' : 'bg-ink/15'} relative mt-0.5`}>
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${kidsBuffet ? 'right-0.5' : 'left-0.5'}`} />
                </div>
              </div>
            </button>
            <button onClick={() => setAdultBuffet(!adultBuffet)} disabled={adults === 0}
              className={`w-full p-3 rounded-2xl border-2 flex items-center justify-between transition-all ${
                adultBuffet ? 'border-coral bg-coral/10' : 'border-ink/8 bg-background'
              } ${adults === 0 ? 'opacity-40' : ''}`}>
              <div className="text-left">
                <p className="font-heading text-sm text-ink">Adult Buffet 🍽️</p>
                <p className="text-[10px] text-ink/55">₹{pricing.adultBuffet} × {adults} adult{adults !== 1 ? 's' : ''}</p>
              </div>
              <div className="text-right">
                <p className="font-display text-base text-coral">₹{adultBuffet ? pricing.adultBuffet * adults : 0}</p>
                <div className={`w-10 h-6 rounded-full transition-all ${adultBuffet ? 'bg-coral' : 'bg-ink/15'} relative mt-0.5`}>
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${adultBuffet ? 'right-0.5' : 'left-0.5'}`} />
                </div>
              </div>
            </button>
            <p className="text-[10px] text-ink/55 text-center">Non-veg on extra charges</p>
          </div>
        )}

        {/* Date */}
        <div className="bg-card border-2 border-ink/8 rounded-3xl p-4 space-y-3 shadow-soft">
          <label className="font-display text-base text-ink flex items-center gap-2">
            <Icon3D name="calendar" size={22} alt="" /> Pick a Date
          </label>
          <input
            type="date" value={date} min={today} max={maxDate}
            onChange={e => setDate(e.target.value)}
            className="w-full px-3 py-3 bg-background border-2 border-ink/8 rounded-2xl text-sm text-ink focus:outline-none focus:border-coral"
          />
        </div>

        {/* Slot */}
        <div className="bg-card border-2 border-ink/8 rounded-3xl p-4 space-y-3 shadow-soft">
          <label className="font-display text-base text-ink flex items-center gap-2">
            <Icon3D name="clock" size={22} alt="" /> Pick a Time
          </label>
          <div className="grid grid-cols-4 gap-2">
            {SLOTS.map(s => (
              <button key={s} onClick={() => setSlot(s)}
                className={`py-2.5 rounded-xl text-xs font-heading transition-all ${
                  slot === s ? 'bg-gradient-coral text-white shadow-pop-coral' : 'bg-background border-2 border-ink/8 text-ink/70'
                }`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="bg-card border-2 border-ink/8 rounded-3xl p-4 space-y-3 shadow-soft">
          <p className="font-display text-base text-ink">Contact</p>
          <input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Your name *"
            className="w-full px-3 py-3 bg-background border-2 border-ink/8 rounded-2xl text-sm text-ink focus:outline-none focus:border-coral" />
          <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="Phone number *"
            className="w-full px-3 py-3 bg-background border-2 border-ink/8 rounded-2xl text-sm text-ink focus:outline-none focus:border-coral" />
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Allergies, special requests…" rows={2}
            className="w-full px-3 py-3 bg-background border-2 border-ink/8 rounded-2xl text-sm text-ink focus:outline-none focus:border-coral resize-none" />
        </div>

        {/* Discount */}
        <div className="bg-card border-2 border-ink/8 rounded-3xl p-4 space-y-2 shadow-soft">
          <p className="font-display text-base text-ink">Discount (₹)</p>
          <div className="flex gap-2">
            <input type="number" min="0" value={discountInput} onChange={e => setDiscountInput(e.target.value)}
              placeholder="0"
              className="flex-1 px-3 py-3 bg-background border-2 border-ink/8 rounded-2xl text-sm text-ink focus:outline-none focus:border-coral" />
            <button onClick={applyDiscount}
              className="px-5 rounded-2xl bg-ink text-white font-heading text-sm active:scale-95">Apply</button>
          </div>
          {discount > 0 && (
            <button onClick={() => { setDiscount(0); setDiscountInput(''); }}
              className="text-[11px] text-coral font-heading">Remove discount</button>
          )}
        </div>

        {/* Price breakdown */}
        <div className="bg-card border-2 border-ink/8 rounded-3xl p-4 space-y-2 shadow-soft">
          <div className="flex justify-between text-sm text-ink">
            <span>Play ({withCar ? 'with car' : 'no car'}) × {numKids}</span>
            <span className="tabular-nums">₹{breakdown.playSubtotal}</span>
          </div>
          {kidsBuffet && (
            <div className="flex justify-between text-sm text-ink">
              <span>Kids Buffet × {numKids}</span>
              <span className="tabular-nums">₹{breakdown.kidsBuffetSubtotal}</span>
            </div>
          )}
          {adultBuffet && adults > 0 && (
            <div className="flex justify-between text-sm text-ink">
              <span>Adult Buffet × {adults}</span>
              <span className="tabular-nums">₹{breakdown.adultBuffetSubtotal}</span>
            </div>
          )}
          <div className="border-t-2 border-ink/5 pt-2 flex justify-between text-sm text-ink">
            <span>Subtotal</span><span className="tabular-nums">₹{breakdown.subtotal}</span>
          </div>
          {safeDiscount > 0 && (
            <div className="flex justify-between text-sm text-mint">
              <span>Discount</span><span>−₹{safeDiscount}</span>
            </div>
          )}
          <div className="border-t-2 border-ink/5 pt-2 flex justify-between font-display text-lg text-ink">
            <span>Pay at Venue</span><span className="text-coral tabular-nums">₹{total}</span>
          </div>
          <p className="text-[10px] text-ink/55 pt-1 flex items-center gap-1">
            <CheckCircle2 size={10} /> Reserve now, pay when you arrive
          </p>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t-2 border-ink/5 p-4">
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleConfirm} disabled={!canSubmit}
          className="w-full py-4 bg-gradient-coral rounded-2xl font-display text-base text-white shadow-pop-coral disabled:opacity-40 disabled:shadow-none">
          {submitting ? 'Booking…' : `Confirm ₹${total} 🎉`}
        </motion.button>
      </div>
    </div>
  );
};

export default BookingPage;
