// frontend/src/pages/petty-cash/PettyCashManager.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api'; 
import PettyCashTopUp from '../../components/petty-cash/PettyCashTopUp';

export default function PettyCashManager() {
  const navigate = useNavigate();
  
  // State for Custom Modal
  const [modal, setModal] = useState({ isOpen: false, type: 'success', message: '' });
  const [currentBalance, setCurrentBalance] = useState(0);
  
  // Active Allocations / Advances
  const [activeAllocations, setActiveAllocations] = useState([]);
  const [loadingAllocations, setLoadingAllocations] = useState(true);

  // Fetch live petty cash balance
  const fetchBalance = async () => {
    try {
      const activeBranch = localStorage.getItem('active_branch');
      if (!activeBranch) return;
      const response = await api.get(`/api/petty-cash/balance?branchId=${encodeURIComponent(activeBranch)}`);
      if (response.data && response.data.success) {
        setCurrentBalance(response.data.balance || 0);
      }
    } catch (error) {
      console.error("Could not fetch petty cash balance", error);
    }
  };

  // Fetch active petty cash advances
  const fetchActiveAllocations = async () => {
    setLoadingAllocations(true);
    try {
      const activeBranch = localStorage.getItem('active_branch');
      if (!activeBranch) {
        setLoadingAllocations(false);
        return;
      }
      const response = await api.get(`/api/petty-cash/active-allocations?branchId=${encodeURIComponent(activeBranch)}`);
      if (response.data && response.data.success) {
        setActiveAllocations(response.data.data || []);
      } else {
        setActiveAllocations([]);
      }
    } catch (error) {
      console.error("Could not fetch active petty cash allocations", error);
      setActiveAllocations([]);
    } finally {
      setLoadingAllocations(false);
    }
  };

  const handleRefreshAll = () => {
    fetchBalance();
    fetchActiveAllocations();
  };

  useEffect(() => {
    handleRefreshAll();
  }, []);

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '--';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-12 relative petty-cash-container">
      
      {/* Header with Balance */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-[1.75rem] font-semibold text-slate-900 tracking-tight leading-tight">Petty Cash Management</h2>
          <p className="text-slate-500 text-sm mt-1.5 font-light tracking-wide">
            Top up petty cash advances from the vault. All expenses against these funds are recorded under the Expenses page.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Live Balance</span>
            <span className="text-sm font-bold text-slate-900">AED {currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* TOP-UP SECTION */}
      <PettyCashTopUp onTopUpSuccess={handleRefreshAll} />

      {/* ACTIVE ADVANCES & SETTLEMENT SECTION */}
      <div className="flex flex-col gap-6 relative z-10 mt-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-slate-900 tracking-tight">Active Petty Cash Advances</h3>
            <p className="text-xs text-slate-500 mt-1 font-light">
              Advances funded from the vault awaiting expense settlement. To log expenses and return leftover cash, select Petty Cash Vault in Expenses.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleRefreshAll}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 bg-white border border-slate-200 px-3 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Refresh
            </button>
            <button 
              onClick={() => navigate('/expenses')}
              className="text-xs font-semibold text-white bg-brand-dark hover:bg-slate-800 px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              Log Expense in Expenses
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden">
          {loadingAllocations ? (
            <div className="p-12 text-center text-slate-400 font-medium text-sm animate-pulse">
              Loading active petty cash advances...
            </div>
          ) : activeAllocations.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h4 className="text-base font-semibold text-slate-900 mb-1">No Active Advances Pending</h4>
              <p className="text-xs text-slate-400 max-w-sm font-light">
                All petty cash advances have been settled. When a new top-up is recorded, it will appear here until an expense is filed.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-[11px] font-semibold uppercase tracking-widest border-b border-slate-100/80">
                    <th className="px-8 py-4 whitespace-nowrap">Date</th>
                    <th className="px-8 py-4 w-full">Advance Purpose / Description</th>
                    <th className="px-8 py-4 whitespace-nowrap">Source Vault</th>
                    <th className="px-8 py-4 text-right whitespace-nowrap">Advance Amount</th>
                    <th className="px-8 py-4 text-center whitespace-nowrap">Status</th>
                    <th className="px-8 py-4 text-right whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80 text-sm">
                  {activeAllocations.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5 text-slate-500 whitespace-nowrap font-medium text-xs">
                        {formatDateForDisplay(item.date || item.createdAt)}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                          <span className="font-semibold text-slate-800">{item.description}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({item.id})</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-slate-600 whitespace-nowrap text-xs">
                        {item.vaultSource || 'CEO Vault'}
                      </td>
                      <td className="px-8 py-5 text-right font-bold text-slate-900 whitespace-nowrap">
                        <span className="text-xs font-normal text-slate-400 mr-1">AED</span>
                        {parseFloat(item.amount || item.remainingAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-8 py-5 text-center whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          Active Advance
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right whitespace-nowrap">
                        <button
                          onClick={() => navigate('/expenses')}
                          className="px-3.5 py-1.5 bg-brand-bg hover:bg-brand-bg/80 text-brand-dark rounded-xl text-xs font-semibold transition-all border border-brand-light/20"
                        >
                          Settle in Expenses &rarr;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* CUSTOM PREMIUM SUCCESS/ERROR MODAL */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" onClick={() => setModal({ ...modal, isOpen: false })}></div>
          
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full relative z-10 shadow-[0_20px_60px_rgb(0,0,0,0.08)] animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 shadow-sm ${
                modal.type === 'success' ? 'bg-emerald-50 text-emerald-500 border border-emerald-100/50' : 'bg-rose-50 text-rose-500 border border-rose-100/50'
              }`}>
                {modal.type === 'success' ? (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              
              <h3 className="text-xl font-semibold text-slate-900 mb-2 tracking-tight">
                {modal.type === 'success' ? 'Success' : 'Action Failed'}
              </h3>
              
              <p className="text-slate-500 text-sm font-light leading-relaxed mb-8">
                {modal.message}
              </p>
              
              <button 
                onClick={() => setModal({ ...modal, isOpen: false })}
                className="w-full py-3.5 bg-slate-900 text-white rounded-full font-medium hover:bg-slate-800 transition-colors shadow-md hover:shadow-lg"
              >
                Okay, got it
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}