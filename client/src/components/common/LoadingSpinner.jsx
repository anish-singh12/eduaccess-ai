import React from 'react';

export default function LoadingSpinner({ size = 'md', message = 'Loading...', fullScreen = false }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4'
  }[size] || 'w-8 h-8 border-3';

  const content = (
    <div className="flex flex-col items-center justify-center gap-3 p-4" role="status" aria-live="polite">
      <div
        className={`${sizeClasses} border-brand-200 border-t-brand-600 rounded-full animate-spin`}
        aria-hidden="true"
      />
      {message && (
        <span className="text-sm font-medium text-charcoal-600 dark:text-charcoal-300">
          {message}
        </span>
      )}
      <span className="sr-only">{message || 'Loading content'}</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-ivory-50/80 dark:bg-charcoal-950/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
}
