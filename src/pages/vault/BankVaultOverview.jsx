// frontend/src/pages/vault/BankVaultOverview.jsx
import React, { useState, useEffect } from 'react';
import api from '../../config/api'; 
import BankTransactionForm from '../../components/vault/BankTransactionForm'; // ✅ IMPORTED NEW FORM
import BankLogsCard from '../../components/vault/BankLogsCard'; // ✅ IMPORTED NEW LOGS CARD

export default function BankVaultOverview() {
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // ✅ NEW: Toggle this state to trigger child component re-fetches
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // ✅ MOVED FUNCTION OUTSIDE useEffect so it can be called manually
  const fetchBankVaultData = async () => {
    try {
      // Grab the active branch to ensure we don't fetch global sums
      const activeBranch = localStorage.getItem('active_branch');
      
      if (!activeBranch) {
        console.warn("No active branch selected.");
        setLoading(false);
        return;
      }
      
      // Fetches data from the new Bank Summary endpoint
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

  useEffect(() => {
    fetchBankVaultData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]); // ✅ Re-fetch when trigger changes

  const handleTransactionSuccess = () => {
    // Increment trigger to refetch both the balance and the logs component
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
          <div className="bg-brand-dark rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl flex flex-col justify-center">
            <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <p className="text-white/60 text-xs font-semibold mb-2 tracking-widest uppercase">Total Banked Balance</p>
              <h3 className="text-4xl lg:text-5xl font-semibold tracking-tighter mb-8">
                <span className="text-2xl text-white/50 font-light mr-2">AED</span>
                {totalBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}
              </h3>
              
              <div className="space-y-4 pt-6 border-t border-white/10">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/60 font-light">Last Reconciliation</span>
                  <span className="font-medium text-white">Today, 09:00 AM</span>
                </div>
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
          <BankLogsCard refreshTrigger={refreshTrigger} />
        </div>
        
      </div>

    </div>
  );
}