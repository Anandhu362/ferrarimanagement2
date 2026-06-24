// frontend/src/pages/logs/LogsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PremiumCalendar from '../../components/shared/PremiumCalendar';
import DailySummaryCards from '../../components/logs/DailySummaryCards';
import ExportLedgerModal from '../../components/logs/ExportLedgerModal';
// The 4 categorized table cards
import InflowLogsCard from '../../components/logs/cards/InflowLogsCard';
import ExpenseLogsCard from '../../components/logs/cards/ExpenseLogsCard';
import TransferLogsCard from '../../components/logs/cards/TransferLogsCard';
import PettyCashLogsCard from '../../components/logs/cards/PettyCashLogsCard';
// ✅ Import the new Daily Denominations Card
import DailyDenominationsCard from '../../components/logs/cards/DailyDenominationsCard';
import api from '../../config/api'; 

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [branchError, setBranchError] = useState(false); 
  const navigate = useNavigate();
  
  // State for the Calendar Filter
  const [selectedDate, setSelectedDate] = useState(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // State for Export Modal
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // State: Tracks which card is currently maximized (full-screen)
  const [expandedCard, setExpandedCard] = useState(null); // 'inflows', 'expenses', 'transfers', 'pettyCash', or null

  // fetchLogs now accepts a date parameter to dynamically switch endpoints
  const fetchLogs = async (dateToFetch = selectedDate) => {
    setLoading(true);
    try {
      const activeBranch = localStorage.getItem('active_branch');
      
      // Safety check to prevent querying null paths if local storage is cleared
      if (!activeBranch) {
        setBranchError(true);
        setLoading(false);
        return;
      }
      
      // Dynamic API Endpoint switching using centralized Axios instance
      let endpoint = `/api/logs/all?branchId=${encodeURIComponent(activeBranch)}`;
      if (dateToFetch) {
        endpoint = `/api/logs/daily?branchId=${encodeURIComponent(activeBranch)}&date=${dateToFetch}`;
      }
      
      const response = await api.get(endpoint);
      const result = response.data; 
      
      if (result.success) {
        // Sort by the true epoch timestamp hidden in the Transaction ID
        const sortedLogs = result.data.sort((a, b) => {
          const timeA = parseInt(String(a.id).split('-')[1]) || 0;
          const timeB = parseInt(String(b.id).split('-')[1]) || 0;
          
          if (timeA > 0 && timeB > 0) {
              return timeB - timeA; // Descending (Newest first)
          }
          // Fallback
          const dateA = new Date(a.createdAt || a.created_at);
          const dateB = new Date(b.createdAt || b.created_at);
          return dateB - dateA; 
        });
        
        setLogs(sortedLogs);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    fetchLogs(date); // Immediately fetch new data when date changes
  };

  // Function to handle expanding/collapsing a card
  const handleExpandToggle = (cardName) => {
    if (expandedCard === cardName) {
      setExpandedCard(null); // Collapse if already expanded
    } else {
      setExpandedCard(cardName); // Expand the clicked card
    }
  };

  // --- Data Filtering Logic ---
  const inflows = logs.filter(t => t.type === 'INFLOW' || t.type === 'TEMP_INFLOW');
  const expenses = logs.filter(t => t.type === 'OUTFLOW' || t.type === 'EXPENSE');
  const transfers = logs.filter(t => t.type === 'TRANSFER' || t.type === 'EXCHANGE');
  const pettyCash = logs.filter(t => t.type === 'PETTY_CASH');

  // Branch Error UI Block
  if (branchError) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="bg-rose-50 border border-rose-100 p-8 rounded-[2rem] text-center max-w-md shadow-sm">
          <svg className="w-12 h-12 text-rose-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <h3 className="text-xl font-semibold text-slate-900 tracking-tight mb-2">Active Branch Missing</h3>
          <p className="text-slate-500 text-sm font-light mb-6">We could not identify your active branch location. Please log in or select a branch to view the master ledger.</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-brand-dark text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            Return to Setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-12">
      
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 relative z-40">
        <div>
          <h2 className="text-[1.75rem] font-semibold text-slate-900 tracking-tight leading-tight">Master Ledger Logs</h2>
          <p className="text-slate-500 text-sm mt-1.5 font-light tracking-wide">
            A complete, chronological audit trail of all vault inflows, expenses, and automated sweeps.
          </p>
        </div>
        
        {/* Filter, Export & Refresh Actions (Hidden if a card is expanded to save space) */}
        {!expandedCard && (
          <div className="flex items-center gap-3">
            
            {/* FILTER DATE BLOCK */}
            <div className="relative">
              <button 
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm border ${
                  selectedDate 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md hover:bg-slate-800' 
                    : 'bg-white text-slate-600 border-slate-200 hover:text-brand-dark hover:border-brand-light/30'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {selectedDate 
                  ? new Date(selectedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) 
                  : 'Filter Date'}
              </button>

              <PremiumCalendar 
                isOpen={isCalendarOpen} 
                onClose={() => setIsCalendarOpen(false)} 
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
              />
            </div>

            {/* EXPORT LEDGER BLOCK */}
            <div className="relative">
              <button 
                onClick={() => setIsExportModalOpen(!isExportModalOpen)}
                className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl border border-emerald-200/50 text-sm font-medium hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export Ledger
              </button>

              <ExportLedgerModal 
                isOpen={isExportModalOpen} 
                onClose={() => setIsExportModalOpen(false)} 
              />
            </div>

            {/* REFRESH BUTTON */}
            <button 
              onClick={() => fetchLogs()}
              className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:text-brand-dark hover:border-brand-light/30 transition-all shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        )}
      </div>

      {/* Conditional Rendering of Daily Summary Cards */}
      {selectedDate && !loading && !expandedCard && (
        <DailySummaryCards logs={logs} />
      )}

      {/* ✅ RESTRUCTURED DASHBOARD GRID VIEW */}
      {/* Splits into 12 columns: 8 for the tables, 4 for the Daily Denominations side-panel */}
      <div className={`transition-all duration-500 ${expandedCard ? 'block' : 'grid grid-cols-1 lg:grid-cols-12 gap-6'}`}>
        
        {/* LEFT COLUMN: The 4 Table Cards */}
        <div className={`${expandedCard ? 'block' : 'lg:col-span-8 grid grid-cols-1 xl:grid-cols-2 gap-6'}`}>
          
          {/* Back Button (Only shows when a card is expanded) */}
          {expandedCard && (
            <div className="mb-4 animate-in fade-in slide-in-from-left-4">
              <button 
                onClick={() => setExpandedCard(null)}
                className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 px-4 py-2 rounded-xl shadow-sm transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard View
              </button>
            </div>
          )}

          {/* INFLOWS CARD */}
          {(!expandedCard || expandedCard === 'inflows') && (
            <InflowLogsCard 
              inflowsData={inflows} 
              loading={loading} 
              isExpanded={expandedCard === 'inflows'}
              onExpand={() => handleExpandToggle('inflows')} 
            />
          )}

          {/* EXPENSES CARD */}
          {(!expandedCard || expandedCard === 'expenses') && (
            <ExpenseLogsCard 
              expensesData={expenses} 
              loading={loading} 
              isExpanded={expandedCard === 'expenses'}
              onExpand={() => handleExpandToggle('expenses')} 
            />
          )}

          {/* TRANSFERS CARD */}
          {(!expandedCard || expandedCard === 'transfers') && (
            <TransferLogsCard 
              transfersData={transfers} 
              loading={loading} 
              isExpanded={expandedCard === 'transfers'}
              onExpand={() => handleExpandToggle('transfers')} 
            />
          )}

          {/* PETTY CASH CARD */}
          {(!expandedCard || expandedCard === 'pettyCash') && (
            <PettyCashLogsCard 
              pettyCashData={pettyCash} 
              loading={loading} 
              isExpanded={expandedCard === 'pettyCash'}
              onExpand={() => handleExpandToggle('pettyCash')} 
            />
          )}
        </div>

        {/* ✅ RIGHT COLUMN: Daily Denominations Breakdown Sidebar */}
        {/* This column is entirely hidden if any table is expanded full-screen */}
        {!expandedCard && (
          <div className="lg:col-span-4 flex flex-col gap-6">
            <DailyDenominationsCard selectedDate={selectedDate} />
          </div>
        )}

      </div>

    </div>
  );
}