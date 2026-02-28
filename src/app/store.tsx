import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface BiryaniItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  tags: string[];
}

export interface CartItem extends BiryaniItem {
  quantity: number;
}

export interface OrderStage {
  stage: number;
  title: string;
  description: string;
  completed: boolean;
}

export interface WalletTransaction {
  id: string;
  type: 'earned' | 'spent' | 'bonus';
  amount: number;
  description: string;
  date: string;
}

export type RoyalTier = 'Sipahi' | 'Wazir' | 'Nawab' | 'Sultan';

interface AppState {
  isLoggedIn: boolean;
  isFirstTime: boolean;
  phoneNumber: string;
  userName: string;
  walletBalance: number;
  tier: RoyalTier;
  totalOrders: number;
  currentStreak: number;
  longestStreak: number;
  freeDawatsEarned: number;
  cart: CartItem[];
  transactions: WalletTransaction[];
  musicEnabled: boolean;
  notificationsEnabled: boolean;
  isSubscriber: boolean;
  referralCode: string;
  savedAddresses: string[];

  setLoggedIn: (v: boolean) => void;
  setFirstTime: (v: boolean) => void;
  setPhoneNumber: (v: string) => void;
  setUserName: (v: string) => void;
  addToCart: (item: BiryaniItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  setMusicEnabled: (v: boolean) => void;
  setNotificationsEnabled: (v: boolean) => void;
  spendPoints: (amount: number) => void;
  earnPoints: (amount: number, desc: string) => void;
}

import badshahiImg from '@/assets/biryani-badshahi-murgh.jpg';
import nawabiImg from '@/assets/biryani-nawabi-gosht.jpg';
import zaffraniImg from '@/assets/biryani-zaffrani-sabz.jpg';
import sehatSabzImg from '@/assets/biryani-sehat-sabz.jpg';
import sehatMurghImg from '@/assets/biryani-sehat-murgh.jpg';

const BIRYANI_MENU: BiryaniItem[] = [
  { id: '1', name: 'Badshahi Murgh Biryani', description: 'The emperor\'s recipe. Slow-cooked chicken layered with aged basmati, saffron & royal spices.', price: 349, image: badshahiImg, tags: ['Bestseller', 'Non-Veg'] },
  { id: '2', name: 'Nawabi Gosht Biryani', description: 'Tender mutton pieces marinated for 24 hours in secret Nawabi masala, sealed with dum.', price: 449, image: nawabiImg, tags: ['Premium', 'Non-Veg'] },
  { id: '3', name: 'Zaffrani Sabz Biryani', description: 'Garden-fresh vegetables kissed by real Kashmiri saffron & slow-cooked with paneer.', price: 299, image: zaffraniImg, tags: ['Zafran', 'Veg'] },
  { id: '4', name: 'Sehat Sabz Biryani', description: 'Low-oil, high-fiber vegetarian biryani for the health-conscious royal. 18g protein.', price: 279, image: sehatSabzImg, tags: ['Healthy', 'Veg', '18g Protein'] },
  { id: '5', name: 'Sehat Murgh Biryani', description: 'Lean chicken breast biryani with quinoa blend. The warrior\'s choice. 32g protein.', price: 329, image: sehatMurghImg, tags: ['Healthy', 'Non-Veg', '32g Protein'] },
];

export { BIRYANI_MENU };

const AppContext = createContext<AppState | null>(null);

export const useAppStore = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used within AppProvider');
  return ctx;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setLoggedIn] = useState(false);
  const [isFirstTime, setFirstTime] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userName, setUserName] = useState('Royal Guest');
  const [walletBalance, setWalletBalance] = useState(150);
  const [tier] = useState<RoyalTier>('Wazir');
  const [totalOrders] = useState(12);
  const [currentStreak] = useState(2);
  const [longestStreak] = useState(4);
  const [freeDawatsEarned] = useState(2);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([
    { id: '1', type: 'earned', amount: 50, description: 'Google Review Bonus', date: '2026-02-25' },
    { id: '2', type: 'earned', amount: 100, description: 'Referral Bonus', date: '2026-02-20' },
    { id: '3', type: 'spent', amount: -50, description: 'Order #1042', date: '2026-02-18' },
    { id: '4', type: 'bonus', amount: 50, description: 'Wazir Tier Bonus', date: '2026-02-15' },
  ]);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isSubscriber] = useState(false);
  const [referralCode] = useState('BIRYAAN-ROYAL-7K2X');
  const [savedAddresses] = useState(['123, Royal Palace Road, Hyderabad', '45, Nawab Street, Lucknow']);

  const addToCart = (item: BiryaniItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(c => c.id !== id));
  const updateQuantity = (id: string, qty: number) => {
    if (qty <= 0) return removeFromCart(id);
    setCart(prev => prev.map(c => c.id === id ? { ...c, quantity: qty } : c));
  };
  const clearCart = () => setCart([]);

  const spendPoints = (amount: number) => {
    setWalletBalance(prev => prev - amount);
    setTransactions(prev => [{ id: Date.now().toString(), type: 'spent', amount: -amount, description: 'Points Redeemed', date: new Date().toISOString().split('T')[0] }, ...prev]);
  };

  const earnPoints = (amount: number, desc: string) => {
    setWalletBalance(prev => prev + amount);
    setTransactions(prev => [{ id: Date.now().toString(), type: 'earned', amount, description: desc, date: new Date().toISOString().split('T')[0] }, ...prev]);
  };

  return (
    <AppContext.Provider value={{
      isLoggedIn, isFirstTime, phoneNumber, userName, walletBalance, tier, totalOrders,
      currentStreak, longestStreak, freeDawatsEarned, cart, transactions, musicEnabled,
      notificationsEnabled, isSubscriber, referralCode, savedAddresses,
      setLoggedIn, setFirstTime, setPhoneNumber, setUserName, addToCart, removeFromCart,
      updateQuantity, clearCart, setMusicEnabled, setNotificationsEnabled, spendPoints, earnPoints,
    }}>
      {children}
    </AppContext.Provider>
  );
};
