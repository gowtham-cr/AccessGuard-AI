import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Volume2, Loader2, AlertCircle } from 'lucide-react';

/**
 * SiriVoiceOrb — Premium Siri-inspired animated voice-wave interface
 * 
 * Flowing multi-harmonic ribbons in blue (#60A5FA), cyan (#2DD4BF), violet (#A855F7), and purple/magenta (#EC4899).
 * 
 * Distinct states:
 * - 'idle': Calm, serene ambient breathing (subtle wave motion, never mimicking active listening)
 * - 'listening': Audio-reactive ribbons responding in real-time to microphone levels via Web Audio API AnalyserNode
 * - 'processing': Orbital violet/cyan swirling halo ring with rhythmic pulse
 * - 'speaking': Active vocal cadence modulation simulating speech frequency resonance
 * - 'error': Warm coral/amber glow with soft pulse and retry affordance
 */
export function SiriVoiceOrb({
  state = 'idle', // 'idle' | 'listening' | 'processing' | 'speaking' | 'error'
  isSpeaking = false,
  onToggleMic,
  ariaLabel = 'Start Voice Input',
  ariaPressed = false,
  buttonId = 'voice-assistant-mic-btn',
}) {
  const canvasRef = useRef(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const phaseRef = useRef(0);
  const smoothedLevelRef = useRef(0);

  // Derive effective visual state
  const effectiveState = state === 'error'
    ? 'error'
    : isSpeaking
    ? 'speaking'
    : state === 'listening'
    ? 'listening'
    : state === 'processing'
    ? 'processing'
    : 'idle';

  // 1. Real Web Audio API Microphone Volume Metering (Active ONLY during 'listening')
  useEffect(() => {
    // If not listening, immediately teardown any audio context and media stream
    if (state !== 'listening') {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      smoothedLevelRef.current = 0;
      setAudioLevel(0);
      return;
    }

    let isMounted = true;
    let animId;

    async function initMicMetering() {
      try {
        if (
          typeof window === 'undefined' ||
          typeof navigator === 'undefined' ||
          !navigator.mediaDevices?.getUserMedia
        ) {
          return;
        }

        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        mediaStreamRef.current = stream;

        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.5;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const readLevel = () => {
          if (!isMounted) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          // Scale raw 0-255 average to normalized 0.0 - 1.0 with noise floor
          const rawNorm = Math.min(1, Math.max(0, (avg - 8) / 85));

          // Exponential moving average for liquid organic response
          smoothedLevelRef.current = smoothedLevelRef.current * 0.7 + rawNorm * 0.3;
          setAudioLevel(smoothedLevelRef.current);

          animId = requestAnimationFrame(readLevel);
        };

        readLevel();
      } catch {
        // Fallback gracefully if microphone permission is denied or in mock/test environments
      }
    }

    initMicMetering();

    return () => {
      isMounted = false;
      if (animId) cancelAnimationFrame(animId);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      smoothedLevelRef.current = 0;
    };
  }, [state]);

  // 2. High-Performance Siri Wave Ribbon Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null;
    if (!ctx) return;

    let animId;
    const baseWidth = 320;
    const baseHeight = 320;
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

    canvas.width = baseWidth * dpr;
    canvas.height = baseHeight * dpr;
    ctx.scale(dpr, dpr);

    // Harmonic wave layers matching Siri palette:
    // Cyan (#2DD4BF), Blue (#60A5FA), Violet (#A855F7), Purple/Pink (#EC4899)
    const waveConfigs = [
      { color: 'rgba(45, 212, 191, ', speed: 0.045, frequency: 0.019, baseAmp: 16 }, // Cyan
      { color: 'rgba(96, 165, 250, ', speed: -0.038, frequency: 0.024, baseAmp: 20 }, // Sky Blue
      { color: 'rgba(168, 85, 247, ', speed: 0.052, frequency: 0.017, baseAmp: 24 }, // Violet
      { color: 'rgba(236, 72, 153, ', speed: -0.044, frequency: 0.021, baseAmp: 18 }, // Pink / Purple
    ];

    const render = () => {
      ctx.clearRect(0, 0, baseWidth, baseHeight);

      // Advance wave phase smoothly
      phaseRef.current += 0.032;
      const phase = phaseRef.current;

      // Dynamic amplitude scaling based on state and real audio input
      let ampMultiplier = 0.22; // Gentle, calm idle breathing
      if (effectiveState === 'listening') {
        // Direct response to real microphone input
        ampMultiplier = 0.35 + audioLevel * 1.85;
      } else if (effectiveState === 'speaking') {
        // Human vocal cadence envelope modulation
        const speechEnvelope = Math.sin(phase * 3.2) * Math.cos(phase * 1.4);
        ampMultiplier = 0.7 + speechEnvelope * 0.4;
      } else if (effectiveState === 'processing') {
        ampMultiplier = 0.4 + Math.sin(phase * 4.8) * 0.15;
      } else if (effectiveState === 'error') {
        ampMultiplier = 0.12;
      }

      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      const centerY = baseHeight / 2;

      waveConfigs.forEach((cfg, idx) => {
        ctx.beginPath();
        const currentAmp = cfg.baseAmp * ampMultiplier;
        
        let alpha = 0.35;
        if (effectiveState === 'listening') {
          alpha = 0.45 + audioLevel * 0.35;
        } else if (effectiveState === 'speaking') {
          alpha = 0.5;
        } else if (effectiveState === 'idle') {
          alpha = 0.22;
        } else if (effectiveState === 'error') {
          alpha = 0.2;
        }

        ctx.strokeStyle = `${cfg.color}${Math.min(0.9, alpha)})`;
        ctx.lineWidth = (effectiveState === 'listening' || effectiveState === 'speaking') ? 2.8 : 1.8;

        for (let x = 0; x <= baseWidth; x += 3) {
          // Smooth parabolic window envelope to gently taper waves at borders
          const relX = (x - baseWidth / 2) / (baseWidth / 2);
          const envelope = Math.max(0, 1 - relX * relX);

          // Multi-harmonic sine equation for flowing liquid motion
          const y = centerY +
            Math.sin(x * cfg.frequency + phase * (idx + 1) * 0.75) *
            currentAmp *
            envelope *
            Math.cos(phase * 0.45 + idx);

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      });

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [effectiveState, audioLevel]);

  // Glow and shadow styling corresponding to current state
  const orbGlowClass = {
    listening: 'shadow-[0_0_55px_rgba(45,212,191,0.6),0_0_110px_rgba(168,85,247,0.4)] ring-4 ring-teal-400/50',
    speaking: 'shadow-[0_0_55px_rgba(168,85,247,0.65),0_0_100px_rgba(236,72,153,0.4)] ring-4 ring-purple-400/50 animate-pulse',
    processing: 'shadow-[0_0_45px_rgba(59,130,246,0.55),0_0_90px_rgba(168,85,247,0.35)] ring-4 ring-blue-400/40',
    error: 'shadow-[0_0_40px_rgba(239,68,68,0.5)] ring-4 ring-red-500/40',
    idle: 'shadow-[0_0_35px_rgba(45,212,191,0.25),0_0_70px_rgba(99,102,241,0.2)] ring-2 ring-teal-500/25',
  }[effectiveState];

  return (
    <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center select-none mx-auto">
      {/* Background Ambient Radial Diffusion Aura */}
      <div 
        className={`absolute inset-0 rounded-full blur-3xl transition-all duration-700 pointer-events-none ${
          effectiveState === 'listening'
            ? 'bg-gradient-to-tr from-teal-500/30 via-cyan-500/30 to-purple-600/35 scale-110'
            : effectiveState === 'speaking'
            ? 'bg-gradient-to-tr from-purple-600/35 via-violet-500/30 to-pink-500/30 scale-110'
            : effectiveState === 'processing'
            ? 'bg-gradient-to-tr from-blue-600/30 via-indigo-500/30 to-purple-500/30 scale-105'
            : effectiveState === 'error'
            ? 'bg-red-500/25 scale-100'
            : 'bg-gradient-to-tr from-teal-500/15 via-navy-800 to-indigo-900/20 scale-95'
        }`}
      />

      {/* Siri Flowing Wave Canvas */}
      <canvas
        ref={canvasRef}
        style={{ width: 320, height: 320 }}
        className="absolute inset-0 w-full h-full pointer-events-none rounded-full"
        aria-hidden="true"
      />

      {/* Rotating Orbital Halo (Active in Processing) */}
      {effectiveState === 'processing' && (
        <div 
          className="absolute inset-4 rounded-full border-2 border-transparent border-t-cyan-400 border-r-purple-400 animate-spin pointer-events-none"
          aria-hidden="true"
        />
      )}

      {/* Central Glassmorphic Siri Core Button */}
      <button
        type="button"
        id={buttonId}
        onClick={onToggleMic}
        aria-label={ariaLabel}
        aria-pressed={ariaPressed}
        className={`relative z-10 w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all duration-300 transform active:scale-95 focus-visible:ring-4 focus-visible:ring-teal-400 focus:outline-none ${orbGlowClass} ${
          effectiveState === 'listening'
            ? 'bg-gradient-to-tr from-teal-500/90 via-cyan-600 to-indigo-900 text-navy-950 scale-105'
            : effectiveState === 'speaking'
            ? 'bg-gradient-to-tr from-purple-600/90 via-violet-700 to-navy-900 text-white scale-105'
            : effectiveState === 'processing'
            ? 'bg-gradient-to-tr from-blue-600/80 via-navy-850 to-indigo-950 text-teal-300'
            : effectiveState === 'error'
            ? 'bg-gradient-to-tr from-red-600/80 via-navy-900 to-navy-950 text-red-200'
            : 'bg-gradient-to-tr from-navy-850 via-navy-900 to-teal-950/80 hover:from-navy-800 hover:to-teal-900/90 text-teal-300'
        }`}
      >
        {/* State Icon */}
        <div className="relative mb-1">
          {effectiveState === 'listening' ? (
            <MicOff className="w-9 h-9 animate-pulse text-navy-950 drop-shadow" aria-hidden="true" />
          ) : effectiveState === 'speaking' ? (
            <Volume2 className="w-9 h-9 animate-bounce text-purple-200" aria-hidden="true" />
          ) : effectiveState === 'processing' ? (
            <Loader2 className="w-9 h-9 animate-spin text-teal-300" aria-hidden="true" />
          ) : effectiveState === 'error' ? (
            <AlertCircle className="w-9 h-9 text-red-400" aria-hidden="true" />
          ) : (
            <Mic className="w-9 h-9 text-teal-300 transition-transform group-hover:scale-110" aria-hidden="true" />
          )}
        </div>

        {/* State Label */}
        <span className="text-[10px] font-black tracking-widest uppercase text-center px-1 font-mono">
          {effectiveState === 'listening'
            ? 'Listening'
            : effectiveState === 'speaking'
            ? 'Speaking'
            : effectiveState === 'processing'
            ? 'Processing'
            : effectiveState === 'error'
            ? 'Retry'
            : 'Tap To Talk'}
        </span>

        {/* Dynamic Voice Level Indicator Bar (Active ONLY when listening) */}
        {effectiveState === 'listening' && (
          <div className="flex items-center gap-1 mt-1.5 h-1.5" aria-hidden="true">
            {[0.4, 0.8, 1, 0.7, 0.5].map((factor, i) => (
              <span
                key={i}
                className="w-1 bg-navy-950 rounded-full transition-all duration-75"
                style={{
                  height: `${Math.max(3, (audioLevel * factor + 0.2) * 10)}px`,
                }}
              />
            ))}
          </div>
        )}
      </button>
    </div>
  );
}
