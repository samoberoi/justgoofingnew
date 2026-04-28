import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, Shield } from 'lucide-react';
import { Star, Sparkle } from '../../app/components/Stickers';

const OpsLoginPage = () => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const mockEmail = (p: string) => `${p}@ops.justgoofing.app`;

  const handlePhoneSubmit = async () => {
    if (phone.length < 10) return;
    setSending(true);
    setError('');
    setTimeout(() => {
      setSending(false);
      setStep('otp');
    }, 500);
  };

  const handleOtpChange = async (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      document.getElementById(`ops-otp-${index + 1}`)?.focus();
    }

    if (newOtp.every(d => d !== '')) {
      setError('');
      const password = `${phone}-justgoofing-2024`;
      const email = mockEmail(phone);

      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) {
        const { error: signUpErr } = await supabase.auth.signUp({ email, password });
        if (signUpErr) {
          if (signUpErr.message.includes('already registered')) {
            try {
              const res = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-dev-password`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
                  body: JSON.stringify({ email, password }),
                }
              );
              if (res.ok) {
                await supabase.auth.signInWithPassword({ email, password });
              } else {
                setError('Could not reset account.');
              }
            } catch {
              setError('Login failed. Try again.');
            }
          } else {
            setError(signUpErr.message);
          }
          setOtp(['', '', '', '', '', '']);
          document.getElementById('ops-otp-0')?.focus();
          return;
        }
        const { error: retryErr } = await supabase.auth.signInWithPassword({ email, password });
        if (retryErr) {
          setError('Account created but login failed.');
          setOtp(['', '', '', '', '', '']);
          document.getElementById('ops-otp-0')?.focus();
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-background bg-confetti flex flex-col items-center justify-center px-6 overflow-hidden">
      <Star className="absolute top-16 right-12 w-10 h-10 text-butter opacity-50 animate-wobble" />
      <Sparkle className="absolute bottom-32 left-12 w-8 h-8 text-coral opacity-50 animate-bounce-soft" />

      <AnimatePresence mode="wait">
        {step === 'phone' && (
          <motion.div
            key="phone"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-sm space-y-6 text-center relative z-10"
          >
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-coral/15 border-2 border-coral/20">
                <Shield size={14} className="text-coral" />
                <span className="text-[11px] font-heading text-coral uppercase tracking-wider">Staff Only</span>
              </div>
              <h1 className="font-display text-3xl text-ink mt-3">Ops Command 🎛️</h1>
              <p className="text-sm text-ink/60">Sign in to manage Just Goofing</p>
            </div>

            <div className="bg-card border-2 border-ink/8 rounded-3xl p-5 shadow-pop space-y-4">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/50 text-sm font-heading">+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="Mobile Number"
                  className="w-full pl-14 pr-4 py-3.5 bg-background border-2 border-ink/8 rounded-2xl text-ink text-lg tracking-wider focus:outline-none focus:border-coral transition-colors"
                />
              </div>

              {error && <p className="text-coral text-xs font-heading">{error}</p>}

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handlePhoneSubmit}
                disabled={phone.length < 10 || sending}
                className="w-full py-3.5 bg-gradient-coral rounded-2xl font-heading text-sm text-white shadow-pop-coral disabled:opacity-40 disabled:shadow-none flex items-center justify-center gap-2"
              >
                {sending ? 'Sending OTP…' : 'Send OTP'} <ArrowRight size={16} />
              </motion.button>
            </div>
          </motion.div>
        )}

        {step === 'otp' && (
          <motion.div
            key="otp"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-sm space-y-6 text-center relative z-10"
          >
            <div>
              <h1 className="font-display text-3xl text-ink">Verify OTP ✨</h1>
              <p className="mt-2 text-sm text-ink/60">Sent to +91 {phone}</p>
            </div>

            <div className="bg-card border-2 border-ink/8 rounded-3xl p-5 shadow-pop space-y-4">
              <div className="flex justify-center gap-2">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`ops-otp-${i}`}
                    type="tel"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    className="w-11 h-14 text-center text-xl font-display bg-background border-2 border-ink/8 rounded-2xl text-ink focus:outline-none focus:border-coral transition-colors"
                  />
                ))}
              </div>

              {error && <p className="text-coral text-xs font-heading">{error}</p>}

              <button
                onClick={() => { setStep('phone'); setOtp(['','','','','','']); setError(''); }}
                className="text-xs text-ink/60 underline font-heading"
              >
                Wrong number? Go back
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OpsLoginPage;
