// frontend/src/pages/dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api'; 
import { db } from '../../config/firebase'; 
import { collection, doc, onSnapshot } from 'firebase/firestore'; 
import CashFlowAnalyticsChart from '../../components/dashboard/CashFlowAnalyticsChart';

export default function Dashboard() {
  const [ceoVaultBalance, setCeoVaultBalance] = useState(0);
  const [reserveVaultBalance, setReserveVaultBalance] = useState(0);
  const [vaultComposition, setVaultComposition] = useState([]);
  const [pettyCash, setPettyCash] = useState(0);
  const [todayInflow, setTodayInflow] = useState(0);
  const [todayExpenses, setTodayExpenses] = useState(0);
  
  const [recentActivity, setRecentActivity] = useState([]);
  const [cashFlowTrend, setCashFlowTrend] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [branchError, setBranchError] = useState(false);
  const navigate = useNavigate();

  // Timeframe State Management for the Chart
  const [chartRange, setChartRange] = useState('1M'); 

  // ==========================================================================
  // 1. FIRESTORE REAL-TIME LISTENERS (Sub-100ms Live Data)
  // ==========================================================================
  useEffect(() => {
    const activeBranch = localStorage.getItem('active_branch');
    
    // Safety check to prevent querying null paths if local storage is cleared
    if (!activeBranch) {
      setBranchError(true);
      setLoading(false);
      return;
    }

    // A. Listen to Main CEO Vault
    const vaultRef = collection(db, 'branches', activeBranch, 'vault_inventory');
    const unsubVault = onSnapshot(vaultRef, (snapshot) => {
      let total = 0;
      const comp = [];
      snapshot.forEach(document => {
        const data = document.data();
        const qty = parseInt(data.quantity) || 0;
        const denom = parseFloat(data.denomination_value);
        
        if (qty > 0) {
          total += (qty * denom);
          comp.push({ denomination_value: denom, qty });
        }
      });
      setCeoVaultBalance(total);
      setVaultComposition(comp.sort((a, b) => b.denomination_value - a.denomination_value));
    });

    // B. Listen to Reserve Vault Float
    const reserveRef = collection(db, 'branches', activeBranch, 'reserve_vault_inventory');
    const unsubReserve = onSnapshot(reserveRef, (snapshot) => {
      let total = 0;
      snapshot.forEach(document => {
        const data = document.data();
        const qty = parseInt(data.quantity) || 0;
        const denom = parseFloat(data.denomination_value);
        
        if (qty > 0) {
          total += (qty * denom);
        }
      });
      setReserveVaultBalance(total);
    });

    // C. Listen to Petty Cash Balance
    const pcRef = doc(db, 'branches', activeBranch, 'petty_cash', 'balance');
    const unsubPC = onSnapshot(pcRef, (docSnap) => {
      if (docSnap.exists()) {
        setPettyCash(docSnap.data().current_balance || 0);
      }
    });

    return () => {
      unsubVault();
      unsubReserve();
      unsubPC();
    };
  }, []);

  // ==========================================================================
  // 2. BACKEND API CALL (Historical Charts, Logs, and Today's Stats)
  // ==========================================================================
  useEffect(() => {
    const fetchAnalytics = async () => {
      const activeBranch = localStorage.getItem('active_branch');
      if (!activeBranch) return; 

      try {
        const response = await api.get(`/api/dashboard/summary?branchId=${encodeURIComponent(activeBranch)}&range=${chartRange}`);
        const result = response.data;
        
        if (result.success && result.data) {
          let activity = result.data.recentActivity || [];
          if (Array.isArray(activity)) {
            activity.sort((a, b) => {
              const matchA = String(a.id).match(/\d+/);
              const matchB = String(b.id).match(/\d+/);
              const timeA = matchA ? parseInt(matchA[0], 10) : 0;
              const timeB = matchB ? parseInt(matchB[0], 10) : 0;
              if (timeA > 0 && timeB > 0) return timeB - timeA;
              return new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at); 
            });
            setRecentActivity(activity.slice(0, 5));
          }
          
          setCashFlowTrend(result.data.cashFlowTrend || []);
          setTodayInflow(result.data.todayInflow || 0);
          setTodayExpenses(result.data.todayExpenses || 0);
        }
      } catch (error) {
        console.error("Error fetching dashboard analytical data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [chartRange]); 

  const formatTrxDate = (dateVal) => {
    if (!dateVal) return '--:--';
    try {
      let dateStr = typeof dateVal === 'object' && dateVal.value ? dateVal.value : String(dateVal);
      dateStr = dateStr.replace(' ', 'T');
      const dateObj = new Date(dateStr);
      if (isNaN(dateObj.getTime())) return 'Invalid Date';
      return dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + 
             dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getTrxColors = (type) => {
    switch (type) {
      case 'INFLOW': return { dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]', text: 'text-emerald-600', prefix: '+ ' };
      case 'OUTFLOW': return { dot: 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]', text: 'text-rose-600', prefix: '- ' };
      case 'EXCHANGE': return { dot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]', text: 'text-amber-600', prefix: '≈ ' };
      case 'TEMP_INFLOW': return { dot: 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]', text: 'text-purple-600', prefix: '+ ' };
      case 'TRANSFER': return { dot: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]', text: 'text-blue-600', prefix: '→ ' };
      default: return { dot: 'bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.5)]', text: 'text-slate-900', prefix: '' };
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'SYSTEM') return 'bg-blue-50 text-blue-500 border-blue-200/50';
    if (status === 'PENDING CEO') return 'bg-purple-50 text-purple-600 border-purple-200/50';
    if (status === 'VERIFIED') return 'bg-emerald-50 text-emerald-600 border-emerald-200/50';
    return 'bg-slate-50 text-slate-500 border-slate-200/50';
  };

  const getLiveComposition = () => {
    if (!vaultComposition || vaultComposition.length === 0) {
      return [
        { label: '1,000 AED Note', value: 0, percentage: 0, color: 'bg-brand-dark' },
        { label: '500 AED Note', value: 0, percentage: 0, color: 'bg-brand-light' },
        { label: '200 AED Note', value: 0, percentage: 0, color: 'bg-slate-300' },
        { label: '100 AED Note', value: 0, percentage: 0, color: 'bg-slate-200' },
        { label: 'Smaller & Coins', value: 0, percentage: 0, color: 'bg-slate-100' },
      ];
    }

    let d1000 = 0, d500 = 0, d200 = 0, d100 = 0, dSmall = 0;

    vaultComposition.forEach(item => {
      const val = parseFloat(item.denomination_value);
      const total = val * parseInt(item.quantity || item.qty || 0);
      if (val === 1000) d1000 += total;
      else if (val === 500) d500 += total;
      else if (val === 200) d200 += total;
      else if (val === 100) d100 += total;
      else dSmall += total;
    });

    const safeTotal = ceoVaultBalance || 1; 

    return [
      { label: '1,000 AED Note', value: d1000, percentage: (d1000 / safeTotal) * 100, color: 'bg-brand-dark' },
      { label: '500 AED Note', value: d500, percentage: (d500 / safeTotal) * 100, color: 'bg-brand-light' },
      { label: '200 AED Note', value: d200, percentage: (d200 / safeTotal) * 100, color: 'bg-slate-300' },
      { label: '100 AED Note', value: d100, percentage: (d100 / safeTotal) * 100, color: 'bg-slate-200' },
      { label: 'Smaller & Coins', value: dSmall, percentage: (dSmall / safeTotal) * 100, color: 'bg-slate-100' },
    ];
  };

  const liveComposition = getLiveComposition();
  const totalCombinedVaultBalance = ceoVaultBalance + reserveVaultBalance;

  const trendData = cashFlowTrend?.length > 0 
    ? cashFlowTrend 
    : Array.from({length: 7}).map(() => ({ dayOfWeek: '-', dailyInflow: 0 })); 

  const maxInflow = Math.max(...trendData.map(d => Number(d.dailyInflow) || 0), 100); 

  if (branchError) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="bg-rose-50 border border-rose-100 p-8 rounded-[2rem] text-center max-w-md shadow-sm">
          <svg className="w-12 h-12 text-rose-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <h3 className="text-xl font-semibold text-slate-900 tracking-tight mb-2">Active Branch Missing</h3>
          <p className="text-slate-500 text-sm font-light mb-6">We could not identify your active branch location. Please log in or select a branch to view your dashboard.</p>
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

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <span className="relative flex h-6 w-6">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-light opacity-75"></span>
          <span className="relative inline-flex rounded-full h-6 w-6 bg-brand-dark"></span>
        </span>
        <p className="text-slate-500 font-medium tracking-wide animate-pulse">Syncing Live Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-[1600px] mx-auto pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-[1.75rem] font-semibold text-slate-900 tracking-tight leading-tight">Financial Overview</h2>
          <p className="text-slate-500 text-sm mt-1.5 font-light tracking-wide">Real-time snapshot of today's cash operations and vault status.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-medium text-slate-600 tracking-wide uppercase">Live Sync</span>
        </div>
      </div>

      {/* TOP SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-brand-dark rounded-[2rem] p-7 text-white relative overflow-hidden shadow-[0_12px_40px_rgb(43,38,64,0.3)]">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-brand-light/30 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <p className="text-white/60 text-xs font-medium mb-1.5 tracking-widest uppercase">Total Vault Balance</p>
            <h3 className="text-4xl font-semibold tracking-tighter">
              <span className="text-xl text-white/50 font-light mr-1 tracking-normal">AED</span>
              {totalCombinedVaultBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}
            </h3>
            
            <div className="mt-5 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-300 bg-emerald-400/10 backdrop-blur-md w-max px-3 py-1.5 rounded-xl border border-emerald-400/20">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                Live Data Connected
              </div>
              
              {/* Breakdown Row */}
              <div className="flex items-center gap-3 text-[11px] font-medium text-white/70 bg-white/5 px-3 py-2 rounded-xl border border-white/10 w-max">
                <span>CEO: <span className="text-white tracking-wide">AED {ceoVaultBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></span>
                <span className="w-px h-3 bg-white/20"></span>
                <span>Reserve: <span className="text-white tracking-wide">AED {reserveVaultBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-7 border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow duration-300">
          <div className="flex justify-between items-start">
            <p className="text-slate-400 text-xs font-medium mb-1.5 tracking-widest uppercase">Petty Cash Fund</p>
            <span className="bg-emerald-50 border border-emerald-100 p-1.5 rounded-full">
               <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
            </span>
          </div>
          <h3 className="text-4xl font-semibold text-slate-900 tracking-tighter">
            <span className="text-xl text-slate-300 font-light mr-1 tracking-normal">AED</span>
            {pettyCash.toLocaleString(undefined, {minimumFractionDigits: 2})}
          </h3>
          <div className="mt-5 flex items-center gap-2 text-xs text-slate-500">
            <span className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl font-medium">Fully Replenished</span>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-7 border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow duration-300">
          <p className="text-slate-400 text-xs font-medium mb-1.5 tracking-widest uppercase">Today's Inflow</p>
          <h3 className="text-4xl font-semibold text-slate-900 tracking-tighter text-emerald-600">
            <span className="text-xl text-emerald-600/50 font-light mr-1 tracking-normal">AED</span>
            {todayInflow.toLocaleString(undefined, {minimumFractionDigits: 2})}
          </h3>
        </div>

        <div className="bg-white rounded-[2rem] p-7 border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow duration-300">
          <p className="text-slate-400 text-xs font-medium mb-1.5 tracking-widest uppercase">Today's Expenses</p>
          <h3 className="text-4xl font-semibold text-slate-900 tracking-tighter text-rose-500">
            <span className="text-xl text-rose-500/50 font-light mr-1 tracking-normal">AED</span>
            {todayExpenses.toLocaleString(undefined, {minimumFractionDigits: 2})}
          </h3>
        </div>
      </div>

      {/* MIDDLE SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <CashFlowAnalyticsChart 
          trendData={trendData} 
          maxInflow={maxInflow} 
          chartRange={chartRange} 
          setChartRange={setChartRange} 
        />

        {/* Vault Composition - LIVE DATA */}
        <div className="bg-white rounded-[2rem] p-8 border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col">
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Vault Composition</h3>
            <p className="text-xs text-slate-400 mt-1 font-light">Current denomination breakdown</p>
          </div>
          
          <div className="flex-1 flex flex-col justify-center space-y-5">
            {liveComposition.map((item, index) => (
              <div key={index} className="flex flex-col gap-2 group">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium text-slate-700">{item.label}</span>
                  <span className="text-xs font-semibold text-slate-900">
                    AED {item.value.toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                  <div 
                    className={`h-full ${item.color} rounded-full transition-all duration-1000 ease-out`} 
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* BOTTOM SECTION: Recent Activity Table (Historical/BigQuery) */}
      <div className="bg-white rounded-[2rem] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden">
        <div className="p-8 border-b border-slate-100/80 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Recent Vault Activity</h3>
            <p className="text-xs text-slate-400 mt-1 font-light">Latest inflows, expenses, and automated sweeps.</p>
          </div>
          <button 
            onClick={() => navigate('/logs')}
            className="text-sm font-medium text-slate-500 hover:text-brand-dark bg-slate-50 hover:bg-slate-100 px-4 py-2 rounded-xl transition-colors"
          >
            View All
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[11px] font-semibold uppercase tracking-widest">
                <th className="px-8 py-4 whitespace-nowrap">Transaction ID</th>
                <th className="px-8 py-4 whitespace-nowrap">Time</th>
                <th className="px-8 py-4 w-full">Description</th>
                <th className="px-8 py-4 text-right whitespace-nowrap">Amount (AED)</th>
                <th className="px-8 py-4 text-center whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 text-sm">
              {recentActivity.map((trx, index) => {
                const billedVal = parseFloat(trx.billedAmount || trx.billed_amount || 0);
                const { dot, text, prefix } = getTrxColors(trx.type);
                
                return (
                  <tr key={index} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5 text-slate-900 font-medium whitespace-nowrap">{trx.id}</td>
                    <td className="px-8 py-5 text-slate-400 whitespace-nowrap font-light">{formatTrxDate(trx.createdAt || trx.created_at)}</td>
                    
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`}></span>
                        
                        <div className="flex flex-col">
                          <span className="text-slate-600 font-medium group-hover:text-slate-900 transition-colors">
                            {trx.description}
                          </span>
                          {billedVal > 0 && (
                            <span className="text-[10px] text-slate-400 mt-0.5 tracking-wide">
                              Bill: AED {billedVal.toLocaleString(undefined, {minimumFractionDigits: 2})}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className={`px-8 py-5 text-right font-semibold whitespace-nowrap tracking-tight ${text}`}>
                      {prefix}{Math.abs(parseFloat(trx.amount || 0)).toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </td>
                    
                    <td className="px-8 py-5 text-center whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1.5 rounded-xl text-[10px] font-semibold tracking-wide uppercase border ${getStatusBadge(trx.status || 'COMPLETED')}`}>
                        {trx.status || 'COMPLETED'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}