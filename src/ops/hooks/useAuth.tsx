import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export type AppRole = 'super_admin' | 'store_manager' | 'kitchen_manager' | 'delivery_partner';

interface AuthState {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  storeId: string | null;
  loading: boolean;
  signInWithOtp: (phone: string) => Promise<{ error: any }>;
  verifyOtp: (phone: string, token: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const OpsAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role, store_id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      if (data) {
        setRole(data.role as AppRole);
        setStoreId(data.store_id);
      } else {
        setRole(null);
        setStoreId(null);
      }
    } catch (e) {
      console.warn('[Auth] fetchRole error:', e);
      setRole(null);
      setStoreId(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    // First get the current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Fire-and-forget — do NOT block the callback
        fetchRole(session.user.id).then(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    // CRITICAL: This callback must NOT be async — Supabase JS client
    // waits for all listeners to resolve. Making it async deadlocks auth.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRole(session.user.id).then(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setRole(null);
        setStoreId(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithOtp = async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    return { error };
  };

  const verifyOtp = async (phone: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setStoreId(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, role, storeId, loading, signInWithOtp, verifyOtp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
