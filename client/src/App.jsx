import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/common/AppLayout';
import LoadingSpinner from './components/common/LoadingSpinner';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import NotesWorkspacePage from './pages/NotesWorkspacePage';
import NotesLibraryPage from './pages/NotesLibraryPage';
import ConceptMapStudioPage from './pages/ConceptMapStudioPage';
import ConceptMapLibraryPage from './pages/ConceptMapLibraryPage';
import QuizStudioPage from './pages/QuizStudioPage';
import QuizHistoryPage from './pages/QuizHistoryPage';
import LearningInsightsPage from './pages/LearningInsightsPage';
import SettingsPage from './pages/SettingsPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import NotFoundPage from './pages/NotFoundPage';

/**
 * Route wrapper that requires authentication
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory-50 dark:bg-charcoal-950">
        <LoadingSpinner message="Checking authentication status..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

/**
 * Route wrapper that redirects authenticated users to /dashboard
 */
function PublicOnlyRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory-50 dark:bg-charcoal-950">
        <LoadingSpinner message="Loading..." />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public Pages wrapped in AppLayout for consistent header, footer and accessibility tools */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          }
        />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />

        {/* Protected App Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notes"
          element={
            <ProtectedRoute>
              <NotesWorkspacePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notes/library"
          element={
            <ProtectedRoute>
              <NotesLibraryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/concept-maps"
          element={
            <ProtectedRoute>
              <ConceptMapStudioPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/concept-maps/library"
          element={
            <ProtectedRoute>
              <ConceptMapLibraryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quizzes"
          element={
            <ProtectedRoute>
              <QuizStudioPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quizzes/history"
          element={
            <ProtectedRoute>
              <QuizHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/insights"
          element={
            <ProtectedRoute>
              <LearningInsightsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
