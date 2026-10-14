import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { UI_TRANSLATIONS } from '../data/citizenContent.js';

// Pre-generated authentic Kannada audio recordings for core Citizen Mode guides
export const OFFLINE_KANNADA_AUDIO = {
  page_overview: '/audio/citizen/kn/page_overview.mp3',
  'svc_ration-card': '/audio/citizen/kn/svc_ration-card.mp3',
  'svc_bhoomi-land': '/audio/citizen/kn/svc_bhoomi-land.mp3',
  'svc_senior-pension': '/audio/citizen/kn/svc_senior-pension.mp3',
  'svc_disability-udid': '/audio/citizen/kn/svc_disability-udid.mp3',
  'svc_aadhaar-update': '/audio/citizen/kn/svc_aadhaar-update.mp3',
};

const CitizenContext = createContext(null);

export function CitizenProvider({ children }) {
  // 1. Language state: English ('en') or Kannada ('kn')
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem('accessguard_citizen_lang') || 'kn'; // Default to Kannada
    } catch {
      return 'kn';
    }
  });

  // 2. Font size: 'normal' (100%), 'large' (125%), 'xlarge' (150%)
  const [fontSize, setFontSize] = useState(() => {
    try {
      return localStorage.getItem('accessguard_citizen_font') || 'normal';
    } catch {
      return 'normal';
    }
  });

  // 3. High Contrast toggle
  const [highContrast, setHighContrast] = useState(() => {
    try {
      return localStorage.getItem('accessguard_citizen_contrast') === 'true';
    } catch {
      return false;
    }
  });

  // 4. Speech and Audio state
  const [isReading, setIsReading] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [currentlyReadingId, setCurrentlyReadingId] = useState(null);
  const [audioError, setAudioError] = useState(null);

  const audioRef = useRef(null);
  const abortControllerRef = useRef(null);

  const speechSupported =
    typeof window !== 'undefined' &&
    ('speechSynthesis' in window || typeof Audio !== 'undefined');

  // Persist preferences
  useEffect(() => {
    try {
      localStorage.setItem('accessguard_citizen_lang', language);
    } catch {}
  }, [language]);

  useEffect(() => {
    try {
      localStorage.setItem('accessguard_citizen_font', fontSize);
    } catch {}
  }, [fontSize]);

  useEffect(() => {
    try {
      localStorage.setItem('accessguard_citizen_contrast', String(highContrast));
    } catch {}
  }, [highContrast]);

  // Available speech synthesis voices
  const [voices, setVoices] = useState([]);

  // Load and listen for browser voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const loadVoices = () => {
      try {
        const available = window.speechSynthesis.getVoices() || [];
        setVoices(available);
      } catch {}
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Stop all active audio / speech synthesis
  const stopSpeaking = useCallback(() => {
    // 1. Stop HTML5 audio element
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = '';
      } catch {}
      audioRef.current = null;
    }

    // 2. Abort any in-flight online audio request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // 3. Cancel browser speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }

    setIsReading(false);
    setIsLoadingAudio(false);
    setCurrentlyReadingId(null);
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, [stopSpeaking]);

  // Cancel any ongoing speech when language changes so previous language does not continue
  const handleSetLanguage = useCallback(
    (newLang) => {
      stopSpeaking();
      setAudioError(null);
      setLanguage(newLang);
    },
    [stopSpeaking]
  );

  // Clear audio error
  const clearAudioError = useCallback(() => {
    setAudioError(null);
  }, []);

  // Play online Kannada TTS fallback for dynamic/unmatched text
  const playOnlineKannadaAudio = useCallback((text, targetId) => {
    if (typeof Audio === 'undefined') {
      setAudioError({
        kn: 'ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಆಡಿಯೋ ಬೆಂಬಲವಿಲ್ಲ.',
        en: 'Audio playback is not supported in this browser.',
      });
      setIsReading(false);
      setIsLoadingAudio(false);
      setCurrentlyReadingId(null);
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsLoadingAudio(true);
    setIsReading(true);
    if (targetId) setCurrentlyReadingId(targetId);

    const safeText = text.slice(0, 500);
    const url = `/api/tts/kannada?text=${encodeURIComponent(safeText)}`;

    fetch(url, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`TTS server responded with ${res.status}`);
        }
        const blob = await res.blob();
        if (controller.signal.aborted) return;

        const objectUrl = typeof URL !== 'undefined' && URL.createObjectURL ? URL.createObjectURL(blob) : url;
        const audio = new Audio(objectUrl);
        audioRef.current = audio;
        setIsLoadingAudio(false);

        audio.onended = () => {
          if (typeof URL !== 'undefined' && URL.revokeObjectURL && objectUrl !== url) {
            URL.revokeObjectURL(objectUrl);
          }
          setIsReading(false);
          setCurrentlyReadingId(null);
          audioRef.current = null;
        };

        audio.onerror = (e) => {
          if (typeof URL !== 'undefined' && URL.revokeObjectURL && objectUrl !== url) {
            URL.revokeObjectURL(objectUrl);
          }
          setIsReading(false);
          setCurrentlyReadingId(null);
          audioRef.current = null;
          setAudioError({
            kn: 'ಕನ್ನಡ ಧ್ವನಿ ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕವನ್ನು ಪರಿಶೀಲಿಸಿ.',
            en: 'Kannada audio is currently unavailable. Please check your network connection.',
          });
        };

        const playPromise = audio.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch((err) => {
            if (controller.signal.aborted) return;
            console.warn('Audio playback error:', err);
            setIsReading(false);
            setCurrentlyReadingId(null);
            audioRef.current = null;
            setAudioError({
              kn: 'ಆಡಿಯೋ ಪ್ಲೇ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ.',
              en: 'Could not play audio. Please interact with the page or try again.',
            });
          });
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        console.warn('Kannada TTS online fallback error:', err);
        setIsLoadingAudio(false);
        setIsReading(false);
        setCurrentlyReadingId(null);
        audioRef.current = null;
        setAudioError({
          kn: 'ಕನ್ನಡ ಧ್ವನಿ ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕವನ್ನು ಪರಿಶೀಲಿಸಿ.',
          en: 'Kannada audio is currently unavailable. Please check your network connection.',
        });
      });
  }, []);

  // Speak text with explicit target language and matching voice/audio source
  const speak = useCallback(
    (text, options = {}) => {
      if (!text) return;

      // Stop any prior speech or audio immediately
      stopSpeaking();
      setAudioError(null);

      const targetLang = options.lang || (language === 'kn' ? 'kn-IN' : 'en-IN');
      const isKannada = targetLang.startsWith('kn') || targetLang === 'kn-IN';

      if (isKannada) {
        // Step 1: Check if a genuine native Kannada voice is installed in the browser/OS
        const availableVoices =
          voices.length > 0
            ? voices
            : typeof window !== 'undefined' && 'speechSynthesis' in window
            ? window.speechSynthesis.getVoices() || []
            : [];

        const genuineKnVoice = availableVoices.find((v) => {
          const l = (v.lang || '').replace('_', '-').toLowerCase();
          const n = (v.name || '').toLowerCase();
          return l === 'kn-in' || l === 'kn' || l.startsWith('kn-') || n.includes('kannada');
        });

        if (genuineKnVoice && typeof window !== 'undefined' && 'speechSynthesis' in window) {
          // Native Kannada voice is legitimately installed
          try {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'kn-IN';
            utterance.voice = genuineKnVoice;
            utterance.rate = options.rate || 0.95;
            utterance.pitch = options.pitch || 1.0;

            utterance.onstart = () => {
              setIsReading(true);
              if (options.id) setCurrentlyReadingId(options.id);
            };
            utterance.onend = () => {
              setIsReading(false);
              setCurrentlyReadingId(null);
            };
            utterance.onerror = (e) => {
              if (e.error !== 'canceled' && e.error !== 'interrupted') {
                setIsReading(false);
                setCurrentlyReadingId(null);
              }
            };

            window.speechSynthesis.speak(utterance);
            return;
          } catch (err) {
            console.warn('Native Kannada speech synthesis error, using audio fallback:', err);
          }
        }

        // Step 2: No genuine Kannada voice installed (or native speech failed).
        // CRITICAL: NEVER pass Kannada text to an English speech synthesis voice!
        // Check if an authentic pre-recorded offline recording exists for this section ID
        const targetId = options.id;
        const offlineAudioUrl = targetId ? OFFLINE_KANNADA_AUDIO[targetId] : null;

        if (offlineAudioUrl && typeof Audio !== 'undefined') {
          try {
            const audio = new Audio(offlineAudioUrl);
            audioRef.current = audio;
            setIsReading(true);
            if (targetId) setCurrentlyReadingId(targetId);

            audio.onended = () => {
              setIsReading(false);
              setCurrentlyReadingId(null);
              audioRef.current = null;
            };

            audio.onerror = (e) => {
              console.warn(`Offline audio failed for ${targetId}, falling back to online TTS:`, e);
              playOnlineKannadaAudio(text, targetId);
            };

            const playPromise = audio.play();
            if (playPromise && typeof playPromise.catch === 'function') {
              playPromise.catch((err) => {
                console.warn(`Playback error for ${targetId}, falling back to online TTS:`, err);
                playOnlineKannadaAudio(text, targetId);
              });
            }
            return;
          } catch (err) {
            console.warn('Offline audio error, trying online fallback:', err);
            playOnlineKannadaAudio(text, targetId);
            return;
          }
        }

        // Step 3: Online fallback for dynamic text or unmatched sections
        playOnlineKannadaAudio(text, targetId);
        return;
      }

      // English Speech Synthesis
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'en-IN';
          utterance.rate = options.rate || 0.95;
          utterance.pitch = options.pitch || 1.0;

          const availableVoices =
            voices.length > 0 ? voices : window.speechSynthesis.getVoices() || [];
          const enInVoice = availableVoices.find(
            (v) => (v.lang || '').replace('_', '-').toLowerCase() === 'en-in'
          );
          const anyEnVoice = availableVoices.find((v) =>
            (v.lang || '').replace('_', '-').toLowerCase().startsWith('en')
          );

          if (enInVoice) {
            utterance.voice = enInVoice;
          } else if (anyEnVoice) {
            utterance.voice = anyEnVoice;
          }

          utterance.onstart = () => {
            setIsReading(true);
            if (options.id) setCurrentlyReadingId(options.id);
          };

          utterance.onend = () => {
            setIsReading(false);
            setCurrentlyReadingId(null);
          };

          utterance.onerror = (e) => {
            if (e.error !== 'canceled' && e.error !== 'interrupted') {
              setIsReading(false);
              setCurrentlyReadingId(null);
            }
          };

          window.speechSynthesis.speak(utterance);
        } catch (err) {
          console.warn('English speech synthesis error:', err);
          setIsReading(false);
          setCurrentlyReadingId(null);
        }
      }
    },
    [voices, language, stopSpeaking, playOnlineKannadaAudio]
  );

  // Translation helper
  const t = useCallback(
    (path) => {
      const keys = path.split('.');
      let current = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;
      for (const key of keys) {
        if (current && current[key] !== undefined) {
          current = current[key];
        } else {
          // Fallback to English
          let fallback = UI_TRANSLATIONS.en;
          for (const fKey of keys) {
            if (fallback && fallback[fKey] !== undefined) {
              fallback = fallback[fKey];
            } else {
              return path;
            }
          }
          return fallback;
        }
      }
      return current;
    },
    [language]
  );

  const value = {
    language,
    setLanguage: handleSetLanguage,
    fontSize,
    setFontSize,
    highContrast,
    setHighContrast,
    speechSupported,
    isReading,
    isLoadingAudio,
    currentlyReadingId,
    audioError,
    clearAudioError,
    speak,
    stopSpeaking,
    t,
  };

  return <CitizenContext.Provider value={value}>{children}</CitizenContext.Provider>;
}

export function useCitizen() {
  const context = useContext(CitizenContext);
  if (!context) {
    throw new Error('useCitizen must be used within a CitizenProvider');
  }
  return context;
}
