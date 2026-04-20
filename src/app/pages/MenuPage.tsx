import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Search, ArrowLeft, PartyPopper, Clock, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { Star, Sparkle, Heart } from '../components/Stickers';
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

const packStyles = [
  { bg: 'bg-gradient-coral', shadow: 'shadow-pop-coral', sticker: 'butter' },
  { bg: 'bg-gradient-mint', shadow: 'shadow-pop-mint', sticker: 'coral' },
  { bg: 'bg-gradient-butter', shadow: 'shadow-pop-butter', sticker: 'lavender' },
  { bg: 'bg-gradient-lavender', shadow: 'shadow-pop-lavender', sticker: 'mint' },
  { bg: 'bg-gradient-sky', shadow: 'shadow-pop', sticker: 'coral' },
  { bg: 'bg-gradient-bubblegum', shadow: 'shadow-pop-coral', sticker: 'mint' },
];

const PackCard = ({ pack, index, onBuy }: { pack: PlayPack; index: number; onBuy: (p: PlayPack) => void }) => {
  const isFree = pack.price === 0;
  const perHour = pack.total_hours > 1 ? Math.round(pack.price / pack.total_hours) : null;
  const s = packStyles[index % packStyles.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`relative ${s.bg} rounded-[28px] p-5 ${s.shadow} border-2 border-ink/8 overflow-hidden`}
    >
      <div className="absolute -top-3 -right-3 opacity-25">
        <Star size={70} color={`hsl(var(--${s.sticker}))`} />
      </div>
      <div className="absolute bottom-3 right-4 opacity-30">
        <Sparkle size={16} color="hsl(var(--card))" />
      </div>

      <div className="flex items-start gap-4 relative z-10">
        <div className="w-20 h-20 rounded-2xl bg-card border-2 border-ink/10 flex flex-col items-center justify-center shrink-0 shadow-soft">
          <span className="font-display text-3xl text-ink leading-none">{pack.total_hours}</span>
          <span className="text-[9px] font-display text-ink/60 uppercase mt-0.5">hrs</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-lg text-ink leading-tight">{pack.name}</h3>
            {isFree && (
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-ink text-cream font-display shrink-0">
                FREE
              </span>
            )}
          </div>
          {pack.description && (
            <p className="text-xs text-ink/75 mt-1.5 leading-relaxed line-clamp-2 font-medium">{pack.description}</p>
          )}
          <div className="flex items-end justify-between mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-xl text-ink">{isFree ? 'FREE' : `₹${pack.price}`}</span>
              {perHour && (
                <span className="text-[10px] text-ink/60 font-medium">≈ ₹{perHour}/hr</span>
              )}
            </div>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => onBuy(pack)}
              className="px-5 py-2.5 bg-card rounded-2xl text-xs font-display text-ink shadow-soft border-2 border-ink/10 hover:scale-105 transition-transform"
            >
              {isFree ? 'Claim it!' : 'Get pack'}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const PackageCard = ({ item, index, onBook }: { item: MenuItem; index: number; onBook: (item: MenuItem) => void }) => {
  const price = item.discounted_price || item.price;
  const s = packStyles[(index + 2) % packStyles.length];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-card rounded-[24px] overflow-hidden flex shadow-soft border-2 border-ink/8 hover:scale-[1.01] transition-transform"
    >
      <div className={`w-28 shrink-0 ${s.bg} relative flex items-center justify-center`}>
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <PartyPopper size={32} className="text-ink/70" strokeWidth={2.5} />
        )}
        <div className="absolute top-2 left-2">
          <Heart size={14} color="hsl(var(--card))" />
        </div>
      </div>
      <div className="flex-1 p-4 min-w-0 flex flex-col justify-between">
        <div>
          <h3 className="font-display text-base text-ink leading-tight">{item.name}</h3>
          {item.description && (
            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed font-medium">{item.description}</p>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="font-display text-lg text-coral">₹{price}</span>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => onBook(item)}
            className="px-4 py-2 bg-gradient-mint rounded-xl text-xs font-display text-ink shadow-pop-mint border-2 border-ink/10"
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
    <div className="min-h-screen bg-background bg-confetti pb-28">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 h-16 max-w-lg mx-auto">
          <button
            onClick={() => navigate('/home')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-card border-2 border-ink/10 shadow-soft"
          >
            <ArrowLeft size={18} className="text-ink" strokeWidth={2.5} />
          </button>
          <div className="flex-1">
            <h1 className="font-display text-xl text-ink leading-tight">Pick your fun ✨</h1>
            {selectedStore && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                <MapPin size={10} /> {selectedStore.name}
              </p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 pb-3 max-w-lg mx-auto">
          <div className="flex gap-1.5 p-1.5 bg-card rounded-2xl shadow-soft border-2 border-ink/8">
            <button
              onClick={() => setTab('packs')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-display transition-all flex items-center justify-center gap-1.5 ${
                tab === 'packs' ? 'bg-gradient-coral text-ink shadow-pop-coral' : 'text-muted-foreground'
              }`}
            >
              <Package size={13} strokeWidth={2.5} /> Hour Packs
            </button>
            <button
              onClick={() => setTab('visits')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-display transition-all flex items-center justify-center gap-1.5 ${
                tab === 'visits' ? 'bg-gradient-mint text-ink shadow-pop-mint' : 'text-muted-foreground'
              }`}
            >
              <Clock size={13} strokeWidth={2.5} /> One-off
            </button>
          </div>
        </div>
      </header>

      {tab === 'packs' ? (
        <div className="px-4 pt-4 space-y-3.5 max-w-lg mx-auto">
          <div className="bg-gradient-butter rounded-[24px] p-4 border-2 border-ink/8 shadow-pop-butter relative overflow-hidden">
            <div className="absolute -top-2 -right-2 opacity-30">
              <Star size={50} color="hsl(var(--coral))" />
            </div>
            <div className="flex items-center gap-2 relative z-10">
              <Sparkle size={16} color="hsl(var(--ink))" />
              <p className="font-display text-sm text-ink">Why hour packs?</p>
            </div>
            <p className="text-xs text-ink/80 mt-1.5 leading-relaxed font-medium relative z-10">
              Buy hours in bulk, save big, use anytime. <span className="font-display">No expiry — ever!</span>
            </p>
          </div>

          {packs.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-32 bg-card rounded-[28px] animate-pulse shadow-soft" />)}
            </div>
          ) : (
            packs.map((pack, idx) => <PackCard key={pack.id} pack={pack} index={idx} onBuy={handleBuyPack} />)
          )}
        </div>
      ) : (
        <div className="px-4 pt-4 space-y-4 max-w-lg mx-auto">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" strokeWidth={2.5} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search packages…"
              className="w-full pl-11 pr-4 py-3.5 bg-card border-2 border-ink/8 rounded-2xl text-sm text-ink placeholder:text-muted-foreground/70 focus:outline-none focus:border-coral shadow-soft font-medium"
            />
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <div key={i} className="h-28 bg-card rounded-[24px] animate-pulse shadow-soft" />)}
            </div>
          ) : (
            <>
              {visibleCategories.map(cat => {
                const catItems = filterItems(grouped.get(cat.id) || []);
                return (
                  <div key={cat.id}>
                    <div className="flex items-center gap-2 mb-2.5 px-1">
                      <h3 className="font-display text-sm text-ink">{cat.name}</h3>
                      <div className="flex-1 h-0.5 bg-ink/10 rounded-full" />
                      <span className="text-[10px] text-muted-foreground font-medium">{catItems.length}</span>
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
                  <p className="text-sm text-muted-foreground font-medium">No one-off packages right now</p>
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
