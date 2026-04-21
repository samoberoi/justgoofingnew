import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Sparkles, CheckCircle2, PartyPopper, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '../store';
import { useStoreSelection } from '../hooks/useStoreSelection';
import { useKids, calcAge } from '../hooks/useKids';
import Icon3D from '../components/Icon3D';

const SLOTS = ['11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

const BookingPage = () => {
  const navigate = useNavigate();
  const { itemId } = useParams<{ itemId: string }>();
  const { userId, phoneNumber, userName, totalOrders, activeCampaigns, refreshUserData } = useAppStore();
  const { selectedStore } = useStoreSelection();
  const { kids } = useKids(userId);

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [slot, setSlot] = useState<string>('11:00');
  const [selectedKidIds, setSelectedKidIds] = useState<string[]>([]);
  const [extraKids, setExtraKids] = useState(0);
  const [notes, setNotes] = useState('');
  const [contactName, setContactName] = useState(userName || '');
  const [contactPhone, setContactPhone] = useState(phoneNumber || '');

  const welcomeCampaign = activeCampaigns.find(c =>
    c.category === 'welcome' && c.is_active && c.auto_apply && totalOrders === 0
  );
  const isFreeWelcome = !!welcomeCampaign && totalOrders === 0;

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
  const price = item ? Number(item.discounted_price || item.price) : 0;
  const discount = isFreeWelcome ? price : 0;
  const total = Math.max(0, price - discount);

  const today = new Date().toISOString().split('T')[0];
  const maxDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const canSubmit = item && contactName.trim() && contactPhone.trim() && date && slot && numKids >= 1 && !submitting;

  const toggleKid = (id: string) => {
    setSelectedKidIds(prev => prev.includes(id) ? prev.filter(k => k !== id) : [...prev, id]);
  };

  const handleConfirm = async () => {
    if (!canSubmit || !userId || !item || !selectedStore) return;
    setSubmitting(true);
    const firstKid = kids.find(k => k.id === selectedKidIds[0]);
    const kidNames = selectedKidIds.map(id => kids.find(k => k.id === id)?.name).filter(Boolean).join(', ');

    const { data: booking, error } = await supabase
      .from('bookings' as any)
      .insert({
        user_id: userId,
        store_id: selectedStore.id,
        menu_item_id: item.id,
        package_name: item.name,
        package_price: price,
        customer_name: contactName.trim(),
        customer_phone: contactPhone.trim(),
        kid_name: kidNames || null,
        kid_age: firstKid ? calcAge(firstKid.date_of_birth) : null,
        num_kids: numKids,
        booking_date: date,
        slot_time: slot,
        duration_hours: 1,
        special_instructions: notes.trim() || null,
        total_amount: total,
        discount,
        is_free_welcome: isFreeWelcome,
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
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft size={18} className="text-ink" strokeWidth={2.5} />
          </motion.button>
          <h1 className="font-display text-xl text-ink -tracking-wide">Book a Slot</h1>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-4 relative z-10">
        {/* Package summary */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border-2 border-ink/8 rounded-3xl p-4 flex gap-3 shadow-pop">
          <div className="w-16 h-16 rounded-2xl shrink-0 overflow-hidden bg-gradient-butter flex items-center justify-center">
            {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> : <PartyPopper size={26} className="text-ink" />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-base text-ink">{item.name}</h3>
            <p className="text-[11px] text-ink/55 mt-0.5 line-clamp-2">{item.description}</p>
            <p className="font-display text-base text-coral mt-1">₹{price}</p>
          </div>
        </motion.div>

        {isFreeWelcome && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-mint rounded-3xl p-4 flex items-center gap-3 shadow-pop-mint text-ink">
            <Sparkles size={20} className="shrink-0" />
            <div>
              <p className="font-display text-sm">{welcomeCampaign!.name}</p>
              <p className="text-[11px] text-ink/70">This one's on us 🎉</p>
            </div>
          </motion.div>
        )}

        {/* Pick kids */}
        <div className="bg-card border-2 border-ink/8 rounded-3xl p-4 space-y-3 shadow-soft">
          <div className="flex items-center justify-between">
            <label className="font-display text-base text-ink flex items-center gap-2">
              <Users size={16} className="text-coral" /> Who's coming?
            </label>
            <button onClick={() => navigate('/kids')} className="text-[11px] font-heading text-coral flex items-center gap-1">
              <Plus size={12} /> Manage Kids
            </button>
          </div>

          {kids.length === 0 ? (
            <button
              onClick={() => navigate('/kids')}
              className="w-full bg-coral/5 border-2 border-dashed border-coral/30 rounded-2xl p-4 text-center"
            >
              <p className="text-sm font-heading text-coral">Add your kids first</p>
              <p className="text-[11px] text-ink/55 mt-0.5">So we know who's playing 👶</p>
            </button>
          ) : (
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
              <p className="text-sm font-heading text-ink">+ Extra friends</p>
              <p className="text-[11px] text-ink/55">Bringing other kids along?</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setExtraKids(Math.max(0, extraKids - 1))}
                className="w-8 h-8 rounded-xl bg-card border-2 border-ink/8 font-display text-ink active:scale-90">−</button>
              <span className="font-display text-lg text-ink w-6 text-center tabular-nums">{extraKids}</span>
              <button onClick={() => setExtraKids(extraKids + 1)}
                className="w-8 h-8 rounded-xl bg-coral text-white font-display active:scale-90">+</button>
            </div>
          </div>

          <p className="text-[11px] text-ink/55 text-center">
            Total kids: <span className="font-display text-coral">{numKids}</span>
          </p>
        </div>

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

        {/* Price */}
        <div className="bg-card border-2 border-ink/8 rounded-3xl p-4 space-y-2 shadow-soft">
          <div className="flex justify-between text-sm text-ink"><span>Package</span><span className="tabular-nums">₹{price}</span></div>
          {discount > 0 && <div className="flex justify-between text-sm text-mint"><span>Welcome (FREE)</span><span>−₹{discount}</span></div>}
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
          {submitting ? 'Booking…' : `Confirm Booking 🎉`}
        </motion.button>
      </div>
    </div>
  );
};

export default BookingPage;
