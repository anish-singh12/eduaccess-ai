import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="lp-root">

      {/* ============================================================
          HERO SECTION
          ============================================================ */}
      <section className="lp-hero" id="home">
        <div className="lp-container lp-hero-inner">
          {/* Left Column */}
          <div className="lp-hero-left">
            <span className="lp-hero-badge">
              <span className="lp-hero-badge-dot" />
              Welcome to EduAccess AI
            </span>

            <h1 className="lp-hero-heading">
              Turn Study Material Into{' '}
              <span className="lp-accent">Understanding</span>.
            </h1>

            <p className="lp-hero-sub">
              Upload your study material, simplify complex topics, create visual concept maps, and generate AI-powered quizzes — all in one place.
            </p>

            <div className="lp-hero-actions">
              <Link to="/notes" className="lp-btn lp-btn--primary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                Browse Notes
              </Link>
              <Link to="/register" className="lp-btn lp-btn--outline">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Sign Up Free
              </Link>
            </div>
          </div>

          {/* Right Column — Stylised Mock Card */}
          <div className="lp-hero-right">
            <div className="lp-hero-card">
              <div className="lp-hero-card-header">
                <span className="lp-hero-card-title">
                  Study Resources & <span className="lp-accent">Tools</span>
                </span>
              </div>
              <div className="lp-hero-card-search">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <span>Search study materials & tools...</span>
              </div>
              <div className="lp-hero-card-list">
                {[
                  {
                    title: 'Simplified Lecture Notes',
                    meta: 'Core takeaways & key definitions',
                    icon: (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" />
                      </svg>
                    )
                  },
                  {
                    title: 'Interactive Concept Map',
                    meta: 'Connected concept hierarchy',
                    icon: (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                      </svg>
                    )
                  },
                  {
                    title: 'Practice Assessment Quiz',
                    meta: 'AI questions with explanations',
                    icon: (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m9 11 3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                      </svg>
                    )
                  },
                ].map((item) => (
                  <div key={item.title} className="lp-hero-card-item">
                    <div className="lp-hero-card-item-icon" aria-hidden="true">
                      {item.icon}
                    </div>
                    <div className="lp-hero-card-item-body">
                      <span className="lp-hero-card-item-title">{item.title}</span>
                      <span className="lp-hero-card-item-meta">{item.meta}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          FEATURES SECTION
          ============================================================ */}
      <section className="lp-section" id="features">
        <div className="lp-container">
          <div className="lp-section-header">
            <h2 className="lp-section-title">Key Features</h2>
            <p className="lp-section-sub">Essential tools designed to turn study material into clear understanding.</p>
          </div>

          <div className="lp-features-grid">
            {[
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                ),
                title: 'PDF Study Material Upload',
                desc: 'Upload study PDFs and extract their text for use with learning tools.',
              },
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>
                  </svg>
                ),
                title: 'Simplified Study Notes',
                desc: 'Make complex study material easier to understand through AI-generated explanations or summaries.',
              },
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                  </svg>
                ),
                title: 'Visual Concept Maps',
                desc: 'Explore relationships between concepts through interactive visual maps.',
              },
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                ),
                title: 'AI Quiz Generation',
                desc: 'Generate practice questions directly from uploaded study material.',
              },
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/>
                  </svg>
                ),
                title: 'Accessible Learning',
                desc: 'Customize reading with dyslexia-friendly fonts, high-contrast themes, and text scaling.',
              },
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
                  </svg>
                ),
                title: 'Learning Workspace',
                desc: 'Manage your uploaded documents, concept maps, and quizzes from a centralized dashboard.',
              },
            ].map((feat) => (
              <div key={feat.title} className="lp-feat-card">
                <div className="lp-feat-icon">{feat.icon}</div>
                <h3 className="lp-feat-title">{feat.title}</h3>
                <p className="lp-feat-desc">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          HOW IT WORKS
          ============================================================ */}
      <section className="lp-section lp-section--alt" id="overview">
        <span id="how-it-works" className="sr-only" />
        <div className="lp-container">
          <div className="lp-section-header">
            <h2 className="lp-section-title">How It Works</h2>
            <p className="lp-section-sub">Three simple steps to transform how you study and retain information.</p>
          </div>

          <div className="lp-steps">
            <div className="lp-step">
              <div className="lp-step-num">01</div>
              <h3 className="lp-step-title">Upload Study Material</h3>
              <p className="lp-step-desc">Upload a study PDF and extract its text to prepare it for learning.</p>
            </div>
            <div className="lp-step-arrow" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </div>
            <div className="lp-step">
              <div className="lp-step-num">02</div>
              <h3 className="lp-step-title">Generate Learning Resources</h3>
              <p className="lp-step-desc">Transform your study material into simplified notes, visual concept maps, and AI-generated practice quizzes.</p>
            </div>
            <div className="lp-step-arrow" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </div>
            <div className="lp-step">
              <div className="lp-step-num">03</div>
              <h3 className="lp-step-title">Practice and Review</h3>
              <p className="lp-step-desc">Attempt generated quizzes and review your learning using the tools available in EduAccess AI.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          ABOUT / ACCESSIBILITY SECTION
          ============================================================ */}
      <section className="lp-section" id="accessibility">
        <div className="lp-container">
          <div className="lp-section-header">
            <h2 className="lp-section-title">Learning Should Be Easier to Access.</h2>
            <p className="lp-section-sub" style={{ maxWidth: '780px', margin: '0 auto' }}>
              EduAccess AI helps students understand and practise their study material through AI-powered learning tools and an accessibility-conscious interface. It brings study resources, visual concept maps, and practice quizzes together to make learning simpler and more approachable.
            </p>
          </div>

          <div className="lp-a11y-grid">
            {[
              { emoji: '🔤', title: 'Dyslexia-Friendly Font', desc: 'Atkinson Hyperlegible typography to enhance character distinction and reading flow.' },
              { emoji: '📏', title: 'Reading Guide Ruler', desc: 'A cursor-following reading guide to help you maintain focus on one line at a time.' },
              { emoji: '🌙', title: 'Dark & High-Contrast Modes', desc: 'Switch between dark mode and high-contrast themes to minimize visual strain.' },
              { emoji: '⚙️', title: 'Custom Text & Spacing', desc: 'Adjust font scaling and line spacing to tailor content to your reading comfort.' },
            ].map((item) => (
              <div key={item.title} className="lp-a11y-card">
                <div className="lp-a11y-emoji" aria-hidden="true">{item.emoji}</div>
                <h4 className="lp-a11y-title">{item.title}</h4>
                <p className="lp-a11y-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          CTA BANNER
          ============================================================ */}
      <section className="lp-section lp-section--cta">
        <div className="lp-container">
          <div className="lp-cta-box">
            <h2 className="lp-cta-title">Ready To Study Smarter?</h2>
            <p className="lp-cta-sub">
              Upload your study material, generate visual maps, and test your knowledge with interactive quizzes.
            </p>
            <div className="lp-cta-actions">
              <Link to="/dashboard" className="lp-btn lp-btn--primary lp-btn--light">
                Go to Dashboard
              </Link>
              <Link to="/notes" className="lp-btn lp-btn--ghost">
                Browse Notes
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}