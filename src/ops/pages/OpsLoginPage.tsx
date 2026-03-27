import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { ArrowRight, Shield, ChefHat } from 'lucide-react';

const OpsLoginPage = () => {
  const { signInWithOtp, verifyOtp } = useAuth();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const handlePhoneSubmit = async () => {
    if (phone.length < 10) return;
    setSending(true);
    setError('');
    const fullPhone = '+91' + phone;
    const { error: err } = await signInWithOtp(fullPhone);
    setSending(false);
    if (err) {
      setError(err.message);
    } else {
      setStep('otp');
    }
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
      const fullPhone = '+91' + phone;
      const { error: err } = await verifyOtp(fullPhone, newOtp.join(''));
      if (err) {
        setError('Invalid OTP. Please try again.');
        setOtp(['', '', '', '', '', '']);
        document.getElementById('ops-otp-0')?.focus();
      }
      // On success, auth state change will handle redirect
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
              Didn't receive? <button onClick={() => handlePhoneSubmit()} className="text-secondary underline">Resend OTP</button>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OpsLoginPage;
