// frontend/src/components/vault/BankLogsCard.jsx
import React, { useState, useEffect, useRef } from 'react';
import api from '../../config/api';
import PremiumCalendar from '../shared/PremiumCalendar';

// ✅ NEW: Added onDateChange to the component props to communicate with the parent
export default function BankLogsCard({ refreshTrigger, onDateChange }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters State
  const [selectedDates, setSelectedDates] = useState([]);
  const [filterType, setFilterType] = useState('ALL'); // 'ALL', 'CREDIT', 'DEBIT'
  
  // UI Dropdown State
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  
  const dropdownRef = useRef(null);

  // Close custom dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsTypeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchLogs = async (dates = selectedDates) => {
    setLoading(true);
    try {
      const activeBranch = localStorage.getItem('active_branch') || 'DXB-MAIN';
      let endpoint = `/api/vault/bank-logs?branchId=${encodeURIComponent(activeBranch)}`;
      
      // Send dates to backend to pull historical data if needed
      if (dates && dates.length > 0) {
        endpoint += `&dates=${dates.join(',')}`;
      }

      const response = await api.get(endpoint);
      if (response.data.success) {
        setLogs(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching bank logs:", error);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when dates change or a new transaction is recorded
  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDates, refreshTrigger]);

  // ✅ UPDATED: Handle date selection and notify the parent component
  const handleDateSelect = (dates) => {
    setSelectedDates(dates);
    
    // Notify the parent (BankVaultOverview) so it can fetch the specific date's snapshot
    if (onDateChange) {
        // If a date is selected, pass the first date string. If cleared, pass null.
        if (dates && dates.length > 0) {
            onDateChange(dates[0]);
        } else {
            onDateChange(null);
        }
    }
  };

  // ✅ ROBUST FRONTEND FILTERING
  const displayedLogs = logs.filter(log => {
    // 1. Strict Date Filter (Solves backend timezone/format bleeding)
    if (selectedDates.length > 0) {
      let logDateStr = "";
      if (log.createdAt && log.createdAt.length === 10) {
        logDateStr = log.createdAt; // YYYY-MM-DD format
      } else if (log.createdAt) {
        logDateStr = new Date(log.createdAt).toISOString().split('T')[0];
      }
      
      if (!selectedDates.includes(logDateStr)) return false;
    }

    // 2. Strict Type Filter (Credit / Debit)
    if (filterType !== 'ALL') {
      // Physical vault OUTFLOWs sent to the bank are always Credits to the bank balance.
      const isCredit = log.type === 'BANK_MANUAL_CREDIT' || log.type === 'OUTFLOW';
      
      if (filterType === 'CREDIT' && !isCredit) return false;
      if (filterType === 'DEBIT' && isCredit) return false;
    }

    return true;
  });

  return (
    <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col h-full min-h-[600px] relative z-10">
      
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative z-30">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Transaction Logs</h3>
          <p className="text-xs text-slate-500 mt-1 font-light">Recent bank activity ledger.</p>
        </div>

        <div className="flex items-center gap-3">
          
          {/* Custom Type Filter Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => {
                setIsTypeDropdownOpen(!isTypeDropdownOpen);
                setIsCalendarOpen(false);
              }}
              className="flex items-center gap-2 bg-[#FCFCFD] border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:border-brand-light/50 focus:ring-2 focus:ring-brand-light/10 transition-all shadow-sm"
            >
              <span className="min-w-[70px] text-left">
                {filterType === 'ALL' ? 'All Types' : filterType === 'CREDIT' ? 'Credits Only' : 'Debits Only'}
              </span>
              <svg className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isTypeDropdownOpen ? 'rotate-180 text-brand-dark' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </button>

            {isTypeDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsTypeDropdownOpen(false)}></div>
                <div className="absolute top-[calc(100%+8px)] right-0 w-48 bg-white rounded-[1.25rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100/80 z-50 animate-in slide-in-from-top-2 fade-in duration-200 p-2">
                  {['ALL', 'CREDIT', 'DEBIT'].map((type) => (
                    <button
                      key={type}
                      onClick={() => { setFilterType(type); setIsTypeDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-between ${
                        filterType === type ? 'bg-slate-50 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      {type === 'ALL' ? 'All Types' : type === 'CREDIT' ? 'Credits Only' : 'Debits Only'}
                      {filterType === type && (
                        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Premium Calendar Date Filter */}
          <div className="relative z-20">
            <button 
              onClick={() => {
                setIsCalendarOpen(!isCalendarOpen);
                setIsTypeDropdownOpen(false);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm border ${
                selectedDates.length > 0 
                  ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800' 
                  : 'bg-[#FCFCFD] text-slate-700 border-slate-200 hover:border-brand-light/50'
              }`}
            >
              <svg className={`w-4 h-4 ${selectedDates.length > 0 ? 'text-white' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>
                {selectedDates.length > 0 
                  ? (selectedDates.length === 1 ? new Date(selectedDates[0]).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : `${selectedDates.length} Dates`) 
                  : 'Filter Date'}
              </span>
            </button>
            <PremiumCalendar 
              isOpen={isCalendarOpen} 
              onClose={() => setIsCalendarOpen(false)} 
              selectedDates={selectedDates}
              onDateSelect={handleDateSelect}
            />
          </div>
        </div>
      </div>

      {/* Logs List Container */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 no-scrollbar relative z-10">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-50">
            <span className="relative flex h-6 w-6">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-light opacity-75"></span>
              <span className="relative inline-flex rounded-full h-6 w-6 bg-brand-dark"></span>
            </span>
          </div>
        ) : displayedLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-70">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <p className="text-sm font-semibold text-slate-600">No transactions found</p>
            <p className="text-xs text-slate-400 mt-1">Adjust your filters or date selection.</p>
          </div>
        ) : (
          displayedLogs.map((log) => {
            // ✅ Clean Logic for Credit vs Debit
            const isCredit = log.type === 'BANK_MANUAL_CREDIT' || log.type === 'OUTFLOW';
            
            // Extract clean title from description
            let rawTitle = (log.description || '').replace('[Bank Account] ', '').split(' - Notes removed:')[0];
            
            let displayTitle = rawTitle;
            let displaySubtitle = 'Manual Adjustment';
            const companyMatch = rawTitle.match(/\[(.*?)\] (.*)/);
            
            if (companyMatch) {
                displayTitle = companyMatch[1]; 
                displaySubtitle = companyMatch[2]; 
            } else if (isCredit && log.type === 'OUTFLOW') {
                displaySubtitle = 'Physical Cash Deposit';
            }

            return (
              <div 
                key={log.id} 
                className="group p-4 rounded-2xl bg-[#FCFCFD] hover:bg-white border border-slate-100 hover:border-slate-200 transition-all shadow-sm hover:shadow-md flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  {/* Icon Indicator */}
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 border ${
                    isCredit ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'
                  }`}>
                    {isCredit ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4" /></svg>
                    )}
                  </div>
                  
                  {/* Text Information */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 tracking-tight line-clamp-1">{displayTitle}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-medium text-slate-500">{new Date(log.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span className="text-[11px] text-slate-400 line-clamp-1 truncate max-w-[150px] sm:max-w-[200px]">{displaySubtitle}</span>
                    </div>
                  </div>
                </div>

                {/* Amount */}
                <div className={`text-right font-bold tracking-tight text-sm sm:text-base whitespace-nowrap pl-4 ${
                  isCredit ? 'text-emerald-600' : 'text-slate-900'
                }`}>
                  {isCredit ? '+' : '-'} <span className="text-xs mr-1 opacity-70">AED</span>
                  {log.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}