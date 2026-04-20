import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, Users, Sparkles, CheckCircle2, PartyPopper } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '../store';
import { useStoreSelection } from '../hooks/useStoreSelection';

const SLOTS = [
  '11:00', '12:00', '13:00', '14:00', '15:00',
  '16:00', '17:00', '18:00', '19:00', '20:00',
];

const BookingPage = () => {
  const navigate = useNavigate();
  const { itemId } = useParams<{ itemId: string }>();
  const { userId, phoneNumber, userName, totalOrders, activeCampaigns, refreshUserData } = useAppStore();
  const { selectedStore } = useStoreSelection();

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [slot, setSlot] = useState<string>('11:00');
  const [numKids, setNumKids] = useState(1);
  const [kidName, setKidName] = useState('');
  const [kidAge, setKidAge] = useState('');
  const [notes, setNotes] = useState('');
  const [contactName, setContactName] = useState(userName || '');
  const [contactPhone, setContactPhone] = useState(phoneNumber || '');

  // Welcome offer
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

  const price = item ? Number(item.discounted_price || item.price) : 0;
  const discount = isFreeWelcome ? price : 0;
  const total = Math.max(0, price - discount);

  const today = new Date().toISOString().split('T')[0];
  const maxDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const canSubmit = item && contactName.trim() && contactPhone.trim() && date && slot && numKids >= 1 && !submitting;

  const handleConfirm = async () => {
    if (!canSubmit || !userId || !item || !selectedStore) return;
    setSubmitting(true);

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
        kid_name: kidName.trim() || null,
        kid_age: kidAge ? parseInt(kidAge) : null,
        num_kids: numKids,
        booking_date: date,
        slot_time: slot,
        duration_hours: 1,
        special_instructions: notes.trim() || null,
        total_amount: total,
        discount: discount,
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
        <div className="w-10 h-10 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-2xl border-b border-secondary/10">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-foreground" /></button>
          <h1 className="font-heading text-lg text-foreground">Book a Slot</h1>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-4">
        {/* Package summary */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-4 flex gap-3">
          <div className="w-16 h-16 rounded-xl shrink-0 overflow-hidden bg-muted">
            {item.image_url ? (
              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary/15 to-muted">
                <PartyPopper size={24} className="text-secondary/60" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading text-sm text-foreground">{item.name}</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
            <p className="font-heading text-sm text-secondary mt-1">₹{price}</p>
          </div>
        </motion.div>

        {/* Welcome offer banner */}
        {isFreeWelcome && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-secondary/15 to-secondary/5 border border-secondary/25 rounded-2xl p-3 flex items-center gap-3">
            <Sparkles size={18} className="text-secondary shrink-0" />
            <div>
              <p className="font-heading text-xs text-secondary">{welcomeCampaign!.name}</p>
              <p className="text-[10px] text-muted-foreground">This booking is FREE on us 🎉</p>
            </div>
          </motion.div>
        )}

        {/* Date */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <label className="flex items-center gap-2 text-xs font-heading text-muted-foreground uppercase tracking-wider">
            <Calendar size={13} /> Pick a Date
          </label>
          <input
            type="date"
            value={date}
            min={today}
            max={maxDate}
            onChange={e => setDate(e.target.value)}
            className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-secondary/50 transition-colors"
          />
        </div>

        {/* Slot */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <label className="flex items-center gap-2 text-xs font-heading text-muted-foreground uppercase tracking-wider">
            <Clock size={13} /> Pick a Time
          </label>
          <div className="grid grid-cols-4 gap-2">
            {SLOTS.map(s => (
              <button
                key={s}
                onClick={() => setSlot(s)}
                className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                  slot === s
                    ? 'bg-gradient-saffron text-primary-foreground shadow-sm'
                    : 'bg-muted text-foreground hover:bg-secondary/10'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Number of kids */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <label className="flex items-center gap-2 text-xs font-heading text-muted-foreground uppercase tracking-wider">
            <Users size={13} /> Number of Kids
          </label>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setNumKids(Math.max(1, numKids - 1))}
              className="w-10 h-10 rounded-full bg-muted text-foreground font-bold text-lg active:scale-95"
            >−</button>
            <span className="font-heading text-2xl text-secondary tabular-nums">{numKids}</span>
            <button
              onClick={() => setNumKids(numKids + 1)}
              className="w-10 h-10 rounded-full bg-muted text-foreground font-bold text-lg active:scale-95"
            >+</button>
          </div>
        </div>

        {/* Kid info */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <p className="text-xs font-heading text-muted-foreground uppercase tracking-wider">Kid Info (optional)</p>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={kidName}
              onChange={e => setKidName(e.target.value)}
              placeholder="Kid's name"
              className="px-3 py-2.5 bg-muted border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-secondary/50"
            />
            <input
              type="number"
              value={kidAge}
              onChange={e => setKidAge(e.target.value)}
              placeholder="Age"
              min={1}
              max={18}
              className="px-3 py-2.5 bg-muted border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-secondary/50"
            />
          </div>
        </div>

        {/* Contact */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <p className="text-xs font-heading text-muted-foreground uppercase tracking-wider">Contact</p>
          <input
            type="text"
            value={contactName}
            onChange={e => setContactName(e.target.value)}
            placeholder="Your name *"
            className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-secondary/50"
          />
          <input
            type="tel"
            value={contactPhone}
            onChange={e => setContactPhone(e.target.value)}
            placeholder="Phone number *"
            className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-secondary/50"
          />
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Special instructions (allergies, accessibility, etc.)"
            rows={2}
            className="w-full px-3 py-2.5 bg-muted border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-secondary/50 resize-none"
          />
        </div>

        {/* Price summary */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
          <div className="flex justify-between text-sm text-foreground">
            <span>Package</span><span className="tabular-nums">₹{price}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-green-500">
              <span>Welcome Offer (FREE)</span><span className="tabular-nums">−₹{discount}</span>
            </div>
          )}
          <div className="border-t border-border pt-2 flex justify-between font-heading text-base text-foreground">
            <span>Pay at Venue</span><span className="text-secondary tabular-nums">₹{total}</span>
          </div>
          <p className="text-[10px] text-muted-foreground pt-1">
            <CheckCircle2 size={10} className="inline mr-1" />
            Reserve now, pay when you arrive at Just Goofing
          </p>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-2xl border-t border-secondary/10 p-4">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleConfirm}
          disabled={!canSubmit}
          className="w-full py-4 bg-gradient-saffron rounded-2xl font-heading text-sm uppercase tracking-widest text-primary-foreground shadow-saffron disabled:opacity-40"
        >
          {submitting ? 'Booking…' : `Confirm Booking · ${date.split('-').reverse().join('/')} at ${slot}`}
        </motion.button>
      </div>
    </div>
  );
};

export default BookingPage;
