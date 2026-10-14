/**
 * AccessVoice AI — Voice-Guided Scholarship Assistant Content & Data Schema
 * 
 * Simulated demonstration module for visually impaired users.
 * STRICTLY FICTIONAL: Never connects to real SSP or collects real credentials.
 */

export const SCHOLARSHIP_STEPS = [
  {
    id: 'name',
    field: 'studentName',
    isSensitive: false,
    en: {
      title: 'Student Full Name',
      prompt: 'Please say your full name as registered in college records.',
      placeholder: 'e.g. Rahul Kumar',
      help: 'Speak clearly. For example, say: My name is Rahul Kumar, or simply Rahul Kumar.',
    },
    kn: {
      title: 'ವಿದ್ಯಾರ್ಥಿಯ ಪೂರ್ಣ ಹೆಸರು',
      prompt: 'ದಯವಿಟ್ಟು ಕಾಲೇಜು ದಾಖಲೆಗಳಲ್ಲಿ ನೋಂದಾಯಿಸಿದ ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರನ್ನು ಹೇಳಿ.',
      placeholder: 'ಉದಾ: ರಾಹುಲ್ ಕುಮಾರ್',
      help: 'ಸ್ಪಷ್ಟವಾಗಿ ಮಾತನಾಡಿ. ಉದಾಹರಣೆಗೆ: ರಾಹುಲ್ ಕುಮಾರ್ ಎಂದು ಹೇಳಿ.',
    },
  },
  {
    id: 'usn',
    field: 'usn',
    isSensitive: true,
    en: {
      title: 'University Seat Number (USN)',
      prompt: 'Please say your University Seat Number or USN.',
      placeholder: 'e.g. 1MS21CS045',
      help: 'Say each character clearly, for example: 1 M S 2 1 C S 0 4 5.',
    },
    kn: {
      title: 'ವಿಶ್ವವಿದ್ಯಾಲಯದ ನೋಂದಣಿ ಸಂಖ್ಯೆ (USN)',
      prompt: 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಯೂನಿವರ್ಸಿಟಿ ಸೀಟ್ ನಂಬರ್ ಅಥವಾ ಯು.ಎಸ್.ಎನ್ ಹೇಳಿ.',
      placeholder: 'ಉದಾ: 1MS21CS045',
      help: 'ಪ್ರತಿಯೊಂದು ಅಕ್ಷರವನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಹೇಳಿ, ಉದಾಹರಣೆಗೆ: 1 M S 2 1 C S 0 4 5.',
    },
  },
  {
    id: 'collegeReg',
    field: 'collegeRegNumber',
    isSensitive: true,
    en: {
      title: 'College Registration Number',
      prompt: 'Please say your College Admission or Registration Number.',
      placeholder: 'e.g. REG-2024-8891',
      help: 'Say your college registration number as printed on your ID card.',
    },
    kn: {
      title: 'ಕಾಲೇಜು ನೋಂದಣಿ ಸಂಖ್ಯೆ',
      prompt: 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಕಾಲೇಜು ಪ್ರವೇಶ ಅಥವಾ ನೋಂದಣಿ ಸಂಖ್ಯೆಯನ್ನು ಹೇಳಿ.',
      placeholder: 'ಉದಾ: REG-2024-8891',
      help: 'ನಿಮ್ಮ ಗುರುತಿನ ಚೀಟಿಯಲ್ಲಿರುವ ಕಾಲೇಜು ನೋಂದಣಿ ಸಂಖ್ಯೆಯನ್ನು ಹೇಳಿ.',
    },
  },
  {
    id: 'sspId',
    field: 'sspId',
    isSensitive: true,
    en: {
      title: 'State Scholarship Portal (SSP) ID',
      prompt: 'Please provide your demo State Scholarship Portal ID.',
      placeholder: 'e.g. SSP-KA-2024-5412',
      help: 'This is a fictional demonstration ID. For example: S S P 2 0 2 4 5 4 1 2.',
    },
    kn: {
      title: 'ರಾಜ್ಯ ವಿದ್ಯಾರ್ಥಿವೇತನ ಪೋರ್ಟಲ್ (SSP) ಐಡಿ',
      prompt: 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಮಾದರಿ ರಾಜ್ಯ ವಿದ್ಯಾರ್ಥಿವೇತನ ಪೋರ್ಟಲ್ ಐಡಿ ಹೇಳಿ.',
      placeholder: 'ಉದಾ: SSP-KA-2024-5412',
      help: 'ಇದು ಮಾದರಿ ಡೆಮೊ ಐಡಿ. ಉದಾಹರಣೆಗೆ: ಎಸ್ ಎಸ್ ಪಿ 2 0 2 4 5 4 1 2.',
    },
  },
  {
    id: 'aadhaarDemo',
    field: 'aadhaarDemo',
    isSensitive: true,
    maskSpoken: true,
    en: {
      title: 'Aadhaar Verification (Fictional Demo Field)',
      prompt: 'Please provide a 12-digit fictional demo Aadhaar number. Do not speak a real Aadhaar number.',
      placeholder: 'e.g. 1234 5678 9012 (Demo Only)',
      help: 'Say twelve sample digits for testing. Only the last four digits will be announced for safety.',
    },
    kn: {
      title: 'ಆಧಾರ್ ಪರಿಶೀಲನೆ (ಮಾದರಿ ಡೆಮೊ ಕ್ಷೇತ್ರ)',
      prompt: 'ದಯವಿಟ್ಟು ಹನ್ನೆರಡು ಅಂಕಿಗಳ ಮಾದರಿ ಡೆಮೊ ಸಂಖ್ಯೆಯನ್ನು ನೀಡಿ. ನೈಜ ಆಧಾರ್ ಸಂಖ್ಯೆಯನ್ನು ಎಂದಿಗೂ ಹೇಳಬೇಡಿ.',
      placeholder: 'ಉದಾ: 1234 5678 9012 (ಡೆಮೊ ಮಾತ್ರ)',
      help: 'ಪರೀಕ್ಷೆಗಾಗಿ 12 ಮಾದರಿ ಅಂಕಿಗಳನ್ನು ಹೇಳಿ. ಸುರಕ್ಷತೆಗಾಗಿ ಕೊನೆಯ 4 ಅಂಕಿಗಳನ್ನು ಮಾತ್ರ ಧ್ವನಿಯಲ್ಲಿ ಓದಲಾಗುತ್ತದೆ.',
    },
  },
  {
    id: 'category',
    field: 'category',
    isSensitive: false,
    options: ['General', 'Category-1', '2A', '2B', '3A', '3B', 'SC', 'ST'],
    en: {
      title: 'Caste / Reservation Category',
      prompt: 'Please select or speak your reservation category. Options are: General, Category 1, 2A, 2B, 3A, 3B, SC, or ST.',
      placeholder: 'Select or say: General / SC / ST / 2A...',
      help: 'You can say: SC, ST, Category 1, 2A, 2B, 3A, 3B, or General.',
    },
    kn: {
      title: 'ಜಾತಿ / ಮೀಸಲಾತಿ ವರ್ಗ',
      prompt: 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಮೀಸಲಾತಿ ವರ್ಗವನ್ನು ಹೇಳಿ. ಆಯ್ಕೆಗಳು: ಸಾಮಾನ್ಯ, ವರ್ಗ 1, 2A, 2B, 3A, 3B, ಪರಿಶಿಷ್ಟ ಜಾತಿ (SC), ಅಥವಾ ಪರಿಶಿಷ್ಟ ಪಂಗಡ (ST).',
      placeholder: 'ಆಯ್ಕೆ ಮಾಡಿ ಅಥವಾ ಹೇಳಿ: ಸಾಮಾನ್ಯ / SC / ST / 2A...',
      help: 'ನೀವು ಹೇಳಬಹುದು: ಸಾಮಾನ್ಯ, ಎಸ್.ಸಿ, ಎಸ್.ಟಿ, ವರ್ಗ ಒಂದು, 2A, 2B.',
    },
  },
  {
    id: 'income',
    field: 'annualIncome',
    isSensitive: false,
    en: {
      title: 'Annual Family Income',
      prompt: 'Please state your approximate annual family income in Rupees.',
      placeholder: 'e.g. 120000',
      help: 'Speak the amount in rupees, for example: One lakh twenty thousand, or one lakh fifty thousand.',
    },
    kn: {
      title: 'ವಾರ್ಷಿಕ ಕುಟುಂಬ ಆದಾಯ',
      prompt: 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಅಂದಾಜು ವಾರ್ಷಿಕ ಕುಟುಂಬ ಆದಾಯವನ್ನು ರೂಪಾಯಿಗಳಲ್ಲಿ ತಿಳಿಸಿ.',
      placeholder: 'ಉದಾ: 120000',
      help: 'ಆದಾಯವನ್ನು ರೂಪಾಯಿಗಳಲ್ಲಿ ಹೇಳಿ, ಉದಾಹರಣೆಗೆ: ಒಂದು ಲಕ್ಷ ಇಪ್ಪತ್ತು ಸಾವಿರ.',
    },
  },
];

export const VOICE_COMMANDS = {
  en: {
    next: ['next', 'continue', 'forward', 'proceed', 'go next', 'next field'],
    back: ['back', 'previous', 'go back', 'last step', 'return'],
    repeat: ['repeat', 'say again', 'pardon', 'what', 'read again', 'once more'],
    help: ['help', 'commands', 'instructions', 'what can i say', 'options'],
    readDetails: ['read details', 'read field', 'current field', 'what is this', 'explain'],
    review: ['review', 'summary', 'check application', 'review application', 'review form'],
    cancel: ['cancel', 'stop', 'reset', 'clear', 'start over'],
    yes: ['yes', 'correct', 'confirm', 'right', 'yeah', 'yep', 'okay', 'proceed'],
    no: ['no', 'wrong', 'incorrect', 'change', 'nope', 're-enter', 'cancel that'],
    submit: ['submit', 'submit application', 'send application', 'apply now', 'finish'],
  },
  kn: {
    next: ['ಮುಂದೆ', 'ಮುಂದಿನದು', 'ಮುಂದಕ್ಕೆ', 'ಮುಂದುವರಿಸಿ', 'ಮುಂದೆ ಹೋಗಿ'],
    back: ['ಹಿಂದೆ', 'ಹಿಂದಿನದು', 'ಹಿಂದಕ್ಕೆ ಹೋಗಿ', 'ಹಿಂದಿನ ಹೆಜ್ಜೆ'],
    repeat: ['ಮತ್ತೊಮ್ಮೆ', 'ಪುನರಾವರ್ತಿಸಿ', 'ಇನ್ನೊಮ್ಮೆ ಹೇಳಿ', 'ಮತ್ತೆ ಹೇಳಿ'],
    help: ['ಸಹಾಯ', 'ಸೂಚನೆಗಳು', 'ಕಮಾಂಡ್‌ಗಳು', 'ಏನು ಹೇಳಬೇಕು'],
    readDetails: ['ವಿವರಗಳನ್ನು ಓದಿ', 'ವಿವರ ಹೇಳಿ', 'ಈ ಕ್ಷೇತ್ರ ಏನು'],
    review: ['ಅರ್ಜಿ ಪರಿಶೀಲಿಸಿ', 'ಸಾರಾಂಶ', 'ಪರಿಶೀಲನೆ', 'ಸಮೀಕ್ಷೆ'],
    cancel: ['ರದ್ದು', 'ರದ್ದುಮಾಡಿ', 'ನಿಲ್ಲಿಸಿ', 'ಆರಂಭದಿಂದ ಪ್ರಾರಂಭಿಸಿ'],
    yes: ['ಹೌದು', 'ಸರಿ', 'ಖಚಿತಪಡಿಸಿ', 'ಸರಿಯಾಗಿದೆ', 'ಖಚಿತ'],
    no: ['ಇಲ್ಲ', 'ತಪ್ಪು', 'ಬೇಡ', 'ತಿದ್ದುಪಡಿ', 'ಬದಲಾಯಿಸಿ'],
    submit: ['ಸಲ್ಲಿಸಿ', 'ಅರ್ಜಿ ಸಲ್ಲಿಸಿ', 'ಖಚಿತಪಡಿಸಿ ಸಲ್ಲಿಸಿ', 'ಮುಗಿಸಿ'],
  },
};

export const UI_STRINGS = {
  en: {
    moduleTitle: 'AccessVoice AI — Voice-Guided Scholarship Assistant',
    subtitle: 'Simulated hands-free scholarship assistant designed for blind and visually impaired students.',
    disclaimer: 'Demonstration environment only. Never enter real passwords, banking details, or genuine government credentials. This module simulates scholarship application workflows using fictional data.',
    listening: 'Listening to your voice...',
    speaking: 'Speaking instructions...',
    processing: 'Processing recognized speech...',
    idle: 'Microphone is ready. Press Space or click the microphone to speak.',
    micDisabled: 'Speech recognition is not supported in this browser. You can still use accessible keyboard inputs.',
    startListening: 'Start Voice Input',
    stopListening: 'Stop Listening',
    stepOf: 'Step {current} of {total}',
    confirmPrompt: 'Recognized {label}: "{maskedValue}". Is this correct? Say "yes" to confirm or "no" to retry.',
    confirmed: 'Confirmed and saved.',
    retryPrompt: 'Let us try again. Please speak the value clearly.',
    formSummaryTitle: 'Scholarship Application Summary',
    summaryIntro: 'Here is the summary of your completed application. Please review all fields.',
    confirmSubmissionPrompt: 'All fields have been completed. Do you confirm mock submission of this scholarship application? Say "submit" or "confirm".',
    submissionSuccessTitle: 'Mock Scholarship Application Submitted Successfully!',
    receiptNotice: 'Application receipt saved locally in demonstration storage. Your fictional application reference number is: ',
    startNew: 'Start New Demo Application',
    commandsAvailable: 'Available voice commands: "next", "go back", "repeat", "help", "review application", "cancel".',
    sensitiveNotice: 'Sensitive identifiers are masked on screen and never read aloud in full.',
  },
  kn: {
    moduleTitle: 'ಆಕ್ಸೆಸ್ ವಾಯ್ಸ್ ಎಐ — ಧ್ವನಿ ಮಾರ್ಗದರ್ಶಿ ವಿದ್ಯಾರ್ಥಿವೇತನ ಸಹಾಯಕ',
    subtitle: 'ದೃಷ್ಟಿದೋಷವುಳ್ಳ ವಿದ್ಯಾರ್ಥಿಗಳಿಗಾಗಿ ವಿನ್ಯಾಸಗೊಳಿಸಲಾದ ಸ್ವಯಂಚಾಲಿತ ಧ್ವನಿ ಮಾರ್ಗದರ್ಶಿ ವಿದ್ಯಾರ್ಥಿವೇತನ ಅರ್ಜಿ.',
    disclaimer: 'ಇದು ಡೆಮೊ ಪ್ರದರ್ಶನ ವ್ಯವಸ್ಥೆ ಮಾತ್ರ. ನೈಜ ಪಾಸ್‌ವರ್ಡ್‌ಗಳು, ಬ್ಯಾಂಕಿಂಗ್ ವಿವರಗಳು ಅಥವಾ ಅಧಿಕೃತ ಸರ್ಕಾರಿ ದಾಖಲೆಗಳನ್ನು ಎಂದಿಗೂ ನಮೂದಿಸಬೇಡಿ. ಈ ಮಾಡ್ಯೂಲ್ ಮಾದರಿ ಡೇಟಾವನ್ನು ಬಳಸುತ್ತದೆ.',
    listening: 'ನಿಮ್ಮ ಧ್ವನಿಯನ್ನು ಆಲಿಸಲಾಗುತ್ತಿದೆ...',
    speaking: 'ಸೂಚನೆಗಳನ್ನು ಓದಲಾಗುತ್ತಿದೆ...',
    processing: 'ಧ್ವನಿ ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲಾಗುತ್ತಿದೆ...',
    idle: 'ಮೈಕ್ರೊಫೋನ್ ಸಿದ್ಧವಾಗಿದೆ. ಮಾತನಾಡಲು ಸ್ಪೇಸ್ ಕೀ ಒತ್ತಿರಿ ಅಥವಾ ಮೈಕ್ರೊಫೋನ್ ಕ್ಲಿಕ್ ಮಾಡಿ.',
    micDisabled: 'ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಧ್ವನಿ ಗುರುತಿಸುವಿಕೆ ಲಭ್ಯವಿಲ್ಲ. ನೀವು ಕೀಬೋರ್ಡ್ ಮೂಲಕವೂ ನಮೂದಿಸಬಹುದು.',
    startListening: 'ಧ್ವನಿ ಇನ್‌ಪುಟ್ ಪ್ರಾರಂಭಿಸಿ',
    stopListening: 'ಆಲಿಸುವುದನ್ನು ನಿಲ್ಲಿಸಿ',
    stepOf: 'ಹೆಜ್ಜೆ {current} / {total}',
    confirmPrompt: 'ಗುರುತಿಸಲಾದ {label}: "{maskedValue}". ಇದು ಸರಿಯೇ? ಖಚಿತಪಡಿಸಲು "ಹೌದು" ಅಥವಾ ಪುನಃ ಪ್ರಯತ್ನಿಸಲು "ಇಲ್ಲ" ಎಂದು ಹೇಳಿ.',
    confirmed: 'ಖಚಿತಪಡಿಸಲಾಗಿದೆ ಮತ್ತು ಉಳಿಸಲಾಗಿದೆ.',
    retryPrompt: 'ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸೋಣ. ದಯವಿಟ್ಟು ಸ್ಪಷ್ಟವಾಗಿ ಮಾತನಾಡಿ.',
    formSummaryTitle: 'ವಿದ್ಯಾರ್ಥಿವೇತನ ಅರ್ಜಿಯ ಸಾರಾಂಶ',
    summaryIntro: 'ನಿಮ್ಮ ಪೂರ್ಣಗೊಂಡ ಅರ್ಜಿಯ ಸಾರಾಂಶ ಇಲ್ಲಿದೆ. ದಯವಿಟ್ಟು ಎಲ್ಲಾ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.',
    confirmSubmissionPrompt: 'ಎಲ್ಲಾ ವಿವರಗಳು ಪೂರ್ಣಗೊಂಡಿವೆ. ಈ ಅರ್ಜಿಯನ್ನು ಸಲ್ಲಿಸಲು ನೀವು ಖಚಿತಪಡಿಸುತ್ತೀರಾ? "ಸಲ್ಲಿಸಿ" ಅಥವಾ "ಹೌದು" ಎಂದು ಹೇಳಿ.',
    submissionSuccessTitle: 'ಮಾದರಿ ವಿದ್ಯಾರ್ಥಿವೇತನ ಅರ್ಜಿಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ!',
    receiptNotice: 'ಅರ್ಜಿಯ ರಸೀದಿಯನ್ನು ಡೆಮೊ ಸಂಗ್ರಹದಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ. ನಿಮ್ಮ ಮಾದರಿ ಅರ್ಜಿ ಉಲ್ಲೇಖ ಸಂಖ್ಯೆ: ',
    startNew: 'ಹೊಸ ಡೆಮೊ ಅರ್ಜಿ ಪ್ರಾರಂಭಿಸಿ',
    commandsAvailable: 'ಲಭ್ಯವಿರುವ ಧ್ವನಿ ಆಜ್ಞೆಗಳು: "ಮುಂದೆ", "ಹಿಂದೆ", "ಮತ್ತೊಮ್ಮೆ", "ಸಹಾಯ", "ಅರ್ಜಿ ಪರಿಶೀಲಿಸಿ", "ರದ್ದು".',
    sensitiveNotice: 'ಸುರಕ್ಷತೆಗಾಗಿ ಸೂಕ್ಷ್ಮ ಗುರುತಿನ ವಿವರಗಳನ್ನು ಪರದೆಯ ಮೇಲೆ ಮರೆಮಾಡಲಾಗಿದೆ ಮತ್ತು ಧ್ವನಿಯಲ್ಲಿ ಪೂರ್ಣವಾಗಿ ಓದಲಾಗುವುದಿಲ್ಲ.',
  },
};

/**
 * Masks sensitive identifiers for screen display and screen readers.
 * Example: "1MS21CS045" -> "••••••S045", Aadhaar "123456789012" -> "•••• •••• 9012"
 */
export function maskIdentifier(value, isSensitive = false) {
  if (!value) return '';
  const str = String(value).trim();
  if (!isSensitive || str.length <= 4) return str;

  const visibleLength = 4;
  const maskedLength = Math.max(0, str.length - visibleLength);
  const visiblePart = str.slice(-visibleLength);

  // Grouped masking for 12-digit Aadhaar demo
  if (str.replace(/\D/g, '').length === 12) {
    return `•••• •••• ${str.slice(-4)}`;
  }

  return '•'.repeat(Math.min(maskedLength, 8)) + visiblePart;
}

/**
 * Creates an audio-safe spoken representation of an identifier that protects privacy.
 * Never speaks full number; only confirms last 4 digits.
 */
export function getSpokenMasked(value, isSensitive, lang = 'en') {
  if (!value) return '';
  const str = String(value).trim();
  if (!isSensitive || str.length <= 4) return str;

  const last4 = str.slice(-4).split('').join(' ');
  if (lang === 'kn') {
    return `ಕೊನೆಯ ನಾಲ್ಕು ಅಂಕಿಗಳು ${last4}`;
  }
  return `ending in ${last4}`;
}
