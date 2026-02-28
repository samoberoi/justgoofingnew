import { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";

const MusicToggle = () => {
  const [playing, setPlaying] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element - using a placeholder. Replace src with actual Sultaniat music file
    const audio = new Audio();
    audio.loop = true;
    audio.volume = 0.15;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      // Audio requires user interaction to play
      setUserInteracted(true);
      audioRef.current.play().catch(() => {});
      setPlaying(true);
    }
  };

  return (
    <button
      onClick={toggle}
      className="relative w-10 h-10 rounded-full border-2 border-gold/50 flex items-center justify-center text-gold hover:border-gold hover:bg-gold/10 transition-all duration-300"
      aria-label={playing ? "Mute music" : "Play music"}
      title={playing ? "Mute" : "Play Sultaniat Music"}
    >
      {playing ? <Volume2 size={16} /> : <VolumeX size={16} />}
    </button>
  );
};

export default MusicToggle;
