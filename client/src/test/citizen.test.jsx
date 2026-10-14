import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CitizenProvider, OFFLINE_KANNADA_AUDIO } from '../context/CitizenContext.jsx';
import { CitizenPage } from '../pages/CitizenPage.jsx';

let mockAudioInstances = [];

// Setup SpeechSynthesis and Audio mocks for jsdom
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mockAudioInstances = [];

  window.Audio = class {
    constructor(src) {
      this.src = src;
      this.play = vi.fn().mockResolvedValue(undefined);
      this.pause = vi.fn();
      this.currentTime = 0;
      this.onended = null;
      this.onerror = null;
      mockAudioInstances.push(this);
    }
  };

  window.speechSynthesis = {
    speak: vi.fn(),
    cancel: vi.fn(),
    speaking: false,
    getVoices: vi.fn().mockReturnValue([
      { lang: 'en-IN', name: 'Indian English' },
      { lang: 'kn-IN', name: 'Kannada' },
    ]),
  };

  window.SpeechSynthesisUtterance = class {
    constructor(text) {
      this.text = text;
      this.lang = '';
      this.voice = undefined;
      this.rate = 1;
      this.pitch = 1;
    }
  };
});

describe('Citizen Mode (Bilingual Accessibility & Civic Guidance)', () => {
  it('renders Citizen Mode with Kannada by default and allows switching to English', () => {
    render(
      <CitizenProvider>
        <BrowserRouter>
          <CitizenPage />
        </BrowserRouter>
      </CitizenProvider>
    );

    // Initial Kannada heading
    expect(screen.getByText(/ನಾಗರಿಕ ಡಿಜಿಟಲ್ ಸೇವಾ ಮಾರ್ಗದರ್ಶಿ/i)).toBeInTheDocument();

    // Language buttons
    const enButton = screen.getByRole('button', { name: /^english$/i });
    const knButton = screen.getByRole('button', { name: /^ಕನ್ನಡ$/i });

    expect(enButton).toBeInTheDocument();
    expect(knButton).toBeInTheDocument();

    // Switch to English
    fireEvent.click(enButton);
    expect(screen.getByRole('heading', { name: /Citizen Digital Service Guide/i })).toBeInTheDocument();

    // Switch back to Kannada
    fireEvent.click(knButton);
    expect(screen.getByRole('heading', { name: /ನಾಗರಿಕ ಡಿಜಿಟಲ್ ಸೇವಾ ಮಾರ್ಗದರ್ಶಿ/i })).toBeInTheDocument();
  });

  it('toggles font sizes (normal, large, xlarge)', () => {
    const { container } = render(
      <CitizenProvider>
        <BrowserRouter>
          <CitizenPage />
        </BrowserRouter>
      </CitizenProvider>
    );

    const largeBtn = screen.getByRole('button', { name: /^large text size$/i });
    const xlargeBtn = screen.getByRole('button', { name: /^extra large text size$/i });
    const normalBtn = screen.getByRole('button', { name: /^normal text size$/i });

    fireEvent.click(largeBtn);
    expect(container.firstChild.className).toContain('citizen-font-large');

    fireEvent.click(xlargeBtn);
    expect(container.firstChild.className).toContain('citizen-font-xlarge');

    fireEvent.click(normalBtn);
    expect(container.firstChild.className).toContain('citizen-font-normal');
  });

  it('toggles high contrast mode', () => {
    const { container } = render(
      <CitizenProvider>
        <BrowserRouter>
          <CitizenPage />
        </BrowserRouter>
      </CitizenProvider>
    );

    const contrastBtn = screen.getByRole('button', { name: /toggle high contrast/i });
    expect(contrastBtn).toBeInTheDocument();

    // Initially high contrast is off
    expect(container.firstChild.className).not.toContain('citizen-high-contrast');

    // Click to enable high contrast
    fireEvent.click(contrastBtn);
    expect(container.firstChild.className).toContain('citizen-high-contrast');

    // Click to disable high contrast
    fireEvent.click(contrastBtn);
    expect(container.firstChild.className).not.toContain('citizen-high-contrast');
  });

  it('speaks Kannada using native voice when kn-IN voice is installed', () => {
    render(
      <CitizenProvider>
        <BrowserRouter>
          <CitizenPage />
        </BrowserRouter>
      </CitizenProvider>
    );

    const readAloudBtn = screen.getByRole('button', { name: /ಗಟ್ಟಿಯಾಗಿ ಓದಿ/i });
    expect(readAloudBtn).toBeInTheDocument();

    fireEvent.click(readAloudBtn);
    expect(window.speechSynthesis.speak).toHaveBeenCalled();

    const lastCall = window.speechSynthesis.speak.mock.calls.at(-1);
    const utterance = lastCall[0];
    expect(utterance.lang).toBe('kn-IN');
    expect(utterance.voice.name).toBe('Kannada');
  });

  it('strictly suppresses English speech synthesis for Kannada when no Kannada voice is installed, and uses offline audio', () => {
    // Only English voices available (like Windows default)
    window.speechSynthesis.getVoices = vi.fn().mockReturnValue([
      { lang: 'en-US', name: 'Microsoft David' },
      { lang: 'en-IN', name: 'Microsoft Ravi' },
    ]);

    render(
      <CitizenProvider>
        <BrowserRouter>
          <CitizenPage />
        </BrowserRouter>
      </CitizenProvider>
    );

    const readAloudBtn = screen.getByRole('button', { name: /ಗಟ್ಟಿಯಾಗಿ ಓದಿ/i });
    fireEvent.click(readAloudBtn);

    // CRITICAL: Must NEVER call speechSynthesis.speak with English voice for Kannada!
    expect(window.speechSynthesis.speak).not.toHaveBeenCalled();

    // Instead, must play authentic pre-recorded Kannada MP3
    expect(mockAudioInstances.length).toBeGreaterThan(0);
    const playedAudio = mockAudioInstances.at(-1);
    expect(playedAudio.src).toBe(OFFLINE_KANNADA_AUDIO.page_overview);
    expect(playedAudio.play).toHaveBeenCalled();
  });

  it('speaks English using en-IN when English is selected', () => {
    render(
      <CitizenProvider>
        <BrowserRouter>
          <CitizenPage />
        </BrowserRouter>
      </CitizenProvider>
    );

    // Switch to English
    const enBtn = screen.getByRole('button', { name: /^english$/i });
    fireEvent.click(enBtn);

    const readAloudBtn = screen.getByRole('button', { name: /^read aloud$/i });
    fireEvent.click(readAloudBtn);

    expect(window.speechSynthesis.speak).toHaveBeenCalled();
    const lastCall = window.speechSynthesis.speak.mock.calls.at(-1);
    const utterance = lastCall[0];
    expect(utterance.lang).toBe('en-IN');
  });

  it('cancels active speech and audio immediately when switching languages', () => {
    // Test with no Kannada voice to verify audio cancellation
    window.speechSynthesis.getVoices = vi.fn().mockReturnValue([
      { lang: 'en-US', name: 'Microsoft David' },
    ]);

    render(
      <CitizenProvider>
        <BrowserRouter>
          <CitizenPage />
        </BrowserRouter>
      </CitizenProvider>
    );

    // Start speaking in Kannada (offline audio)
    const readAloudBtn = screen.getByRole('button', { name: /ಗಟ್ಟಿಯಾಗಿ ಓದಿ/i });
    fireEvent.click(readAloudBtn);
    expect(mockAudioInstances.length).toBeGreaterThan(0);
    const audio = mockAudioInstances.at(-1);

    // Switch to English while audio is playing
    const enBtn = screen.getByRole('button', { name: /^english$/i });
    fireEvent.click(enBtn);

    // Audio must be paused and speech cancelled
    expect(audio.pause).toHaveBeenCalled();
    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
  });

  it('plays individual service guide using offline audio when Kannada is selected without native voice', () => {
    window.speechSynthesis.getVoices = vi.fn().mockReturnValue([
      { lang: 'en-US', name: 'Microsoft David' },
    ]);

    render(
      <CitizenProvider>
        <BrowserRouter>
          <CitizenPage />
        </BrowserRouter>
      </CitizenProvider>
    );

    const listenGuideBtns = screen.getAllByRole('button', { name: /ಈ ಮಾರ್ಗದರ್ಶಿಯನ್ನು ಆಲಿಸಿ/i });
    fireEvent.click(listenGuideBtns[0]);

    // SpeechSynthesis NOT called
    expect(window.speechSynthesis.speak).not.toHaveBeenCalled();

    // Offline audio played for first service (ration-card)
    expect(mockAudioInstances.length).toBeGreaterThan(0);
    const playedAudio = mockAudioInstances.at(-1);
    expect(playedAudio.src).toBe(OFFLINE_KANNADA_AUDIO['svc_ration-card']);
    expect(playedAudio.play).toHaveBeenCalled();
  });

  it('renders civic service guides and functional document checklist', () => {
    render(
      <CitizenProvider>
        <BrowserRouter>
          <CitizenPage />
        </BrowserRouter>
      </CitizenProvider>
    );

    // Verify presence of Ration, Bhoomi, and Pension guides
    expect(screen.getAllByText(/ಪಡಿತರ ಚೀಟಿ/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/ಭೂಮಿ: ಪಹಣಿ/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/ಸಂಧ್ಯಾ ಸುರಕ್ಷಾ/i).length).toBeGreaterThan(0);

    // Check document checklist items for expanded service
    const docCheckboxes = screen.getAllByRole('button', { name: /ಆಧಾರ್ ಕಾರ್ಡ್|ಪ್ರಮಾಣಪತ್ರ/i });
    expect(docCheckboxes.length).toBeGreaterThan(0);

    // Click first document checkbox to mark as gathered
    const firstDoc = docCheckboxes[0];
    expect(firstDoc.className).not.toContain('line-through');
    fireEvent.click(firstDoc);
    expect(firstDoc.className).toContain('line-through');
  });

  it('displays honest disclaimer notice about not submitting applications or collecting data', () => {
    render(
      <CitizenProvider>
        <BrowserRouter>
          <CitizenPage />
        </BrowserRouter>
      </CitizenProvider>
    );

    expect(screen.getByText(/ಪ್ರಾಮಾಣಿಕ ನಾಗರಿಕ ಮಾರ್ಗದರ್ಶನ ಪ್ರಕಟಣೆ|Honest Digital Guidance Notice/i)).toBeInTheDocument();
    expect(screen.getByText(/ನಾವು ಯಾವುದೇ ಸರ್ಕಾರಿ ಅರ್ಜಿಯನ್ನು ನೇರವಾಗಿ ಸಲ್ಲಿಸುವುದಿಲ್ಲ/i)).toBeInTheDocument();
  });
});
