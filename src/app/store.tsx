import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

export interface LoyaltyCampaign {
  id: string;
  name: string;
  type: string; // flat, percentage, free_item
  category: string;
  coupon_code: string | null;
  auto_apply: boolean;
  discount_value: number;
  min_order_value: number | null;
  target_audience: string;
  is_active: boolean;
}

interface AppState {
  isLoggedIn: boolean;
  userId: string | null;
  phoneNumber: string;
  userName: string;
  walletBalance: number;
  totalOrders: number;
  cart: CartItem[];
  transactions: WalletTransaction[];
  musicEnabled: boolean;
  notificationsEnabled: boolean;
  referralCode: string;
  savedAddresses: string[];
  activeCampaigns: LoyaltyCampaign[];
  badges: { id: string; name: string; icon: string; description: string | null; earned_at?: string }[];

  setLoggedIn: (v: boolean) => void;
  setPhoneNumber: (v: string) => void;
  setUserName: (v: string) => void;
  addToCart: (item: BiryaniItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  setMusicEnabled: (v: boolean) => void;
  setNotificationsEnabled: (v: boolean) => void;
  refreshUserData: () => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

export const useAppStore = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used within AppProvider');
  return ctx;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userName, setUserName] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [referralCode, setReferralCode] = useState('');
  const [savedAddresses] = useState<string[]>([]);
  const [activeCampaigns, setActiveCampaigns] = useState<LoyaltyCampaign[]>([]);
  const [badges, setBadges] = useState<any[]>([]);

  // Listen for auth state changes
  // CRITICAL: This callback must NOT be async — Supabase JS client waits for
  // all onAuthStateChange listeners to resolve before completing signUp/signIn.
  // Making it async with awaits deadlocks the auth flow.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const uid = session.user.id;
        setUserId(uid);
        const code = 'BIRYAAN-' + uid.slice(0, 6).toUpperCase();
        setReferralCode(code);

        // Fire-and-forget referral setup — completely detached from callback
        setTimeout(() => {
          void (async () => {
            try {
              const { data: existing } = await supabase
                .from('referrals')
                .select('id')
                .eq('referrer_id', uid)
                .eq('referral_code', code)
                .limit(1);
              if (!existing || existing.length === 0) {
                await supabase.from('referrals').insert({
                  referrer_id: uid,
                  referral_code: code,
                  status: 'pending',
                });
              }
            } catch (e) {
              console.warn('[Store] Referral setup failed:', e);
            }
          })();
        }, 0);
      } else {
        setUserId(null);
        setWalletBalance(0);
        setTotalOrders(0);
        setTransactions([]);
        setBadges([]);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch user data when userId changes
  useEffect(() => {
    if (userId) refreshUserData();
  }, [userId]);

  // Fetch active campaigns on mount
  useEffect(() => {
    const fetchCampaigns = async () => {
      const { data } = await supabase
        .from('loyalty_campaigns')
        .select('*')
        .eq('is_active', true) as any;
      setActiveCampaigns(data || []);
    };
    fetchCampaigns();
  }, []);

  const refreshUserData = async () => {
    if (!userId) return;

    // Fetch points balance from transactions for THIS user only
    const { data: ptsTx } = await supabase
      .from('points_transactions')
      .select('amount, type, description, created_at, id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }) as any;

    if (ptsTx) {
      const balance = ptsTx.reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);
      setWalletBalance(Math.max(0, balance));
      setTransactions(ptsTx.map((tx: any) => ({
        id: tx.id,
        type: Number(tx.amount) >= 0 ? (tx.type === 'bonus' || tx.type === 'referral' ? 'bonus' : 'earned') : 'spent',
        amount: Number(tx.amount),
        description: tx.description || '',
        date: tx.created_at?.split('T')[0] || '',
      })));
    }

    // Fetch order count for THIS user only
    const { count } = await (supabase
      .from('orders')
      .select('id', { count: 'exact', head: true }) as any)
      .eq('user_id', userId);
    setTotalOrders(count || 0);

    // Fetch badges
    const { data: userBadges } = await supabase
      .from('user_badges')
      .select('badge_id, earned_at, badges(name, icon, description)')
      .eq('user_id', userId) as any;
    if (userBadges) {
      setBadges(userBadges.map((ub: any) => ({
        id: ub.badge_id,
        name: ub.badges?.name || '',
        icon: ub.badges?.icon || '🏅',
        description: ub.badges?.description || '',
        earned_at: ub.earned_at,
      })));
    }
  };

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

  return (
    <AppContext.Provider value={{
      isLoggedIn, userId, phoneNumber, userName, walletBalance, totalOrders,
      cart, transactions, musicEnabled, notificationsEnabled, referralCode,
      savedAddresses, activeCampaigns, badges,
      setLoggedIn, setPhoneNumber, setUserName, addToCart, removeFromCart,
      updateQuantity, clearCart, setMusicEnabled, setNotificationsEnabled, refreshUserData,
    }}>
      {children}
    </AppContext.Provider>
  );
};
