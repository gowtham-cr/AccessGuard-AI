import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { CitizenProvider } from '../context/CitizenContext.jsx';
import { SafetyShieldPage } from '../pages/SafetyShieldPage.jsx';
import { DashboardPage } from '../pages/DashboardPage.jsx';
import { Sidebar } from '../components/Sidebar.jsx';
import { api } from '../services/api.js';

// Setup SpeechSynthesis and Audio mocks for jsdom
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem('accessguard_citizen_lang', 'en');

  window.Audio = class {
    constructor(src) {
      this.src = src;
      this.play = vi.fn().mockResolvedValue(undefined);
      this.pause = vi.fn();
      this.currentTime = 0;
      this.onended = null;
      this.onerror = null;
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

describe('Senior Safety Shield — Frontend & Dashboard Integration', () => {
  describe('SafetyShieldPage Component', () => {
    it('renders page header, badge, and default "Check a Message" tab', () => {
      render(
        <CitizenProvider>
          <MemoryRouter initialEntries={['/safety-shield']}>
            <SafetyShieldPage />
          </MemoryRouter>
        </CitizenProvider>
      );

      expect(screen.getByRole('heading', { level: 1, name: /Senior Safety Shield/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Check a Message/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Check a Website/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Explain a Warning/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Analyze Message/i })).toBeInTheDocument();
    });

    it('Check a Message: validates empty input with clear error message', async () => {
      render(
        <CitizenProvider>
          <MemoryRouter initialEntries={['/safety-shield?tab=message']}>
            <SafetyShieldPage />
          </MemoryRouter>
        </CitizenProvider>
      );

      const analyzeButton = screen.getByRole('button', { name: /Analyze Message/i });
      fireEvent.click(analyzeButton);

      expect(await screen.findByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Please enter or paste a message to analyze/i)).toBeInTheDocument();
    });

    it('Check a Message: calls API and displays actual risk level, evidence, and next steps', async () => {
      const mockResult = {
        riskLevel: 'High Risk',
        warningSigns: [
          {
            id: 'utility_threat',
            category: 'Urgency & Pressure',
            title: 'Utility Disconnection Threat',
            evidence: 'power will be disconnected tonight',
            description: 'Scammers frequently create artificial emergencies.',
          },
          {
            id: 'otp_request',
            category: 'Sensitive Credentials',
            title: 'OTP Solicitation',
            evidence: 'share the OTP',
            description: 'Banks never ask for your OTP.',
          },
        ],
        explanation: 'This message exhibits strong warning signs of a scam.',
        safeNextSteps: [
          'DO NOT click any link in this message.',
          'Never share your OTP with anyone.',
        ],
        disclaimer: 'This automated check highlights identifiable scam patterns.',
      };

      vi.spyOn(api, 'checkShieldMessage').mockResolvedValue(mockResult);

      render(
        <CitizenProvider>
          <MemoryRouter initialEntries={['/safety-shield?tab=message']}>
            <SafetyShieldPage />
          </MemoryRouter>
        </CitizenProvider>
      );

      const textarea = screen.getByPlaceholderText(/Paste the message here/i);
      fireEvent.change(textarea, {
        target: {
          value: 'URGENT: Power will be disconnected tonight. Share the OTP to verify.',
        },
      });

      const analyzeButton = screen.getByRole('button', { name: /Analyze Message/i });
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        expect(api.checkShieldMessage).toHaveBeenCalledWith(
          'URGENT: Power will be disconnected tonight. Share the OTP to verify.'
        );
      });

      expect(await screen.findByText('High Risk')).toBeInTheDocument();
      expect(screen.getByText('Utility Disconnection Threat')).toBeInTheDocument();
      expect(screen.getByText('"power will be disconnected tonight"')).toBeInTheDocument();
      expect(screen.getByText('OTP Solicitation')).toBeInTheDocument();
      expect(screen.getByText('This message exhibits strong warning signs of a scam.')).toBeInTheDocument();
      expect(screen.getByText('DO NOT click any link in this message.')).toBeInTheDocument();

      // Clear button resets the form
      const clearBtn = screen.getByRole('button', { name: /Clear/i });
      fireEvent.click(clearBtn);
      expect(screen.queryByText('Utility Disconnection Threat')).not.toBeInTheDocument();
    });

    it('Check a Message: handles API failure with clear error alert', async () => {
      vi.spyOn(api, 'checkShieldMessage').mockRejectedValue(new Error('Network server timeout'));

      render(
        <CitizenProvider>
          <MemoryRouter initialEntries={['/safety-shield?tab=message']}>
            <SafetyShieldPage />
          </MemoryRouter>
        </CitizenProvider>
      );

      const textarea = screen.getByPlaceholderText(/Paste the message here/i);
      fireEvent.change(textarea, { target: { value: 'Suspicious test message' } });

      const analyzeButton = screen.getByRole('button', { name: /Analyze Message/i });
      fireEvent.click(analyzeButton);

      expect(await screen.findByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Network server timeout/i)).toBeInTheDocument();
    });

    it('Check a Message: handles Network error (Failed to fetch) and recovers upon successful retry', async () => {
      const mockNetworkError = new Error('Network error: Unable to connect to AccessGuard API server (Failed to fetch)');
      const checkSpy = vi.spyOn(api, 'checkShieldMessage').mockRejectedValueOnce(mockNetworkError);

      render(
        <CitizenProvider>
          <MemoryRouter initialEntries={['/safety-shield?tab=message']}>
            <SafetyShieldPage />
          </MemoryRouter>
        </CitizenProvider>
      );

      const textarea = screen.getByPlaceholderText(/Paste the message here/i);
      fireEvent.change(textarea, { target: { value: 'Pay electricity bill now' } });

      const analyzeButton = screen.getByRole('button', { name: /Analyze Message/i });
      fireEvent.click(analyzeButton);

      expect(await screen.findByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Network error: Unable to connect to AccessGuard API server \(Failed to fetch\)/i)).toBeInTheDocument();

      // Retry when network connectivity is restored
      checkSpy.mockResolvedValueOnce({
        riskLevel: 'Needs Verification',
        warningSigns: [],
        explanation: 'Payment request identified.',
        safeNextSteps: ['Check official electricity board portal.'],
      });

      fireEvent.click(analyzeButton);

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
      expect(await screen.findByText('Needs Verification')).toBeInTheDocument();
    });

    it('Check a Website: validates empty input', async () => {
      render(
        <CitizenProvider>
          <MemoryRouter initialEntries={['/safety-shield?tab=website']}>
            <SafetyShieldPage />
          </MemoryRouter>
        </CitizenProvider>
      );

      const checkButton = screen.getByRole('button', { name: /Check Website/i });
      fireEvent.click(checkButton);

      expect(await screen.findByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Please enter a valid website address/i)).toBeInTheDocument();
    });

    it('Check a Website: inspects URL and renders findings, security headers, and safe guidance', async () => {
      const mockResult = {
        url: 'https://example-portal.com',
        hostname: 'example-portal.com',
        valid: true,
        riskLevel: 'No Obvious Warning Signs',
        status: 'Reachable',
        httpsEnabled: true,
        findings: [
          {
            id: 'https_present',
            title: 'Encrypted Transport (HTTPS)',
            severity: 'Info',
            description: 'Transport encryption is present.',
          },
        ],
        explanation: 'Basic security checks succeeded.',
        limitations: 'Automated inspection analyzes domain patterns and encryption headers.',
        safeNextSteps: ['Look for the official website through a trusted search engine.'],
      };

      vi.spyOn(api, 'checkShieldUrl').mockResolvedValue(mockResult);

      render(
        <CitizenProvider>
          <MemoryRouter initialEntries={['/safety-shield?tab=website']}>
            <SafetyShieldPage />
          </MemoryRouter>
        </CitizenProvider>
      );

      const urlInput = screen.getByPlaceholderText(/https:\/\/example.com/i);
      fireEvent.change(urlInput, { target: { value: 'example-portal.com' } });

      const checkButton = screen.getByRole('button', { name: /Check Website/i });
      fireEvent.click(checkButton);

      await waitFor(() => {
        expect(api.checkShieldUrl).toHaveBeenCalledWith('https://example-portal.com');
      });

      expect(await screen.findByText('No Obvious Warning Signs')).toBeInTheDocument();
      expect(screen.getByText('Encrypted Transport (HTTPS)')).toBeInTheDocument();
      expect(screen.getByText('Active (Encrypted Connection)')).toBeInTheDocument();
      expect(screen.getByText('Basic security checks succeeded.')).toBeInTheDocument();
      expect(screen.getByText(/Automated inspection analyzes domain patterns/i)).toBeInTheDocument();
    });

    it('Check a Website: renders "Unable to Verify" distinctly on unreachable/timeout targets', async () => {
      const mockResult = {
        url: 'https://offline-site.example.com',
        hostname: 'offline-site.example.com',
        valid: false,
        riskLevel: 'Unable to verify',
        status: 'Unable to verify',
        findings: [
          {
            id: 'unreachable',
            title: 'Site Unreachable or Timed Out',
            severity: 'Medium',
            description: 'Could not connect to host.',
          },
        ],
        explanation: 'The website could not be reliably verified.',
        limitations: 'Websites that cannot be reached cannot be inspected.',
        safeNextSteps: ['Double-check the website address for spelling errors.'],
      };

      vi.spyOn(api, 'checkShieldUrl').mockResolvedValue(mockResult);

      render(
        <CitizenProvider>
          <MemoryRouter initialEntries={['/safety-shield?tab=website']}>
            <SafetyShieldPage />
          </MemoryRouter>
        </CitizenProvider>
      );

      const urlInput = screen.getByPlaceholderText(/https:\/\/example.com/i);
      fireEvent.change(urlInput, { target: { value: 'https://offline-site.example.com' } });

      fireEvent.click(screen.getByRole('button', { name: /Check Website/i }));

      await waitFor(() => {
        expect(api.checkShieldUrl).toHaveBeenCalledWith('https://offline-site.example.com');
      });

      expect(await screen.findByText('Site Unreachable or Timed Out')).toBeInTheDocument();
      expect((await screen.findAllByText(/Unable to Verify/i)).length).toBeGreaterThanOrEqual(1);
    });

    it('Explain a Warning: renders scenarios, allows selection, switches language, and integrates voice playback', async () => {
      render(
        <CitizenProvider>
          <MemoryRouter initialEntries={['/safety-shield?tab=explain']}>
            <SafetyShieldPage />
          </MemoryRouter>
        </CitizenProvider>
      );

      // Default scenario is Suspicious Payment Request
      expect(screen.getAllByText(/Suspicious Payment Request/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/you NEVER need to enter your UPI PIN/i)).toBeInTheDocument();

      // Select another scenario: Electricity Disconnection or SIM/KYC Threat
      const utilityCard = screen.getByRole('button', {
        name: /Electricity Disconnection or SIM\/KYC Threat/i,
      });
      fireEvent.click(utilityCard);

      expect(screen.getAllByText(/Electricity Disconnection or SIM\/KYC Threat/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Dear Consumer, your BESCOM electricity power/i)).toBeInTheDocument();

      // Test Voice Playback (uses useCitizen().speak)
      const readAloudBtn = screen.getByRole('button', { name: /Read Aloud/i });
      fireEvent.click(readAloudBtn);

      expect(window.speechSynthesis.speak).toHaveBeenCalled();

      // Test Language Switch to Kannada
      const knButton = screen.getByRole('button', { name: /ಕನ್ನಡ/i });
      fireEvent.click(knButton);

      // Heading should now be in authentic Kannada
      expect(
        (await screen.findAllByText(/ವಿದ್ಯುತ್ ಸಂಪರ್ಕ ಕಡಿತ ಅಥವಾ ಸಿಮ್\/ಕೆವೈಸಿ ಬೆದರಿಕೆ/i)).length
      ).toBeGreaterThanOrEqual(1);
    });
  });

  describe('DashboardPage & Navigation Integration', () => {
    it('DashboardPage renders Senior Safety Shield card with 3 action buttons linking to correct tabs', async () => {
      vi.spyOn(api, 'getScans').mockResolvedValue({ scans: [] });

      render(
        <CitizenProvider>
          <BrowserRouter>
            <DashboardPage />
          </BrowserRouter>
        </CitizenProvider>
      );

      expect(screen.getByText('Senior Safety Shield')).toBeInTheDocument();
      expect(
        screen.getByText('Check suspicious messages, links, and online requests before taking action.')
      ).toBeInTheDocument();

      const checkMessageLink = screen.getByRole('link', { name: /Check a Message/i });
      const checkWebsiteLink = screen.getByRole('link', { name: /Check a Website/i });
      const explainWarningLink = screen.getByRole('link', { name: /Explain a Warning/i });

      expect(checkMessageLink).toHaveAttribute('href', '/safety-shield?tab=message');
      expect(checkWebsiteLink).toHaveAttribute('href', '/safety-shield?tab=website');
      expect(explainWarningLink).toHaveAttribute('href', '/safety-shield?tab=explain');
    });

    it('Sidebar renders Safety Shield navigation item pointing to /safety-shield', () => {
      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      );

      const shieldNavLink = screen.getByRole('link', { name: /Safety Shield/i });
      expect(shieldNavLink).toBeInTheDocument();
      expect(shieldNavLink).toHaveAttribute('href', '/safety-shield');
    });
  });
});
