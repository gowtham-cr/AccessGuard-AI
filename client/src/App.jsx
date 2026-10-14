import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { CitizenProvider } from './context/CitizenContext.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { LandingPage } from './pages/LandingPage.jsx';
import { CitizenPage } from './pages/CitizenPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { DashboardLayout } from './pages/DashboardLayout.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { ScanLauncherPage } from './pages/ScanLauncherPage.jsx';
import { ScanDetailPage } from './pages/ScanDetailPage.jsx';
import { HistoryPage } from './pages/HistoryPage.jsx';
import { VoiceAssistantPage } from './pages/VoiceAssistantPage.jsx';
import { SafetyShieldPage } from './pages/SafetyShieldPage.jsx';

export default function App() {
  return (
    <AuthProvider>
      <CitizenProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/citizen" element={<CitizenPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

          {/* Protected Dashboard Routes */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/scans/new" element={<ScanLauncherPage />} />
            <Route path="/scans/:id" element={<ScanDetailPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/voice-assistant" element={<VoiceAssistantPage />} />
            <Route path="/safety-shield" element={<SafetyShieldPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </CitizenProvider>
    </AuthProvider>
  );
}
