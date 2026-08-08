// frontend/src/pages/vault/VaultOverview.jsx
import React, { useState, useEffect } from 'react';
import api from '../../config/api'; // ✅ IMPORTING YOUR CENTRAL API
import ReserveVaultCard from '../../components/vault/ReserveVaultCard'; // ✅ Imported Reserve Vault Component
import ReserveLogsCard from '../../components/logs/cards/ReserveLogsCard'; // ✅ ADDED: Imported Reserve Logs Card

// The baseline structure we always want to show, even if quantity is 0
const DENOMINATION_TIERS = [
  { value: 1000, label: '1,000 AED', type: 'note' },
  { value: 500, label: '500 AED', type: 'note' },
  { value: 200, label: '200 AED', type: 'note' },
  { value: 100, label: '100 AED', type: 'note' },
  { value: 50, label: '50 AED', type: 'note' },
  { value: 20, label: '20 AED', type: 'note' },
  { value: 10, label: '10 AED', type: 'note' },
  { value: 5, label: '5 AED', type: 'note' },
  { value: 1, label: 'Mixed Coins', type: 'coin' },
];

export default function VaultOverview() {
  const [vaultData, setVaultData] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // ✅ ADDED: Dedicated state for Reserve Vault activity logs
  const [reserveLogs, setReserveLogs] = useState([]);
  const [reserveLoading, setReserveLoading] = useState(true);

  // ✅ ADDED: Fetch function for Reserve Logs
  const fetchReserveLogs = async () => {
    setReserveLoading(true);
    try {
      const activeBranch = localStorage.getItem('active_branch');
      if (!activeBranch) return;
      const reserveEndpoint = `/api/logs/reserve?branchId=${encodeURIComponent(activeBranch)}`;
      const response = await api.get(reserveEndpoint);
      
      if (response.data.success) {
        setReserveLogs(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching reserve logs:", error);
    } finally {
      setReserveLoading(false);
    }
  };

  useEffect(() => {
    const fetchVaultData = async () => {
      try {
        // Grab the active branch to ensure we don't fetch global sums
        const activeBranch = localStorage.getItem('active_branch');
        if (!activeBranch) return;
        
        // ✅ Fetches data from the CEO Vault table
        const response = await api.get(`/api/vault/summary?branchId=${encodeURIComponent(activeBranch)}&vaultType=ceo`);
        const result = response.data; // Axios automatically parses JSON

        if (result.success) {
          let currentTotal = 0;
          
          // Merge DB data with our baseline tiers
          const mergedData = DENOMINATION_TIERS.map(tier => {
            // Added parseFloat to ensure safe matching if BigQuery sends strings
            const dbMatch = result.data.find(row => parseFloat(row.denomination_value) === tier.value);
            const qty = dbMatch ? parseInt(dbMatch.total_quantity) : 0;
            const totalValue = qty * tier.value;
            
            currentTotal += totalValue;

            return { ...tier, qty, totalValue };
          });

          setTotalBalance(currentTotal);
          setVaultData(mergedData);
        }
      } catch (error) {
        console.error("Error fetching vault data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVaultData();
    fetchReserveLogs(); // ✅ ADDED: Call the reserve logs fetch on mount
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <span className="relative flex h-6 w-6">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-light opacity-75"></span>
          <span className="relative inline-flex rounded-full h-6 w-6 bg-brand-dark"></span>
        </span>
        <p className="text-slate-500 font-medium tracking-wide animate-pulse">Syncing Vault Data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-12">
      
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-[1.75rem] font-semibold text-slate-900 tracking-tight leading-tight">CEO Vault Overview</h2>
          <p className="text-slate-500 text-sm mt-1.5 font-light tracking-wide">Real-time read-only view of the main safe's rolling balance and precise denomination distribution.</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50/50 px-4 py-2 rounded-full border border-emerald-100">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-semibold text-emerald-600 tracking-wide uppercase">Live Sync Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Main Balance Card */}
          <div className="bg-brand-dark rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl">
            <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <p className="text-white/60 text-xs font-semibold mb-2 tracking-widest uppercase">Current Rolling Balance</p>
              <h3 className="text-4xl lg:text-5xl font-semibold tracking-tighter mb-8">
                <span className="text-2xl text-white/50 font-light mr-2">AED</span>
                {totalBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}
              </h3>
              
              <div className="space-y-4 pt-6 border-t border-white/10">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/60 font-light">Last Reconciliation</span>
                  <span className="font-medium text-white">Today, 09:00 AM</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/60 font-light">Pending Inflows</span>
                  <span className="font-medium text-emerald-400">+ AED 0.00</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rules Card */}
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
            <h4 className="text-sm font-semibold text-slate-900 mb-6">Vault Security Rules</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex gap-3 text-slate-600">
                <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                <span className="leading-relaxed font-light">Money cannot be manually adjusted here. It must flow through authorized Inflow or Expense forms.</span>
              </li>
              <li className="flex gap-3 text-slate-600">
                <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                <span className="leading-relaxed font-light">Petty cash replenishments are pulled automatically from these denominations.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* RIGHT COLUMN: Denomination Distribution */}
        <div className="lg:col-span-8 bg-white rounded-[2rem] p-8 lg:p-10 border border-slate-100 shadow-sm flex flex-col">
          
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Denomination Distribution</h3>
            <span className="text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
              9 Categories Tracked
            </span>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 pb-4 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">
            <div className="col-span-4 sm:col-span-3 pl-2">Note/Coin</div>
            <div className="col-span-2 text-center">Qty</div>
            <div className="col-span-4 sm:col-span-3 text-right">Total Value</div>
            <div className="col-span-4 text-right pr-2 hidden sm:block">Vault Share</div>
          </div>

          {/* List */}
          <div className="flex-1 space-y-6 mt-2">
            {vaultData.map((item, idx) => {
              // Calculate width for the progress bar based on total balance
              const percentage = totalBalance > 0 ? (item.totalValue / totalBalance) * 100 : 0;

              return (
                <div key={idx} className="grid grid-cols-12 gap-4 items-center group">
                  <div className="col-span-4 sm:col-span-3 flex items-center gap-3">
                    <div className={`w-8 h-6 rounded flex items-center justify-center text-[10px] font-bold ${item.type === 'note' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100 rounded-full w-7 h-7'}`}>
                      {item.type === 'note' ? '💵' : '🪙'}
                    </div>
                    <span className="text-sm font-medium text-slate-700">{item.label}</span>
                  </div>
                  
                  <div className="col-span-2 flex justify-center">
                    <span className="bg-slate-50 border border-slate-100 text-slate-600 text-xs font-medium px-4 py-1.5 rounded-xl">
                      {item.qty === 0 ? '-' : item.qty.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="col-span-6 sm:col-span-3 text-right font-semibold text-slate-900 text-sm">
                    {item.totalValue === 0 ? '-' : item.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </div>
                  
                  <div className="col-span-4 hidden sm:flex items-center justify-end pl-6">
                    <div className="w-full bg-slate-50 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${percentage > 30 ? 'bg-brand-dark' : percentage > 10 ? 'bg-brand-light' : 'bg-slate-400'}`} 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center text-sm">
            <span className="text-slate-400 font-light">Totals matched with database</span>
            <span className="font-semibold text-slate-900">AED {totalBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
          </div>

        </div>

      </div>

      {/* ✅ NEW: Reserve Vault Float Container added as a secondary section below the main view */}
      <div className="mt-8">
        <ReserveVaultCard />
      </div>
      
      {/* ✅ ADDED: Reserve Logs placed directly below the Reserve Vault card */}
      <div className="mt-8">
        <ReserveLogsCard 
          logs={reserveLogs} 
          loading={reserveLoading} 
          onRefresh={fetchReserveLogs}
        />
      </div>

    </div>
  );
}