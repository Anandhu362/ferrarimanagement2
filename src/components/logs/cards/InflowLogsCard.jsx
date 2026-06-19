// frontend/src/components/logs/cards/InflowLogsCard.jsx
import React from 'react';

export default function InflowLogsCard({ inflowsData, loading }) {
  
  // --- Helper Functions ---
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
    // Tailored for Inflows
    if (type === 'TEMP_INFLOW') return { dot: 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]', text: 'text-purple-600', prefix: '+ ' };
    return { dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]', text: 'text-emerald-600', prefix: '+ ' };
  };

  const getStatusBadge = (status) => {
    if (status === 'SYSTEM') return 'bg-blue-50 text-blue-500 border-blue-200/50';
    if (status === 'PENDING CEO') return 'bg-purple-50 text-purple-600 border-purple-200/50';
    if (status === 'VERIFIED') return 'bg-emerald-50 text-emerald-600 border-emerald-200/50';
    return 'bg-slate-50 text-slate-500 border-slate-200/50';
  };

  // Helper function to strip "Invoice INV-XXX - " and keep only the Company Name
  const extractCompanyName = (desc) => {
    if (!desc) return '';
    const parts = desc.split(' - ');
    if (parts.length > 1) {
      // Drops the first part (Invoice number) and joins the rest
      return parts.slice(1).join(' - ').trim();
    }
    return desc;
  };

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden animate-in slide-in-from-bottom-4 duration-500 flex flex-col min-h-[500px] h-[55vh]">
      
      {/* Emerald Banner Header */}
      <div className="bg-emerald-500 px-8 py-5 flex items-center justify-between relative overflow-hidden shrink-0">
        <div className="absolute -right-4 -top-12 w-32 h-32 bg-emerald-400 rounded-full blur-2xl opacity-50 pointer-events-none"></div>
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg tracking-wide uppercase">Inflows</h3>
            <p className="text-emerald-100 text-xs font-medium">All revenue and incoming cash</p>
          </div>
        </div>
        
        <div className="bg-white/20 px-4 py-1.5 rounded-full backdrop-blur-sm relative z-10">
          <span className="text-white text-xs font-bold">{inflowsData?.length || 0} Records</span>
        </div>
      </div>

      {/* Scrollable Table Content */}
      <div className="overflow-auto grow [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200/80 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full relative">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4">
            <span className="relative flex h-6 w-6">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-6 w-6 bg-emerald-500"></span>
            </span>
            <p className="text-slate-400 font-medium tracking-wide animate-pulse">Loading inflows...</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 shadow-sm">
                <th className="px-6 py-4 whitespace-nowrap bg-slate-50/95 backdrop-blur-md border-b border-slate-100/80">Date & Time</th>
                <th className="px-6 py-4 w-full bg-slate-50/95 backdrop-blur-md border-b border-slate-100/80">Company</th>
                <th className="px-6 py-4 text-right whitespace-nowrap bg-slate-50/95 backdrop-blur-md border-b border-slate-100/80">Amount (AED)</th>
                <th className="px-6 py-4 text-center whitespace-nowrap bg-slate-50/95 backdrop-blur-md border-b border-slate-100/80">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 text-sm">
              {!inflowsData || inflowsData.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-8 py-12 text-center text-slate-400 font-medium bg-slate-50/30">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                      <span>No inflow records found for this period.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                inflowsData.map((trx, index) => {
                  const billedVal = parseFloat(trx.billedAmount || trx.billed_amount || 0);
                  const { dot, text, prefix } = getTrxColors(trx.type);
                  
                  return (
                    <tr key={index} className="hover:bg-emerald-50/30 transition-colors group">
                      <td className="px-6 py-4 text-slate-400 whitespace-nowrap font-light text-xs">{formatTrxDate(trx.createdAt || trx.created_at)}</td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`}></span>
                          <div className="flex flex-col">
                            <span className="text-slate-600 font-medium group-hover:text-slate-900 transition-colors line-clamp-1">
                              {extractCompanyName(trx.description)}
                            </span>
                            
                            {billedVal > 0 && (
                              <span className="text-[10px] text-slate-400 mt-0.5 tracking-wide">
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