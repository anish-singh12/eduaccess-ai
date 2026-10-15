import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from './Navbar';
import Footer from './Footer';
import Sidebar from './Sidebar';
import AccessibleControls from './AccessibleControls';
import { useAccessibility } from '../../context/AccessibilityContext';

// Routes that show the sidebar layout
const SIDEBAR_ROUTES = [
  '/dashboard',
  '/notes',
  '/concept-maps',
  '/quizzes',
  '/insights',
  '/settings',
];

export default function AppLayout() {
  const { isAuthenticated } = useAuth();
  const { fontSize, lineSpacing, contentWidth } = useAccessibility();
  const location = useLocation();

  // Check if we should show sidebar layout
  const hasSidebar = isAuthenticated && SIDEBAR_ROUTES.some(
    (route) => location.pathname === route || location.pathname.startsWith(route + '/')
  );

  // Dynamic content width class
  const widthClasses = {
    normal: 'max-w-7xl',
    wide: 'max-w-[1440px]',
    full: 'max-w-full px-2'
  }[contentWidth] || 'max-w-7xl';

  // Dynamic font sizing classes
  const fontSizeClass = `reading-size-${fontSize}`;
  const spacingClass = `reading-spacing-${lineSpacing}`;

  if (hasSidebar) {
    return (
      <div className={`app-shell ${fontSizeClass} ${spacingClass}`}>
        <Navbar />
        <div className="app-shell-body">
          <Sidebar />
          <main
            id="main-content"
            className="app-shell-main"
            tabIndex={-1}
          >
            <Outlet />
          </main>
        </div>
        {/* Persistent Floating Accessibility Menu */}
        <AccessibleControls variant="floating" />
      </div>
    );
  }

  // Public layout: no sidebar, full width
  const isLanding = location.pathname === '/';

  return (
    <div
      className={`min-h-screen flex flex-col ${
        isLanding
          ? 'bg-slate-50 text-slate-900 dark:bg-[#0b1120] dark:text-[#e2e8f0]'
          : 'bg-ivory-50 text-charcoal-900 dark:bg-charcoal-950 dark:text-ivory-100'
      } transition-colors duration-150 ${fontSizeClass} ${spacingClass}`}
    >
      <Navbar />

      <main
        id="main-content"
        className={isLanding ? 'flex-1 w-full' : `flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 ${widthClasses}`}
        tabIndex={-1}
      >
        <Outlet />
      </main>

      <Footer />

      {/* Persistent Floating Accessibility Menu */}
      <AccessibleControls variant="floating" />
    </div>
  );
}
