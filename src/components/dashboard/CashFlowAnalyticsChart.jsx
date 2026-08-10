// frontend/src/components/dashboard/CashFlowAnalyticsChart.jsx
import React, { useState, useEffect, useRef } from 'react';

export default function CashFlowAnalyticsChart({ trendData, maxInflow, chartRange, setChartRange }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Robust click-outside listener to fix dropdown selection interception issues
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col relative overflow-hidden">
      
      {/* Header & Custom Dropdown */}
      <div className="flex justify-between items-center mb-8 relative z-20">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Cash Flow Analytics</h3>
          <p className="text-xs text-slate-400 mt-1 font-light">Daily inflow trends</p>
        </div>
        
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-slate-100"
          >
            {chartRange === '7D' ? 'Last 7 Days' : chartRange === '1M' ? 'This Month' : 'This Year'}
            <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
              {[
                { label: 'Last 7 Days', value: '7D' },
                { label: 'This Month', value: '1M' },
                { label: 'This Year', value: '1Y' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setChartRange(option.value);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-medium transition-colors flex items-center justify-between hover:bg-slate-50"
                >
                  <span className={chartRange === option.value ? 'text-slate-900 font-semibold' : 'text-slate-500'}>
                    {option.label}
                  </span>
                  {chartRange === option.value && (
                    <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Chart container with custom transparent premium scrollbar */}
      <div className="flex-1 flex items-end justify-between gap-3 pt-10 border-b border-slate-100/80 pb-2 relative z-10 overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200/50 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-2 min-w-full">
          <div className="border-t border-slate-50 w-full h-0"></div>
          <div className="border-t border-slate-50 w-full h-0"></div>
          <div className="border-t border-slate-50 w-full h-0"></div>
        </div>
        
        {trendData.map((dayData, i) => {
          const val = Number(dayData.dailyInflow) || 0;
          const heightPercent = val === 0 ? 2 : (val / maxInflow) * 100; 
          const tooltipVal = val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val;

          return (
            <div key={i} className="w-full min-w-[24px] flex justify-center group relative z-10 h-full items-end">
              <div 
                className="w-full max-w-[48px] bg-brand-light/10 rounded-t-xl group-hover:bg-brand-light/90 transition-all duration-300 cursor-pointer relative"
                style={{ height: `${heightPercent}%` }}
              >
                {val > 0 && (
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded-lg font-medium transition-opacity whitespace-nowrap">
                    {tooltipVal}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-between w-full text-[11px] font-medium text-slate-400 mt-4 px-3 uppercase tracking-widest relative z-10 overflow-x-hidden min-w-max">
        {trendData.map((dayData, i) => (
          <span key={i} className="flex-1 text-center truncate px-1 min-w-[24px]">{dayData.dayOfWeek}</span>
        ))}
      </div>
    </div>
  );
}