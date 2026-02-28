import { useState, useRef, useCallback } from "react";
import { Volume2, VolumeX } from "lucide-react";

const MusicToggle = () => {
  const [playing, setPlaying] = useState(false);
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

  // Attempt autoplay on first render
  useState(() => {
    const audio = getAudio();
    audio.play().then(() => {
      setPlaying(true);
    }).catch(() => {
      // Autoplay blocked by browser — user must click
    });
  });

  const toggle = useCallback(() => {
    const audio = getAudio();
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().catch(() => {});
      setPlaying(true);
    }
  }, [playing, getAudio]);

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
