import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function Navbar() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  const isLanding = location.pathname === '/';

  // Public nav links (shown on landing page)
  const publicLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Overview', href: '#overview' },
    { name: 'Dashboard', to: '/dashboard' },
    { name: 'Features', href: '#features' },
    { name: 'About', href: '#accessibility' },
  ];

  // Authenticated nav links (shown on all non-landing pages when logged in)
  const authLinks = [
    { name: 'Dashboard', to: '/dashboard' },
    { name: 'Workspace', to: '/notes' },
    { name: 'Library', to: '/notes/library' },
    { name: 'Quizzes', to: '/quizzes' },
    { name: 'Concept Maps', to: '/concept-maps' },
    { name: 'Insights', to: '/insights' },
  ];

  const isActiveRoute = (to) => {
    if (to === '/dashboard') return location.pathname === '/dashboard';
    // Match sub-paths: /notes matches /notes and /notes/library
    return location.pathname.startsWith(to);
  };

  return (
    <header className={`navbar ${isLanding ? 'navbar--landing' : ''}`} role="banner">
      {/* Skip to Content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-4 z-50 px-4 py-2 bg-brand-600 text-white rounded-lg font-bold shadow-lg"
      >
        Skip to main content
      </a>

      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo" title="EduAccess AI Home">
          <div className="navbar-logo-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6 6h10" />
              <path d="M6 10h10" />
              <circle cx="18" cy="18" r="3" />
            </svg>
          </div>
          <span className="navbar-logo-text">
            EduAccess <span className="navbar-logo-highlight">AI</span>
          </span>
        </Link>

        {/* Center links — landing page: anchor links, authenticated pages: app links */}
        {isLanding ? (
          <nav className="navbar-links" aria-label="Main Navigation">
            {publicLinks.map((link) =>
              link.to ? (
                <Link key={link.name} to={link.to} className="navbar-link">
                  {link.name}
                </Link>
              ) : (
                <a key={link.name} href={link.href} className="navbar-link">
                  {link.name}
                </a>
              )
            )}
          </nav>
        ) : isAuthenticated ? (
          <nav className="navbar-links" aria-label="App Navigation">
            {authLinks.map((link) => (
              <Link
                key={link.name}
                to={link.to}
                className={`navbar-link ${isActiveRoute(link.to) ? 'navbar-link--active' : ''}`}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        ) : null}

        {/* Right side actions */}
        <div className="navbar-actions">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            type="button"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="navbar-icon-btn"
          >
            {isDark ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            )}
          </button>

          {loading ? (
            /* Auth initializing — render reserved-size placeholder to prevent layout shift */
            <div className="navbar-auth-actions" style={{ minWidth: '120px' }}>
              <div className="navbar-avatar" style={{ opacity: 0.3 }} aria-hidden="true">
                <span style={{ visibility: 'hidden' }}>U</span>
              </div>
            </div>
          ) : isAuthenticated ? (
            <div className="navbar-user-menu" ref={menuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                type="button"
                aria-expanded={userMenuOpen}
                aria-label="User account menu"
                className="navbar-user-btn"
              >
                <div className="navbar-avatar">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="navbar-user-name">
                  {user?.name}
                </span>
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className={`navbar-chevron ${userMenuOpen ? 'navbar-chevron--open' : ''}`}
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <div className="navbar-dropdown" role="menu">
                  <div className="navbar-dropdown-header">
                    <p className="navbar-dropdown-label">Signed in as</p>
                    <p className="navbar-dropdown-email">{user?.email}</p>
                  </div>
                  <Link to="/dashboard" className="navbar-dropdown-item" role="menuitem">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
                    Dashboard
                  </Link>
                  <Link to="/settings" className="navbar-dropdown-item" role="menuitem">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
                    Settings
                  </Link>
                  <div className="navbar-dropdown-divider" />
                  <button onClick={handleLogout} className="navbar-dropdown-item navbar-dropdown-item--danger" role="menuitem">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16,17 21,12 16,7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="navbar-auth-actions">
              <Link to="/login" className={isLanding ? 'navbar-link navbar-link--landing-auth' : 'navbar-link'}>
                Login
              </Link>
              <Link to="/register" className="navbar-cta-btn">
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile Hamburger — on landing page and authenticated pages */}
          {(isLanding || isAuthenticated) && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              className="navbar-hamburger"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {mobileMenuOpen ? (
                  <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>
                ) : (
                  <><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></>
                )}
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileMenuOpen && (
        <div className="navbar-mobile-drawer">
          {isLanding ? (
            <>
              {publicLinks.map((link) => (
                link.to ? (
                  <Link
                    key={link.name}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className="navbar-mobile-link"
                  >
                    {link.name}
                  </Link>
                ) : (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="navbar-mobile-link"
                  >
                    {link.name}
                  </a>
                )
              ))}
            </>
          ) : isAuthenticated ? (
            <>
              {authLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`navbar-mobile-link ${isActiveRoute(link.to) ? 'navbar-mobile-link--active' : ''}`}
                >
                  {link.name}
                </Link>
              ))}
            </>
          ) : null}

          <div className="navbar-mobile-divider" />
          {loading ? (
            <div className="navbar-mobile-link opacity-50 cursor-wait">Loading...</div>
          ) : isAuthenticated ? (
            <>
              <Link to="/settings" onClick={() => setMobileMenuOpen(false)} className="navbar-mobile-link">
                Settings
              </Link>
              <button
                onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                className="navbar-mobile-link text-red-500 text-left w-full"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="navbar-mobile-link">
                Sign In
              </Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="navbar-mobile-link navbar-mobile-link--primary">
                Get Started
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}

