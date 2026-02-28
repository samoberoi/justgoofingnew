import { useState, useRef, useCallback } from "react";
import { Volume2, VolumeX } from "lucide-react";

/**
 * Creates an ambient tanpura/sitar-like drone using Web Audio API.
 * No external audio file needed.
 */
function createAmbientDrone(audioCtx: AudioContext): { gainNode: GainNode } {
  const masterGain = audioCtx.createGain();
  masterGain.gain.value = 0;
  masterGain.connect(audioCtx.destination);

  // Tanpura drone frequencies (Sa-Pa-Sa' in C)
  const frequencies = [130.81, 196.0, 261.63, 130.81];

  frequencies.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const oscGain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.value = freq;

    // Slight detuning for warmth
    osc.detune.value = (i - 1.5) * 3;

    oscGain.gain.value = i === 0 ? 0.25 : 0.12;
    osc.connect(oscGain);
    oscGain.connect(masterGain);
    osc.start();

    // Add subtle vibrato
    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    lfo.type = "sine";
    lfo.frequency.value = 0.15 + i * 0.05;
    lfoGain.gain.value = 1.5;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start();
  });

  // Add a soft high harmonic shimmer (sitar-like)
  const shimmer = audioCtx.createOscillator();
  const shimmerGain = audioCtx.createGain();
  shimmer.type = "triangle";
  shimmer.frequency.value = 523.25;
  shimmerGain.gain.value = 0.04;
  shimmer.connect(shimmerGain);
  shimmerGain.connect(masterGain);
  shimmer.start();

  return { gainNode: masterGain };
}

const MusicToggle = () => {
  const [playing, setPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const toggle = useCallback(() => {
    if (playing) {
      // Fade out
      if (gainRef.current && audioCtxRef.current) {
        gainRef.current.gain.linearRampToValueAtTime(
          0,
          audioCtxRef.current.currentTime + 0.5
        );
      }
      setPlaying(false);
    } else {
      // Start or resume
      if (!audioCtxRef.current) {
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;
        const { gainNode } = createAmbientDrone(ctx);
        gainRef.current = gainNode;
      }

      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }

      // Fade in
      if (gainRef.current) {
        gainRef.current.gain.linearRampToValueAtTime(
          0.12,
          audioCtxRef.current.currentTime + 1.5
        );
      }
      setPlaying(true);
    }
  }, [playing]);

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
