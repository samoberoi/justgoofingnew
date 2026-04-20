import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const timeSlots = ['12:00 PM', '1:00 PM', '2:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'];

const PreBookPage = () => {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [selectedBiryani, setSelectedBiryani] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('menu_items').select('id, name, price, image_url').eq('is_active', true).limit(10);
      setMenuItems(data || []);
      if (data?.[0]) setSelectedBiryani(data[0].id);
    };
    fetch();
  }, []);

  // Generate next 7 days
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return { full: d.toISOString().split('T')[0], day: d.toLocaleDateString('en', { weekday: 'short' }), date: d.getDate() };
  });

  if (booked) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center px-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="text-center space-y-4">
          <div className="text-6xl">📅</div>
          <h1 className="font-heading text-xl text-gradient-gold">Your Order<br />Has Been Reserved</h1>
          <p className="text-muted-foreground text-sm">Preparation begins at the scheduled hour</p>
          <button onClick={() => navigate('/app')} className="px-6 py-3 bg-gradient-saffron rounded-lg text-xs font-heading text-primary-foreground">
            Go Home
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
          <h1 className="font-heading text-lg text-foreground">Pre-Book Order</h1>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-6">
        <div className="bg-card border border-secondary/20 rounded-xl p-4 text-center">
          <Calendar size={24} className="text-secondary mx-auto mb-2" />
          <p className="font-heading text-sm text-foreground">Reserve Your Order</p>
          <p className="text-xs text-muted-foreground mt-1">Schedule up to 7 days ahead</p>
        </div>

        {/* Date picker */}
        <div>
          <p className="text-sm text-foreground font-semibold mb-2">Choose Date</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {dates.map(d => (
              <button
                key={d.full}
                onClick={() => setSelectedDate(d.full)}
                className={`flex flex-col items-center min-w-[56px] py-3 rounded-xl border ${selectedDate === d.full ? 'border-secondary bg-secondary/10' : 'border-border bg-card'}`}
              >
                <span className="text-[10px] text-muted-foreground">{d.day}</span>
                <span className={`text-lg font-heading ${selectedDate === d.full ? 'text-secondary' : 'text-foreground'}`}>{d.date}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Time slot */}
        <div>
          <p className="text-sm text-foreground font-semibold mb-2">Choose Time Slot</p>
          <div className="grid grid-cols-3 gap-2">
            {timeSlots.map(t => (
              <button
                key={t}
                onClick={() => setSelectedTime(t)}
                className={`py-2.5 rounded-xl border text-xs font-heading flex items-center justify-center gap-1 ${selectedTime === t ? 'border-secondary bg-secondary/10 text-secondary' : 'border-border bg-card text-muted-foreground'}`}
              >
                <Clock size={10} /> {t}
              </button>
            ))}
          </div>
        </div>

        {/* Biryani selection */}
        <div>
          <p className="text-sm text-foreground font-semibold mb-2">Choose Biryani</p>
          <div className="space-y-2">
            {menuItems.map(b => (
              <button
                key={b.id}
                onClick={() => setSelectedBiryani(b.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border ${selectedBiryani === b.id ? 'border-secondary bg-secondary/5' : 'border-border bg-card'}`}
              >
                <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden shrink-0">
                  {b.image_url ? <img src={b.image_url} className="w-full h-full object-cover" alt="" /> : <span className="text-2xl flex items-center justify-center h-full">🍚</span>}
                </div>
                <div className="flex-1 text-left">
                  <span className="text-sm text-foreground">{b.name}</span>
                  <span className="block text-xs text-secondary">₹{b.price}</span>
                </div>
                {selectedBiryani === b.id && <Check size={16} className="text-secondary" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border p-4">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setBooked(true)}
          disabled={!selectedDate || !selectedTime}
          className="w-full py-4 bg-gradient-saffron rounded-xl font-heading text-sm uppercase tracking-widest text-primary-foreground shadow-saffron disabled:opacity-40"
        >
          Reserve My Feast
        </motion.button>
      </div>
    </div>
  );
};

export default PreBookPage;
