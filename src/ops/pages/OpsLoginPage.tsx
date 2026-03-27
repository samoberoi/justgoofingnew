import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, Shield, ChefHat } from 'lucide-react';

const OpsLoginPage = () => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  // Mock email from phone for dev login
  const mockEmail = (p: string) => `${p}@ops.biryaan.app`;

  const handlePhoneSubmit = async () => {
    if (phone.length < 10) return;
    setSending(true);
    setError('');
    // No real SMS — just move to OTP step
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
      const password = newOtp.join('');
      const email = mockEmail(phone);

      // Try sign in first
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) {
        // If user doesn't exist, sign up (auto-confirm is enabled)
        const { error: signUpErr } = await supabase.auth.signUp({ email, password });
        if (signUpErr) {
          setError(signUpErr.message);
          setOtp(['', '', '', '', '', '']);
          document.getElementById('ops-otp-0')?.focus();
          return;
        }
        // Sign in after signup
        const { error: retryErr } = await supabase.auth.signInWithPassword({ email, password });
        if (retryErr) {
          setError('Account created but login failed. Try again.');
          setOtp(['', '', '', '', '', '']);
          document.getElementById('ops-otp-0')?.focus();
        }
      }
    }
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
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <ChefHat className="text-secondary" size={28} />
                <span className="font-display text-2xl text-gradient-gold">BIRYAAN OPS</span>
              </div>
              <p className="text-muted-foreground text-sm">Operations Command Center</p>
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
              <Shield size={12} /> Staff access only
            </div>

            <div className="bg-card/50 border border-border rounded-lg p-3 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">🔑 Dev Login</p>
              <p>Phone: <span className="text-secondary font-bold">8373914073</span> | OTP: <span className="text-secondary font-bold">111111</span></p>
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

            <div className="flex justify-center gap-3">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`ops-otp-${i}`}
                  type="tel"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  className="w-12 h-14 text-center text-xl font-bold bg-card border border-border rounded-lg text-foreground focus:outline-none focus:border-secondary transition-colors"
                />
              ))}
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <p className="text-muted-foreground text-xs">
              Wrong number? <button onClick={() => { setStep('phone'); setOtp(['','','','','','']); setError(''); }} className="text-secondary underline">Go back</button>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OpsLoginPage;
