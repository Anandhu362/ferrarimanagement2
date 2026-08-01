// frontend/src/pages/vault/BankVaultOverview.jsx
import React, { useState, useEffect } from 'react';
import api, { getBankBalanceForDate } from '../../config/api'; // ✅ IMPORTED NEW API HELPER
import BankTransactionForm from '../../components/vault/BankTransactionForm'; 
import BankLogsCard from '../../components/vault/BankLogsCard'; 

export default function BankVaultOverview() {
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Toggle this state to trigger child component re-fetches
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // ✅ NEW: State for tracking the selected date and its fetched snapshot data
  const [selectedDate, setSelectedDate] = useState(null);
  const [snapshotData, setSnapshotData] = useState(null);

  // Fetch overarching persistent total balance
  const fetchBankVaultData = async () => {
    try {
      const activeBranch = localStorage.getItem('active_branch');
      if (!activeBranch) {
        console.warn("No active branch selected.");
        setLoading(false);
        return;
      }
      
      const response = await api.get(`/api/vault/bank-summary?branchId=${encodeURIComponent(activeBranch)}`);
      const result = response.data; 

      if (result.success) {
        setTotalBalance(result.totalBalance || 0);
      }
    } catch (error) {
      console.error("Error fetching bank vault data:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Fetch the specific date's closing balance when selectedDate changes
  useEffect(() => {
    const fetchDateSnapshot = async () => {
      // If the user clears the filter, reset the snapshot
      if (!selectedDate) {
        setSnapshotData(null);
        return;
      }

      try {
        const activeBranch = localStorage.getItem('active_branch');
        if (!activeBranch) return;

        const response = await getBankBalanceForDate(activeBranch, selectedDate);
        
        if (response.data.success) {
          setSnapshotData(response.data);
        }
      } catch (error) {
        console.error("Error fetching bank snapshot data:", error);
        setSnapshotData(null);
      }
    };

    fetchDateSnapshot();
  }, [selectedDate, refreshTrigger]); // Re-fetches if a manual trx is added for that date

  useEffect(() => {
    fetchBankVaultData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]); 

  const handleTransactionSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (loading && totalBalance === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <span className="relative flex h-6 w-6">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-light opacity-75"></span>
          <span className="relative inline-flex rounded-full h-6 w-6 bg-brand-dark"></span>
        </span>
        <p className="text-slate-500 font-medium tracking-wide animate-pulse">Syncing Bank Data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-12">
      
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-[1.75rem] font-semibold text-slate-900 tracking-tight leading-tight">Bank Vault Overview</h2>
          <p className="text-slate-500 text-sm mt-1.5 font-light tracking-wide">Real-time read-only view of cumulative bank deposits.</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50/50 px-4 py-2 rounded-full border border-emerald-100">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-semibold text-emerald-600 tracking-wide uppercase">Live Sync Active</span>
        </div>
      </div>

      {/* Main Content Area - Split Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Balance, Rules, and Manual Form */}
        <div className="xl:col-span-5 space-y-8">
          
          {/* Main Balance Card */}
          <div className={`bg-brand-dark rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl flex flex-col justify-center transition-all duration-500 ${snapshotData ? 'min-h-[380px]' : 'min-h-[280px]'}`}>
            <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <p className="text-white/60 text-xs font-semibold mb-2 tracking-widest uppercase">Total Banked Balance</p>
                <h3 className="text-4xl lg:text-5xl font-semibold tracking-tighter">
                  <span className="text-2xl text-white/50 font-light mr-2">AED</span>
                  {totalBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}
                </h3>
              </div>
              
              {/* ✅ NEW: Dynamic Selected Date Snapshot UI */}
              {snapshotData && selectedDate && (
                <div className="mt-8 p-5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-inner">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-white/80 text-[11px] font-semibold uppercase tracking-widest">
                      Closing Balance: {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-end border-b border-white/10 pb-4 mb-4">
                    <h4 className="text-2xl font-medium text-white tracking-tight">
                      <span className="text-sm text-white/50 font-light mr-1">AED</span>
                      {parseFloat(snapshotData.closingBalance).toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </h4>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1 bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/20 flex flex-col justify-center">
                      <p className="text-emerald-400/80 text-[10px] uppercase tracking-wider mb-1 font-semibold flex items-center gap-1">
                         <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                         Inflow
                      </p>
                      <p className="text-emerald-300 text-sm font-bold tracking-tight">+{parseFloat(snapshotData.dayInflow).toLocaleString()}</p>
                    </div>
                    <div className="flex-1 bg-rose-500/10 px-3 py-2 rounded-xl border border-rose-500/20 flex flex-col justify-center">
                      <p className="text-rose-400/80 text-[10px] uppercase tracking-wider mb-1 font-semibold flex items-center gap-1">
                         <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                         Outflow
                      </p>
                      <p className="text-rose-300 text-sm font-bold tracking-tight">-{parseFloat(snapshotData.dayOutflow).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-6 mt-6 border-t border-white/10 flex justify-between items-center text-sm">
                <span className="text-white/60 font-light">Last Reconciliation</span>
                <span className="font-medium text-white">Today, 09:00 AM</span>
              </div>
            </div>
          </div>

          {/* Rules Card */}
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex flex-col justify-center">
            <h4 className="text-sm font-semibold text-slate-900 mb-6">Bank Tracking Rules</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex gap-3 text-slate-600">
                <svg className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                <span className="leading-relaxed font-light">This vault tracks physical deposits explicitly marked as Bank Deposits in the ledger, plus manual bank adjustments.</span>
              </li>
            </ul>
          </div>

          {/* Manual Bank Transaction Form */}
          <BankTransactionForm onSuccess={handleTransactionSuccess} />
        </div>

        {/* RIGHT COLUMN: Vertical Log Container */}
        <div className="xl:col-span-7 h-full">
          {/* ✅ NEW: Pass onDateChange to BankLogsCard to receive the selected calendar date */}
          <BankLogsCard 
            refreshTrigger={refreshTrigger} 
            onDateChange={(date) => setSelectedDate(date)} 
          />
        </div>
        
      </div>
    </div>
  );
}