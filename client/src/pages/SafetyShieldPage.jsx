import React, { useState, useEffect, useId } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api.js';
import { useCitizen } from '../context/CitizenContext.jsx';
import { SAFETY_WARNINGS, SHIELD_UI } from '../data/safetyShieldContent.js';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  CheckCircle,
  HelpCircle,
  Volume2,
  VolumeX,
  Loader2,
  RotateCcw,
  Lock,
  Unlock,
  Globe,
  MessageSquare,
  Search,
  ArrowRight,
  Info,
  CreditCard,
  KeyRound,
  Building2,
  ZapOff,
  Gift,
  Link2,
  Receipt,
} from 'lucide-react';

const ICON_MAP = {
  CreditCard,
  KeyRound,
  Building2,
  ZapOff,
  Gift,
  Link2,
  ShieldAlert,
  Receipt,
};

export function SafetyShieldPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'message';

  const [activeTab, setActiveTab] = useState(
    ['message', 'website', 'explain'].includes(initialTab) ? initialTab : 'message'
  );

  // Sync activeTab when query param changes
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['message', 'website', 'explain'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  // Reuse existing CitizenContext for language and speech playback
  const {
    language,
    setLanguage,
    speak,
    stopSpeaking,
    isReading,
    isLoadingAudio,
    currentlyReadingId,
  } = useCitizen();

  const lang = language === 'kn' ? 'kn' : 'en';
  const ui = SHIELD_UI[lang];

  // ----------------------------------------------------
  // Section A: Check a Message State
  // ----------------------------------------------------
  const [messageInput, setMessageInput] = useState('');
  const [messageAnalyzing, setMessageAnalyzing] = useState(false);
  const [messageError, setMessageError] = useState(null);
  const [messageResult, setMessageResult] = useState(null);

  const handleAnalyzeMessage = async (e) => {
    e?.preventDefault();
    const trimmed = messageInput.trim();

    if (!trimmed) {
      setMessageError(ui.messageSection.emptyError);
      return;
    }

    if (trimmed.length > 5000) {
      setMessageError(ui.messageSection.tooLongError);
      return;
    }

    try {
      setMessageAnalyzing(true);
      setMessageError(null);
      setMessageResult(null);

      const res = await api.checkShieldMessage(trimmed);
      setMessageResult(res);
    } catch (err) {
      setMessageError(err.message || 'Failed to inspect message.');
    } finally {
      setMessageAnalyzing(false);
    }
  };

  const handleClearMessage = () => {
    setMessageInput('');
    setMessageResult(null);
    setMessageError(null);
  };

  // ----------------------------------------------------
  // Section B: Check a Website State
  // ----------------------------------------------------
  const [urlInput, setUrlInput] = useState('');
  const [urlChecking, setUrlChecking] = useState(false);
  const [urlError, setUrlError] = useState(null);
  const [urlResult, setUrlResult] = useState(null);

  const handleCheckUrl = async (e) => {
    e?.preventDefault();
    let target = urlInput.trim();

    if (!target) {
      setUrlError(ui.websiteSection.emptyError);
      return;
    }

    if (target.length > 2048) {
      setUrlError(ui.websiteSection.tooLongError);
      return;
    }

    if (!/^https?:\/\//i.test(target)) {
      target = `https://${target}`;
    }

    try {
      setUrlChecking(true);
      setUrlError(null);
      setUrlResult(null);

      const res = await api.checkShieldUrl(target);
      setUrlResult(res);
    } catch (err) {
      setUrlError(err.message || 'Failed to inspect website.');
    } finally {
      setUrlChecking(false);
    }
  };

  const handleClearUrl = () => {
    setUrlInput('');
    setUrlResult(null);
    setUrlError(null);
  };

  // ----------------------------------------------------
  // Section C: Explain a Warning State
  // ----------------------------------------------------
  const [selectedWarningId, setSelectedWarningId] = useState(SAFETY_WARNINGS[0].id);
  const currentWarning =
    SAFETY_WARNINGS.find((w) => w.id === selectedWarningId) || SAFETY_WARNINGS[0];
  const warningContent = currentWarning[lang] || currentWarning.en;

  const handleReadWarningAloud = () => {
    if (isReading) {
      stopSpeaking();
      return;
    }

    const titleText = warningContent.title;
    const explanationText = warningContent.explanation;
    const warningSignsText = `${ui.explainSection.warningSignsTitle} ${warningContent.warningSigns.join('. ')}`;
    const stepsText = `${ui.explainSection.safeStepsTitle} ${warningContent.safeNextSteps.join('. ')}`;

    const fullSpokenText = `${titleText}. ${explanationText}. ${warningSignsText}. ${stepsText}`;

    speak(fullSpokenText, {
      lang: lang === 'kn' ? 'kn-IN' : 'en-IN',
      id: `shield_warning_${selectedWarningId}`,
      rate: 0.9,
    });
  };

  // Helper for rendering risk badges
  const renderRiskBadge = (level) => {
    switch (level) {
      case 'High Risk':
      case 'ಹೆಚ್ಚಿನ ಅಪಾಯ (High Risk)':
        return (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/20 border border-red-500/50 text-red-300 text-xs font-extrabold uppercase tracking-wide">
            <AlertOctagon className="w-4 h-4 text-red-400" aria-hidden="true" />
            <span>{ui.riskLevels.high}</span>
          </div>
        );
      case 'Needs Verification':
      case 'ಪರಿಶೀಲನೆ ಅಗತ್ಯ (Needs Verification)':
        return (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-extrabold uppercase tracking-wide">
            <AlertTriangle className="w-4 h-4 text-amber-400" aria-hidden="true" />
            <span>{ui.riskLevels.medium}</span>
          </div>
        );
      case 'Unable to verify':
      case 'Unable to Verify':
      case 'ಪರಿಶೀಲಿಸಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ (Unable to Verify)':
        return (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/50 text-purple-300 text-xs font-extrabold uppercase tracking-wide">
            <HelpCircle className="w-4 h-4 text-purple-400" aria-hidden="true" />
            <span>{ui.riskLevels.unable}</span>
          </div>
        );
      case 'No Obvious Warning Signs':
      case 'ಯಾವುದೇ ಸ್ಪಷ್ಟ ಎಚ್ಚರಿಕೆಗಳಿಲ್ಲ (No Obvious Warning Signs)':
      default:
        return (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/20 border border-teal-500/50 text-teal-300 text-xs font-extrabold uppercase tracking-wide">
            <ShieldCheck className="w-4 h-4 text-teal-400" aria-hidden="true" />
            <span>{ui.riskLevels.low}</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header Banner & Language Toggle */}
      <header className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-navy-900 via-navy-900 to-teal-950/40 border border-teal-500/30 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 text-xs font-bold tracking-wide">
              <Shield className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{ui.badge}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {ui.title}
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              {ui.subtitle}
            </p>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center gap-2 bg-navy-950 p-1.5 rounded-2xl border border-navy-800 shrink-0">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-teal-400 ${
                language === 'en'
                  ? 'bg-teal-500 text-navy-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage('kn')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-teal-400 ${
                language === 'kn'
                  ? 'bg-teal-500 text-navy-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ಕನ್ನಡ (Kannada)
            </button>
          </div>
        </div>
      </header>

      {/* Main Tab Navigation */}
      <nav
        aria-label="Safety Shield Sections"
        className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-1.5 rounded-2xl bg-navy-900 border border-navy-800"
      >
        <button
          type="button"
          onClick={() => handleTabChange('message')}
          className={`flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl text-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-teal-400 ${
            activeTab === 'message'
              ? 'bg-teal-500 text-navy-950 shadow-lg shadow-teal-500/20'
              : 'text-slate-300 hover:text-white hover:bg-navy-800/60'
          }`}
          aria-selected={activeTab === 'message'}
          role="tab"
        >
          <MessageSquare className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{ui.tabs.message}</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('website')}
          className={`flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl text-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-teal-400 ${
            activeTab === 'website'
              ? 'bg-teal-500 text-navy-950 shadow-lg shadow-teal-500/20'
              : 'text-slate-300 hover:text-white hover:bg-navy-800/60'
          }`}
          aria-selected={activeTab === 'website'}
          role="tab"
        >
          <Globe className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{ui.tabs.website}</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('explain')}
          className={`flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl text-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-teal-400 ${
            activeTab === 'explain'
              ? 'bg-teal-500 text-navy-950 shadow-lg shadow-teal-500/20'
              : 'text-slate-300 hover:text-white hover:bg-navy-800/60'
          }`}
          aria-selected={activeTab === 'explain'}
          role="tab"
        >
          <HelpCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{ui.tabs.explain}</span>
        </button>
      </nav>

      {/* ==================================================== */}
      {/* SECTION A: CHECK A MESSAGE                           */}
      {/* ==================================================== */}
      {activeTab === 'message' && (
        <section aria-labelledby="check-message-heading" className="space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-navy-900 border border-navy-800 shadow-xl space-y-5">
            <div>
              <h2 id="check-message-heading" className="text-lg sm:text-xl font-bold text-white">
                {ui.messageSection.title}
              </h2>
              <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                {ui.messageSection.description}
              </p>
            </div>

            {messageError && (
              <div
                role="alert"
                className="p-4 rounded-2xl bg-red-500/10 border border-red-500/40 text-red-300 text-xs sm:text-sm font-medium leading-relaxed flex items-start gap-3"
              >
                <AlertTriangle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-bold">Error:</p>
                  <p>{messageError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleAnalyzeMessage} className="space-y-4">
              <div>
                <label
                  htmlFor="message-input"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2"
                >
                  {ui.messageSection.label}
                </label>
                <textarea
                  id="message-input"
                  rows={5}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={ui.messageSection.placeholder}
                  className="w-full p-4 rounded-2xl bg-navy-950 border border-navy-800 text-white placeholder-slate-500 text-sm leading-relaxed focus-visible:ring-2 focus-visible:ring-teal-400 focus:border-transparent outline-none transition-all resize-y"
                />
                <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
                  <span>{ui.messageSection.privacyNote}</span>
                  <span>
                    {messageInput.length} / 5000 {ui.messageSection.charCount}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={messageAnalyzing}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-extrabold bg-teal-500 hover:bg-teal-400 text-navy-950 shadow-lg shadow-teal-500/20 transition-all focus-visible:ring-2 focus-visible:ring-teal-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {messageAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      <span>{ui.messageSection.analyzing}</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" aria-hidden="true" />
                      <span>{ui.messageSection.analyzeButton}</span>
                    </>
                  )}
                </button>

                {messageInput && (
                  <button
                    type="button"
                    onClick={handleClearMessage}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold bg-navy-800 hover:bg-navy-700 text-slate-300 hover:text-white transition-all focus-visible:ring-2 focus-visible:ring-slate-400"
                  >
                    <RotateCcw className="w-4 h-4" aria-hidden="true" />
                    <span>{ui.messageSection.clearButton}</span>
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Analysis Results Display */}
          {messageResult && (
            <div
              role="region"
              aria-label="Message Analysis Results"
              className="p-6 sm:p-8 rounded-3xl bg-navy-900 border border-teal-500/30 shadow-2xl space-y-6"
            >
              {/* Risk Level Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-navy-800">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {ui.results.riskBadge}
                  </span>
                  <div className="mt-1">{renderRiskBadge(messageResult.riskLevel)}</div>
                </div>

                <div className="text-xs text-slate-400 font-mono">
                  {messageResult.warningSigns?.length || 0} warning signal(s) detected
                </div>
              </div>

              {/* Plain-Language Explanation */}
              <div className="space-y-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Info className="w-4 h-4 text-teal-400" aria-hidden="true" />
                  <span>{ui.results.explanationTitle}</span>
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed bg-navy-950/60 p-4 rounded-2xl border border-navy-800">
                  {messageResult.explanation}
                </p>
              </div>

              {/* Detected Evidence List */}
              {messageResult.warningSigns && messageResult.warningSigns.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" aria-hidden="true" />
                    <span>{ui.results.evidenceTitle}</span>
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {messageResult.warningSigns.map((sign, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-navy-950 border border-navy-800 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-teal-300">{sign.title}</span>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-navy-800 text-slate-400">
                            {sign.category}
                          </span>
                        </div>
                        {sign.evidence && (
                          <div className="text-xs text-red-300 bg-red-950/30 border border-red-500/20 px-3 py-1.5 rounded-xl font-mono">
                            <span className="font-bold text-slate-400">"{sign.evidence}"</span>
                          </div>
                        )}
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {sign.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Safe Next Steps */}
              {messageResult.safeNextSteps && messageResult.safeNextSteps.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-teal-400" aria-hidden="true" />
                    <span>{ui.results.recommendationsTitle}</span>
                  </h3>
                  <ul className="space-y-2">
                    {messageResult.safeNextSteps.map((step, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs sm:text-sm text-teal-200"
                      >
                        <span className="w-5 h-5 rounded-full bg-teal-500 text-navy-950 font-bold flex items-center justify-center shrink-0 text-xs mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Disclaimer */}
              {messageResult.disclaimer && (
                <div className="p-4 rounded-2xl bg-navy-950 border border-navy-800/80 text-xs text-slate-400 leading-relaxed">
                  <strong className="text-slate-300">{ui.results.disclaimerTitle}: </strong>
                  {messageResult.disclaimer}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* ==================================================== */}
      {/* SECTION B: CHECK A WEBSITE                           */}
      {/* ==================================================== */}
      {activeTab === 'website' && (
        <section aria-labelledby="check-website-heading" className="space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-navy-900 border border-navy-800 shadow-xl space-y-5">
            <div>
              <h2 id="check-website-heading" className="text-lg sm:text-xl font-bold text-white">
                {ui.websiteSection.title}
              </h2>
              <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                {ui.websiteSection.description}
              </p>
            </div>

            {urlError && (
              <div
                role="alert"
                className="p-4 rounded-2xl bg-red-500/10 border border-red-500/40 text-red-300 text-xs sm:text-sm font-medium leading-relaxed flex items-start gap-3"
              >
                <AlertTriangle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-bold">Error:</p>
                  <p>{urlError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleCheckUrl} className="space-y-4">
              <div>
                <label
                  htmlFor="website-url-input"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2"
                >
                  {ui.websiteSection.label}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Globe className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <input
                    id="website-url-input"
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder={ui.websiteSection.placeholder}
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-navy-950 border border-navy-800 text-white placeholder-slate-500 text-sm focus-visible:ring-2 focus-visible:ring-teal-400 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {ui.websiteSection.safetyNote}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={urlChecking}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-extrabold bg-teal-500 hover:bg-teal-400 text-navy-950 shadow-lg shadow-teal-500/20 transition-all focus-visible:ring-2 focus-visible:ring-teal-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {urlChecking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      <span>{ui.websiteSection.checking}</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" aria-hidden="true" />
                      <span>{ui.websiteSection.checkButton}</span>
                    </>
                  )}
                </button>

                {urlInput && (
                  <button
                    type="button"
                    onClick={handleClearUrl}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold bg-navy-800 hover:bg-navy-700 text-slate-300 hover:text-white transition-all focus-visible:ring-2 focus-visible:ring-slate-400"
                  >
                    <RotateCcw className="w-4 h-4" aria-hidden="true" />
                    <span>{ui.websiteSection.clearButton}</span>
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Website Findings Display */}
          {urlResult && (
            <div
              role="region"
              aria-label="Website Inspection Findings"
              className="p-6 sm:p-8 rounded-3xl bg-navy-900 border border-teal-500/30 shadow-2xl space-y-6"
            >
              {/* Header Details */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-navy-800">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {ui.results.riskBadge}
                  </span>
                  <div className="mt-1">{renderRiskBadge(urlResult.riskLevel)}</div>
                </div>

                <div className="text-xs text-slate-300 font-mono bg-navy-950 px-3 py-1.5 rounded-xl border border-navy-800">
                  <span className="text-slate-500">Status: </span>
                  <strong>{urlResult.status || 'Verified'}</strong>
                </div>
              </div>

              {/* Target Address Card (Safe non-clickable display) */}
              <div className="p-4 rounded-2xl bg-navy-950 border border-navy-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                    Target Address
                  </span>
                  <p className="font-mono text-white text-sm break-all mt-0.5">
                    {urlResult.url}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                    {ui.results.https}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    {urlResult.httpsEnabled ? (
                      <>
                        <Lock className="w-4 h-4 text-teal-400" aria-hidden="true" />
                        <span className="text-teal-300 font-semibold">{ui.results.httpsActive}</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-4 h-4 text-amber-400" aria-hidden="true" />
                        <span className="text-amber-300 font-semibold">{ui.results.httpsInactive}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Plain-Language Explanation */}
              {urlResult.explanation && (
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Info className="w-4 h-4 text-teal-400" aria-hidden="true" />
                    <span>{ui.results.explanationTitle}</span>
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed bg-navy-950/60 p-4 rounded-2xl border border-navy-800">
                    {urlResult.explanation}
                  </p>
                </div>
              )}

              {/* Observable Findings */}
              {urlResult.findings && urlResult.findings.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" aria-hidden="true" />
                    <span>{ui.results.evidenceTitle}</span>
                  </h3>
                  <div className="space-y-2.5">
                    {urlResult.findings.map((f, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-navy-950 border border-navy-800 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-sm">{f.title}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                              f.severity === 'Critical' || f.severity === 'High'
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                : f.severity === 'Medium'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                            }`}
                          >
                            {f.severity || 'Info'}
                          </span>
                        </div>
                        <p className="text-slate-400 leading-relaxed">{f.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Safe Next Steps */}
              {urlResult.safeNextSteps && urlResult.safeNextSteps.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-teal-400" aria-hidden="true" />
                    <span>{ui.results.recommendationsTitle}</span>
                  </h3>
                  <ul className="space-y-2">
                    {urlResult.safeNextSteps.map((step, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs sm:text-sm text-teal-200"
                      >
                        <span className="w-5 h-5 rounded-full bg-teal-500 text-navy-950 font-bold flex items-center justify-center shrink-0 text-xs mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Limitations Note */}
              {urlResult.limitations && (
                <div className="p-4 rounded-2xl bg-navy-950 border border-navy-800 text-xs text-slate-400 leading-relaxed">
                  <strong className="text-slate-300">{ui.results.limitationsTitle}: </strong>
                  {urlResult.limitations}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* ==================================================== */}
      {/* SECTION C: EXPLAIN A WARNING (Bilingual + Audio)    */}
      {/* ==================================================== */}
      {activeTab === 'explain' && (
        <section aria-labelledby="explain-warning-heading" className="space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-navy-900 border border-navy-800 shadow-xl space-y-6">
            <div>
              <h2 id="explain-warning-heading" className="text-lg sm:text-xl font-bold text-white">
                {ui.explainSection.title}
              </h2>
              <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                {ui.explainSection.description}
              </p>
            </div>

            {/* Warning Scenario Selector Cards */}
            <div>
              <label
                htmlFor="warning-scenario-select"
                className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-3"
              >
                {ui.explainSection.selectLabel}
              </label>

              <div
                id="warning-scenario-select"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
              >
                {SAFETY_WARNINGS.map((warn) => {
                  const Icon = ICON_MAP[warn.icon] || ShieldAlert;
                  const itemContent = warn[lang] || warn.en;
                  const isSelected = selectedWarningId === warn.id;

                  return (
                    <button
                      key={warn.id}
                      type="button"
                      onClick={() => {
                        stopSpeaking();
                        setSelectedWarningId(warn.id);
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 focus-visible:ring-2 focus-visible:ring-teal-400 ${
                        isSelected
                          ? 'bg-teal-500/15 border-teal-500/60 shadow-lg shadow-teal-500/10 text-white'
                          : 'bg-navy-950 border-navy-800 text-slate-400 hover:text-white hover:bg-navy-800/60'
                      }`}
                      aria-pressed={isSelected}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-teal-500 text-navy-950'
                              : 'bg-navy-900 text-teal-400 border border-navy-800'
                          }`}
                        >
                          <Icon className="w-5 h-5" aria-hidden="true" />
                        </div>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                        )}
                      </div>

                      <div>
                        <h3 className="text-xs font-bold text-white leading-snug line-clamp-2">
                          {itemContent.title}
                        </h3>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                          {itemContent.shortDesc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Warning Deep Dive Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-navy-950 border border-teal-500/30 space-y-6">
              {/* Header & Voice Playback Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-navy-800">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 font-mono">
                    {warningContent.category}
                  </span>
                  <h3 className="text-xl font-extrabold text-white">
                    {warningContent.title}
                  </h3>
                </div>

                {/* Voice Guidance Button (uses useCitizen) */}
                <button
                  type="button"
                  onClick={handleReadWarningAloud}
                  disabled={isLoadingAudio}
                  className={`inline-flex items-center gap-2.5 px-5 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all focus-visible:ring-2 focus-visible:ring-teal-400 shrink-0 ${
                    isReading && currentlyReadingId === `shield_warning_${selectedWarningId}`
                      ? 'bg-amber-500 text-navy-950 shadow-lg shadow-amber-500/20'
                      : 'bg-teal-500 hover:bg-teal-400 text-navy-950 shadow-lg shadow-teal-500/20'
                  }`}
                  aria-label={
                    isReading ? ui.explainSection.stopReading : ui.explainSection.readAloud
                  }
                >
                  {isLoadingAudio ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      <span>Loading Audio...</span>
                    </>
                  ) : isReading && currentlyReadingId === `shield_warning_${selectedWarningId}` ? (
                    <>
                      <VolumeX className="w-4 h-4" aria-hidden="true" />
                      <span>{ui.explainSection.stopReading}</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4" aria-hidden="true" />
                      <span>{ui.explainSection.readAloud}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Explanation */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {ui.results.explanationTitle}
                </h4>
                <p className="text-sm sm:text-base text-slate-200 leading-relaxed bg-navy-900/60 p-5 rounded-2xl border border-navy-800">
                  {warningContent.explanation}
                </p>
              </div>

              {/* Real World Example */}
              {warningContent.example && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                    {ui.explainSection.exampleTitle}
                  </span>
                  <p className="text-xs sm:text-sm text-amber-100 font-mono italic">
                    "{warningContent.example}"
                  </p>
                </div>
              )}

              {/* Warning Signs */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" aria-hidden="true" />
                  <span>{ui.explainSection.warningSignsTitle}</span>
                </h4>
                <ul className="space-y-2">
                  {warningContent.warningSigns.map((sign, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 p-3.5 rounded-2xl bg-navy-900 border border-navy-800 text-xs sm:text-sm text-slate-300 leading-relaxed"
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-2" />
                      <span>{sign}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Safe Next Steps */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-teal-400" aria-hidden="true" />
                  <span>{ui.explainSection.safeStepsTitle}</span>
                </h4>
                <ul className="space-y-2">
                  {warningContent.safeNextSteps.map((step, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs sm:text-sm text-teal-200 leading-relaxed"
                    >
                      <span className="w-5 h-5 rounded-full bg-teal-500 text-navy-950 font-bold flex items-center justify-center shrink-0 text-xs mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
