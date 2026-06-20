import React from 'react';

export default function SalesTopBar({ grossPendingTotal = 0, pendingCount = 0 }) {
  // Get today's formatted date for the display
  const today = new Date().toLocaleDateString('en-AE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      {/* Left Side: Title & Status */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sales Entry Desk</h1>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <p className="text-sm font-medium text-slate-500">
            Live Sync Active &bull; {today}
          </p>
        </div>
      </div>

      {/* Right Side: Financial Overview Card */}
      <div className="bg-[#2A2B3D] rounded-xl px-6 py-4 flex items-center gap-6 shadow-md w-full sm:w-auto">
        {/* Pending Sessions Counter */}
        <div>
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
            Pending Sessions
          </p>
          <p className="text-xl font-bold text-white">
            {pendingCount}
          </p>
        </div>
        
        {/* Vertical Divider */}
        <div className="h-10 w-px bg-slate-600/50"></div>
        
        {/* Gross Pending Total */}
        <div>
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
            Gross Pending Total
          </p>
          <p className="text-2xl font-black tracking-tight text-emerald-400">
            <span className="text-sm text-slate-400 font-medium mr-1">AED</span>
            {grossPendingTotal.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}