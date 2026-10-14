import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { VoiceAssistantPage } from '../pages/VoiceAssistantPage.jsx';
import { maskIdentifier, getSpokenMasked } from '../data/scholarshipVoiceContent.js';

describe('AccessVoice AI — Voice-Guided Scholarship Assistant', () => {
  beforeEach(() => {
    // Mock SpeechSynthesisUtterance as class constructor
    class MockSpeechSynthesisUtterance {
      constructor(text) {
        this.text = text;
        this.lang = 'en-IN';
        this.rate = 1;
        this.onend = null;
        this.onerror = null;
      }
    }
    global.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;
    window.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;

    // Mock window.speechSynthesis
    window.speechSynthesis = {
      speak: vi.fn(),
      cancel: vi.fn(),
      getVoices: vi.fn().mockReturnValue([]),
    };

    // Mock Audio as class constructor
    class MockAudio {
      constructor(url) {
        this.src = url;
        this.currentTime = 0;
        this.onended = null;
        this.onerror = null;
      }
      play() {
        return Promise.resolve();
      }
      pause() {}
    }
    global.Audio = MockAudio;
    window.Audio = MockAudio;

    // Mock HTMLCanvasElement.prototype.getContext for SiriVoiceOrb
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      stroke: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      scale: vi.fn(),
    });
  });

  describe('Identifier Masking & Privacy Utilities', () => {
    it('masks sensitive identifiers to last 4 characters', () => {
      expect(maskIdentifier('1MS21CS045', true)).toBe('••••••S045');
      expect(maskIdentifier('SSP-KA-2024-88421', true)).toBe('••••••••8421');
    });

    it('masks 12-digit Aadhaar demo numbers in grouped format', () => {
      expect(maskIdentifier('123456789012', true)).toBe('•••• •••• 9012');
    });

    it('does not mask non-sensitive fields', () => {
      expect(maskIdentifier('Rahul Kumar', false)).toBe('Rahul Kumar');
    });

    it('produces privacy-safe spoken representations (never reading full sensitive IDs)', () => {
      const enSpoken = getSpokenMasked('1MS21CS045', true, 'en');
      expect(enSpoken).toBe('ending in S 0 4 5');

      const knSpoken = getSpokenMasked('1MS21CS045', true, 'kn');
      expect(knSpoken).toContain('ಕೊನೆಯ ನಾಲ್ಕು ಅಂಕಿಗಳು');
    });
  });

  describe('VoiceAssistantPage Component', () => {
    it('renders AccessVoice module title, disclaimer, and initial field in English', () => {
      render(<VoiceAssistantPage />);

      expect(screen.getAllByText(/AccessVoice AI/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/Student Full Name/i)[0]).toBeInTheDocument();
      expect(screen.getByText(/Demonstration environment only/i)).toBeInTheDocument();
    });

    it('supports switching language to Kannada and back', () => {
      render(<VoiceAssistantPage />);

      const knButton = screen.getByRole('button', { name: /ಕನ್ನಡ/i });
      fireEvent.click(knButton);

      expect(screen.getByText(/ಆಕ್ಸೆಸ್ ವಾಯ್ಸ್ ಎಐ/i)).toBeInTheDocument();
      expect(screen.getAllByText(/ವಿದ್ಯಾರ್ಥಿಯ ಪೂರ್ಣ ಹೆಸರು/i)[0]).toBeInTheDocument();

      const enButton = screen.getByRole('button', { name: /English/i });
      fireEvent.click(enButton);

      expect(screen.getAllByText(/Student Full Name/i)[0]).toBeInTheDocument();
    });

    it('renders microphone control with accessible aria-label and status', () => {
      render(<VoiceAssistantPage />);

      const micBtn = screen.getByRole('button', { name: /Start Voice Input/i });
      expect(micBtn).toBeInTheDocument();
      expect(micBtn).toHaveAttribute('aria-pressed', 'false');
    });

    it('allows step-by-step navigation through scholarship fields', () => {
      render(<VoiceAssistantPage />);

      // Step 1: Student Name
      const nameInput = screen.getByLabelText(/Student Full Name/i);
      fireEvent.change(nameInput, { target: { value: 'Deepak Sharma' } });
      expect(nameInput.value).toBe('Deepak Sharma');

      // Click Next
      const nextBtn = screen.getByRole('button', { name: /Next/i });
      fireEvent.click(nextBtn);

      // Step 2: USN
      expect(screen.getAllByText(/University Seat Number/i)[0]).toBeInTheDocument();
      const usnInput = screen.getByLabelText(/University Seat Number/i);
      fireEvent.change(usnInput, { target: { value: '1MS22CS088' } });

      // Click Back
      const backBtn = screen.getByRole('button', { name: /Back/i });
      fireEvent.click(backBtn);

      // Back to Step 1
      expect(screen.getAllByText(/Student Full Name/i)[0]).toBeInTheDocument();
      expect(screen.getByLabelText(/Student Full Name/i).value).toBe('Deepak Sharma');
    });

    it('reaches review summary and completes mock submission', async () => {
      render(<VoiceAssistantPage />);

      // Fill in Step 1
      fireEvent.change(screen.getByLabelText(/Student Full Name/i), { target: { value: 'Ananya Rao' } });

      // Navigate to review by clicking next through steps
      for (let i = 0; i < 7; i++) {
        const nextBtn = screen.getByRole('button', { name: /Next|Review/i });
        fireEvent.click(nextBtn);
      }

      // Review Step
      expect(screen.getAllByText(/Scholarship Application Summary/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/Ananya Rao/i)[0]).toBeInTheDocument();

      // Submit
      const submitBtn = screen.getByRole('button', { name: /Confirm & Submit Application/i });
      fireEvent.click(submitBtn);

      // Verified submission receipt
      await waitFor(() => {
        expect(screen.getAllByText(/Mock Scholarship Application Submitted Successfully/i)[0]).toBeInTheDocument();
        expect(screen.getAllByText(/SSP-MOCK-2026-/i)[0]).toBeInTheDocument();
      });
    });

    it('renders Siri animated voice orb and live speech transcript monitor', () => {
      render(<VoiceAssistantPage />);

      // Siri Voice Orb button and canvas
      const micBtn = screen.getByRole('button', { name: /Start Voice Input/i });
      expect(micBtn).toBeInTheDocument();
      expect(within(micBtn).getByText(/Speaking|Tap To Talk/i)).toBeInTheDocument();

      // Live transcript monitor
      expect(screen.getByText(/Live Speech Transcript/i)).toBeInTheDocument();
      expect(screen.getByText(/Question 1 of 7/i)).toBeInTheDocument();
    });

    it('handles keyboard navigation shortcuts (N for next, B for back, R for repeat prompt)', () => {
      render(<VoiceAssistantPage />);

      expect(screen.getAllByText(/Student Full Name/i)[0]).toBeInTheDocument();

      // Press 'n' to go to next step
      fireEvent.keyDown(window, { key: 'n', code: 'KeyN' });
      expect(screen.getAllByText(/University Seat Number/i)[0]).toBeInTheDocument();

      // Press 'b' to go back
      fireEvent.keyDown(window, { key: 'b', code: 'KeyB' });
      expect(screen.getAllByText(/Student Full Name/i)[0]).toBeInTheDocument();

      // Press 'r' to trigger repeat prompt
      fireEvent.keyDown(window, { key: 'r', code: 'KeyR' });
      expect(window.speechSynthesis.speak).toHaveBeenCalled();
    });
  });
});
