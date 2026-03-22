import { Bell, Crown, Volume2, VolumeX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { useState, useRef, useCallback, useEffect } from 'react';

const tierColors: Record<string, string> = {
  Sipahi: 'bg-muted text-muted-foreground',
  Wazir: 'bg-secondary/20 text-secondary',
  Nawab: 'bg-primary/20 text-primary',
  Sultan: 'bg-accent/20 text-accent',
};

const RoyalHeader = () => {
  const { walletBalance, tier, musicEnabled, setMusicEnabled } = useAppStore();
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
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <span className="font-display text-lg text-gradient-gold">BIRYAAN</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMusic}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-secondary/30 text-secondary"
            aria-label={musicEnabled ? "Mute music" : "Play music"}
          >
            {musicEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
          <button
            onClick={() => navigate('/wallet')}
            className="flex items-center gap-1.5 bg-secondary/10 px-3 py-1 rounded-full"
          >
            <span className="text-xs text-secondary font-semibold">💰 {walletBalance} pts</span>
          </button>
          <button className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${tierColors[tier]}`}>
            <Crown size={12} />
            {tier}
          </button>
          <button onClick={() => navigate('/notifications')} className="relative">
            <Bell size={20} className="text-muted-foreground" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default RoyalHeader;
