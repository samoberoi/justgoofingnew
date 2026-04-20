// Reusable SVG sticker decorations for the playful kids vibe
import { motion } from 'framer-motion';

export const Star = ({ className = '', size = 24, color = 'hsl(var(--butter))' }: { className?: string; size?: number; color?: string }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6L12 2z" fill={color} stroke="hsl(var(--ink))" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

export const Sparkle = ({ className = '', size = 18, color = 'hsl(var(--coral))' }: { className?: string; size?: number; color?: string }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 0v10M12 14v10M0 12h10M14 12h10" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const Squiggle = ({ className = '', color = 'hsl(var(--mint))' }: { className?: string; color?: string }) => (
  <svg className={className} viewBox="0 0 80 12" fill="none">
    <path d="M2 6 Q 12 0, 22 6 T 42 6 T 62 6 T 82 6" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" />
  </svg>
);

export const Cloud = ({ className = '', size = 60, color = 'hsl(var(--sky))' }: { className?: string; size?: number; color?: string }) => (
  <svg className={className} width={size} height={size * 0.6} viewBox="0 0 100 60" fill="none">
    <path d="M25 50 Q 10 50 10 38 Q 10 28 22 28 Q 22 12 38 12 Q 52 12 56 24 Q 70 22 78 32 Q 90 32 90 44 Q 90 50 80 50 Z" fill={color} stroke="hsl(var(--ink))" strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

export const Heart = ({ className = '', size = 22, color = 'hsl(var(--coral))' }: { className?: string; size?: number; color?: string }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 21s-7-4.5-9.5-9C1 9.5 2.5 5 7 5c2 0 3.5 1 5 3 1.5-2 3-3 5-3 4.5 0 6 4.5 4.5 7-2.5 4.5-9.5 9-9.5 9z" fill={color} stroke="hsl(var(--ink))" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

export const Confetti = ({ className = '' }: { className?: string }) => (
  <div className={`pointer-events-none ${className}`}>
    <motion.div animate={{ y: [0, -8, 0], rotate: [0, 10, -10, 0] }} transition={{ duration: 4, repeat: Infinity }} className="absolute top-2 left-4">
      <Star size={16} color="hsl(var(--butter))" />
    </motion.div>
    <motion.div animate={{ y: [0, -10, 0], rotate: [0, -15, 0] }} transition={{ duration: 5, repeat: Infinity, delay: 0.5 }} className="absolute top-8 right-6">
      <Sparkle size={14} color="hsl(var(--coral))" />
    </motion.div>
    <motion.div animate={{ y: [0, -6, 0], rotate: [0, 8, 0] }} transition={{ duration: 3.5, repeat: Infinity, delay: 1 }} className="absolute bottom-6 left-10">
      <Heart size={14} color="hsl(var(--bubblegum))" />
    </motion.div>
  </div>
);
