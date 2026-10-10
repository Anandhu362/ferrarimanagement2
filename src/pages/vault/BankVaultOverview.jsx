// frontend/src/pages/vault/BankVaultOverview.jsx
import React, { useState, useEffect } from 'react';
import api, { getBankBalanceForDate } from '../../config/api'; 
import BankTransactionForm from '../../components/vault/BankTransactionForm'; 
import BankLogsCard from '../../components/vault/BankLogsCard'; 

export default function BankVaultOverview() {
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Toggle this state to trigger child component re-fetches
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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

  // Fetch the specific date's closing balance when selectedDate or refreshTrigger changes
  useEffect(() => {
    const fetchDateSnapshot = async () => {
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
  }, [selectedDate, refreshTrigger]); 

  useEffect(() => {
    fetchBankVaultData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]); 

  // This function increments the trigger, forcing all useEffects and child components to sync
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
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-8">
        
        {/* LEFT COLUMN: Balance, Rules, and Manual Form */}
        <div className="xl:col-span-5 space-y-5 lg:space-y-6">
          
          {/* Main Balance Card - Optimized for Laptop Screens */}
          <div className={`bg-brand-dark rounded-[1.75rem] lg:rounded-[2rem] p-6 lg:p-7 xl:p-8 text-white relative overflow-hidden shadow-xl flex flex-col justify-center transition-all duration-500 ${snapshotData ? 'min-h-[320px]' : 'min-h-[220px] lg:min-h-[240px]'}`}>
            <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <p className="text-white/60 text-xs font-semibold mb-1.5 tracking-widest uppercase">Total Banked Balance</p>
                <h3 className="text-3xl lg:text-4xl xl:text-5xl font-semibold tracking-tighter">
                  <span className="text-xl lg:text-2xl text-white/50 font-light mr-2">AED</span>
                  {totalBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}
                </h3>
              </div>
              
              {snapshotData && selectedDate && (
                <div className="mt-5 p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-inner">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-white/80 text-[10px] font-semibold uppercase tracking-widest">
                      Closing Balance: {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-end border-b border-white/10 pb-3 mb-3">
                    <h4 className="text-xl lg:text-2xl font-medium text-white tracking-tight">
                      <span className="text-xs lg:text-sm text-white/50 font-light mr-1">AED</span>
                      {parseFloat(snapshotData.closingBalance).toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </h4>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 flex flex-col justify-center">
                      <p className="text-emerald-400/80 text-[9px] uppercase tracking-wider mb-0.5 font-semibold flex items-center gap-1">
                         <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                         Inflow
                      </p>
                      <p className="text-emerald-300 text-xs sm:text-sm font-bold tracking-tight">+{parseFloat(snapshotData.dayInflow).toLocaleString()}</p>
                    </div>
                    <div className="flex-1 bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/20 flex flex-col justify-center">
                      <p className="text-rose-400/80 text-[9px] uppercase tracking-wider mb-0.5 font-semibold flex items-center gap-1">
                         <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                         Outflow
                      </p>
                      <p className="text-rose-300 text-xs sm:text-sm font-bold tracking-tight">-{parseFloat(snapshotData.dayOutflow).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 mt-4 border-t border-white/10 flex justify-between items-center text-xs lg:text-sm">
                <span className="text-white/60 font-light">Last Reconciliation</span>
                <span className="font-medium text-white">Today, 09:00 AM</span>
              </div>
            </div>
          </div>

          {/* Compact Rules Indicator for Laptop Space Efficiency */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-slate-100/90 shadow-sm flex items-center gap-2.5 text-xs text-slate-500">
            <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="leading-snug font-light">Tracks physical CEO safe deposits in ledger plus manual adjustments.</span>
          </div>

          {/* Manual Bank Transaction Form */}
          <BankTransactionForm onSuccess={handleTransactionSuccess} />
        </div>

        {/* RIGHT COLUMN: Vertical Log Container */}
        <div className="xl:col-span-7 h-full">
          {/* Note: BankLogsCard inherently handles its own fetching. We just pass down the orchestration callbacks. */}
          <BankLogsCard 
            refreshTrigger={refreshTrigger} 
            onDateChange={(date) => setSelectedDate(date)} 
            onEditSuccess={handleTransactionSuccess} 
          />
        </div>
        
      </div>
    </div>
  );
}