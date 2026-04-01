import { useState } from 'react';
import { MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileAddressesProps {
  addresses: any[];
}

const ProfileAddresses = ({ addresses }: ProfileAddressesProps) => {
  const [expanded, setExpanded] = useState(false);

  if (addresses.length === 0) return null;

  const displayAddresses = expanded ? addresses : addresses.slice(0, 2);

  return (
    <div className="px-4 pt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between mb-2"
      >
        <p className="text-sm text-foreground font-heading flex items-center gap-1.5">
          <MapPin size={14} className="text-secondary" /> Address Book
          <span className="text-[10px] text-muted-foreground font-normal ml-1">({addresses.length})</span>
        </p>
        {addresses.length > 2 && (
          expanded
            ? <ChevronUp size={14} className="text-muted-foreground" />
            : <ChevronDown size={14} className="text-muted-foreground" />
        )}
      </button>
      <AnimatePresence>
        <div className="space-y-1.5">
          {displayAddresses.map((addr: any) => (
            <motion.div
              key={addr.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-card border border-border rounded-xl p-3"
            >
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-full bg-secondary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin size={12} className="text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  {addr.label && (
                    <p className="text-[10px] text-secondary font-heading uppercase tracking-wider mb-0.5">{addr.label}</p>
                  )}
                  <p className="text-xs text-foreground">
                    {addr.house_number ? `${addr.house_number}, ` : ''}{addr.formatted_address}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
      {!expanded && addresses.length > 2 && (
        <button onClick={() => setExpanded(true)} className="text-xs text-secondary font-medium mt-2 w-full text-center">
          View all {addresses.length} addresses →
        </button>
      )}
    </div>
  );
};

export default ProfileAddresses;
