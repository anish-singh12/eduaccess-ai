import React from 'react';
import AudioReader from '../common/AudioReader';

export default function NodeDetailPanel({ node, edges = [], nodes = [], onClose }) {
  if (!node) return null;

  const { data } = node;

  // Find incoming & outgoing relationships
  const incoming = edges
    .filter((e) => e.target === node.id)
    .map((e) => {
      const sourceNode = nodes.find((n) => n.id === e.source);
      return {
        label: e.label || 'connected to',
        sourceName: sourceNode?.data?.label || e.source
      };
    });

  const outgoing = edges
    .filter((e) => e.source === node.id)
    .map((e) => {
      const targetNode = nodes.find((n) => n.id === e.target);
      return {
        label: e.label || 'leads to',
        targetName: targetNode?.data?.label || e.target
      };
    });

  const speechContent = `${data.label}. ${data.description || ''}. ${data.details || ''}`;

  return (
    <div
      className="w-full h-full bg-white dark:bg-charcoal-900 border-l border-charcoal-200 dark:border-charcoal-800 p-5 overflow-y-auto flex flex-col justify-between animate-fadeIn text-charcoal-900 dark:text-ivory-100"
      role="region"
      aria-label={`Details for ${data.label}`}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-charcoal-100 dark:border-charcoal-800 pb-3">
          <div>
            <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
              {data.level === 0 ? 'Core Topic' : `Subtopic Level ${data.level || 1}`}
            </span>
            <h3 className="text-xl font-extrabold text-charcoal-900 dark:text-ivory-100 mt-0.5">
              {data.label}
            </h3>
          </div>
          <button
            onClick={onClose}
            type="button"
            aria-label="Close concept details"
            className="p-1.5 rounded-lg text-charcoal-400 hover:text-charcoal-700 dark:hover:text-charcoal-200 hover:bg-charcoal-100 dark:hover:bg-charcoal-800"
          >
            ✕
          </button>
        </div>

        {/* Audio Reader Component */}
        <AudioReader text={speechContent} label="Listen to Concept" />

        {/* Description */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-400 dark:text-charcoal-500 mb-1">
            Summary
          </h4>
          <p className="text-sm font-medium leading-relaxed bg-brand-50/50 dark:bg-brand-950/30 p-3 rounded-xl border border-brand-100 dark:border-brand-900 text-charcoal-800 dark:text-charcoal-200">
            {data.description || 'No summary available for this concept.'}
          </p>
        </div>

        {/* Elaborated Details / Examples */}
        {data.details && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-400 dark:text-charcoal-500 mb-1">
              Deep Dive & Context
            </h4>
            <p className="text-sm leading-relaxed text-charcoal-700 dark:text-charcoal-300">
              {data.details}
            </p>
          </div>
        )}

        {/* Knowledge Graph Connections */}
        <div className="space-y-2 pt-2 border-t border-charcoal-100 dark:border-charcoal-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-400 dark:text-charcoal-500">
            Node Relationships
          </h4>

          {incoming.length > 0 && (
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-charcoal-500">Influenced By:</span>
              <ul className="space-y-1">
                {incoming.map((rel, idx) => (
                  <li
                    key={idx}
                    className="text-xs bg-charcoal-50 dark:bg-charcoal-800/60 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5"
                  >
                    <span className="font-semibold text-brand-600 dark:text-brand-400">{rel.sourceName}</span>
                    <span className="text-charcoal-400 italic">({rel.label})</span>
                    <span>➔ This Node</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {outgoing.length > 0 && (
            <div className="space-y-1 mt-2">
              <span className="text-[11px] font-semibold text-charcoal-500">Connects To:</span>
              <ul className="space-y-1">
                {outgoing.map((rel, idx) => (
                  <li
                    key={idx}
                    className="text-xs bg-charcoal-50 dark:bg-charcoal-800/60 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5"
                  >
                    <span>This Node</span>
                    <span className="text-charcoal-400 italic">({rel.label})</span>
                    <span className="font-semibold text-brand-600 dark:text-brand-400">➔ {rel.targetName}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {incoming.length === 0 && outgoing.length === 0 && (
            <p className="text-xs text-charcoal-500 italic">No direct connections attached to this node.</p>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-charcoal-100 dark:border-charcoal-800 text-center">
        <p className="text-[11px] text-charcoal-400">
          Click anywhere outside or press Esc to close this drawer.
        </p>
      </div>
    </div>
  );
}
