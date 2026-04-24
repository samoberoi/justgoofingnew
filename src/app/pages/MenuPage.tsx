import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Search, ArrowLeft, PartyPopper, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import Icon3D from '../components/Icon3D';
import { useStoreSelection } from '../hooks/useStoreSelection';
import { useMenu, MenuItem } from '../hooks/useMenu';
import { supabase } from '@/integrations/supabase/client';
import packPlayDate from '@/assets/pack-playdate.jpg';
import pack5h from '@/assets/pack-5h.jpg';
import pack10h from '@/assets/pack-10h.jpg';
import pack20h from '@/assets/pack-20h.jpg';
import pack30h from '@/assets/pack-30h.jpg';
import pack60h from '@/assets/pack-60h.jpg';

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
  { bg: 'bg-coral' },
  { bg: 'bg-mint' },
  { bg: 'bg-lavender' },
  { bg: 'bg-butter' },
  { bg: 'bg-sky' },
  { bg: 'bg-coral' },
];

const matchPackImage = (pack: PlayPack): string | null => {
  if (pack.pack_type === 'play_date') return packPlayDate;
  if (pack.pack_type !== 'hour_pack') return null;
  const h = pack.total_hours;
  if (h <= 5) return pack5h;
  if (h <= 10) return pack10h;
  if (h <= 20) return pack20h;
  if (h <= 30) return pack30h;
  return pack60h;
};

const validityFor = (pack: PlayPack) => {
  if (pack.pack_type === 'play_date') return 'Single visit';
  if (pack.pack_type !== 'hour_pack') return null;
  return pack.total_hours <= 10 ? '2 month validity' : '3 month validity';
};

const PackCard = ({ pack, index, onBuy }: { pack: PlayPack; index: number; onBuy: (p: PlayPack) => void }) => {
  const perHour = pack.pack_type === 'hour_pack' && pack.total_hours > 1 ? Math.round(pack.price / pack.total_hours) : null;
  const a = accents[index % accents.length];
  const img = matchPackImage(pack);
  const validity = validityFor(pack);
  const shortDesc = (pack.description || '').split('\n')[0];

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onBuy(pack)}
      className={`relative ${a.bg} rounded-[32px] p-5 overflow-hidden text-left w-full shadow-pop`}
    >
      <div className="flex items-stretch gap-4">
        <div className="flex-1 min-w-0 z-10 relative">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="chip-dark text-[10px] py-1">
              <Icon3D name="clock" size={12} alt="" /> {pack.total_hours} hrs
            </span>
            {validity && (
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-white/80 text-ink font-display">{validity}</span>
            )}
          </div>
          <h3 className="font-display text-xl text-ink leading-tight -tracking-wide truncate">{pack.name}</h3>
          {shortDesc && (
            <p className="text-xs text-ink/70 mt-1.5 leading-relaxed line-clamp-2 font-heading">{shortDesc}</p>
          )}
          <div className="flex items-baseline gap-1.5 mt-4">
            <span className="font-display text-2xl text-ink">₹{pack.price.toLocaleString('en-IN')}</span>
            {perHour && <span className="text-[10px] text-ink/60 font-heading">≈ ₹{perHour}/hr</span>}
          </div>
        </div>

        {img && (
          <motion.img
            src={img}
            alt={pack.name}
            width={120}
            height={120}
            loading="lazy"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, delay: index * 0.2 }}
            className="w-28 h-28 rounded-2xl object-cover shadow-soft flex-shrink-0 self-center"
          />
        )}
      </div>
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

// ---------- Add-ons & Themes (static, sourced from playbook photos) ----------

interface Activity {
  name: string;
  price: string;
}
const activities: Activity[] = [
  { name: 'Photographer', price: '₹4,500' },
  { name: 'Bubble Ring', price: '₹4,000' },
  { name: 'Magic Show (Normal / with Animals)', price: '₹4,500' },
  { name: 'Puppet Show', price: '₹4,000' },
  { name: 'Selfie Booth', price: '₹5,000' },
  { name: 'Tattoo Artist', price: '₹2,500' },
  { name: 'Live Character', price: '₹6,500' },
  { name: 'Craft Corner / Paper Craft / Stone Painting', price: '₹4,000' },
  { name: 'Balloon Art', price: '₹4,000' },
  { name: 'Nail Art', price: '₹3,000' },
  { name: 'Cup Cake Decoration', price: '₹100 / head' },
  { name: 'Cupcake Making / Decorating', price: '₹200 / head' },
  { name: 'Hair Braiding', price: '₹4,000' },
  { name: 'Chocolate Fountain', price: '₹4,000' },
  { name: "Potter's Wheel", price: '₹5,000' },
  { name: 'Game Coordinator', price: '₹4,000' },
  { name: 'Science Lab (Outsourced)', price: 'On request' },
  { name: 'Gol Gappe & Papdi Chaat Live Counter', price: 'As per activity' },
  { name: 'Ice Cream Parlor', price: 'As per activity' },
  { name: 'Maggi Live Counter', price: 'As per activity' },
  { name: 'Ramen Noodles', price: 'As per activity' },
];

const themes = [
  'Baby Shark','Rainbow Dash','Paw Patrol','Lima','Peppa Pig','Avengers','Super Hero','Lego','Cars','Animals','Lion King','Football','Science (Mad Scientist)','Detective','Minecraft','Tokka-Bokka','Cocomelon','Two Fast Two Furious',
  'Train','Unicorn','Minions','Tom & Jerry','PJ Mask','Colors / Crayola','Frozen','Fairy','Dino','Space','Rainbow','Nerf Guns','Cricket','Soccer','Jungle','Monsters','Monster Truck','Magic',
  'Fruits','Go Green','Ben & Holly','Geronimo','Candy-Land','Thomas Cars','Among Us','Picnic','Construction','Dominoes','James Bond','Pirates of the Sea','Mermaid',"Gabby's Dollhouse",'Masha & the Bear','Subway Surfers','Pop It',
];

const AddonsTab = () => (
  <div className="px-5 pt-4 space-y-5 max-w-lg mx-auto">
    {/* Why celebrate */}
    <div className="bg-lavender rounded-[28px] p-5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={16} className="text-ink" strokeWidth={2.5} />
        <h3 className="font-display text-base text-ink -tracking-wide">Why celebrate at Just Goofing?</h3>
      </div>
      <ul className="space-y-1.5 text-xs text-ink/80 font-heading leading-relaxed">
        <li>• Dedicated private event zone</li>
        <li>• Safe, sanitized & air-purified play area</li>
        <li>• Café catering for all age groups</li>
        <li>• Trained kids hosts</li>
        <li>• Customizable décor</li>
        <li>• Hassle-free planning</li>
      </ul>
    </div>

    {/* Activities */}
    <div>
      <h3 className="font-display text-lg text-ink -tracking-wide px-1 mb-2.5">Additional Activities</h3>
      <div className="bg-card rounded-[24px] border border-border overflow-hidden">
        {activities.map((a, i) => (
          <div
            key={a.name}
            className={`flex items-center justify-between px-4 py-3 ${i !== activities.length - 1 ? 'border-b border-border' : ''}`}
          >
            <span className="text-xs text-ink font-heading flex-1 pr-3">{a.name}</span>
            <span className="font-display text-xs text-ink whitespace-nowrap">{a.price}</span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground font-heading mt-2 px-1">
        Tell our team which activities you'd like and we'll add them to your party booking.
      </p>
    </div>

    {/* Themes */}
    <div>
      <h3 className="font-display text-lg text-ink -tracking-wide px-1 mb-2.5">Themes for Birthday</h3>
      <div className="bg-butter rounded-[24px] p-4">
        <div className="flex flex-wrap gap-2">
          {themes.map(t => (
            <span
              key={t}
              className="px-3 py-1.5 rounded-full bg-white/70 text-[11px] font-heading text-ink"
            >
              {t}
            </span>
          ))}
        </div>
        <p className="text-[11px] text-ink/65 font-heading mt-3">
          Pick any theme — we customise invites, backdrop & décor to match.
        </p>
      </div>
    </div>

    {/* Hours */}
    <div className="bg-muted rounded-[24px] p-4">
      <p className="font-display text-sm text-ink mb-1">Play Area Timings</p>
      <p className="text-xs text-ink/70 font-heading leading-relaxed">
        Weekdays: 4:00 PM – 8:00 PM<br/>Weekends: 11:00 AM – 8:00 PM
      </p>
    </div>
  </div>
);

const MenuPage = () => {
  const navigate = useNavigate();
  const { selectedStore } = useStoreSelection();
  const { categories, grouped, uncategorized, loading, items } = useMenu(selectedStore?.id);
  const [tab, setTab] = useState<'packs' | 'visits' | 'addons'>('packs');
  const [packs, setPacks] = useState<PlayPack[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchPacks = async () => {
      const { data } = await supabase
        .from('play_packs' as any)
        .select('*')
        .eq('is_active', true)
        .neq('pack_type', 'party')
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

        {/* Pill tabs */}
        <div className="px-5 pb-3 max-w-lg mx-auto">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setTab('packs')}
              className={`px-5 py-2.5 rounded-full text-xs font-display whitespace-nowrap flex items-center gap-1.5 transition-all ${
                tab === 'packs' ? 'bg-ink text-white' : 'bg-muted text-ink'
              }`}
            >
              <Icon3D name="clock" size={16} alt="" /> Hour Packs
            </button>
            <button
              onClick={() => setTab('visits')}
              className={`px-5 py-2.5 rounded-full text-xs font-display whitespace-nowrap flex items-center gap-1.5 transition-all ${
                tab === 'visits' ? 'bg-ink text-white' : 'bg-muted text-ink'
              }`}
            >
              <Icon3D name="calendar" size={16} alt="" /> One-off
            </button>
            <button
              onClick={() => setTab('addons')}
              className={`px-5 py-2.5 rounded-full text-xs font-display whitespace-nowrap flex items-center gap-1.5 transition-all ${
                tab === 'addons' ? 'bg-ink text-white' : 'bg-muted text-ink'
              }`}
            >
              <Icon3D name="gift" size={16} alt="" /> Add-ons & Themes
            </button>
          </div>
        </div>
      </header>

      {tab === 'packs' && (
        <div className="px-5 pt-4 space-y-3.5 max-w-lg mx-auto">
          {/* Hint card */}
          <div className="bg-muted rounded-[24px] p-4">
            <p className="font-display text-sm text-ink">Why hour packs?</p>
            <p className="text-xs text-ink/70 mt-1 leading-relaxed font-heading">
              Buy hours in bulk, save big, use anytime within validity.{' '}
              <span className="font-display text-ink">Group of up to 5 kids.</span>
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
      )}

      {tab === 'visits' && (
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

      {tab === 'addons' && <AddonsTab />}

      <BottomNav />
    </div>
  );
};

export default MenuPage;
