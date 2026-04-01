import { MapPin } from 'lucide-react';

interface ProfileAddressesProps {
  addresses: any[];
}

const ProfileAddresses = ({ addresses }: ProfileAddressesProps) => {
  if (addresses.length === 0) return null;

  return (
    <div className="px-4 pt-4">
      <p className="text-sm text-foreground font-heading mb-2 flex items-center gap-1.5">
        <MapPin size={14} className="text-secondary" /> Saved Addresses
      </p>
      <div className="space-y-1.5">
        {addresses.map((addr: any) => (
          <div key={addr.id} className="bg-card border border-border rounded-xl p-3">
            <p className="text-xs font-medium text-foreground">
              {addr.house_number ? `${addr.house_number}, ` : ''}{addr.formatted_address}
            </p>
            {addr.label && <p className="text-[10px] text-muted-foreground mt-0.5">{addr.label}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileAddresses;
