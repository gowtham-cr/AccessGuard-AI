import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCitizen } from '../context/CitizenContext.jsx';
import { CITIZEN_SERVICES } from '../data/citizenContent.js';
import {
  Volume2,
  VolumeX,
  Languages,
  Eye,
  Type,
  Search,
  CheckSquare,
  Square,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  PhoneCall,
  Wheat,
  MapPin,
  HeartHandshake,
  Accessibility,
  Fingerprint,
  FileCheck2,
  ArrowRight,
  Info,
} from 'lucide-react';

const ICON_MAP = {
  Wheat,
  MapPin,
  HeartHandshake,
  Accessibility,
  Fingerprint,
};

export function CitizenPage() {
  const {
    language,
    setLanguage,
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
  } = useCitizen();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedServiceId, setExpandedServiceId] = useState(CITIZEN_SERVICES[0]?.id || null);
  const [checkedDocs, setCheckedDocs] = useState({});

  // Toggle document checklist state
  const toggleDocCheck = (serviceId, docIndex) => {
    const key = `${serviceId}_${docIndex}`;
    setCheckedDocs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Filtered services
  const filteredServices = useMemo(() => {
    return CITIZEN_SERVICES.filter((svc) => {
      const data = svc[language] || svc.en;
      const matchesCategory = selectedCategory === 'all' || svc.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        data.title.toLowerCase().includes(query) ||
        data.shortDesc.toLowerCase().includes(query) ||
        data.department.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [language, selectedCategory, searchQuery]);

  // Read full page overview in the currently selected language
  const handleReadPage = () => {
    if (isReading && currentlyReadingId === 'page_overview') {
      stopSpeaking();
      return;
    }

    const title = t('banner.title');
    const subtitle = t('banner.subtitle');
    const notice = t('disclaimer.text');
    const textToRead = `${title}. ${subtitle}. ${notice}`;
    const targetLang = language === 'kn' ? 'kn-IN' : 'en-IN';
    speak(textToRead, { id: 'page_overview', lang: targetLang });
  };

  // Read individual service guide in the currently selected language
  const handleReadService = (svc) => {
    const svcId = `svc_${svc.id}`;
    if (isReading && currentlyReadingId === svcId) {
      stopSpeaking();
      return;
    }

    const data = svc[language] || svc.en;
    const stepsText = data.steps
      .map((s) => `${t('serviceCard.stepNumber')} ${s.step}: ${s.title}. ${s.instruction}`)
      .join('. ');
    const docsText = `${t('serviceCard.requiredDocs')}: ${data.documentsRequired.join(', ')}`;
    const fullText = `${data.title}. ${data.department}. ${data.shortDesc}. ${docsText}. ${stepsText}. ${data.helpline}.`;
    const targetLang = language === 'kn' ? 'kn-IN' : 'en-IN';

    speak(fullText, { id: svcId, lang: targetLang });
  };

  // Text scaling class
  const fontClass =
    fontSize === 'xlarge'
      ? 'citizen-font-xlarge'
      : fontSize === 'large'
      ? 'citizen-font-large'
      : 'citizen-font-normal';

  return (
    <div
      className={`min-h-screen ${
        highContrast ? 'citizen-high-contrast' : 'bg-navy-950 text-slate-100'
      } ${fontClass} transition-colors duration-200 flex flex-col justify-between`}
    >
      {/* Top Accessibility Control Bar */}
      <header
        className={`sticky top-0 z-40 border-b ${
          highContrast ? 'bg-black border-yellow-400' : 'bg-navy-900/95 border-navy-800 backdrop-blur'
        } px-4 py-2.5 shadow-md`}
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Mode Indicator */}
          <div className="flex items-center gap-3">
            <Link
              to="/citizen"
              className="flex items-center gap-2.5 focus-visible:ring-2 focus-visible:ring-teal-400 rounded-lg p-1"
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-black ${
                  highContrast
                    ? 'bg-yellow-400 text-black border-2 border-white'
                    : 'bg-gradient-to-br from-teal-400 to-teal-700 text-navy-950 shadow-md border-glow-teal'
                }`}
              >
                <ShieldCheck className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <span className={`font-black text-base tracking-tight ${highContrast ? 'text-yellow-400' : 'text-white'}`}>
                  AccessGuard
                </span>
                <span
                  className={`ml-2 text-xs font-bold uppercase px-2 py-0.5 rounded-full ${
                    highContrast
                      ? 'bg-yellow-400 text-black'
                      : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                  }`}
                >
                  {t('banner.modeCitizen')}
                </span>
              </div>
            </Link>
          </div>

          {/* Action Toolbar: Language, Audio, Contrast, Text Size, Switch to Auditor */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Language Switcher (EN / KN) */}
            <div
              className={`flex items-center rounded-xl p-0.5 border ${
                highContrast ? 'border-yellow-400 bg-black' : 'border-navy-750 bg-navy-850'
              }`}
              role="group"
              aria-label="Language selection"
            >
              <button
                type="button"
                onClick={() => setLanguage('en')}
                aria-pressed={language === 'en'}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  language === 'en'
                    ? highContrast
                      ? 'bg-yellow-400 text-black'
                      : 'bg-teal-500 text-navy-950 shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('kn')}
                aria-pressed={language === 'kn'}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  language === 'kn'
                    ? highContrast
                      ? 'bg-yellow-400 text-black'
                      : 'bg-teal-500 text-navy-950 shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                ಕನ್ನಡ
              </button>
            </div>

            {/* Read Aloud Button */}
            {speechSupported && (
              <button
                type="button"
                onClick={handleReadPage}
                aria-label={isReading ? t('controls.stopReading') : t('controls.readAloud')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  isReading
                    ? 'bg-red-500/20 border-red-500 text-red-300 animate-pulse'
                    : highContrast
                    ? 'bg-black border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black'
                    : 'bg-navy-850 border-navy-750 text-slate-200 hover:text-white hover:bg-navy-800'
                }`}
              >
                {isReading ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-red-400" aria-hidden="true" />
                    <span>{t('controls.stopReading')}</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-teal-400" aria-hidden="true" />
                    <span>{t('controls.readAloud')}</span>
                  </>
                )}
              </button>
            )}

            {/* Font Size Adjuster */}
            <div
              className={`flex items-center rounded-xl p-0.5 border ${
                highContrast ? 'border-yellow-400 bg-black' : 'border-navy-750 bg-navy-850'
              }`}
              role="group"
              aria-label="Font size controls"
            >
              <button
                type="button"
                onClick={() => setFontSize('normal')}
                title="Normal text size"
                aria-label="Normal text size"
                aria-pressed={fontSize === 'normal'}
                className={`px-2 py-1 text-xs font-bold rounded-lg transition-all ${
                  fontSize === 'normal'
                    ? highContrast
                      ? 'bg-yellow-400 text-black'
                      : 'bg-teal-500/20 text-teal-300'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setFontSize('large')}
                title="Large text size"
                aria-label="Large text size"
                aria-pressed={fontSize === 'large'}
                className={`px-2 py-1 text-sm font-bold rounded-lg transition-all ${
                  fontSize === 'large'
                    ? highContrast
                      ? 'bg-yellow-400 text-black'
                      : 'bg-teal-500/20 text-teal-300'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                A+
              </button>
              <button
                type="button"
                onClick={() => setFontSize('xlarge')}
                title="Extra large text size"
                aria-label="Extra large text size"
                aria-pressed={fontSize === 'xlarge'}
                className={`px-2 py-1 text-base font-black rounded-lg transition-all ${
                  fontSize === 'xlarge'
                    ? highContrast
                      ? 'bg-yellow-400 text-black'
                      : 'bg-teal-500/20 text-teal-300'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                A++
              </button>
            </div>

            {/* High Contrast Mode Toggle */}
            <button
              type="button"
              onClick={() => setHighContrast(!highContrast)}
              aria-pressed={highContrast}
              aria-label="Toggle High Contrast"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                highContrast
                  ? 'bg-yellow-400 text-black border-yellow-400'
                  : 'bg-navy-850 border-navy-750 text-slate-300 hover:text-white hover:bg-navy-800'
              }`}
            >
              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">{highContrast ? t('controls.normalContrast') : t('controls.highContrast')}</span>
            </button>

            {/* Switch to Auditor Mode */}
            <Link
              to="/dashboard"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                highContrast
                  ? 'border-white text-white hover:bg-white hover:text-black'
                  : 'border-teal-500/40 bg-teal-500/10 text-teal-300 hover:bg-teal-500/20'
              }`}
            >
              <span>{t('banner.modeAuditor')}</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 flex-1 w-full">
        {/* Audio Error Alert Banner */}
        {audioError && (
          <div
            role="alert"
            aria-live="polite"
            className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-all ${
              highContrast
                ? 'border-yellow-400 bg-black text-yellow-400'
                : 'border-red-500/40 bg-red-950/40 text-red-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" aria-hidden="true" />
              <div>
                <p className="font-bold">{language === 'kn' ? audioError.kn : audioError.en}</p>
                <p className="text-[11px] opacity-80 mt-0.5">
                  {language === 'kn' ? audioError.en : audioError.kn}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={clearAudioError}
              aria-label="Dismiss error"
              className="px-2 py-1 text-xs font-bold rounded-lg border border-red-500/30 hover:bg-red-500/20 text-red-300"
            >
              ✕
            </button>
          </div>
        )}

        {/* Civic Helplines Quick Access Bar */}
        <div
          className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
            highContrast ? 'border-yellow-400 bg-black text-yellow-400' : 'border-teal-500/25 bg-teal-950/20 text-teal-200'
          }`}
        >
          <div className="flex items-center gap-2 font-bold">
            <PhoneCall className="w-4 h-4 shrink-0 text-teal-400" aria-hidden="true" />
            <span>{t('helplineQuickBar.title')}:</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] sm:text-xs">
            <span className="px-2 py-0.5 rounded bg-black/30 border border-white/10">
              {t('helplineQuickBar.karnatakaHelpline')}
            </span>
            <span className="px-2 py-0.5 rounded bg-black/30 border border-white/10">
              {t('helplineQuickBar.elderLine')}
            </span>
            <span className="px-2 py-0.5 rounded bg-black/30 border border-white/10">
              {t('helplineQuickBar.aadhaarHelp')}
            </span>
            <span className="px-2 py-0.5 rounded bg-black/30 border border-white/10">
              {t('helplineQuickBar.emergency')}
            </span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center space-y-3 py-2">
          <h1
            className={`text-2xl sm:text-4xl font-black tracking-tight leading-tight ${
              highContrast ? 'text-yellow-400' : 'text-white'
            }`}
          >
            {t('banner.title')}
          </h1>
          <p
            className={`max-w-3xl mx-auto text-sm sm:text-base leading-relaxed ${
              highContrast ? 'text-white' : 'text-slate-300'
            }`}
          >
            {t('banner.subtitle')}
          </p>
        </div>

        {/* Search & Category Filter Controls */}
        <div className="space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('controls.searchPlaceholder')}
              aria-label="Search civic services"
              className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium transition-all ${
                highContrast
                  ? 'bg-black border-2 border-yellow-400 text-yellow-400 placeholder:text-yellow-600 focus:outline-none focus:ring-2 focus:ring-white'
                  : 'bg-navy-900 border border-navy-750 text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-400'
              }`}
            />
          </div>

          {/* Category Filter Pills */}
          <div
            className="flex items-center gap-2 overflow-x-auto pb-1"
            role="tablist"
            aria-label="Service categories"
          >
            {[
              { id: 'all', label: t('controls.allCategories') },
              { id: 'food', label: t('controls.foodCategory') },
              { id: 'land', label: t('controls.landCategory') },
              { id: 'pension', label: t('controls.pensionCategory') },
              { id: 'disability', label: t('controls.disabilityCategory') },
              { id: 'identity', label: t('controls.identityCategory') },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={selectedCategory === cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  selectedCategory === cat.id
                    ? highContrast
                      ? 'bg-yellow-400 text-black border-yellow-400 shadow'
                      : 'bg-teal-500 text-navy-950 border-teal-500 shadow'
                    : highContrast
                    ? 'border-yellow-400 text-yellow-400 hover:bg-yellow-400/20'
                    : 'border-navy-750 bg-navy-900 text-slate-300 hover:text-white hover:bg-navy-850'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Civic Services List */}
        <div className="space-y-4">
          {filteredServices.map((svc) => {
            const data = svc[language] || svc.en;
            const Icon = ICON_MAP[svc.icon] || FileCheck2;
            const isExpanded = expandedServiceId === svc.id;
            const isServiceReading = isReading && currentlyReadingId === `svc_${svc.id}`;

            return (
              <article
                key={svc.id}
                id={`service-${svc.id}`}
                className={`rounded-2xl border transition-all ${
                  highContrast
                    ? 'border-yellow-400 bg-black text-white'
                    : 'border-navy-800 bg-navy-900/90 hover:border-navy-700 shadow-xl'
                }`}
              >
                {/* Service Header Card */}
                <div className="p-4 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                          highContrast
                            ? 'bg-yellow-400 text-black border border-white'
                            : 'bg-teal-500/15 border border-teal-500/30 text-teal-300'
                        }`}
                      >
                        <Icon className="w-6 h-6" aria-hidden="true" />
                      </div>
                      <div>
                        <h2
                          className={`text-lg sm:text-xl font-bold leading-snug ${
                            highContrast ? 'text-yellow-400' : 'text-white'
                          }`}
                        >
                          {data.title}
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">{data.department}</p>
                      </div>
                    </div>

                    {/* Audio & Expand Actions */}
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {speechSupported && (
                        <button
                          type="button"
                          onClick={() => handleReadService(svc)}
                          aria-label={`${isServiceReading ? t('serviceCard.stopGuide') : t('serviceCard.listenToGuide')}: ${data.title}`}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                            isServiceReading
                              ? 'bg-red-500/20 border-red-500 text-red-300 animate-pulse'
                              : highContrast
                              ? 'border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black'
                              : 'border-navy-750 bg-navy-850 text-slate-300 hover:text-white'
                          }`}
                        >
                          {isServiceReading ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5 text-red-400" aria-hidden="true" />
                              <span>{t('serviceCard.stopGuide')}</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5 text-teal-400" aria-hidden="true" />
                              <span>{t('serviceCard.listenToGuide')}</span>
                            </>
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setExpandedServiceId(isExpanded ? null : svc.id)}
                        aria-expanded={isExpanded}
                        aria-controls={`details-${svc.id}`}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          highContrast
                            ? 'bg-yellow-400 text-black border-yellow-400'
                            : 'bg-teal-500/15 border-teal-500/30 text-teal-300 hover:bg-teal-500/25'
                        }`}
                      >
                        {isExpanded ? (language === 'kn' ? 'ಮರೆಮಾಡಿ' : 'Hide Steps') : (language === 'kn' ? 'ವಿವರ ನೋಡಿ' : 'View Steps')}
                      </button>
                    </div>
                  </div>

                  <p className={`text-sm leading-relaxed ${highContrast ? 'text-white' : 'text-slate-300'}`}>
                    {data.shortDesc}
                  </p>
                </div>

                {/* Expanded Step-by-Step Guidance */}
                {isExpanded && (
                  <div
                    id={`details-${svc.id}`}
                    className={`border-t px-4 sm:px-6 py-5 space-y-6 ${
                      highContrast ? 'border-yellow-400/40 bg-black' : 'border-navy-800 bg-navy-950/60'
                    }`}
                  >
                    {/* Document Checklist */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-bold">
                        <FileCheck2 className="w-4 h-4 text-teal-400" aria-hidden="true" />
                        <h3 className={highContrast ? 'text-yellow-400' : 'text-white'}>
                          {t('serviceCard.requiredDocs')}
                        </h3>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2.5">
                        {data.documentsRequired.map((doc, idx) => {
                          const isChecked = Boolean(checkedDocs[`${svc.id}_${idx}`]);
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => toggleDocCheck(svc.id, idx)}
                              className={`flex items-start gap-2.5 p-3 rounded-xl text-left text-xs transition-all border ${
                                isChecked
                                  ? highContrast
                                    ? 'bg-yellow-400/20 border-yellow-400 text-yellow-300 line-through'
                                    : 'bg-teal-500/10 border-teal-500/30 text-slate-300 line-through'
                                  : highContrast
                                  ? 'bg-black border-yellow-400/50 text-white hover:border-yellow-400'
                                  : 'bg-navy-900 border-navy-800 text-slate-200 hover:border-navy-700'
                              }`}
                            >
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" aria-hidden="true" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
                              )}
                              <span>{doc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Step-by-Step Flow */}
                    <div className="space-y-3">
                      <h3 className={`text-sm font-bold ${highContrast ? 'text-yellow-400' : 'text-white'}`}>
                        {t('serviceCard.stepByStep')}
                      </h3>
                      <div className="space-y-3">
                        {data.steps.map((st) => (
                          <div
                            key={st.step}
                            className={`p-4 rounded-xl border flex gap-3.5 items-start ${
                              highContrast
                                ? 'border-yellow-400/40 bg-black text-white'
                                : 'border-navy-800 bg-navy-900/60'
                            }`}
                          >
                            <span
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                highContrast
                                  ? 'bg-yellow-400 text-black'
                                  : 'bg-teal-500 text-navy-950 font-black'
                              }`}
                            >
                              {st.step}
                            </span>
                            <div className="space-y-1">
                              <h4 className={`text-sm font-bold ${highContrast ? 'text-yellow-400' : 'text-white'}`}>
                                {st.title}
                              </h4>
                              <p className={`text-xs leading-relaxed ${highContrast ? 'text-slate-200' : 'text-slate-300'}`}>
                                {st.instruction}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Warnings & Safety Tips */}
                    {data.warnings && data.warnings.length > 0 && (
                      <div
                        className={`p-3.5 rounded-xl border space-y-2 text-xs ${
                          highContrast
                            ? 'border-yellow-400 bg-yellow-400/10 text-yellow-300'
                            : 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-bold">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
                          <span>{t('serviceCard.importantNotice')}</span>
                        </div>
                        <ul className="list-disc list-inside space-y-1 leading-relaxed pl-1 text-[11px] sm:text-xs">
                          {data.warnings.map((w, wIdx) => (
                            <li key={wIdx}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Official Portal Link & Helpline */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                      <div className="text-xs text-slate-400">
                        <span className="font-bold text-slate-300">{t('serviceCard.helplineLabel')}: </span>
                        <span>{data.helpline}</span>
                      </div>

                      <a
                        href={data.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          highContrast
                            ? 'bg-yellow-400 text-black hover:bg-white'
                            : 'bg-teal-500 hover:bg-teal-400 text-navy-950 shadow-md focus-visible:ring-2 focus-visible:ring-teal-400'
                        }`}
                      >
                        <span>{t('serviceCard.openOfficialPortal')}</span>
                        <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {/* Transparent Disclaimer Box */}
        <div
          className={`p-4 rounded-2xl border space-y-2 text-xs leading-relaxed ${
            highContrast ? 'border-white bg-black text-slate-300' : 'border-navy-800 bg-navy-900/60 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-slate-200">
            <Info className="w-4 h-4 text-teal-400 shrink-0" aria-hidden="true" />
            <h4 className={highContrast ? 'text-yellow-400' : 'text-slate-200'}>
              {t('disclaimer.title')}
            </h4>
          </div>
          <p>{t('disclaimer.text')}</p>
        </div>
      </main>

      {/* Footer */}
      <footer
        className={`border-t py-6 text-center text-xs ${
          highContrast ? 'border-yellow-400 bg-black text-yellow-400' : 'border-navy-800 bg-navy-900/80 text-slate-500'
        }`}
      >
        <p>AccessGuard AI — Citizen Digital Service Guide • Accessible by Default</p>
      </footer>
    </div>
  );
}
