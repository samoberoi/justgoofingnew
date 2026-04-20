import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '../store';
import { ArrowRight, Shield, Loader2 } from 'lucide-react';
import { Star, Heart, Sparkle, Cloud } from '../components/Stickers';

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

  const mockEmail = (p: string) => `${p}@ops.justgoofing.app`;

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
    const password = `${phone}-justgoofing-2024`;

    try {
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (!signInErr) { onAuthSuccess(); return; }

      const signUpResult = await Promise.race([
        supabase.auth.signUp({ email, password }),
        new Promise<{ data: null; error: Error }>((resolve) =>
          setTimeout(() => resolve({ data: null, error: new Error('SIGNUP_TIMEOUT') }), 5000)
        ),
      ]);

      if (!signUpResult.error && signUpResult.data?.session) { onAuthSuccess(); return; }

      if (!signUpResult.error && signUpResult.data?.user && !signUpResult.data?.session) {
        const { error: retryErr } = await supabase.auth.signInWithPassword({ email, password });
        if (!retryErr) { onAuthSuccess(); return; }
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-dev-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
          body: JSON.stringify({ email, password }),
        }
      );

      if (res.ok) {
        const { error: finalErr } = await supabase.auth.signInWithPassword({ email, password });
        if (!finalErr) { onAuthSuccess(); return; }
      }
      setError('Login failed. Please try again.');
    } catch (err: any) {
      setError(err?.message || 'Something went wrong.');
    } finally {
      setVerifying(false);
    }
  };

  const onAuthSuccess = async () => {
    setLoggedIn(true);
    setPhoneNumber(phone);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && phone) {
        await supabase.from('profiles').upsert({ user_id: user.id, phone }, { onConflict: 'user_id' });
      }
    } catch {}

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();

        if (roleData?.role) {
          const role = roleData.role as string;
          const dest = role === 'kitchen_manager' ? '/kitchen'
            : role === 'delivery_partner' ? '/deliveries'
            : '/dashboard';
          setStep('success');
          setTimeout(() => { window.location.href = dest; }, 1000);
          return;
        }

        const [ordersRes, packsRes, bookingsRes] = await Promise.all([
          supabase.from('orders').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('user_packs').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        ]);
        const totalActivity = (ordersRes.count || 0) + (packsRes.count || 0) + (bookingsRes.count || 0);
        const dest = totalActivity > 0 ? '/home' : '/welcome';
        setStep('success');
        setTimeout(() => { window.location.href = dest; }, 1000);
        return;
      }
    } catch {}
    setStep('success');
    setTimeout(() => { window.location.href = '/welcome'; }, 1000);
  };

  const handleOtpInput = (value: string) => {
    setOtp(value.replace(/\D/g, '').slice(0, OTP_LENGTH));
  };

  return (
    <div className="fixed inset-0 bg-background bg-confetti flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Floating decorations */}
      <motion.div
        animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute top-[8%] left-[10%]"
      >
        <Cloud size={70} color="hsl(var(--sky))" />
      </motion.div>
      <motion.div
        animate={{ y: [0, -8, 0], rotate: [0, -5, 0] }}
        transition={{ duration: 5, repeat: Infinity, delay: 1 }}
        className="absolute top-[12%] right-[8%]"
      >
        <Star size={36} color="hsl(var(--butter))" />
      </motion.div>
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
        className="absolute bottom-[20%] left-[12%]"
      >
        <Heart size={28} color="hsl(var(--coral))" />
      </motion.div>
      <motion.div
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="absolute bottom-[15%] right-[10%]"
      >
        <Sparkle size={28} color="hsl(var(--lavender))" />
      </motion.div>

      <AnimatePresence mode="wait">
        {step === 'phone' && (
          <motion.div
            key="phone"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="w-full max-w-sm space-y-7 text-center relative z-10"
          >
            <div>
              <motion.img
                src="/logo.png"
                alt="Just Goofing"
                animate={{ rotate: [0, 4, -4, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
                className="h-24 mx-auto"
              />
              <p className="mt-3 text-muted-foreground text-sm font-medium">Where the fun never stops 🎉</p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-ink font-display text-base">+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="Mobile number"
                  className="w-full pl-16 pr-4 py-4 bg-card border-2 border-ink/10 rounded-2xl text-ink placeholder:text-muted-foreground/60 focus:outline-none focus:border-coral text-lg font-display tracking-wide shadow-soft"
                />
              </div>

              {error && <p className="text-destructive text-sm font-medium">{error}</p>}

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handlePhoneSubmit}
                disabled={phone.length < 10 || sending}
                className="w-full py-4 bg-gradient-coral rounded-2xl font-display text-base text-ink disabled:opacity-40 flex items-center justify-center gap-2 shadow-pop-coral border-2 border-ink/10"
              >
                {sending ? 'Sending...' : 'Send OTP'} <ArrowRight size={18} strokeWidth={2.5} />
              </motion.button>
            </div>

            <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs font-medium">
              <Shield size={12} strokeWidth={2.5} /> Your number is safe with us
            </div>

            <div className="bg-gradient-butter rounded-2xl p-3.5 text-xs text-ink border-2 border-ink/10 shadow-soft">
              <p className="font-display mb-1">🔑 Dev Login</p>
              <p className="font-medium">Admin: <span className="font-display">8373914073</span> · OTP: <span className="font-display">111111</span></p>
              <p className="mt-0.5 font-medium">Delivery: <span className="font-display">7777777777</span> · OTP: <span className="font-display">111111</span></p>
            </div>
          </motion.div>
        )}

        {step === 'otp' && (
          <motion.div
            key="otp"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="w-full max-w-sm space-y-7 text-center relative z-10"
          >
            <div>
              <span className="font-display text-3xl text-gradient-rainbow">Verify OTP</span>
              <p className="mt-2 text-muted-foreground text-sm font-medium">Sent to +91 {phone}</p>
            </div>

            <input
              type="tel"
              inputMode="numeric"
              maxLength={OTP_LENGTH}
              value={otp}
              onChange={e => handleOtpInput(e.target.value)}
              placeholder="Enter 6-digit OTP"
              autoFocus
              className="w-full py-4 text-center text-2xl font-display tracking-[0.5em] bg-card border-2 border-ink/10 rounded-2xl text-ink placeholder:text-muted-foreground placeholder:text-base placeholder:tracking-normal focus:outline-none focus:border-coral shadow-soft"
            />

            {error && <p className="text-destructive text-sm font-medium">{error}</p>}

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleVerify}
              disabled={otp.length !== OTP_LENGTH || verifying}
              className="w-full py-4 bg-gradient-coral rounded-2xl font-display text-base text-ink disabled:opacity-40 flex items-center justify-center gap-2 shadow-pop-coral border-2 border-ink/10"
            >
              {verifying ? <><Loader2 size={18} className="animate-spin" /> Verifying...</> : <>Let's go <ArrowRight size={18} strokeWidth={2.5} /></>}
            </motion.button>

            <p className="text-muted-foreground text-xs font-medium">
              Wrong number? <button onClick={() => { setStep('phone'); setOtp(''); setError(''); }} className="text-coral underline font-display">Go back</button>
            </p>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 14 }}
            className="text-center space-y-4 relative z-10"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.3, 1] }}
              transition={{ duration: 0.8 }}
              className="text-8xl"
            >
              🎉
            </motion.div>
            <p className="font-display text-3xl text-gradient-rainbow">You're In!</p>
            <p className="text-muted-foreground text-sm font-medium">Let the goofing begin...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginPage;
