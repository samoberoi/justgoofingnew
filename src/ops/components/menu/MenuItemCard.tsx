import { Leaf, Drumstick, ToggleRight, ToggleLeft, Edit, Check, Image as ImageIcon } from 'lucide-react';

interface Props {
  item: any;
  isSelected: boolean;
  selectionMode: boolean;
  onToggleAvailability: (id: string, current: boolean) => void;
  onEdit: (item: any) => void;
  onSelect: (id: string) => void;
  role: string;
}

const MenuItemCard = ({ item, isSelected, selectionMode, onToggleAvailability, onEdit, onSelect, role }: Props) => {
  const tags: string[] = [];
  if (item.is_bestseller) tags.push('🏆 Bestseller');
  if (item.is_chefs_special) tags.push('👨‍🍳 Special');
  if (item.is_new) tags.push('✨ New');

  const displayPrice = item.discounted_price && item.discounted_price < item.price
    ? { original: item.price, current: item.discounted_price }
    : { original: null, current: item.price };

  return (
    <div className={`bg-card border rounded-lg overflow-hidden transition-colors ${isSelected ? 'border-secondary' : 'border-border'} ${!item.is_active ? 'opacity-50' : ''}`}>
      <div className="flex">
        {/* Image */}
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-20 h-20 object-cover flex-shrink-0" />
        ) : (
          <div className="w-20 h-20 bg-muted flex items-center justify-center flex-shrink-0">
            <ImageIcon size={20} className="text-muted-foreground" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-2.5 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                {item.is_veg ? <Leaf size={12} className="text-green-400 flex-shrink-0" /> : <Drumstick size={12} className="text-accent flex-shrink-0" />}
                <span className="font-medium text-sm text-foreground truncate">{item.name}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {displayPrice.original && (
                  <span className="text-[10px] text-muted-foreground line-through">₹{Number(displayPrice.original)}</span>
                )}
                <span className="text-xs font-medium text-foreground">₹{Number(displayPrice.current)}</span>
                {item.prep_time && <span className="text-[10px] text-muted-foreground">• {item.prep_time}min</span>}
              </div>
              {tags.length > 0 && (
                <div className="flex gap-1 mt-1 flex-wrap">
                  {tags.map(t => (
                    <span key={t} className="text-[9px] px-1.5 py-0.5 bg-secondary/15 text-secondary rounded-full">{t}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {selectionMode ? (
                <button onClick={() => onSelect(item.id)} className={`w-6 h-6 rounded flex items-center justify-center ${isSelected ? 'bg-secondary text-secondary-foreground' : 'border border-border text-muted-foreground'}`}>
                  {isSelected && <Check size={14} />}
                </button>
              ) : (
                <>
                  <button onClick={() => onToggleAvailability(item.id, item.is_available)} className="p-1">
                    {item.is_available ? <ToggleRight size={20} className="text-green-400" /> : <ToggleLeft size={20} className="text-muted-foreground" />}
                  </button>
                  {role === 'super_admin' && (
                    <button onClick={() => onEdit(item)} className="p-1"><Edit size={14} className="text-muted-foreground" /></button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuItemCard;
