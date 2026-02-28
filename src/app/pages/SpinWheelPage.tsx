import { useState, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';

const segments = [
  { label: '20 pts', color: 'hsl(43 80% 55%)' },
  { label: 'Free Add-on', color: 'hsl(30 90% 50%)' },
  { label: '50 pts', color: 'hsl(5 70% 40%)' },
  { label: 'Double Pts', color: 'hsl(43 60% 45%)' },
  { label: '100 pts', color: 'hsl(30 70% 45%)' },
  { label: '🍗 FREE!', color: 'hsl(5 60% 35%)' },
  { label: '20 pts', color: 'hsl(43 80% 55%)' },
  { label: '50 pts', color: 'hsl(30 90% 50%)' },
];

const SpinWheelPage = () => {
  const navigate = useNavigate();
  const { earnPoints } = useAppStore();
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [spinsLeft, setSpinsLeft] = useState(1);
  const controls = useAnimation();

  const handleSpin = async () => {
    if (spinning || spinsLeft <= 0) return;
    setSpinning(true);
    setResult(null);

    const winIndex = Math.floor(Math.random() * segments.length);
    const segmentAngle = 360 / segments.length;
    const targetAngle = 360 * 5 + (360 - winIndex * segmentAngle - segmentAngle / 2);

    await controls.start({
      rotate: targetAngle,
      transition: { duration: 4, ease: [0.17, 0.67, 0.12, 0.99] },
    });

    setResult(segments[winIndex].label);
    setSpinning(false);
    setSpinsLeft(prev => prev - 1);

    // Auto-credit points
    const pts = parseInt(segments[winIndex].label);
    if (!isNaN(pts)) earnPoints(pts, `Spin Wheel: ${segments[winIndex].label}`);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-foreground" /></button>
          <h1 className="font-heading text-lg text-foreground">Spin the Royal Wheel</h1>
        </div>
      </header>

      <div className="px-4 pt-8 flex flex-col items-center">
        <p className="text-sm text-muted-foreground mb-6">
          {spinsLeft > 0 ? `${spinsLeft} spin${spinsLeft > 1 ? 's' : ''} available` : 'Come back next week!'}
        </p>

        {/* Wheel container */}
        <div className="relative w-72 h-72">
          {/* Pointer */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-secondary" />

          {/* Wheel */}
          <motion.div
            animate={controls}
            className="w-72 h-72 rounded-full border-4 border-secondary/30 relative overflow-hidden"
            style={{ transformOrigin: 'center center' }}
          >
            {segments.map((seg, i) => {
              const angle = (360 / segments.length) * i;
              return (
                <div
                  key={i}
                  className="absolute w-full h-full"
                  style={{ transform: `rotate(${angle}deg)` }}
                >
                  <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1/2 origin-bottom"
                    style={{
                      background: seg.color,
                      width: '50%',
                      clipPath: `polygon(50% 100%, ${50 - 50 * Math.tan(Math.PI / segments.length)}% 0%, ${50 + 50 * Math.tan(Math.PI / segments.length)}% 0%)`,
                    }}
                  />
                  <div
                    className="absolute top-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-background whitespace-nowrap"
                    style={{ transform: `rotate(${360 / segments.length / 2}deg)` }}
                  >
                    {seg.label}
                  </div>
                </div>
              );
            })}
            {/* Center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-card border-2 border-secondary flex items-center justify-center">
                <span className="text-2xl">👑</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Spin button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSpin}
          disabled={spinning || spinsLeft <= 0}
          className="mt-8 px-12 py-4 bg-gradient-saffron rounded-xl font-heading text-sm uppercase tracking-widest text-primary-foreground shadow-saffron disabled:opacity-40"
        >
          {spinning ? 'Spinning...' : 'Spin Now'}
        </motion.button>

        {/* Result */}
        {result && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mt-6 bg-secondary/10 border border-secondary/20 rounded-xl p-4 text-center"
          >
            <p className="text-2xl mb-1">🎉</p>
            <p className="font-heading text-lg text-secondary">You Won: {result}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SpinWheelPage;
