import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Search, ArrowLeft, PartyPopper } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import Icon3D from '../components/Icon3D';
import { useStoreSelection } from '../hooks/useStoreSelection';
import { useMenu, MenuItem } from '../hooks/useMenu';
import { supabase } from '@/integrations/supabase/client';
import charHero from '@/assets/char-hero.png';
import charGirl from '@/assets/char-girl.png';
import charCool from '@/assets/char-cool.png';

interface PlayPack {
  id: string;
  name: string;
  description: string | null;
  pack_type: string;
  total_hours: number;
  price: number;
  image_url: string | null;
}

const accents = [
  { bg: 'bg-coral', char: charGirl },
  { bg: 'bg-mint', char: charHero },
  { bg: 'bg-lavender', char: charCool },
  { bg: 'bg-butter', char: charHero },
];

const PackCard = ({ pack, index, onBuy }: { pack: PlayPack; index: number; onBuy: (p: PlayPack) => void }) => {
  const isFree = pack.price === 0;
  const perHour = pack.total_hours > 1 ? Math.round(pack.price / pack.total_hours) : null;
  const a = accents[index % accents.length];

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      onClick={() => onBuy(pack)}
      className={`relative ${a.bg} rounded-[32px] p-5 overflow-hidden text-left w-full`}
    >
      <div className="relative z-10 max-w-[60%]">
        <div className="flex items-center gap-2 mb-2">
          <span className="chip-dark text-[10px] py-1">
            <Icon3D name="clock" size={12} alt="" /> {pack.total_hours} hrs
          </span>
          {isFree && (
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-white text-ink font-display">FREE</span>
          )}
        </div>
        <h3 className="font-display text-xl text-ink leading-tight -tracking-wide">{pack.name}</h3>
        {pack.description && (
          <p className="text-xs text-ink/70 mt-1.5 leading-relaxed line-clamp-2 font-heading">{pack.description}</p>
        )}
        <div className="flex items-baseline gap-1.5 mt-4">
          <span className="font-display text-2xl text-ink">{isFree ? 'FREE' : `₹${pack.price}`}</span>
          {perHour && <span className="text-[10px] text-ink/60 font-heading">≈ ₹{perHour}/hr</span>}
        </div>
      </div>

      <motion.img
        src={a.char}
        alt=""
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, delay: index * 0.2 }}
        className="absolute -bottom-2 -right-4 w-32 h-32 object-contain pointer-events-none"
      />
    </motion.button>
  );
};

const PackageCard = ({ item, index, onBook }: { item: MenuItem; index: number; onBook: (item: MenuItem) => void }) => {
  const price = item.discounted_price || item.price;
  const a = accents[(index + 2) % accents.length];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-card rounded-[24px] overflow-hidden flex shadow-soft border border-border hover:scale-[1.01] transition-transform"
    >
      <div className={`w-24 shrink-0 ${a.bg} relative flex items-center justify-center`}>
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <PartyPopper size={28} className="text-ink/70" strokeWidth={2.5} />
        )}
      </div>
      <div className="flex-1 p-4 min-w-0 flex flex-col justify-between">
        <div>
          <h3 className="font-display text-base text-ink leading-tight">{item.name}</h3>
          {item.description && (
            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed font-heading">{item.description}</p>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="font-display text-lg text-ink">₹{price}</span>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => onBook(item)}
            className="px-4 py-2 bg-ink rounded-full text-xs font-display text-white"
          >
            Book it
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

  const handleBuyPack = (pack: PlayPack) => navigate(`/buy-pack/${pack.id}`);
  const handleBook = (item: MenuItem) => navigate(`/book/${item.id}`);

  const filterItems = (list: MenuItem[]) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(i => i.name.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q));
  };

  const visibleCategories = categories.filter(c => filterItems(grouped.get(c.id) || []).length > 0);

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-5 h-16 max-w-lg mx-auto">
          <button
            onClick={() => navigate('/home')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-muted"
          >
            <ArrowLeft size={18} className="text-ink" strokeWidth={2.5} />
          </button>
          <div className="flex-1">
            <h1 className="font-display text-xl text-ink leading-tight -tracking-wide">Pick your fun</h1>
            {selectedStore && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 font-heading">
                <MapPin size={10} /> {selectedStore.name}
              </p>
            )}
          </div>
        </div>

        {/* Reference-style pill tabs */}
        <div className="px-5 pb-3 max-w-lg mx-auto">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setTab('packs')}
              className={`px-5 py-2.5 rounded-full text-xs font-display whitespace-nowrap flex items-center gap-1.5 transition-all ${
                tab === 'packs' ? 'bg-ink text-white' : 'bg-muted text-ink'
              }`}
            >
              <Icon3D name="gift" size={16} alt="" /> Hour Packs
            </button>
            <button
              onClick={() => setTab('visits')}
              className={`px-5 py-2.5 rounded-full text-xs font-display whitespace-nowrap flex items-center gap-1.5 transition-all ${
                tab === 'visits' ? 'bg-ink text-white' : 'bg-muted text-ink'
              }`}
            >
              <Icon3D name="calendar" size={16} alt="" /> One-off
            </button>
          </div>
        </div>
      </header>

      {tab === 'packs' ? (
        <div className="px-5 pt-4 space-y-3.5 max-w-lg mx-auto">
          {/* Hint card */}
          <div className="bg-muted rounded-[24px] p-4">
            <p className="font-display text-sm text-ink">Why hour packs?</p>
            <p className="text-xs text-ink/70 mt-1 leading-relaxed font-heading">
              Buy hours in bulk, save big, use anytime.{' '}
              <span className="font-display text-ink">No expiry — ever!</span>
            </p>
          </div>

          {packs.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-40 bg-muted rounded-[32px] animate-pulse" />)}
            </div>
          ) : (
            packs.map((pack, idx) => <PackCard key={pack.id} pack={pack} index={idx} onBuy={handleBuyPack} />)
          )}
        </div>
      ) : (
        <div className="px-5 pt-4 space-y-4 max-w-lg mx-auto">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" strokeWidth={2.5} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search packages…"
              className="w-full pl-11 pr-4 py-3.5 bg-muted rounded-full text-sm text-ink placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-mint font-heading"
            />
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <div key={i} className="h-28 bg-muted rounded-[24px] animate-pulse" />)}
            </div>
          ) : (
            <>
              {visibleCategories.map(cat => {
                const catItems = filterItems(grouped.get(cat.id) || []);
                return (
                  <div key={cat.id}>
                    <div className="flex items-center gap-2 mb-2.5 px-1">
                      <h3 className="font-display text-sm text-ink">{cat.name}</h3>
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-[10px] text-muted-foreground font-heading">{catItems.length}</span>
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
                  <PartyPopper size={36} className="text-muted-foreground/40 mx-auto mb-2" strokeWidth={2} />
                  <p className="text-sm text-muted-foreground font-heading">No one-off packages right now</p>
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
