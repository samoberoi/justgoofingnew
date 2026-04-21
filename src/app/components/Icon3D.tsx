import iconHome from '@/assets/icons/icon-home.png';
import iconPlay from '@/assets/icons/icon-play.png';
import iconGift from '@/assets/icons/icon-gift.png';
import iconUser from '@/assets/icons/icon-user.png';
import iconWallet from '@/assets/icons/icon-wallet.png';
import iconOrders from '@/assets/icons/icon-orders.png';
import iconQR from '@/assets/icons/icon-qr.png';
import iconCalendar from '@/assets/icons/icon-calendar.png';
import iconKid from '@/assets/icons/icon-kid.png';
import iconBadge from '@/assets/icons/icon-badge.png';
import iconStreak from '@/assets/icons/icon-streak.png';
import iconTier from '@/assets/icons/icon-tier.png';
import iconClock from '@/assets/icons/icon-clock.png';
import iconBell from '@/assets/icons/icon-bell.png';
import iconCart from '@/assets/icons/icon-cart.png';
import iconPayment from '@/assets/icons/icon-payment.png';
import iconPin from '@/assets/icons/icon-pin.png';
import iconSettings from '@/assets/icons/icon-settings.png';

export const ICON_MAP = {
  home: iconHome,
  play: iconPlay,
  gift: iconGift,
  user: iconUser,
  wallet: iconWallet,
  orders: iconOrders,
  qr: iconQR,
  calendar: iconCalendar,
  kid: iconKid,
  badge: iconBadge,
  streak: iconStreak,
  tier: iconTier,
  clock: iconClock,
  bell: iconBell,
  cart: iconCart,
  payment: iconPayment,
  pin: iconPin,
  settings: iconSettings,
} as const;

export type Icon3DName = keyof typeof ICON_MAP;

interface Icon3DProps {
  name: Icon3DName;
  size?: number;
  className?: string;
  alt?: string;
}

const Icon3D = ({ name, size = 28, className = '', alt = '' }: Icon3DProps) => (
  <img
    src={ICON_MAP[name]}
    alt={alt}
    width={size}
    height={size}
    loading="lazy"
    className={`object-contain shrink-0 select-none pointer-events-none ${className}`}
    style={{ width: size, height: size }}
  />
);

export default Icon3D;
