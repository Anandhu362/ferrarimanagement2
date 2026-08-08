// frontend/src/components/RecentExpenses.jsx
import React, { useState, useEffect } from 'react';
import api from '../config/api'; // ✅ Centralized API Import

export default function RecentExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch the data on component mount
  const fetchExpenses = async () => {
    try {
      // Pull active branch from local storage
      const activeBranch = localStorage.getItem('active_branch');
      if (!activeBranch) return;
      
      // ✅ Replaced raw fetch with centralized Axios api.get
      const response = await api.get(`/api/expenses/recent?branchId=${encodeURIComponent(activeBranch)}`);
      const result = response.data; // Axios auto-parses JSON
      
      if (result.success) {
        setExpenses(result.data);
      }
    } catch (error) {
      console.error("Error fetching recent expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Bulletproof date formatter (same as dashboard)
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

  if (loading) {
    return (
      <div className="w-full h-32 flex items-center justify-center bg-white rounded-[2rem] border border-slate-100 mt-8">
         <span className="text-slate-400 font-medium animate-pulse">Loading recent expenses...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden mt-8">
      <div className="p-8 border-b border-slate-100/80 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Recent Expense Log</h3>
          <p className="text-xs text-slate-400 mt-1 font-light">Latest verified outflows from the CEO Vault.</p>
        </div>
        <button 
          onClick={fetchExpenses}
          className="text-sm font-medium text-slate-500 hover:text-brand-dark bg-slate-50 hover:bg-slate-100 px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Refresh
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-slate-400 text-[11px] font-semibold uppercase tracking-widest">
              <th className="px-8 py-4 whitespace-nowrap">Transaction ID</th>
              <th className="px-8 py-4 whitespace-nowrap">Time</th>
              <th className="px-8 py-4 w-full">Category & Description</th>
              <th className="px-8 py-4 text-right whitespace-nowrap">Amount (AED)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80 text-sm">
            {expenses.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-8 py-8 text-center text-slate-400 font-medium">No expenses logged yet.</td>
              </tr>
            ) : (
              expenses.map((trx, index) => (
                <tr key={index} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5 text-slate-900 font-medium whitespace-nowrap">{trx.id}</td>
                  <td className="px-8 py-5 text-slate-400 whitespace-nowrap font-light">{formatTrxDate(trx.createdAt || trx.created_at)}</td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      {/* Red dot for expenses */}
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      <span className="text-slate-600 font-medium group-hover:text-slate-900 transition-colors">{trx.description}</span>
                    </div>
                  </td>
                  {/* ✅ FIX: Applied Math.abs() to remove double negative */}
                  <td className="px-8 py-5 text-right font-semibold whitespace-nowrap tracking-tight text-slate-900">
                    - {Math.abs(parseFloat(trx.amount || 0)).toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}