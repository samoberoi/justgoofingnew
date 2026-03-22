import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Smartphone, CreditCard, Building2, Wallet, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';

const paymentMethods = [
  { id: 'upi', label: 'UPI', icon: Smartphone, desc: 'Google Pay, PhonePe, Paytm' },
  { id: 'card', label: 'Card', icon: CreditCard, desc: 'Credit or Debit Card' },
  { id: 'netbanking', label: 'Net Banking', icon: Building2, desc: 'All major banks' },
  { id: 'wallet', label: 'Wallet', icon: Wallet, desc: 'Amazon Pay, Mobikwik' },
];

const PaymentPage = () => {
  const navigate = useNavigate();
  const { clearCart } = useAppStore();
  const [selected, setSelected] = useState('upi');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setSuccess(true);
      clearCart();
    }, 2000);
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 12 }}
          className="text-center space-y-6"
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 1 }}
            className="inline-block"
          >
            <CheckCircle2 size={80} className="text-secondary" />
          </motion.div>
          <h1 className="font-heading text-2xl text-gradient-gold leading-tight">
            Your Royal Dawat<br />Has Been Sealed
          </h1>
          <p className="text-muted-foreground text-sm">Order #BRYN-{Date.now().toString().slice(-4)}</p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/tracking')}
            className="w-full py-4 bg-gradient-saffron rounded-xl font-heading text-sm uppercase tracking-widest text-primary-foreground"
          >
            Track My Biryani
          </motion.button>
          <button onClick={() => navigate('/app')} className="text-muted-foreground text-xs underline">
            Back to Menu
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-foreground" /></button>
          <h1 className="font-heading text-lg text-foreground">Payment</h1>
        </div>
      </header>

      <div className="px-4 pt-6 space-y-3">
        <p className="text-sm text-muted-foreground mb-2">Choose payment method</p>
        {paymentMethods.map(method => (
          <motion.button
            key={method.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelected(method.id)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-colors ${
              selected === method.id ? 'bg-secondary/10 border-secondary/30' : 'bg-card border-border'
            }`}
          >
            <method.icon size={22} className={selected === method.id ? 'text-secondary' : 'text-muted-foreground'} />
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">{method.label}</p>
              <p className="text-xs text-muted-foreground">{method.desc}</p>
            </div>
            <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              selected === method.id ? 'border-secondary' : 'border-muted-foreground/30'
            }`}>
              {selected === method.id && <div className="w-2.5 h-2.5 rounded-full bg-secondary" />}
            </div>
          </motion.button>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border p-4">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handlePay}
          disabled={processing}
          className="w-full py-4 bg-gradient-saffron rounded-xl font-heading text-sm uppercase tracking-widest text-primary-foreground shadow-saffron disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {processing ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full" />
          ) : (
            'Seal the Dawat'
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default PaymentPage;
