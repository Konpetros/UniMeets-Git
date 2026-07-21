import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './i18n';
import { AuthProvider, useAuth } from './components/AuthContext';
import LoginPage from './components/LoginPage';
import OnboardingPage from './components/OnboardingPage';
import FeedPage from './components/FeedPage';
import CreateMeetupPage from './components/CreateMeetupPage';
import MyUniMeetsPage from './components/MyUniMeetsPage';
import ChatScreenPage from './components/ChatScreenPage';
import ProfilePage from './components/ProfilePage';
import NotificationsPage from './components/NotificationsPage';
import PrivacySettingsPage from './components/PrivacySettingsPage';
import BlockedUsersPage from './components/BlockedUsersPage';
import TermsOfServicePage from './components/TermsOfServicePage';
import DeleteAccountPage from './components/DeleteAccountPage';

// Auth Guard for standard users: Must be authenticated and onboarding completed
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, onboardingCompleted, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

// Auth Guard for onboarding: Must be authenticated but onboarding NOT completed
function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { user, onboardingCompleted, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (onboardingCompleted) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public auth route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Onboarding route */}
            <Route
              path="/onboarding"
              element={
                <OnboardingRoute>
                  <OnboardingPage />
                </OnboardingRoute>
              }
            />

            {/* Main feed route */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <FeedPage />
                </ProtectedRoute>
              }
            />

            {/* Create meetup route */}
            <Route
              path="/create"
              element={
                <ProtectedRoute>
                  <CreateMeetupPage />
                </ProtectedRoute>
              }
            />

            {/* My UniMeets route */}
            <Route
              path="/my-unimeets"
              element={
                <ProtectedRoute>
                  <MyUniMeetsPage />
                </ProtectedRoute>
              }
            />

            {/* Chat Screen route */}
            <Route
              path="/chat/:unimeetId"
              element={
                <ProtectedRoute>
                  <ChatScreenPage />
                </ProtectedRoute>
              }
            />

            {/* Profile route */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Notifications settings */}
            <Route
              path="/account/notifications"
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />

            {/* Privacy settings */}
            <Route
              path="/account/privacy-settings"
              element={
                <ProtectedRoute>
                  <PrivacySettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Blocked Users settings */}
            <Route
              path="/account/blocked"
              element={
                <ProtectedRoute>
                  <BlockedUsersPage />
                </ProtectedRoute>
              }
            />

            {/* Terms of Service */}
            <Route
              path="/account/terms"
              element={
                <ProtectedRoute>
                  <TermsOfServicePage />
                </ProtectedRoute>
              }
            />

            {/* Delete Account */}
            <Route
              path="/account/delete"
              element={
                <ProtectedRoute>
                  <DeleteAccountPage />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}
