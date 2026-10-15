import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

function ConceptNode({ data, selected }) {
  const isSelected = selected || data.selected;

  // Level-based color themes
  const levelStyles = {
    0: 'bg-brand-50 border-brand-600 text-brand-950 dark:bg-brand-950 dark:border-brand-400 dark:text-brand-100 ring-brand-500',
    1: 'bg-emerald-50 border-emerald-500 text-emerald-950 dark:bg-emerald-950 dark:border-emerald-400 dark:text-emerald-100 ring-emerald-400',
    2: 'bg-teal-50 border-teal-500 text-teal-950 dark:bg-teal-950 dark:border-teal-400 dark:text-teal-100 ring-teal-400',
    3: 'bg-slate-50 border-slate-400 text-slate-900 dark:bg-slate-900 dark:border-slate-500 dark:text-slate-100 ring-slate-400'
  }[data.level !== undefined ? data.level : 1] || 'bg-white border-brand-500 text-charcoal-900 dark:bg-charcoal-800 dark:border-brand-400 dark:text-ivory-100 ring-brand-500';

  return (
    <div
      tabIndex={0}
      role="button"
      aria-label={`Concept Node: ${data.label}. Click to view details.`}
      className={`relative px-4 py-3 min-w-[170px] max-w-[240px] rounded-2xl border-2 shadow-sm transition-all text-center cursor-pointer ${levelStyles} ${
        isSelected ? 'ring-4 ring-offset-2 ring-brand-500 scale-105 shadow-md' : 'hover:shadow-md'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-2.5 h-2.5 !bg-brand-600 dark:!bg-brand-400 border border-white"
        aria-hidden="true"
      />

      <div className="flex flex-col items-center">
        {data.level === 0 && (
          <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-brand-600 text-white mb-1">
            Core Concept
          </span>
        )}
        <span className="font-bold text-sm tracking-tight leading-snug">
          {data.label}
        </span>
        {data.description && (
          <span className="text-[11px] opacity-80 line-clamp-1 mt-0.5">
            {data.description}
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2.5 h-2.5 !bg-brand-600 dark:!bg-brand-400 border border-white"
        aria-hidden="true"
      />
    </div>
  );
}

export default memo(ConceptNode);
