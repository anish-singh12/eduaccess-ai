import React from 'react';
import { BookOpen } from 'lucide-react';

export default function EmptyState({
  title = 'No items found',
  description = 'Get started by creating your first item.',
  actionLabel,
  onAction,
  icon
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border-2 border-dashed border-charcoal-200 dark:border-charcoal-800 bg-white/40 dark:bg-charcoal-900/40 my-4">
      <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4 shadow-sm">
        {icon || <BookOpen className="w-6 h-6" aria-hidden="true" />}
      </div>
      <h3 className="text-lg font-semibold text-charcoal-900 dark:text-ivory-100 mb-1">
        {title}
      </h3>
      <p className="text-sm text-charcoal-600 dark:text-charcoal-400 max-w-sm mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          type="button"
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-xl shadow-sm hover:shadow transition-all focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
