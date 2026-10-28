// frontend/src/components/logs/AuditTickButton.jsx
import React from 'react';

/**
 * AuditTickButton - Sleek interactive checkmark indicator for Master Ledger rows.
 * Supports keyboard Enter toggle and direct mouse click.
 * 
 * @param {boolean} isNoted - Whether the transaction is audited/ticked
 * @param {Function} onToggle - Callback triggered when toggled
 * @param {string} title - Optional custom tooltip text
 */
export default function AuditTickButton({ isNoted = true, onToggle, title }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (onToggle) onToggle();
      }}
      title={title || (isNoted ? "Audited / Verified (Press Enter to unmark)" : "Pending Verification (Press Enter to mark)")}
      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer ${
        isNoted
          ? 'bg-emerald-500 text-white shadow-[0_0_6px_rgba(16,185,129,0.45)] ring-1 ring-emerald-500/30 hover:bg-emerald-600'
          : 'border border-slate-300 text-transparent hover:border-slate-400 group-hover:border-slate-400 hover:bg-slate-50'
      }`}
    >
      <svg 
        className={`w-2.5 h-2.5 stroke-[3] transition-opacity ${isNoted ? 'opacity-100' : 'opacity-0'}`} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </button>
  );
}

