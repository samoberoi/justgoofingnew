import { Bell, Volume2, VolumeX, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';

const RoyalHeader = () => {
  const { walletBalance, musicEnabled, setMusicEnabled } = useAppStore();
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio("/music/sitar.mp3");
      audio.loop = true;
      audio.volume = 0.2;
      audioRef.current = audio;
    }
    return audioRef.current;
  }, []);

  useEffect(() => {
    const audio = getAudio();
    if (musicEnabled) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
    return () => { audio.pause(); };
  }, [musicEnabled, getAudio]);

  const toggleMusic = () => setMusicEnabled(!musicEnabled);

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-2xl border-b border-secondary/10">
      <div className="flex items-center justify-between px-4 h-16 max-w-lg mx-auto">
        {/* Left — Logo */}
        <div className="flex items-center gap-2">
          <Crown size={18} className="text-secondary" />
          <span className="font-display text-lg text-gradient-gold tracking-wide">BIRYAAN</span>
        </div>

        {/* Right — Actions */}
        <div className="flex items-center gap-1.5">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleMusic}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-secondary/8 border border-secondary/15 text-secondary/80 hover:bg-secondary/15 transition-colors"
            aria-label={musicEnabled ? "Mute music" : "Play music"}
          >
            {musicEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/wallet')}
            className="flex items-center gap-1.5 bg-gradient-to-r from-secondary/15 to-secondary/5 border border-secondary/20 px-3 py-1.5 rounded-full hover:from-secondary/20 transition-all"
          >
            <span className="text-sm">💰</span>
            <span className="text-xs text-secondary font-bold tabular-nums">{walletBalance}</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/notifications')}
            className="relative w-9 h-9 flex items-center justify-center rounded-full bg-secondary/8 border border-secondary/15 hover:bg-secondary/15 transition-colors"
          >
            <Bell size={15} className="text-secondary/80" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full ring-2 ring-background" />
          </motion.button>
        </div>
      </div>
    </header>
  );
};

export default RoyalHeader;
