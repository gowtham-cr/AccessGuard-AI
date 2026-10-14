import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  ArrowRight, 
  ArrowLeft, 
  RotateCcw, 
  HelpCircle, 
  CheckCircle, 
  AlertTriangle, 
  ShieldAlert, 
  FileText, 
  Send, 
  Eye, 
  EyeOff, 
  Sparkles,
  Layers,
  Check,
  Languages
} from 'lucide-react';
import { 
  SCHOLARSHIP_STEPS, 
  VOICE_COMMANDS, 
  UI_STRINGS, 
  maskIdentifier, 
  getSpokenMasked 
} from '../data/scholarshipVoiceContent.js';
import { SiriVoiceOrb } from '../components/SiriVoiceOrb.jsx';

export function VoiceAssistantPage() {
  // Language selection: 'en' or 'kn'
  const [lang, setLang] = useState('en');
  
  // Current active step: 0 to SCHOLARSHIP_STEPS.length (last step is review)
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  // Form fields state
  const [formData, setFormData] = useState({
    studentName: '',
    usn: '',
    collegeRegNumber: '',
    sspId: '',
    aadhaarDemo: '',
    category: '',
    annualIncome: '',
  });

  // Sensitive field masking toggle on screen
  const [showMasked, setShowMasked] = useState(true);

  // Assistant states
  const [micState, setMicState] = useState('idle'); // 'idle' | 'listening' | 'processing' | 'error'
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [micErrorMessage, setMicErrorMessage] = useState(null);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const [lastSpokenText, setLastSpokenText] = useState('');
  const [latestTranscript, setLatestTranscript] = useState('');

  // Pending confirmation for sensitive or verbal confirmation
  // { field: 'usn', rawValue: '1MS21CS045', maskedSpoken: 'ending in 0 4 5' }
  const [pendingConfirmation, setPendingConfirmation] = useState(null);

  // Final mock submission state
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [mockReferenceNumber, setMockReferenceNumber] = useState(null);

  // Speech Recognition, Sarvam STT & Audio refs
  const [sarvamConfigured, setSarvamConfigured] = useState(false);
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioPlayerRef = useRef(null);
  const currentUtteranceRef = useRef(null);
  const isSpeechRecognitionSupported = typeof window !== 'undefined' && 
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  // Check if Sarvam STT service is configured on backend
  useEffect(() => {
    if (typeof fetch === 'function') {
      fetch('/api/stt/status')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.configured) {
            setSarvamConfigured(true);
          }
        })
        .catch(() => {});
    }
  }, []);

  const t = UI_STRINGS[lang];
  const isReviewStep = currentStepIndex === SCHOLARSHIP_STEPS.length;
  const currentStep = SCHOLARSHIP_STEPS[currentStepIndex];

  // Stop any active speech or audio
  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
      audioPlayerRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  // Speak text using English native SpeechSynthesis or Kannada TTS endpoint
  const speakText = useCallback((text, targetLang = lang) => {
    if (!text || typeof window === 'undefined') return;
    stopSpeech();
    setIsSpeaking(true);
    setLastSpokenText(text);
    setLiveAnnouncement(text);

    if (targetLang === 'kn') {
      // Check for native Kannada browser voice first
      const voices = window.speechSynthesis ? window.speechSynthesis.getVoices() || [] : [];
      const nativeKnVoice = voices.find(v => v.lang.startsWith('kn') || v.name.toLowerCase().includes('kannada'));

      if (nativeKnVoice && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined') {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = nativeKnVoice;
        utterance.lang = 'kn-IN';
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        currentUtteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      } else {
        // Fallback to validated backend Kannada TTS
        const safeText = text.slice(0, 500);
        const audioUrl = `/api/tts/kannada?text=${encodeURIComponent(safeText)}`;
        const AudioConstructor = (typeof window !== 'undefined' && window.Audio) || (typeof Audio !== 'undefined' ? Audio : null);
        
        if (AudioConstructor) {
          try {
            const audio = new AudioConstructor(audioUrl);
            audioPlayerRef.current = audio;
            audio.onended = () => {
              setIsSpeaking(false);
              audioPlayerRef.current = null;
            };
            audio.onerror = () => {
              setIsSpeaking(false);
              audioPlayerRef.current = null;
            };
            if (typeof audio.play === 'function') {
              audio.play().catch(() => setIsSpeaking(false));
            }
          } catch {
            setIsSpeaking(false);
          }
        } else {
          setIsSpeaking(false);
        }
      }
    } else {
      // English speech
      if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
        setIsSpeaking(false);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-IN';
      utterance.rate = 0.95; // slightly slower for maximum clarity
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      currentUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  }, [lang, stopSpeech]);

  // Read current step prompt aloud
  const promptCurrentStep = useCallback(() => {
    if (isReviewStep) {
      const summaryText = lang === 'kn'
        ? `ಅರ್ಜಿ ಸಾರಾಂಶ: ಹೆಸರು ${formData.studentName || 'ಖಾಲಿ'}. ಯು.ಎಸ್.ಎನ್ ${getSpokenMasked(formData.usn, true, 'kn')}. ಕಾಲೇಜು ನೋಂದಣಿ ${getSpokenMasked(formData.collegeRegNumber, true, 'kn')}. ವರ್ಗ ${formData.category || 'ಖಾಲಿ'}. ಆದಾಯ ${formData.annualIncome || 'ಖಾಲಿ'}. ${t.confirmSubmissionPrompt}`
        : `Application Summary: Name is ${formData.studentName || 'empty'}. USN ${getSpokenMasked(formData.usn, true, 'en')}. College Registration ${getSpokenMasked(formData.collegeRegNumber, true, 'en')}. Category is ${formData.category || 'empty'}. Annual family income is ${formData.annualIncome || 'empty'}. ${t.confirmSubmissionPrompt}`;
      speakText(summaryText);
    } else if (currentStep) {
      const stepText = currentStep[lang];
      const announcement = `${t.stepOf.replace('{current}', currentStepIndex + 1).replace('{total}', SCHOLARSHIP_STEPS.length)}. ${stepText.title}. ${stepText.prompt}`;
      speakText(announcement);
    }
  }, [isReviewStep, currentStep, currentStepIndex, formData, lang, t, speakText]);

  // Read prompt whenever step changes
  useEffect(() => {
    setLatestTranscript('');
    if (!isSubmitted) {
      promptCurrentStep();
    }
    return () => stopSpeech();
  }, [currentStepIndex, lang, isSubmitted, promptCurrentStep, stopSpeech]);

  // Stop listening helper
  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setMicState('idle');
  }, []);

  // Process voice commands or field input
  const processTranscript = useCallback((transcript) => {
    setLatestTranscript(transcript);
    const raw = transcript.trim().toLowerCase();
    if (!raw) return;

    const commands = VOICE_COMMANDS[lang];

    // Helper: matches any command phrases
    const isCmd = (cmdList) => cmdList.some(c => raw.includes(c) || c.includes(raw));

    // 1. Pending Confirmation Handling (Yes/No response)
    if (pendingConfirmation) {
      if (isCmd(commands.yes)) {
        // Confirmed!
        setFormData(prev => ({ ...prev, [pendingConfirmation.field]: pendingConfirmation.rawValue }));
        const confirmedMsg = `${t.confirmed} ${lang === 'kn' ? 'ಮುಂದಿನ ಕ್ಷೇತ್ರಕ್ಕೆ ಹೋಗುತ್ತಿದ್ದೇವೆ.' : 'Proceeding to next step.'}`;
        setPendingConfirmation(null);
        speakText(confirmedMsg);
        setTimeout(() => {
          if (currentStepIndex < SCHOLARSHIP_STEPS.length) {
            setCurrentStepIndex(prev => prev + 1);
          }
        }, 1200);
        return;
      } else if (isCmd(commands.no)) {
        // Rejected
        setPendingConfirmation(null);
        speakText(t.retryPrompt);
        return;
      }
    }

    // 2. Navigation & General Voice Commands
    if (isCmd(commands.help)) {
      speakText(t.commandsAvailable);
      return;
    }

    if (isCmd(commands.repeat)) {
      promptCurrentStep();
      return;
    }

    if (isCmd(commands.back)) {
      if (currentStepIndex > 0) {
        stopSpeech();
        setCurrentStepIndex(prev => prev - 1);
      } else {
        speakText(lang === 'kn' ? 'ಇದು ಮೊದಲ ಹೆಜ್ಜೆಯಾಗಿದೆ.' : 'This is already the first step.');
      }
      return;
    }

    if (isCmd(commands.next)) {
      if (currentStepIndex < SCHOLARSHIP_STEPS.length) {
        stopSpeech();
        setCurrentStepIndex(prev => prev + 1);
      }
      return;
    }

    if (isCmd(commands.review)) {
      stopSpeech();
      setCurrentStepIndex(SCHOLARSHIP_STEPS.length);
      return;
    }

    if (isCmd(commands.cancel)) {
      stopSpeech();
      setPendingConfirmation(null);
      speakText(lang === 'kn' ? 'ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ.' : 'Canceled.');
      return;
    }

    if (isCmd(commands.readDetails)) {
      if (!isReviewStep && currentStep) {
        const val = formData[currentStep.field];
        const valText = val ? (currentStep.isSensitive ? getSpokenMasked(val, true, lang) : val) : (lang === 'kn' ? 'ಖಾಲಿ' : 'not entered');
        const details = `${currentStep[lang].title}: ${currentStep[lang].help}. Current value is: ${valText}.`;
        speakText(details);
      }
      return;
    }

    // 3. Final Submission on Review Step
    if (isReviewStep) {
      if (isCmd(commands.submit) || isCmd(commands.yes)) {
        handleFinalMockSubmit();
        return;
      }
    }

    // 4. Input handling for current field
    if (!isReviewStep && currentStep) {
      let cleaned = transcript.trim();

      // Clean prefix speech patterns like "my name is..." or "it is..."
      cleaned = cleaned
        .replace(/^(my name is|i am|name is|ಹೆಸರು|ನನ್ನ ಹೆಸರು)\s+/i, '')
        .replace(/^(my usn is|usn is|ಯು ಎಸ್ ಎನ್)\s+/i, '');

      // Check if this field requires verbal confirmation (sensitive identifiers)
      if (currentStep.isSensitive) {
        const maskedSpoken = getSpokenMasked(cleaned, true, lang);
        setPendingConfirmation({
          field: currentStep.field,
          rawValue: cleaned,
          maskedSpoken,
        });

        const confirmMsg = t.confirmPrompt
          .replace('{label}', currentStep[lang].title)
          .replace('{maskedValue}', maskedSpoken);
        speakText(confirmMsg);
      } else {
        // Direct assignment for non-sensitive fields
        setFormData(prev => ({ ...prev, [currentStep.field]: cleaned }));
        const savedMsg = lang === 'kn'
          ? `${currentStep[lang].title} ಉಳಿಸಲಾಗಿದೆ: ${cleaned}. ಮುಂದಿನ ಹೆಜ್ಜೆಗೆ ಹೋಗಲು 'ಮುಂದೆ' ಎಂದು ಹೇಳಿ.`
          : `Saved ${currentStep[lang].title}: ${cleaned}. Say "next" to proceed.`;
        speakText(savedMsg);
      }
    }
  }, [currentStep, currentStepIndex, formData, isReviewStep, lang, pendingConfirmation, promptCurrentStep, speakText, t, stopSpeech]);

  // Start microphone listening
  const startListening = useCallback(async () => {
    stopSpeech();
    setMicErrorMessage(null);
    setLatestTranscript('');
    setMicState('listening');

    // 1. If Sarvam STT is configured, record audio and transcribe via backend
    if (
      sarvamConfigured &&
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices?.getUserMedia &&
      typeof MediaRecorder !== 'undefined'
    ) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunksRef.current = [];
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          if (audioBlob.size > 0) {
            setMicState('processing');
            setLiveAnnouncement(lang === 'kn' ? 'ಧ್ವನಿ ಸಂಸ್ಕರಿಸಲಾಗುತ್ತಿದೆ...' : 'Processing speech with Sarvam AI...');
            try {
              const res = await fetch(`/api/stt/transcribe?lang=${lang}`, {
                method: 'POST',
                headers: { 'Content-Type': 'audio/wav' },
                body: audioBlob,
              });
              if (res.ok) {
                const data = await res.json();
                if (data.transcript) {
                  setLatestTranscript(data.transcript);
                  setLiveAnnouncement(`Recognized: "${data.transcript}"`);
                  processTranscript(data.transcript);
                  setMicState('idle');
                  return;
                }
              }
            } catch (err) {
              console.warn('Sarvam transcription request failed, falling back to Web Speech:', err);
            }
          }
          setMicState('idle');
        };

        recorder.start();
        setLiveAnnouncement(t.listening);
        return;
      } catch (err) {
        console.warn('MediaRecorder error, falling back to Web Speech API:', err);
      }
    }

    // 2. Native SpeechRecognition Fallback
    if (!isSpeechRecognitionSupported) {
      setMicErrorMessage(t.micDisabled);
      setMicState('error');
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = lang === 'kn' ? 'kn-IN' : 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setMicState('listening');
        setLiveAnnouncement(t.listening);
      };

      recognition.onresult = (event) => {
        setMicState('processing');
        const transcript = event.results[0][0].transcript;
        setLatestTranscript(transcript);
        setLiveAnnouncement(`Recognized: "${transcript}"`);
        processTranscript(transcript);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setMicErrorMessage('Microphone access denied. Please grant microphone permission in your browser.');
        } else if (event.error === 'no-speech') {
          setMicErrorMessage('No speech was detected. Please try again.');
        } else {
          setMicErrorMessage(`Speech recognition error: ${event.error}`);
        }
        setMicState('error');
      };

      recognition.onend = () => {
        if (micState === 'listening') {
          setMicState('idle');
        }
      };

      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setMicErrorMessage(err.message || 'Could not start microphone');
      setMicState('error');
    }
  }, [isSpeechRecognitionSupported, lang, micState, processTranscript, sarvamConfigured, stopSpeech, t]);

  // Toggle mic button action
  const toggleListening = () => {
    if (micState === 'listening') {
      stopListening();
    } else {
      startListening();
    }
  };

  // Keyboard accessibility shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.code === 'Space' || e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleListening();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        promptCurrentStep();
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        if (currentStepIndex < SCHOLARSHIP_STEPS.length) {
          stopSpeech();
          setCurrentStepIndex(prev => prev + 1);
        }
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        if (currentStepIndex > 0) {
          stopSpeech();
          setCurrentStepIndex(prev => prev - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStepIndex, promptCurrentStep, stopSpeech, toggleListening]);

  // Final Mock Submission
  const handleFinalMockSubmit = () => {
    stopSpeech();
    const refNum = `SSP-MOCK-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    setMockReferenceNumber(refNum);
    setIsSubmitted(true);

    const successAnnouncement = lang === 'kn'
      ? `${t.submissionSuccessTitle} ${t.receiptNotice} ${refNum}.`
      : `${t.submissionSuccessTitle} ${t.receiptNotice} ${refNum}.`;
    speakText(successAnnouncement);
  };

  // Reset form
  const handleResetApplication = () => {
    stopSpeech();
    setFormData({
      studentName: '',
      usn: '',
      collegeRegNumber: '',
      sspId: '',
      aadhaarDemo: '',
      category: '',
      annualIncome: '',
    });
    setCurrentStepIndex(0);
    setIsSubmitted(false);
    setMockReferenceNumber(null);
    setPendingConfirmation(null);
    setLatestTranscript('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Screen Reader Live Region for Announcements */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      >
        {liveAnnouncement}
      </div>

      {/* Header Banner & Language Toggle */}
      <div className="p-6 rounded-2xl bg-navy-900 border border-navy-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-500/15 text-teal-300 border border-teal-500/30">
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                <span>AccessVoice AI</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Hands-Free Assistive Mode
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {t.moduleTitle}
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl">
              {t.subtitle}
            </p>
          </div>

          {/* Bilingual Language Selector */}
          <div className="flex items-center gap-1 bg-navy-950 p-1.5 rounded-xl border border-navy-800 self-stretch sm:self-auto justify-center">
            <button
              type="button"
              onClick={() => {
                stopSpeech();
                setLang('en');
              }}
              aria-pressed={lang === 'en'}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-teal-400 flex items-center gap-1.5 ${
                lang === 'en'
                  ? 'bg-teal-500 text-navy-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>English</span>
            </button>
            <button
              type="button"
              onClick={() => {
                stopSpeech();
                setLang('kn');
              }}
              aria-pressed={lang === 'kn'}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-teal-400 flex items-center gap-1.5 ${
                lang === 'kn'
                  ? 'bg-teal-500 text-navy-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Languages className="w-3.5 h-3.5" />
              <span>ಕನ್ನಡ</span>
            </button>
          </div>
        </div>

        {/* Fictional Data Disclaimer */}
        <div 
          role="note" 
          aria-label="Fictional demonstration disclaimer"
          className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs flex items-start gap-2.5"
        >
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" aria-hidden="true" />
          <p className="leading-relaxed">
            {t.disclaimer}
          </p>
        </div>
      </div>

      {/* Main Interactive Stage */}
      {!isSubmitted ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Voice Control Console */}
          <div className="lg:col-span-1 p-6 rounded-2xl bg-navy-900 border border-navy-800 shadow-xl flex flex-col items-center text-center justify-between space-y-6">
            <div className="w-full space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Voice Assistant Status
              </span>

              {/* Status Badge */}
              <div 
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold ${
                  micState === 'listening'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 animate-pulse'
                    : isSpeaking
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-pulse'
                    : micState === 'processing'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : micState === 'error'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                    : 'bg-navy-950 text-slate-400 border border-navy-800'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${
                  micState === 'listening' ? 'bg-teal-400' : isSpeaking ? 'bg-purple-400' : 'bg-slate-500'
                }`} />
                <span>
                  {micState === 'listening' 
                    ? t.listening 
                    : isSpeaking 
                    ? t.speaking 
                    : micState === 'processing' 
                    ? t.processing 
                    : t.idle}
                </span>
              </div>
            </div>

            {/* Central Siri Animated Voice Wave Orb */}
            <div className="py-2 w-full flex justify-center">
              <SiriVoiceOrb
                state={micState}
                isSpeaking={isSpeaking}
                onToggleMic={toggleListening}
                ariaLabel={micState === 'listening' ? t.stopListening : t.startListening}
                ariaPressed={micState === 'listening'}
                buttonId="voice-assistant-mic-btn"
              />
            </div>

            {/* Error Message Display if Any */}
            {micErrorMessage && (
              <div 
                role="alert" 
                className="w-full p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs"
              >
                {micErrorMessage}
              </div>
            )}

            {/* Spoken Action Controls */}
            <div className="w-full space-y-2 pt-4 border-t border-navy-800 text-xs">
              <button
                type="button"
                onClick={promptCurrentStep}
                className="w-full py-2 px-3 rounded-xl bg-navy-950 hover:bg-navy-800 text-teal-300 border border-navy-800 font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Repeat Question (R)</span>
              </button>

              <button
                type="button"
                onClick={() => speakText(t.commandsAvailable)}
                className="w-full py-2 px-3 rounded-xl bg-navy-950 hover:bg-navy-800 text-slate-300 border border-navy-800 font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Voice Commands Help</span>
              </button>
            </div>

            {/* Keyboard Shortcuts Hint */}
            <p className="text-[11px] text-slate-500">
              Shortcuts: <kbd className="px-1 py-0.5 bg-navy-950 rounded border border-navy-800 font-mono">Space</kbd> Mic &bull; <kbd className="px-1 py-0.5 bg-navy-950 rounded border border-navy-800 font-mono">N</kbd> Next &bull; <kbd className="px-1 py-0.5 bg-navy-950 rounded border border-navy-800 font-mono">B</kbd> Back
            </p>
          </div>

          {/* Right Column: Step Application Form Stage */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-navy-900 border border-navy-800 shadow-xl space-y-6">
            {/* Step Progress Tracker */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-teal-400">
                  {isReviewStep 
                    ? t.formSummaryTitle 
                    : t.stepOf.replace('{current}', currentStepIndex + 1).replace('{total}', SCHOLARSHIP_STEPS.length)}
                </span>
                <span className="text-slate-400">
                  {Math.round((currentStepIndex / SCHOLARSHIP_STEPS.length) * 100)}% Completed
                </span>
              </div>
              <div 
                className="w-full h-2 rounded-full bg-navy-950 overflow-hidden" 
                role="progressbar" 
                aria-valuenow={currentStepIndex} 
                aria-valuemin="0" 
                aria-valuemax={SCHOLARSHIP_STEPS.length}
              >
                <div 
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-300 rounded-full"
                  style={{ width: `${(currentStepIndex / SCHOLARSHIP_STEPS.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Active Step Card */}
            {!isReviewStep ? (
              <div className="space-y-5">
                {/* Current Scholarship Question Monitor */}
                <div className="p-5 rounded-2xl bg-navy-950/90 border border-navy-800 shadow-xl space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-teal-500/10 via-purple-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />

                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30">
                      <span>{lang === 'kn' ? `ಪ್ರಶ್ನೆ ${currentStepIndex + 1} / ${SCHOLARSHIP_STEPS.length}` : `Question ${currentStepIndex + 1} of ${SCHOLARSHIP_STEPS.length}`}</span>
                    </span>

                    {isSpeaking && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-purple-300 font-semibold animate-pulse bg-purple-500/15 px-3 py-1 rounded-full border border-purple-500/30">
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>{lang === 'kn' ? 'ಓದಲಾಗುತ್ತಿದೆ...' : 'Speaking Prompt...'}</span>
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                      {currentStep[lang].title}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {currentStep[lang].prompt}
                    </p>
                  </div>
                </div>

                {/* Live Speech Recognition & Assistant Feedback Monitor */}
                <div className="p-4 rounded-xl bg-navy-950/80 border border-navy-800/90 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Mic className={`w-3.5 h-3.5 ${micState === 'listening' ? 'text-teal-400 animate-pulse' : 'text-slate-500'}`} />
                      <span>{lang === 'kn' ? 'ನೇರ ಧ್ವನಿ ಪ್ರತಿಲೇಖನ' : 'Live Speech Transcript'}</span>
                    </span>

                    <span className="text-[11px] font-mono">
                      {micState === 'listening' ? (
                        <span className="text-teal-400 font-bold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                          <span>{lang === 'kn' ? 'ಆಲಿಸಲಾಗುತ್ತಿದೆ...' : 'Listening to microphone...'}</span>
                        </span>
                      ) : micState === 'processing' ? (
                        <span className="text-amber-400 font-semibold">{lang === 'kn' ? 'ಸಂಸ್ಕರಿಸಲಾಗುತ್ತಿದೆ...' : 'Processing speech...'}</span>
                      ) : isSpeaking ? (
                        <span className="text-purple-300 font-semibold">{lang === 'kn' ? 'ಸಹಾಯಕ ಮಾತನಾಡುತ್ತಿದೆ' : 'Assistant Speaking'}</span>
                      ) : micState === 'error' ? (
                        <span className="text-red-400 font-semibold">{lang === 'kn' ? 'ದೋಷ' : 'Mic Error'}</span>
                      ) : (
                        <span className="text-slate-500">{lang === 'kn' ? 'ಧ್ವನಿ ಸಿದ್ಧವಾಗಿದೆ' : 'Ready for Voice'}</span>
                      )}
                    </span>
                  </div>

                  {/* Transcript Content Box */}
                  <div className="min-h-[50px] flex items-center p-3 rounded-lg bg-navy-900/70 border border-navy-800 text-xs">
                    {latestTranscript ? (
                      <div className="flex items-start gap-2 text-teal-200 w-full">
                        <span className="text-teal-400 font-bold text-base leading-none">&ldquo;</span>
                        <div className="flex-1">
                          <span className="font-sans text-sm text-white font-medium break-words">{latestTranscript}</span>
                        </div>
                        <span className="text-teal-400 font-bold text-base leading-none">&rdquo;</span>
                      </div>
                    ) : micState === 'listening' ? (
                      <div className="flex items-center gap-2 text-teal-400/90 text-xs animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                        <span>{lang === 'kn' ? 'ನಿಮ್ಮ ಉತ್ತರವನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಮಾತನಾಡಿ...' : 'Speak your answer clearly into the microphone...'}</span>
                      </div>
                    ) : (
                      <p className="text-slate-500 text-xs">
                        {lang === 'kn' ? 'ಧ್ವನಿಯ ಮೂಲಕ ಉತ್ತರಿಸಲು ಸಿರಿ ಆರ್ಬ್ ಕ್ಲಿಕ್ ಮಾಡಿ ಅಥವಾ ಸ್ಪೇಸ್ ಕೀ ಒತ್ತಿರಿ.' : 'Click the Siri orb or press Space bar to answer with your voice.'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Verbal Confirmation Banner when Pending */}
                {pendingConfirmation && (
                  <div 
                    role="alert" 
                    className="p-4 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-200 text-xs space-y-2 animate-pulse"
                  >
                    <div className="flex items-center gap-2 font-bold text-purple-300">
                      <Volume2 className="w-4 h-4" />
                      <span>Confirmation Required</span>
                    </div>
                    <p className="leading-relaxed">
                      {t.confirmPrompt
                        .replace('{label}', currentStep[lang].title)
                        .replace('{maskedValue}', pendingConfirmation.maskedSpoken)}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => processTranscript('yes')}
                        className="px-3 py-1.5 rounded-lg bg-teal-500 text-navy-950 font-bold text-xs hover:bg-teal-400 transition-colors"
                      >
                        Yes, Confirm (ಹೌದು)
                      </button>
                      <button
                        type="button"
                        onClick={() => processTranscript('no')}
                        className="px-3 py-1.5 rounded-lg bg-navy-800 text-slate-300 font-semibold text-xs hover:bg-navy-700 transition-colors"
                      >
                        No, Re-enter (ಇಲ್ಲ)
                      </button>
                    </div>
                  </div>
                )}

                {/* Accessible Form Input (Synchronized with Voice) */}
                <div className="space-y-2">
                  <label 
                    htmlFor={`input-${currentStep.field}`}
                    className="block text-xs font-semibold text-slate-300"
                  >
                    {currentStep[lang].title}
                  </label>
                  
                  {currentStep.options ? (
                    <select
                      id={`input-${currentStep.field}`}
                      value={formData[currentStep.field]}
                      onChange={(e) => setFormData(prev => ({ ...prev, [currentStep.field]: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-navy-950 border border-navy-800 text-white text-sm focus-visible:ring-2 focus-visible:ring-teal-400"
                    >
                      <option value="">-- Select Category --</option>
                      {currentStep.options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={`input-${currentStep.field}`}
                      type="text"
                      value={formData[currentStep.field]}
                      onChange={(e) => setFormData(prev => ({ ...prev, [currentStep.field]: e.target.value }))}
                      placeholder={currentStep[lang].placeholder}
                      className="w-full px-4 py-2.5 rounded-xl bg-navy-950 border border-navy-800 text-white text-sm focus-visible:ring-2 focus-visible:ring-teal-400 placeholder:text-slate-500"
                    />
                  )}

                  <p className="text-[11px] text-slate-400">
                    {currentStep[lang].help}
                  </p>
                </div>

                {/* Sensitive Masking Security Indicator */}
                {currentStep.isSensitive && (
                  <div className="flex items-center gap-2 text-[11px] text-teal-400/90 font-mono bg-navy-950 p-2.5 rounded-lg border border-navy-800">
                    <EyeOff className="w-3.5 h-3.5 shrink-0 text-teal-400" />
                    <span>{t.sensitiveNotice}</span>
                  </div>
                )}

                {/* Step Navigation Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-navy-800">
                  <button
                    type="button"
                    disabled={currentStepIndex === 0}
                    onClick={() => {
                      stopSpeech();
                      setCurrentStepIndex(prev => prev - 1);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-navy-950 hover:bg-navy-800 text-slate-300 border border-navy-800 transition-colors disabled:opacity-40 flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      stopSpeech();
                      setCurrentStepIndex(prev => prev + 1);
                    }}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-400 text-navy-950 transition-colors flex items-center gap-1.5 shadow-md"
                  >
                    <span>{currentStepIndex === SCHOLARSHIP_STEPS.length - 1 ? 'Review' : 'Next'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              /* Review & Explicit Confirmation View */
              <div className="space-y-5">
                <div className="space-y-1">
                  <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-teal-400" />
                    <span>{t.formSummaryTitle}</span>
                  </h2>
                  <p className="text-xs text-slate-300">
                    {t.summaryIntro}
                  </p>
                </div>

                {/* Summary Table with Masked Sensitive Identifiers */}
                <div className="overflow-hidden rounded-xl border border-navy-800 bg-navy-950">
                  <table className="w-full text-left text-xs" aria-label="Application Summary Table">
                    <tbody className="divide-y divide-navy-800/80">
                      {SCHOLARSHIP_STEPS.map((step, idx) => {
                        const val = formData[step.field];
                        const displayVal = step.isSensitive && showMasked
                          ? maskIdentifier(val, true)
                          : val || '—';

                        return (
                          <tr key={step.id} className="hover:bg-navy-900/40">
                            <td className="px-4 py-3 font-semibold text-slate-400 w-1/3">
                              {step[lang].title}
                            </td>
                            <td className="px-4 py-3 font-mono text-white">
                              {displayVal || <span className="text-slate-500 italic">Not provided</span>}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  stopSpeech();
                                  setCurrentStepIndex(idx);
                                }}
                                className="text-[11px] text-teal-400 hover:text-teal-300 font-semibold"
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mask Toggle */}
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <button
                    type="button"
                    onClick={() => setShowMasked(!showMasked)}
                    className="inline-flex items-center gap-1.5 text-teal-400 hover:text-teal-300 font-semibold"
                  >
                    {showMasked ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{showMasked ? 'Reveal Demo Identifiers' : 'Mask Identifiers'}</span>
                  </button>
                  <span className="text-[11px] text-slate-500 font-mono">
                    All numbers remain fictional
                  </span>
                </div>

                {/* Explicit Verbal/Manual Confirmation Action */}
                <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-200 text-xs space-y-3">
                  <p className="font-semibold text-teal-300">
                    {t.confirmSubmissionPrompt}
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      id="submit-scholarship-btn"
                      onClick={handleFinalMockSubmit}
                      className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-navy-950 font-extrabold text-xs flex items-center gap-2 shadow-lg transition-all"
                    >
                      <Send className="w-4 h-4" />
                      <span>Confirm & Submit Application (ಸಲ್ಲಿಸಿ)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        stopSpeech();
                        setCurrentStepIndex(0);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-700 text-slate-300 font-semibold text-xs transition-colors"
                    >
                      Restart From Beginning
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Submission Success Receipt */
        <div 
          role="region" 
          aria-labelledby="success-heading"
          className="p-8 rounded-2xl bg-navy-900 border border-teal-500/40 shadow-2xl text-center space-y-6 max-w-2xl mx-auto"
        >
          <div className="w-16 h-16 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center mx-auto text-teal-400">
            <CheckCircle className="w-10 h-10" aria-hidden="true" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-teal-400">
              Simulated Submission Verified
            </span>
            <h2 id="success-heading" className="text-xl sm:text-2xl font-extrabold text-white">
              {t.submissionSuccessTitle}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
              {t.receiptNotice} <strong className="font-mono text-teal-300 font-bold text-sm block mt-1">{mockReferenceNumber}</strong>
            </p>
          </div>

          {/* Application Receipt Details */}
          <div className="p-4 rounded-xl bg-navy-950 border border-navy-800 text-left text-xs font-mono space-y-2 max-w-md mx-auto">
            <div className="flex justify-between text-slate-400 pb-1 border-b border-navy-800">
              <span>Timestamp:</span>
              <span className="text-white">{new Date().toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-400 pb-1 border-b border-navy-800">
              <span>Student:</span>
              <span className="text-white">{formData.studentName || 'Rahul Kumar (Demo)'}</span>
            </div>
            <div className="flex justify-between text-slate-400 pb-1 border-b border-navy-800">
              <span>USN:</span>
              <span className="text-white">{maskIdentifier(formData.usn, true)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Category:</span>
              <span className="text-white">{formData.category || 'General'}</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleResetApplication}
              className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-navy-950 font-bold text-xs transition-colors shadow-lg"
            >
              {t.startNew}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
