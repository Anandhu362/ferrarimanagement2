// frontend/src/components/logs/cards/PettyCashLogsCard.jsx
import React, { useState, useEffect, useRef } from 'react';

export default function PettyCashLogsCard({ pettyCashData, loading, isExpanded, onExpand }) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef(null);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [pettyCashData, isExpanded]);

  useEffect(() => {
    if (selectedIndex >= 0 && containerRef.current) {
      const rows = containerRef.current.querySelectorAll('tbody tr');
      if (rows[selectedIndex]) {
        rows[selectedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const handleKeyDown = (e) => {
    if (!pettyCashData || pettyCashData.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, pettyCashData.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    }
  };
  
  const formatTrxDate = (dateVal) => {
    if (!dateVal) return '--:--';
    try {
      let dateStr = typeof dateVal === 'object' && dateVal.value ? dateVal.value : String(dateVal);
      dateStr = dateStr.replace(' ', 'T');
      const dateObj = new Date(dateStr);
      if (isNaN(dateObj.getTime())) return 'Invalid Date';
      
      return dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) + ' - ' + 
             dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getTrxColors = (type) => {
    return { dot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]', text: 'text-amber-600', prefix: '- ' };
  };

  const getStatusBadge = (status) => {
    if (status === 'SYSTEM') return 'bg-blue-50 text-blue-500 border-blue-200/50';
    if (status === 'PENDING CEO') return 'bg-purple-50 text-purple-600 border-purple-200/50';
    if (status === 'VERIFIED') return 'bg-emerald-50 text-emerald-600 border-emerald-200/50';
    return 'bg-slate-50 text-slate-500 border-slate-200/50';
  };

  return (
    <div className={`bg-white rounded-[2rem] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden animate-in slide-in-from-bottom-4 duration-500 flex flex-col transition-all ${
      isExpanded ? 'h-[75vh]' : 'min-h-[500px] h-[55vh]'
    }`}>
      
      <div className="bg-amber-500 px-8 py-5 flex items-center justify-between relative overflow-hidden shrink-0">
        <div className="absolute -right-4 -top-12 w-32 h-32 bg-amber-400 rounded-full blur-2xl opacity-50 pointer-events-none"></div>
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg tracking-wide uppercase">Petty Cash</h3>
            <p className="text-amber-100 text-xs font-medium">Daily miscellaneous expenses</p>
          </div>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="bg-white/20 px-4 py-1.5 rounded-full backdrop-blur-sm">
            <span className="text-white text-xs font-bold">{pettyCashData?.length || 0} Records</span>
          </div>
          <button onClick={onExpand} className="w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-colors text-white">
            {isExpanded ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 9V5m0 4H5m4 0l-5-5m11 5V5m0 4h4m-4 0l5-5M9 15v4m0-4H5m4 0l5 5m11-5v4m0-4h4m-4 0l5 5" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 8V4m0 0h4M4 4l5 5m11-4v4m0 0h-4m4 0l-5-5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5 5" /></svg>
            )}
          </button>
        </div>
      </div>

      <div 
        ref={containerRef}
        tabIndex={0} 
        onKeyDown={handleKeyDown}
        className="overflow-auto grow focus:outline-none [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200/80 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full relative"
      >
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4">
            <span className="relative flex h-6 w-6">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-6 w-6 bg-amber-500"></span>
            </span>
            <p className="text-slate-400 font-medium tracking-wide animate-pulse">Loading petty cash...</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 shadow-sm">
                <th className="px-6 py-4 whitespace-nowrap bg-slate-50/95 backdrop-blur-md border-b border-slate-100/80">Transaction ID</th>
                <th className="px-6 py-4 whitespace-nowrap bg-slate-50/95 backdrop-blur-md border-b border-slate-100/80">Date & Time</th>
                <th className="px-6 py-4 w-full bg-slate-50/95 backdrop-blur-md border-b border-slate-100/80">Description</th>
                <th className="px-6 py-4 text-right whitespace-nowrap bg-slate-50/95 backdrop-blur-md border-b border-slate-100/80">Amount (AED)</th>
                <th className="px-6 py-4 text-center whitespace-nowrap bg-slate-50/95 backdrop-blur-md border-b border-slate-100/80">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 text-sm">
              {!pettyCashData || pettyCashData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-12 text-center text-slate-400 font-medium bg-slate-50/30">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>No petty cash records found for this period.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                pettyCashData.map((trx, index) => {
                  const billedVal = parseFloat(trx.billedAmount || trx.billed_amount || 0);
                  const { dot, text, prefix } = getTrxColors(trx.type);
                  const isSelected = index === selectedIndex;
                  
                  return (
                    <tr 
                      key={index} 
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`transition-colors group cursor-pointer ${
                        isSelected ? 'bg-amber-100/60' : 'hover:bg-amber-50/30'
                      }`}
                    >
                      <td className="px-6 py-4 text-slate-900 font-medium whitespace-nowrap">{trx.id}</td>
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap font-light text-xs group-hover:text-slate-700 transition-colors">{formatTrxDate(trx.createdAt || trx.created_at)}</td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`}></span>
                          <div className="flex flex-col">
                            <span className="text-slate-700 font-medium group-hover:text-slate-900 transition-colors line-clamp-1">
                              {trx.description}
                            </span>
                            {billedVal > 0 && (
                              <span className="text-[10px] text-slate-500 mt-0.5 tracking-wide group-hover:text-slate-700 transition-colors">
                                Bill: AED {billedVal.toLocaleString(undefined, {minimumFractionDigits: 2})}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className={`px-6 py-4 text-right font-semibold whitespace-nowrap tracking-tight ${text}`}>
                        {prefix}{parseFloat(trx.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </td>
                      
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 rounded-xl text-[10px] font-semibold tracking-wide uppercase border ${getStatusBadge(trx.status || 'COMPLETED')}`}>
                          {trx.status || 'COMPLETED'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}