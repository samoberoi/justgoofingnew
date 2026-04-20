import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, MapPin, Search, ArrowLeft, PartyPopper, Clock, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { useStoreSelection } from '../hooks/useStoreSelection';
import { useMenu, MenuItem } from '../hooks/useMenu';
import { supabase } from '@/integrations/supabase/client';

interface PlayPack {
  id: string;
  name: string;
  description: string | null;
  pack_type: string;
  total_hours: number;
  price: number;
  image_url: string | null;
}

const PackCard = ({ pack, index, onBuy }: { pack: PlayPack; index: number; onBuy: (p: PlayPack) => void }) => {
  const isFree = pack.price === 0;
  const perHour = pack.total_hours > 1 ? Math.round(pack.price / pack.total_hours) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-card border border-border rounded-2xl p-4 hover:border-secondary/30 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/5 border border-secondary/20 flex flex-col items-center justify-center shrink-0">
          <span className="font-heading text-base text-secondary leading-none">{pack.total_hours}</span>
          <span className="text-[8px] text-secondary/70 uppercase tracking-wider mt-0.5">hrs</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-heading text-sm text-foreground leading-snug">{pack.name}</h3>
            {isFree && (
              <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-secondary/90 text-primary-foreground font-bold shrink-0">
                FREE
              </span>
            )}
          </div>
          {pack.description && (
            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed line-clamp-2">{pack.description}</p>
          )}
          <div className="flex items-end justify-between mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="font-heading text-base text-secondary">{isFree ? 'FREE' : `₹${pack.price}`}</span>
              {perHour && (
                <span className="text-[10px] text-muted-foreground">≈ ₹{perHour}/hr</span>
              )}
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onBuy(pack)}
              className="px-4 py-2 bg-gradient-saffron rounded-xl text-[11px] font-heading uppercase tracking-wider text-primary-foreground shadow-sm"
            >
              {isFree ? 'Claim' : 'Buy Pack'}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const PackageCard = ({ item, index, onBook }: { item: MenuItem; index: number; onBook: (item: MenuItem) => void }) => {
  const price = item.discounted_price || item.price;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="bg-card border border-border rounded-2xl overflow-hidden flex"
    >
      <div className="w-24 shrink-0 bg-muted relative">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary/15 to-muted">
            <PartyPopper size={24} className="text-secondary/60" />
          </div>
        )}
      </div>
      <div className="flex-1 p-3 min-w-0 flex flex-col justify-between">
        <div>
          <h3 className="font-heading text-sm text-foreground leading-snug">{item.name}</h3>
          {item.description && (
            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="font-heading text-base text-secondary">₹{price}</span>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onBook(item)}
            className="px-3.5 py-1.5 bg-gradient-saffron rounded-xl text-[11px] font-heading uppercase tracking-wider text-primary-foreground"
          >
            Book Slot
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

const MenuPage = () => {
  const navigate = useNavigate();
  const { selectedStore } = useStoreSelection();
  const { categories, grouped, uncategorized, loading, items } = useMenu(selectedStore?.id);
  const [tab, setTab] = useState<'packs' | 'visits'>('packs');
  const [packs, setPacks] = useState<PlayPack[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchPacks = async () => {
      const { data } = await supabase
        .from('play_packs' as any)
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      setPacks((data as any) || []);
    };
    fetchPacks();
  }, []);

  const handleBuyPack = (pack: PlayPack) => {
    navigate(`/buy-pack/${pack.id}`);
  };

  const handleBook = (item: MenuItem) => {
    navigate(`/book/${item.id}`);
  };

  const filterItems = (list: MenuItem[]) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(i => i.name.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q));
  };

  const visibleCategories = categories.filter(c => filterItems(grouped.get(c.id) || []).length > 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-2xl border-b border-secondary/10">
        <div className="flex items-center gap-3 px-4 h-14 max-w-lg mx-auto">
          <button onClick={() => navigate('/home')} className="w-9 h-9 flex items-center justify-center rounded-full bg-secondary/8 border border-secondary/15">
            <ArrowLeft size={16} className="text-secondary" />
          </button>
          <div className="flex-1">
            <h1 className="font-heading text-base text-foreground leading-tight">Browse</h1>
            {selectedStore && (
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <MapPin size={9} /> {selectedStore.name}
              </p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 pb-3 max-w-lg mx-auto">
          <div className="flex gap-2 p-1 bg-muted rounded-xl">
            <button
              onClick={() => setTab('packs')}
              className={`flex-1 py-2 rounded-lg text-xs font-heading uppercase tracking-wider transition-all ${
                tab === 'packs' ? 'bg-card text-secondary shadow-sm' : 'text-muted-foreground'
              }`}
            >
              <Package size={12} className="inline mr-1.5 -mt-0.5" /> Hour Packs
            </button>
            <button
              onClick={() => setTab('visits')}
              className={`flex-1 py-2 rounded-lg text-xs font-heading uppercase tracking-wider transition-all ${
                tab === 'visits' ? 'bg-card text-secondary shadow-sm' : 'text-muted-foreground'
              }`}
            >
              <Clock size={12} className="inline mr-1.5 -mt-0.5" /> One-off
            </button>
          </div>
        </div>
      </header>

      {tab === 'packs' ? (
        <div className="px-4 pt-4 space-y-3">
          <div className="bg-gradient-to-br from-secondary/10 via-secondary/5 to-transparent border border-secondary/15 rounded-2xl p-4">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-secondary" />
              <p className="font-heading text-xs text-secondary uppercase tracking-wider">Why Hour Packs?</p>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
              Buy hours in bulk, save more, and use anytime. No expiry — your hours stay forever.
            </p>
          </div>

          {packs.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-24 bg-card border border-border rounded-2xl animate-pulse" />)}
            </div>
          ) : (
            packs.map((pack, idx) => <PackCard key={pack.id} pack={pack} index={idx} onBuy={handleBuyPack} />)
          )}
        </div>
      ) : (
        <div className="px-4 pt-4 space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search packages…"
              className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-secondary/30"
            />
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <div key={i} className="h-28 bg-card border border-border rounded-2xl animate-pulse" />)}
            </div>
          ) : (
            <>
              {visibleCategories.map(cat => {
                const catItems = filterItems(grouped.get(cat.id) || []);
                return (
                  <div key={cat.id}>
                    <div className="flex items-center gap-2 mb-2.5">
                      <h3 className="font-heading text-xs text-secondary uppercase tracking-[0.15em]">{cat.name}</h3>
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-[10px] text-muted-foreground">{catItems.length}</span>
                    </div>
                    <div className="space-y-2.5">
                      {catItems.map((item, idx) => (
                        <PackageCard key={item.id} item={item} index={idx} onBook={handleBook} />
                      ))}
                    </div>
                  </div>
                );
              })}

              {filterItems(uncategorized).length > 0 && (
                <div className="space-y-2.5">
                  {filterItems(uncategorized).map((item, idx) => (
                    <PackageCard key={item.id} item={item} index={idx} onBook={handleBook} />
                  ))}
                </div>
              )}

              {items.length === 0 && (
                <div className="text-center py-12">
                  <PartyPopper size={28} className="text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No one-off packages available right now</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default MenuPage;
