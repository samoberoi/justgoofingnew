import { Bell, Volume2, VolumeX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';

const PlayfulHeader = () => {
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
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 h-16 max-w-lg mx-auto">
        {/* Left — Logo */}
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Just Goofing" className="h-9 w-auto" />
        </div>

        {/* Right — Actions */}
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={toggleMusic}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-card border-2 border-ink/10 text-ink shadow-soft hover:bg-mint/30 transition-colors"
            aria-label={musicEnabled ? "Mute music" : "Play music"}
          >
            {musicEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/wallet')}
            className="flex items-center gap-1.5 bg-gradient-butter border-2 border-ink/10 px-3.5 py-2 rounded-full shadow-soft hover:scale-105 transition-transform"
          >
            <span className="text-base">🪙</span>
            <span className="text-sm text-ink font-display tabular-nums">{walletBalance}</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => navigate('/notifications')}
            className="relative w-10 h-10 flex items-center justify-center rounded-full bg-card border-2 border-ink/10 shadow-soft hover:bg-coral/20 transition-colors"
          >
            <Bell size={16} className="text-ink" />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-coral rounded-full ring-2 ring-background" />
          </motion.button>
        </div>
      </div>
    </header>
  );
};

export default PlayfulHeader;
