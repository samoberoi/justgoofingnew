import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store';
import { ArrowRight, Shield } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const { setLoggedIn, setPhoneNumber, isFirstTime } = useAppStore();
  const [step, setStep] = useState<'phone' | 'otp' | 'success'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  const handlePhoneSubmit = () => {
    if (phone.length >= 10) {
      setPhoneNumber(phone);
      setStep('otp');
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
    if (newOtp.every(d => d !== '')) {
      setTimeout(() => {
        setStep('success');
        setTimeout(() => {
          setLoggedIn(true);
          navigate(isFirstTime ? '/app/welcome' : '/app');
        }, 2000);
      }, 500);
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
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handlePhoneSubmit}
                disabled={phone.length < 10}
                className="w-full py-4 bg-gradient-saffron rounded-lg font-heading text-sm uppercase tracking-widest text-primary-foreground disabled:opacity-40 flex items-center justify-center gap-2"
              >
                Send OTP <ArrowRight size={16} />
              </motion.button>
            </div>

            <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs">
              <Shield size={12} /> Your number is safe with the Sultanat
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
                  id={`otp-${i}`}
                  type="tel"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  className="w-12 h-14 text-center text-xl font-bold bg-card border border-border rounded-lg text-foreground focus:outline-none focus:border-secondary transition-colors"
                />
              ))}
            </div>

            <p className="text-muted-foreground text-xs">
              Didn't receive? <button className="text-secondary underline">Resend OTP</button>
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
