// frontend/src/components/dashboard/AgentPerformanceCard.jsx
import React from 'react';

export default function AgentPerformanceCard({ agentPerformance }) {
  const rankings = agentPerformance?.rankings || [];
  const totalCollections = agentPerformance?.totalCollections || 0;

  // Format large currency numbers gracefully (e.g., 3.90M AED)
  const formatTotalCompact = (val) => {
    if (val >= 1000000) {
      return (val / 1000000).toFixed(2) + 'M AED';
    }
    if (val >= 1000) {
      return (val / 1000).toFixed(1) + 'K AED';
    }
    return val.toLocaleString(undefined, { minimumFractionDigits: 2 }) + ' AED';
  };

  // Color mapping fallback
  const getBarColor = (name, index) => {
    const clean = String(name || '').toLowerCase();
    if (clean.includes('desk') || clean.includes('direct')) return 'bg-slate-900';
    if (clean.includes('shuhaib')) return 'bg-emerald-500';
    if (clean.includes('thavab')) return 'bg-purple-500';
    if (clean.includes('basheer')) return 'bg-amber-500';

    const fallbackColors = [
      'bg-slate-900',
      'bg-emerald-500',
      'bg-purple-500',
      'bg-amber-500',
      'bg-blue-500',
      'bg-rose-500'
    ];
    return fallbackColors[index % fallbackColors.length];
  };

  const getRoleIcon = (name) => {
    const clean = String(name || '').toLowerCase();
    if (clean.includes('desk') || clean.includes('direct')) {
      return (
        <svg className="w-3.5 h-3.5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    }
    return (
      <svg className="w-3.5 h-3.5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    );
  };

  return (
    <div className="lg:col-span-3 bg-white rounded-[2rem] p-8 border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col justify-between">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Agent & Desk Ranking</h3>
          <p className="text-xs text-slate-400 mt-1 font-light">Share of total collections</p>
        </div>

        {totalCollections > 0 && (
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-[11px] font-semibold text-slate-700 tracking-tight">
              {formatTotalCompact(totalCollections)}
            </span>
          </div>
        )}
      </div>

      {/* Side Bar Ranking List */}
      <div className="flex-1 flex flex-col justify-center space-y-4">
        {rankings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
            <svg className="w-8 h-8 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-xs font-medium">No agent records yet</p>
          </div>
        ) : (
          rankings.slice(0, 5).map((item, index) => {
            const barColor = item.color || getBarColor(item.name, index);
            const percentage = item.percentage || 0;

            return (
              <div key={item.id || index} className="flex flex-col gap-1.5 group">
                
                {/* Meta Row */}
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-slate-100/80 flex items-center justify-center shrink-0">
                      {getRoleIcon(item.name)}
                    </span>
                    <span className="font-semibold text-slate-800 truncate tracking-tight">
                      {item.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-bold text-slate-900">
                      AED {parseFloat(item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                    <span className="bg-slate-100 text-slate-600 font-semibold px-1.5 py-0.5 rounded text-[10px]">
                      {percentage}%
                    </span>
                  </div>
                </div>

                {/* Curved Smooth Side Bar */}
                <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100/80">
                  <div
                    className={`h-full ${barColor} rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: `${Math.min(100, Math.max(2, percentage))}%` }}
                  ></div>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
