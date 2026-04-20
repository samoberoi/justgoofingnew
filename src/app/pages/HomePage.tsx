import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Gift, MapPin, Search, Clock, ArrowRight, PartyPopper } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RoyalHeader from '../components/RoyalHeader';
import BottomNav from '../components/BottomNav';
import { useAppStore } from '../store';
import { useMenu, MenuItem } from '../hooks/useMenu';
import { useStoreSelection } from '../hooks/useStoreSelection';
import { supabase } from '@/integrations/supabase/client';

const PackageCard = ({ item, index, onBook }: { item: MenuItem; index: number; onBook: (item: MenuItem) => void }) => {
  const price = item.discounted_price || item.price;
  const original = item.base_price && item.base_price > price ? item.base_price : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="bg-card border border-border rounded-2xl overflow-hidden group hover:border-secondary/20 transition-colors"
    >
      <div className="flex gap-0">
        <div className="w-28 h-full min-h-[120px] shrink-0 overflow-hidden bg-muted relative">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary/15 to-muted">
              <PartyPopper size={28} className="text-secondary/60" />
            </div>
          )}
          <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
            {item.is_bestseller && (
              <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-secondary/90 text-primary-foreground font-bold backdrop-blur-sm">
                POPULAR
              </span>
            )}
            {item.is_new && (
              <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-primary/90 text-primary-foreground font-bold flex items-center gap-0.5 backdrop-blur-sm">
                <Sparkles size={7} /> NEW
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 p-3 min-w-0 flex flex-col justify-between">
          <div>
            <h3 className="font-heading text-sm text-foreground leading-snug">{item.name}</h3>
            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
          </div>

          <div className="flex items-center justify-between mt-2.5">
            <div className="flex items-baseline gap-1.5">
              <span className="font-heading text-base text-secondary">₹{price}</span>
              {original && (
                <span className="text-[10px] text-muted-foreground line-through">₹{original}</span>
              )}
            </div>
            <motion.button whileTap={{ scale: 0.92 }} onClick={() => onBook(item)}
              className="px-4 py-2 bg-gradient-saffron rounded-xl text-[11px] font-heading uppercase tracking-wider text-primary-foreground shadow-sm">
              Book
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ACTIVE_BOOKING_LABELS: Record<string, { label: string; emoji: string }> = {
  booked: { label: 'Booking confirmed — see you soon!', emoji: '🎉' },
  confirmed: { label: 'Your booking is confirmed!', emoji: '✅' },
  checked_in: { label: 'Having fun at Just Goofing!', emoji: '🎈' },
};

const HomePage = () => {
  const navigate = useNavigate();
  const { activeCampaigns, totalOrders, userId } = useAppStore();
  const { selectedStore, outOfArea, locationLoading } = useStoreSelection();
  const { categories, grouped, uncategorized, loading, items } = useMenu(selectedStore?.id);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBookings, setActiveBookings] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;
    const fetchActive = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('bookings' as any)
        .select('id, booking_number, status, booking_date, slot_time, package_name')
        .eq('user_id', userId)
        .gte('booking_date', today)
        .not('status', 'in', '("completed","cancelled")')
        .order('booking_date', { ascending: true })
        .limit(3);
      setActiveBookings((data as any) || []);
    };
    fetchActive();
  }, [userId]);

  const applicableCampaign = activeCampaigns.find(c => {
    if (c.category === 'welcome' && totalOrders > 0) return false;
    if (c.target_audience === 'new_users' && totalOrders > 0) return false;
    return true;
  });

  const filterItems = (list: MenuItem[]) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(i => i.name.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q));
  };

  const handleBook = (item: MenuItem) => {
    navigate(`/book/${item.id}`);
  };

  if (locationLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-2 border-secondary border-t-transparent rounded-full mb-4" />
        <p className="text-sm text-muted-foreground font-heading">Finding your nearest play zone…</p>
      </div>
    );
  }

  if (outOfArea) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="w-20 h-20 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center mx-auto mb-5">
            <MapPin size={36} className="text-secondary" />
          </div>
          <h2 className="font-heading text-xl text-foreground mb-2">No Play Zone Near You Yet</h2>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Just Goofing isn't in your city yet — but we're expanding fast. Check back soon!
          </p>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => window.location.reload()}
            className="mt-6 px-8 py-3.5 bg-gradient-saffron rounded-xl font-heading text-sm text-primary-foreground shadow-saffron">
            Retry
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const visibleCategories = categories.filter(c => filterItems(grouped.get(c.id) || []).length > 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      <RoyalHeader />

      {/* Active Booking Banners */}
      <AnimatePresence>
        {activeBookings.length > 0 && (
          <div className="px-4 pt-3 space-y-2">
            {activeBookings.filter(b => ACTIVE_BOOKING_LABELS[b.status]).map(booking => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onClick={() => navigate('/orders')}
                className="bg-gradient-to-r from-secondary/12 to-secondary/5 border border-secondary/20 rounded-xl p-3 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
              >
                <span className="text-xl">{ACTIVE_BOOKING_LABELS[booking.status].emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-heading text-[11px] text-secondary">{booking.booking_number}</p>
                  <p className="text-xs text-foreground truncate">
                    {booking.package_name} · {new Date(booking.booking_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {String(booking.slot_time).slice(0, 5)}
                  </p>
                </div>
                <ArrowRight size={14} className="text-secondary" />
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Welcome Campaign Banner */}
      {applicableCampaign && (
        <div className="px-4 pt-3">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-secondary/15 via-secondary/8 to-primary/10 border border-secondary/15 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary/15 flex items-center justify-center shrink-0">
                <Gift size={18} className="text-secondary" />
              </div>
              <div>
                <p className="font-heading text-sm text-secondary">{applicableCampaign.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {applicableCampaign.auto_apply ? 'Auto-applied to your first booking' : `Use code: ${applicableCampaign.coupon_code}`}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Search */}
      <div className="px-4 pt-4">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search packages…"
            className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-secondary/30 transition-colors"
          />
        </div>
      </div>

      {/* Section title */}
      <div className="px-4 pt-4 pb-1">
        <h2 className="font-heading text-base text-foreground">Pick Your Fun</h2>
        {selectedStore && (
          <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
            <MapPin size={10} /> {selectedStore.name}
          </p>
        )}
      </div>

      {loading ? (
        <div className="px-4 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-card border border-border rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="px-4 space-y-5 pt-2">
          {visibleCategories.map(cat => {
            const catItems = filterItems(grouped.get(cat.id) || []);
            return (
              <div key={cat.id}>
                <div className="flex items-center gap-2 mb-2.5">
                  {cat.image_url && <img src={cat.image_url} className="w-6 h-6 rounded-lg object-cover" alt="" />}
                  <h3 className="font-heading text-xs text-secondary uppercase tracking-[0.15em]">{cat.name}</h3>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[10px] text-muted-foreground">{catItems.length}</span>
                </div>
                {cat.description && <p className="text-[11px] text-muted-foreground -mt-1 mb-2.5">{cat.description}</p>}
                <div className="space-y-2.5">
                  {catItems.map((item, idx) => (
                    <PackageCard key={item.id} item={item} index={idx} onBook={handleBook} />
                  ))}
                </div>
              </div>
            );
          })}

          {filterItems(uncategorized).length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <h3 className="font-heading text-xs text-muted-foreground uppercase tracking-[0.15em]">More</h3>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="space-y-2.5">
                {filterItems(uncategorized).map((item, idx) => (
                  <PackageCard key={item.id} item={item} index={idx} onBook={handleBook} />
                ))}
              </div>
            </div>
          )}

          {items.length > 0 && filterItems(items).length === 0 && (
            <div className="text-center py-10">
              <p className="text-muted-foreground text-sm">No packages match your search</p>
            </div>
          )}
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default HomePage;
