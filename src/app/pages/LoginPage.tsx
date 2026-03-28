import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '../store';
import { ArrowRight, Shield, Loader2 } from 'lucide-react';

const OTP_LENGTH = 6;

const LoginPage = () => {
  const navigate = useNavigate();
  const { setLoggedIn, setPhoneNumber } = useAppStore();
  const [step, setStep] = useState<'phone' | 'otp' | 'success'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const mockEmail = (p: string) => `${p}@ops.biryaan.app`;

  const handlePhoneSubmit = () => {
    if (phone.length < 10) return;
    setSending(true);
    setError('');
    setPhoneNumber(phone);
    setTimeout(() => {
      setSending(false);
      setStep('otp');
    }, 500);
  };

  const handleVerify = async () => {
    if (otp.length !== OTP_LENGTH || verifying) return;
    setVerifying(true);
    setError('');

    const email = mockEmail(phone);
    const password = otp;

    try {
      // Try sign in
      console.log('[Login] Attempting signIn for', email);
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      console.log('[Login] signIn result:', signInErr?.message || 'success');

      if (signInErr) {
        // User might not exist — try sign up
        console.log('[Login] Attempting signUp');
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({ email, password });
        console.log('[Login] signUp result:', signUpErr?.message || 'success', 'session:', !!signUpData?.session);

        if (signUpErr) throw new Error(signUpErr.message);

        // If no session after signup, sign in again
        if (!signUpData?.session) {
          console.log('[Login] No session after signup, retrying signIn');
          const { error: retryErr } = await supabase.auth.signInWithPassword({ email, password });
          if (retryErr) throw new Error('Account created but login failed. Try again.');
        }
      }

      // Navigate based on role
      const { data: { user } } = await supabase.auth.getUser();
      console.log('[Login] Got user:', user?.id);

      if (!user) throw new Error('Login failed. Please try again.');

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      console.log('[Login] Role:', roleData?.role || 'none (customer)');

      setStep('success');

      setTimeout(() => {
        if (roleData?.role) {
          const roleRoutes: Record<string, string> = {
            super_admin: '/dashboard',
            store_manager: '/dashboard',
            kitchen_manager: '/kitchen',
            delivery_partner: '/deliveries',
          };
          navigate(roleRoutes[roleData.role] || '/dashboard', { replace: true });
        } else {
          setLoggedIn(true);
          navigate('/welcome', { replace: true });
        }
      }, 1500);
    } catch (err: any) {
      console.error('[Login] Error:', err);
      setError(err?.message || 'Something went wrong.');
    } finally {
      setVerifying(false);
    }
  };

  // Simple OTP input handler — single text input
  const handleOtpInput = (value: string) => {
    setOtp(value.replace(/\D/g, '').slice(0, OTP_LENGTH));
  };

  return (
    <div className="fixed inset-0 bg-background mughal-pattern flex flex-col items-center justify-center px-6">
      <AnimatePresence mode="wait">
        {step === 'phone' && (
          <motion.div
            key="phone"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="w-full max-w-sm space-y-8 text-center"
          >
            <div>
              <span className="font-display text-3xl text-gradient-gold">BIRYAAN</span>
              <p className="mt-2 text-muted-foreground text-sm">Enter the Sultanat</p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter Mobile Number"
                  className="w-full pl-14 pr-4 py-4 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-secondary transition-colors text-lg tracking-wider"
                />
              </div>

              {error && <p className="text-destructive text-sm">{error}</p>}

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handlePhoneSubmit}
                disabled={phone.length < 10 || sending}
                className="w-full py-4 bg-gradient-saffron rounded-lg font-heading text-sm uppercase tracking-widest text-primary-foreground disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {sending ? 'Sending...' : 'Send OTP'} <ArrowRight size={16} />
              </motion.button>
            </div>

            <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs">
              <Shield size={12} /> Your number is safe with the Sultanat
            </div>

            <div className="bg-card/50 border border-border rounded-lg p-3 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">🔑 Dev Login</p>
              <p>Admin: <span className="text-secondary font-bold">8373914073</span> | OTP: <span className="text-secondary font-bold">111111</span></p>
            </div>
          </motion.div>
        )}

        {step === 'otp' && (
          <motion.div
            key="otp"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="w-full max-w-sm space-y-8 text-center"
          >
            <div>
              <span className="font-display text-2xl text-gradient-gold">Verify OTP</span>
              <p className="mt-2 text-muted-foreground text-sm">Sent to +91 {phone}</p>
            </div>

            <input
              type="tel"
              inputMode="numeric"
              maxLength={OTP_LENGTH}
              value={otp}
              onChange={e => handleOtpInput(e.target.value)}
              placeholder="Enter 6-digit OTP"
              autoFocus
              className="w-full py-4 text-center text-2xl font-bold tracking-[0.5em] bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground placeholder:text-base placeholder:tracking-normal focus:outline-none focus:border-secondary transition-colors"
            />

            {error && <p className="text-destructive text-sm">{error}</p>}

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleVerify}
              disabled={otp.length !== OTP_LENGTH || verifying}
              className="w-full py-4 bg-gradient-saffron rounded-lg font-heading text-sm uppercase tracking-widest text-primary-foreground disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {verifying ? <><Loader2 size={16} className="animate-spin" /> Verifying...</> : <>Verify <ArrowRight size={16} /></>}
            </motion.button>

            <p className="text-muted-foreground text-xs">
              Wrong number? <button onClick={() => { setStep('phone'); setOtp(''); setError(''); }} className="text-secondary underline">Go back</button>
            </p>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className="text-center space-y-4"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 0.8 }}
              className="text-7xl"
            >
              🏛️
            </motion.div>
            <p className="font-heading text-xl text-gradient-gold">Royal Seal Verified</p>
            <p className="text-muted-foreground text-sm">Entering the Sultanat...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginPage;
