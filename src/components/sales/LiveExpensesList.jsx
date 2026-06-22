// frontend/src/components/sales/LiveExpensesList.jsx
import React from 'react';

export default function LiveExpensesList({ expenses = [] }) {
  // Helper function to generate consistent initials for the avatar badge
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      {/* Header section */}
      <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">Batch Deductions</h2>
          {expenses.length > 0 && (
            <span className="bg-slate-200 text-slate-600 px-2.5 py-0.5 rounded-full text-xs font-bold">
              {expenses.length} items
            </span>
          )}
        </div>
        <div className="bg-rose-100/50 text-rose-700 border border-rose-200 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
          Live Queue
        </div>
      </div>

      {/* List Container */}
      <div className="overflow-y-auto max-h-[400px]">
        {expenses.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400 font-medium flex flex-col items-center justify-center gap-2">
            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 12H4M8 16l-4-4 4-4" />
            </svg>
            <span>No pending expenses logged in the selected batch.</span>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {expenses.map((exp, index) => (
              <li key={exp.id || index} className="px-6 py-4 hover:bg-slate-50/80 transition-colors flex justify-between items-center group">
                
                {/* ENHANCED: Agent Avatar Badge + Details */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold border border-indigo-200 shadow-sm shrink-0">
                    {getInitials(exp.agentName)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800">
                      {exp.description}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">
                      {exp.agentName} &bull; {exp.date}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm font-black text-rose-600">
                    - {parseFloat(exp.amount).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold ml-1">AED</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}