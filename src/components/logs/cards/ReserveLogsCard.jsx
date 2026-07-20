import React, { useState } from 'react';
import ReserveReversalModal from '../../vault/ReserveReversalModal';

export default function ReserveLogsCard({ logs = [], loading = false, onRefresh }) {
  
  // State for the Reversal Modal
  const [selectedLog, setSelectedLog] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Helper to format the Date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString.value || dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  // Helper to format the Time
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString.value || dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const handleReverseClick = (log) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
        
        {/* HEADER: Distinct Indigo Theme for Reserve Vault */}
        <div className="bg-indigo-500 px-6 py-5 text-white flex justify-between items-center relative overflow-hidden">
          {/* Decorative background glow */}
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold tracking-wide uppercase text-sm">RESERVE FLOAT</h3>
              <p className="text-indigo-100 text-[10px] uppercase tracking-wider mt-0.5 font-medium">Change Pool Activity</p>
            </div>
          </div>
          
          <div className="bg-white/20 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm border border-white/10 relative z-10 shadow-sm">
            {logs.length} Records
          </div>
        </div>

        {/* TABLE HEADERS */}
        <div className="grid grid-cols-12 gap-3 px-6 py-3.5 bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <div className="col-span-3">Date & Time</div>
          <div className="col-span-5 pl-2">Description</div>
          <div className="col-span-2 text-right">Amount (AED)</div>
          <div className="col-span-2 text-right pr-2">Status</div>
        </div>

        {/* LOGS LIST */}
        <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[450px] p-2 space-y-1 bg-white custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-3 py-16">
              <div className="w-8 h-8 border-2 border-indigo-100 border-t-indigo-500 rounded-full animate-spin"></div>
              <p className="text-xs font-semibold text-slate-400 tracking-wide animate-pulse">Syncing Reserve Logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center px-4">
              <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
              </div>
              <p className="text-sm font-semibold text-slate-600">No Reserve Activity Found</p>
              <p className="text-xs text-slate-400 mt-1 font-light max-w-[200px] leading-relaxed">There are no additions or deductions for the selected date.</p>
            </div>
          ) : (
            logs.map((log) => {
              const amountVal = parseFloat(log.amount);
              const isAdd = amountVal > 0;
              const isZero = amountVal === 0;
              const isReversed = log.status === 'REVERSED';

              return (
                <div key={log.id} className={`grid grid-cols-12 gap-3 px-4 py-3.5 items-center hover:bg-indigo-50/40 rounded-xl transition-all duration-200 border border-transparent hover:border-indigo-100/50 group ${isReversed ? 'opacity-70' : ''}`}>
                  
                  {/* Date & Time */}
                  <div className="col-span-3 flex flex-col">
                    <span className={`text-[11px] font-semibold ${isReversed ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-700'}`}>{formatDate(log.createdAt)}</span>
                    <span className="text-[10px] font-medium text-slate-400 mt-0.5">{formatTime(log.createdAt)}</span>
                  </div>
                  
                  {/* Description */}
                  <div className="col-span-5 flex items-start gap-2 pl-2">
                    <span className={`${isReversed ? 'text-slate-300' : 'text-indigo-400'} mt-0.5 shrink-0`}>•</span>
                    <span className={`text-xs font-medium leading-snug line-clamp-2 pr-2 ${isReversed ? 'text-slate-400' : 'text-slate-600'}`} title={log.description}>
                      {log.description}
                    </span>
                  </div>
                  
                  {/* Amount */}
                  <div className="col-span-2 text-right">
                    <span className={`text-xs font-bold tracking-tight ${isZero ? 'text-slate-500' : isAdd ? (isReversed ? 'text-slate-400 line-through' : 'text-emerald-500') : 'text-rose-500'}`}>
                      {isAdd ? '+' : ''}{amountVal.toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </span>
                  </div>
                  
                  {/* Status Pill & Actions */}
                  <div className="col-span-2 flex justify-end items-center gap-2">
                    
                    {/* Action: Edit/Reverse Icon (Only visible on hover for active Additions) */}
                    {isAdd && !isReversed && (
                      <button 
                        onClick={() => handleReverseClick(log)}
                        className="text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 transform scale-95 hover:scale-100"
                        title="Reverse Entry"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                      </button>
                    )}

                    <span className={`text-[9px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border ${
                      isReversed 
                        ? 'bg-rose-50 text-rose-600 border-rose-200/60' 
                        : log.status === 'VERIFIED' 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200/60' 
                          : 'bg-amber-50 text-amber-600 border-amber-200/60'
                    }`}>
                      {log.status || 'VERIFIED'}
                    </span>
                  </div>

                </div>
              );
            })
          )}
        </div>
      </div>

      <ReserveReversalModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        logData={selectedLog}
        onSuccess={() => {
          if (onRefresh) onRefresh();
        }}
      />
    </>
  );
}