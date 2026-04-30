import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '../store';
import { ArrowRight, Shield, Loader2, Fingerprint, Mail } from 'lucide-react';
import Icon3D from '../components/Icon3D';
import charHero from '@/assets/char-hero.png';
import justGoofingLogo from '@/assets/just-goofing-logo.png';
import { hashPin } from '../lib/pinHash';
import {
  isBiometricAvailable,
  isBiometricEnabled,
  getStoredBiometricPhone,
  getStoredPin,
  authenticateBiometric,
  enableBiometric,
  getBiometryLabel,
  isNative,
} from '../lib/biometric';

const PIN_LENGTH = 4;

type Step = 'phone' | 'pin' | 'signup' | 'biometric-prompt' | 'forgot' | 'success';

const LoginPage = () => {
  const navigate = useNavigate();
  const { setLoggedIn, setPhoneNumber } = useAppStore();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [biometryLabel, setBiometryLabel] = useState('Biometrics');
  const [biometricAvail, setBiometricAvail] = useState(false);
  const [forgotMaskedEmail, setForgotMaskedEmail] = useState('');

  const triedBiometricRef = useRef(false);

  useEffect(() => {
    (async () => {
      const avail = await isBiometricAvailable();
      setBiometricAvail(avail);
      if (avail) setBiometryLabel(await getBiometryLabel());

      // Auto-attempt biometric login on mount if previously enabled
      if (avail && !triedBiometricRef.current) {
        const storedPhone = getStoredBiometricPhone();
        const storedPin = getStoredPin();
        if (storedPhone && storedPin) {
          triedBiometricRef.current = true;
          setPhone(storedPhone);
          const ok = await authenticateBiometric();
          if (ok) {
            await loginWithPin(storedPhone, storedPin, false);
          }
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mockEmail = (p: string) => `${p}@ops.justgoofing.app`;
  const password = (p: string) => `${p}-justgoofing-2024`;

  // === PHONE STEP ===
  const handlePhoneSubmit = async () => {
    if (phone.length < 10 || busy) return;
    setBusy(true);
    setError('');
    setPhoneNumber(phone);
    try {
      const { data, error } = await supabase.rpc('phone_has_pin', { _phone: phone });
      if (error) throw error;
      if (data === true) {
        setStep('pin');
      } else {
        setStep('signup');
      }
    } catch (e: any) {
      setError(e?.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  // === SIGNUP STEP ===
  const handleSignup = async () => {
    if (busy) return;
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError('Enter a valid email'); return; }
    if (pin.length !== PIN_LENGTH) { setError('PIN must be 4 digits'); return; }
    if (pin !== confirmPin) { setError("PINs don't match"); return; }

    setBusy(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/setup-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ phone, email, pin }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Signup failed');
      // sign in immediately
      await loginWithPin(phone, pin, true);
    } catch (e: any) {
      setError(e?.message || 'Signup failed');
      setBusy(false);
    }
  };

  // === PIN LOGIN ===
  const handlePinSubmit = async () => {
    if (pin.length !== PIN_LENGTH || busy) return;
    await loginWithPin(phone, pin, false);
  };

  const loginWithPin = async (p: string, pinValue: string, justSignedUp: boolean) => {
    setBusy(true);
    setError('');
    try {
      const pinHash = await hashPin(pinValue);
      const { data: ok, error: rpcErr } = await supabase.rpc('verify_phone_pin', { _phone: p, _pin_hash: pinHash });
      if (rpcErr) throw rpcErr;
      if (!ok) {
        setError('Wrong PIN. Try again.');
        setPin('');
        setBusy(false);
        return;
      }

      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: mockEmail(p),
        password: password(p),
      });
      if (signErr) throw signErr;

      // First login — offer biometric setup
      if (biometricAvail && !isBiometricEnabled(p)) {
        // stash pin temporarily for the biometric-prompt step
        sessionStorage.setItem('jg_pending_pin', pinValue);
        setStep('biometric-prompt');
        setBusy(false);
        return;
      }

      await onAuthSuccess();
    } catch (e: any) {
      setError(e?.message || 'Login failed');
      setBusy(false);
    }
  };

  // === BIOMETRIC PROMPT ===
  const handleEnableBiometric = async () => {
    setBusy(true);
    const pinValue = sessionStorage.getItem('jg_pending_pin') || '';
    const ok = await enableBiometric(phone, pinValue);
    if (ok) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) await supabase.from('profiles').update({ biometric_enabled: true }).eq('user_id', user.id);
      } catch {}
    }
    sessionStorage.removeItem('jg_pending_pin');
    await onAuthSuccess();
  };

  const handleSkipBiometric = async () => {
    sessionStorage.removeItem('jg_pending_pin');
    await onAuthSuccess();
  };

  // === FORGOT PIN ===
  const handleForgotPin = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/forgot-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ phone }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not reset PIN');
      setForgotMaskedEmail(json.sentTo || '');
      setStep('forgot');
    } catch (e: any) {
      setError(e?.message || 'Could not reset PIN');
    } finally {
      setBusy(false);
    }
  };

  // === SUCCESS / NAVIGATION ===
  const onAuthSuccess = async () => {
    setLoggedIn(true);
    setPhoneNumber(phone);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').upsert({ user_id: user.id, phone }, { onConflict: 'user_id' });

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
          setTimeout(() => { window.location.href = dest; }, 800);
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
        setTimeout(() => { window.location.href = dest; }, 800);
        return;
      }
    } catch {}
    setStep('success');
    setTimeout(() => { window.location.href = '/welcome'; }, 800);
  };

  const goBack = () => {
    setError('');
    setPin('');
    setConfirmPin('');
    setEmail('');
    setStep('phone');
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center px-6 overflow-hidden">
      <motion.img
        src={charHero}
        alt=""
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute top-[6%] right-[-2rem] w-40 h-40 object-contain pointer-events-none opacity-90"
      />
      <div className="absolute top-[14%] left-6">
        <Icon3D name="gift" size={56} alt="" className="animate-bounce-soft" />
      </div>
      <div className="absolute bottom-[18%] right-6">
        <Icon3D name="play" size={48} alt="" />
      </div>

      <AnimatePresence mode="wait">
        {/* PHONE */}
        {step === 'phone' && (
          <motion.div
            key="phone"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="w-full max-w-sm space-y-7 text-center relative z-10"
          >
            <div>
              <motion.div
                animate={{ rotate: [0, 4, -4, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
                className="w-44 h-24 mx-auto flex items-center justify-center"
              >
                <img src={justGoofingLogo} alt="Just Goofing" className="w-full h-full object-contain" />
              </motion.div>
              <h1 className="font-display text-3xl text-ink mt-4 -tracking-wide">Just Goofing</h1>
              <p className="mt-1.5 text-muted-foreground text-sm font-heading">Where the fun never stops 🎉</p>
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
                disabled={phone.length < 10 || busy}
                className="w-full py-4 bg-gradient-coral rounded-2xl font-display text-base text-ink disabled:opacity-40 flex items-center justify-center gap-2 shadow-pop-coral border-2 border-ink/10"
              >
                {busy ? <Loader2 size={18} className="animate-spin" /> : <>Continue <ArrowRight size={18} strokeWidth={2.5} /></>}
              </motion.button>
            </div>

            <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs font-medium">
              <Shield size={12} strokeWidth={2.5} /> Your number is safe with us
            </div>
          </motion.div>
        )}

        {/* SIGNUP */}
        {step === 'signup' && (
          <motion.div
            key="signup"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="w-full max-w-sm space-y-5 text-center relative z-10"
          >
            <div>
              <span className="font-display text-3xl text-gradient-rainbow">Set up your account</span>
              <p className="mt-2 text-muted-foreground text-sm font-medium">+91 {phone}</p>
            </div>

            <input
              type="email"
              autoCapitalize="none"
              value={email}
              onChange={e => setEmail(e.target.value.trim())}
              placeholder="Email (for PIN recovery)"
              className="w-full py-4 px-5 bg-card border-2 border-ink/10 rounded-2xl text-ink placeholder:text-muted-foreground/60 focus:outline-none focus:border-coral text-base font-medium shadow-soft"
            />

            <input
              type="tel"
              inputMode="numeric"
              maxLength={PIN_LENGTH}
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH))}
              placeholder="Create 4-digit PIN"
              className="w-full py-4 text-center text-2xl font-display tracking-[0.6em] bg-card border-2 border-ink/10 rounded-2xl text-ink placeholder:text-muted-foreground placeholder:text-base placeholder:tracking-normal focus:outline-none focus:border-coral shadow-soft"
            />

            <input
              type="tel"
              inputMode="numeric"
              maxLength={PIN_LENGTH}
              value={confirmPin}
              onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH))}
              placeholder="Confirm PIN"
              className="w-full py-4 text-center text-2xl font-display tracking-[0.6em] bg-card border-2 border-ink/10 rounded-2xl text-ink placeholder:text-muted-foreground placeholder:text-base placeholder:tracking-normal focus:outline-none focus:border-coral shadow-soft"
            />

            {error && <p className="text-destructive text-sm font-medium">{error}</p>}

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleSignup}
              disabled={busy}
              className="w-full py-4 bg-gradient-coral rounded-2xl font-display text-base text-ink disabled:opacity-40 flex items-center justify-center gap-2 shadow-pop-coral border-2 border-ink/10"
            >
              {busy ? <><Loader2 size={18} className="animate-spin" /> Creating...</> : <>Create account <ArrowRight size={18} strokeWidth={2.5} /></>}
            </motion.button>

            <p className="text-muted-foreground text-xs font-medium">
              <button onClick={goBack} className="text-coral underline font-display">Use a different number</button>
            </p>
          </motion.div>
        )}

        {/* PIN LOGIN */}
        {step === 'pin' && (
          <motion.div
            key="pin"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="w-full max-w-sm space-y-7 text-center relative z-10"
          >
            <div>
              <span className="font-display text-3xl text-gradient-rainbow">Enter your PIN</span>
              <p className="mt-2 text-muted-foreground text-sm font-medium">+91 {phone}</p>
            </div>

            <input
              type="tel"
              inputMode="numeric"
              maxLength={PIN_LENGTH}
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH))}
              placeholder="• • • •"
              autoFocus
              className="w-full py-4 text-center text-3xl font-display tracking-[0.7em] bg-card border-2 border-ink/10 rounded-2xl text-ink placeholder:text-muted-foreground placeholder:text-2xl focus:outline-none focus:border-coral shadow-soft"
            />

            {error && <p className="text-destructive text-sm font-medium">{error}</p>}

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handlePinSubmit}
              disabled={pin.length !== PIN_LENGTH || busy}
              className="w-full py-4 bg-gradient-coral rounded-2xl font-display text-base text-ink disabled:opacity-40 flex items-center justify-center gap-2 shadow-pop-coral border-2 border-ink/10"
            >
              {busy ? <><Loader2 size={18} className="animate-spin" /> Logging in...</> : <>Let's go <ArrowRight size={18} strokeWidth={2.5} /></>}
            </motion.button>

            {biometricAvail && isBiometricEnabled(phone) && (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={async () => {
                  const ok = await authenticateBiometric();
                  if (ok) {
                    const storedPin = getStoredPin();
                    if (storedPin) await loginWithPin(phone, storedPin, false);
                  }
                }}
                className="w-full py-3 bg-card border-2 border-ink/10 rounded-2xl font-display text-sm text-ink flex items-center justify-center gap-2 shadow-soft"
              >
                <Fingerprint size={18} /> Unlock with {biometryLabel}
              </motion.button>
            )}

            <div className="flex items-center justify-between text-xs font-medium">
              <button onClick={goBack} className="text-muted-foreground underline">
                Wrong number?
              </button>
              <button onClick={handleForgotPin} disabled={busy} className="text-coral underline font-display">
                Forgot PIN?
              </button>
            </div>
          </motion.div>
        )}

        {/* BIOMETRIC PROMPT */}
        {step === 'biometric-prompt' && (
          <motion.div
            key="bio"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-sm space-y-6 text-center relative z-10"
          >
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.6, repeat: Infinity }}>
              <Fingerprint size={72} className="mx-auto text-coral" strokeWidth={1.5} />
            </motion.div>
            <div>
              <h2 className="font-display text-2xl text-ink">Use {biometryLabel} next time?</h2>
              <p className="mt-2 text-muted-foreground text-sm font-medium">
                Skip the PIN — unlock with a tap.
              </p>
            </div>

            <div className="space-y-3">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleEnableBiometric}
                disabled={busy}
                className="w-full py-4 bg-gradient-coral rounded-2xl font-display text-base text-ink disabled:opacity-40 flex items-center justify-center gap-2 shadow-pop-coral border-2 border-ink/10"
              >
                {busy ? <Loader2 size={18} className="animate-spin" /> : <>Enable {biometryLabel}</>}
              </motion.button>
              <button onClick={handleSkipBiometric} className="w-full py-3 text-muted-foreground text-sm font-medium underline">
                Maybe later
              </button>
            </div>
          </motion.div>
        )}

        {/* FORGOT PIN CONFIRMATION */}
        {step === 'forgot' && (
          <motion.div
            key="forgot"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="w-full max-w-sm space-y-6 text-center relative z-10"
          >
            <Mail size={64} className="mx-auto text-coral" strokeWidth={1.5} />
            <div>
              <h2 className="font-display text-2xl text-ink">Check your email</h2>
              <p className="mt-2 text-muted-foreground text-sm font-medium">
                We sent a new PIN to <span className="text-ink font-display">{forgotMaskedEmail}</span>
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => { setStep('pin'); setPin(''); setError(''); }}
              className="w-full py-4 bg-gradient-coral rounded-2xl font-display text-base text-ink flex items-center justify-center gap-2 shadow-pop-coral border-2 border-ink/10"
            >
              Enter new PIN <ArrowRight size={18} strokeWidth={2.5} />
            </motion.button>
          </motion.div>
        )}

        {/* SUCCESS */}
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
