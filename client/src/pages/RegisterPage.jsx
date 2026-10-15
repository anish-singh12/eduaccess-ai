import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AlertBanner from '../components/common/AlertBanner';

// Robust email format check — does not over-reject legitimate addresses
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

// Per-requirement live checklist
function getPasswordChecks(pw) {
  return {
    length:    pw.length >= 8,
    uppercase: /[A-Z]/.test(pw),
    lowercase: /[a-z]/.test(pw),
    digit:     /[0-9]/.test(pw),
  };
}

function PasswordCheckItem({ satisfied, label }) {
  return (
    <li className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors ${satisfied ? 'text-emerald-600 dark:text-emerald-400' : 'text-charcoal-400 dark:text-charcoal-500'}`}>
      {satisfied
        ? <Check className="w-3 h-3 shrink-0" />
        : <X className="w-3 h-3 shrink-0" />}
      {label}
    </li>
  );
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const trimmedEmail = email.trim();
  const emailValid = isValidEmail(trimmedEmail);
  const emailError = emailTouched && trimmedEmail && !emailValid
    ? 'Please enter a valid email address (e.g. you@example.com).'
    : null;

  const pwChecks = useMemo(() => getPasswordChecks(password), [password]);
  const passwordStrong = Object.values(pwChecks).every(Boolean);
  const passwordsMatch = password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setEmailTouched(true);

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (!emailValid) {
      setError('Please enter a valid email address (e.g. you@example.com).');
      return;
    }

    if (!passwordStrong) {
      setError('Your password does not meet all the requirements listed below.');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    try {
      setLoading(true);
      await register({ name: name.trim(), email: trimmedEmail, password });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-4 py-3 rounded-xl border border-charcoal-200 dark:border-charcoal-700 bg-ivory-50/50 dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 text-sm focus-visible:ring-2 focus-visible:ring-brand-500 focus:outline-none transition-all';
  const inputErrorClass = 'w-full px-4 py-3 rounded-xl border border-rose-400 dark:border-rose-600 bg-ivory-50/50 dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 text-sm focus-visible:ring-2 focus-visible:ring-rose-400 focus:outline-none transition-all';

  return (
    <div className="max-w-md mx-auto py-12 px-4 animate-fadeIn">
      <div className="bg-white dark:bg-charcoal-900 p-8 rounded-3xl border border-charcoal-200 dark:border-charcoal-800 shadow-xl space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-extrabold text-charcoal-900 dark:text-ivory-100">
            Create Student Account
          </h1>
          <p className="text-sm text-charcoal-500 dark:text-charcoal-400">
            Join EduAccess AI to unlock personalized study tools
          </p>
        </div>

        {error && <AlertBanner type="error" message={error} onClose={() => setError(null)} />}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Full Name */}
          <div>
            <label
              htmlFor="reg-name"
              className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300 uppercase tracking-wider mb-1"
            >
              Full Name
            </label>
            <input
              id="reg-name"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Smith"
              className={inputClass}
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="reg-email"
              className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300 uppercase tracking-wider mb-1"
            >
              Email Address
            </label>
            <input
              id="reg-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailTouched(false); }}
              onBlur={() => setEmailTouched(true)}
              placeholder="alex@college.edu"
              aria-describedby={emailError ? 'email-error' : undefined}
              aria-invalid={!!emailError}
              className={emailError ? inputErrorClass : inputClass}
            />
            {emailError && (
              <p id="email-error" className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                {emailError}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="reg-password"
              className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300 uppercase tracking-wider mb-1"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                aria-describedby="password-requirements"
                className={`${inputClass} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600 dark:hover:text-charcoal-200 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Live password requirements checklist */}
            <ul
              id="password-requirements"
              className="mt-2 space-y-0.5 pl-0.5"
              aria-label="Password requirements"
            >
              <PasswordCheckItem satisfied={pwChecks.length}    label="At least 8 characters" />
              <PasswordCheckItem satisfied={pwChecks.uppercase} label="At least one uppercase letter (A–Z)" />
              <PasswordCheckItem satisfied={pwChecks.lowercase} label="At least one lowercase letter (a–z)" />
              <PasswordCheckItem satisfied={pwChecks.digit}     label="At least one number (0–9)" />
            </ul>
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="reg-confirm-password"
              className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300 uppercase tracking-wider mb-1"
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="reg-confirm-password"
                type={showConfirm ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                aria-invalid={confirmPassword.length > 0 && !passwordsMatch}
                className={`${confirmPassword.length > 0 && !passwordsMatch ? inputErrorClass : inputClass} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600 dark:hover:text-charcoal-200 transition-colors"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                Passwords do not match.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-md transition-all focus-visible:ring-4 focus-visible:ring-brand-400 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="text-center text-xs text-charcoal-500 dark:text-charcoal-400">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-brand-600 dark:text-brand-400 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
