import { useState, useCallback } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '../store';

const segments = [
  { label: '20 Points', value: 20, type: 'points' as const, color: 'hsl(43 80% 55%)' },
  { label: 'Free Raita', value: 0, type: 'addon' as const, color: 'hsl(30 90% 50%)' },
  { label: '50 Points', value: 50, type: 'points' as const, color: 'hsl(5 70% 40%)' },
  { label: '2× Points', value: 0, type: 'double' as const, color: 'hsl(43 60% 45%)' },
  { label: '100 Points', value: 100, type: 'points' as const, color: 'hsl(30 70% 45%)' },
  { label: '🍗 FREE Biryani!', value: 0, type: 'biryani' as const, color: 'hsl(5 60% 35%)' },
  { label: '20 Points', value: 20, type: 'points' as const, color: 'hsl(43 80% 55%)' },
  { label: '50 Points', value: 50, type: 'points' as const, color: 'hsl(30 90% 50%)' },
];

const SEGMENT_COUNT = segments.length;
const SEG_ANGLE = 360 / SEGMENT_COUNT;

const SpinWheelPage = () => {
  const navigate = useNavigate();
  const { walletBalance, refreshUserData } = useAppStore();
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<typeof segments[0] | null>(null);
  const [spinsLeft, setSpinsLeft] = useState(1);
  const [totalRotation, setTotalRotation] = useState(0);
  const controls = useAnimation();

  const handleSpin = useCallback(async () => {
    if (spinning || spinsLeft <= 0) return;
    setSpinning(true);
    setResult(null);

    const weights = [20, 10, 15, 10, 8, 2, 20, 15];
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let rand = Math.random() * totalWeight;
    let winIndex = 0;
    for (let i = 0; i < weights.length; i++) {
      rand -= weights[i];
      if (rand <= 0) { winIndex = i; break; }
    }

    const extraSpins = 5 + Math.floor(Math.random() * 3);
    const targetAngle = totalRotation + extraSpins * 360 + (360 - winIndex * SEG_ANGLE - SEG_ANGLE / 2);

    await controls.start({
      rotate: targetAngle,
      transition: { duration: 4.5, ease: [0.15, 0.65, 0.08, 0.98] },
    });

    setTotalRotation(targetAngle);
    const won = segments[winIndex];
    setResult(won);
    setSpinning(false);
    setSpinsLeft(prev => prev - 1);

    // Credit points to backend
    if (won.type === 'points' && won.value > 0) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('points_transactions').insert({
          user_id: user.id,
          type: 'bonus',
          amount: won.value,
          balance_after: walletBalance + won.value,
          description: `Spin Wheel: Won ${won.label}`,
        } as any);
        refreshUserData();
      }
    }
  }, [spinning, spinsLeft, controls, totalRotation, walletBalance, refreshUserData]);

  const getResultMessage = () => {
    if (!result) return '';
    switch (result.type) {
      case 'points': return `${result.value} Goofy Points added to your wallet!`;
      case 'addon': return 'Free Raita will be added to your next order!';
      case 'double': return 'Your next order earns 2× Goofy Points!';
      case 'biryani': return 'A FREE Biryani has been unlocked! 🎉';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-foreground" /></button>
          <h1 className="font-heading text-lg text-foreground">Spin the Wheel</h1>
        </div>
      </header>

      <div className="px-4 pt-8 flex flex-col items-center">
        <p className="text-sm text-muted-foreground mb-6">
          {spinsLeft > 0 ? `${spinsLeft} spin${spinsLeft > 1 ? 's' : ''} available` : 'Come back next week for more spins!'}
        </p>

        <div className="relative w-72 h-72">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-secondary drop-shadow-lg" />
          <motion.svg animate={controls} width="288" height="288" viewBox="0 0 288 288" style={{ transformOrigin: 'center center' }} className="drop-shadow-2xl">
            {segments.map((seg, i) => {
              const startAngle = (i * SEG_ANGLE - 90) * (Math.PI / 180);
              const endAngle = ((i + 1) * SEG_ANGLE - 90) * (Math.PI / 180);
              const r = 140;
              const cx = 144, cy = 144;
              const x1 = cx + r * Math.cos(startAngle);
              const y1 = cy + r * Math.sin(startAngle);
              const x2 = cx + r * Math.cos(endAngle);
              const y2 = cy + r * Math.sin(endAngle);
              const midAngle = ((i + 0.5) * SEG_ANGLE - 90) * (Math.PI / 180);
              const labelR = r * 0.65;
              const lx = cx + labelR * Math.cos(midAngle);
              const ly = cy + labelR * Math.sin(midAngle);
              const textRotation = (i + 0.5) * SEG_ANGLE;
              return (
                <g key={i}>
                  <path d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 0,1 ${x2},${y2} Z`} fill={seg.color} stroke="hsl(0 0% 10%)" strokeWidth="1" />
                  <text x={lx} y={ly} fill="white" fontSize="10" fontWeight="bold" textAnchor="middle" dominantBaseline="middle" transform={`rotate(${textRotation}, ${lx}, ${ly})`}>
                    {seg.label}
                  </text>
                </g>
              );
            })}
            <circle cx="144" cy="144" r="28" fill="hsl(0 0% 8%)" stroke="hsl(43 80% 55%)" strokeWidth="3" />
            <text x="144" y="148" fill="hsl(43 80% 55%)" fontSize="20" textAnchor="middle" dominantBaseline="middle">👑</text>
          </motion.svg>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSpin}
          disabled={spinning || spinsLeft <= 0}
          className="mt-8 px-12 py-4 bg-gradient-saffron rounded-xl font-heading text-sm uppercase tracking-widest text-primary-foreground shadow-saffron disabled:opacity-40"
        >
          {spinning ? 'Spinning…' : spinsLeft > 0 ? 'Spin Now' : 'No Spins Left'}
        </motion.button>

        {result && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className="mt-6 bg-secondary/10 border border-secondary/20 rounded-xl p-5 text-center w-full max-w-sm"
          >
            <motion.p animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5 }} className="text-3xl mb-2">🎉</motion.p>
            <p className="font-heading text-lg text-secondary">{result.label}</p>
            <p className="text-xs text-muted-foreground mt-2">{getResultMessage()}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SpinWheelPage;
