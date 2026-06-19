import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import api from '../../config/api';

const DENOMINATIONS = [
  { label: '1000', value: 1000 },
  { label: '500', value: 500 },
  { label: '200', value: 200 },
  { label: '100', value: 100 },
  { label: '50', value: 50 },
  { label: '20', value: 20 },
  { label: '10', value: 10 },
  { label: '5', value: 5 },
  { label: 'Coins', value: 1, isValue: true }
];

export default function SalesEntry() {
  const [pendingRecords, setPendingRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- RECONCILIATION STATE ---
  const [expenses, setExpenses] = useState([{ id: Date.now(), description: '', amount: '' }]);
  const [showExpenses, setShowExpenses] = useState(false);
  const [denominations, setDenominations] = useState(
    DENOMINATIONS.reduce((acc, curr) => ({ ...acc, [curr.label]: '' }), {})
  );
  const [totals, setTotals] = useState({ inflow: 0, expense: 0, net: 0, denoms: 0, difference: 0 });

  const expenseInputClasses = "w-full px-4 py-3 bg-white hover:bg-rose-50/30 focus:bg-white border border-rose-100 focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 rounded-xl text-rose-900 font-medium outline-none transition-all placeholder-rose-300 shadow-sm";

  // REAL-TIME FIRESTORE LISTENER
  useEffect(() => {
    setIsLoading(true);
    
    // Optional: If you only want to see pending records for the ACTIVE branch on this desk
    // You could update this query to: where('branchId', '==', localStorage.getItem('active_branch'))
    const q = query(
      collection(db, 'collections'),
      where('status', '==', 'PENDING_REVIEW')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      records.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
        return timeB - timeA; 
      });

      setPendingRecords(records);
      setIsLoading(false);
    }, (error) => {
      console.error("Real-time Firestore error:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // CALCULATE TOTALS (Inflows, Expenses, Denominations)
  useEffect(() => {
    const inflowTotal = pendingRecords.reduce((sum, record) => sum + (parseFloat(record.amount || record.collected) || 0), 0);
    const expTotal = showExpenses ? expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0) : 0;
    const netTotal = inflowTotal - expTotal;

    const denomTotal = DENOMINATIONS.reduce((sum, item) => {
      const val = parseFloat(denominations[item.label]) || 0;
      return sum + (item.isValue ? val : val * item.value);
    }, 0);

    setTotals({ 
      inflow: inflowTotal, 
      expense: expTotal, 
      net: netTotal, 
      denoms: denomTotal, 
      difference: netTotal - denomTotal 
    });
  }, [pendingRecords, expenses, showExpenses, denominations]);

  // --- RECONCILIATION HANDLERS ---
  const handleExpenseChange = (id, field, value) => setExpenses(expenses.map(exp => exp.id === id ? { ...exp, [field]: value } : exp));
  const addExpenseRow = () => setExpenses([...expenses, { id: Date.now(), description: '', amount: '' }]);
  const removeExpenseRow = (id) => { if (expenses.length > 1) setExpenses(expenses.filter(exp => exp.id !== id)); };
  
  const updateDenomination = (denomLabel, value) => {
    const cleanValue = value.replace(/[^0-9.]/g, ''); 
    setDenominations({ ...denominations, [denomLabel]: cleanValue });
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // --- BULK SUBMIT TO ENTERPRISE BACKEND ---
  const handleBulkSubmit = async () => {
    if (pendingRecords.length === 0 || totals.difference !== 0 || totals.net <= 0) return;
    
    // Strict requirement: Ensure a branch is available before processing
    const localBranch = localStorage.getItem('active_branch');
    const activeBranch = localBranch || pendingRecords[0]?.branchId;

    if (!activeBranch) {
      alert("Error: No active branch found in local storage. Please re-login or select a branch.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        branchId: activeBranch, 
        transactionIds: pendingRecords.map(record => record.id),
        expenses: showExpenses ? expenses.filter(e => e.description && parseFloat(e.amount) > 0) : [],
        denominations,
        netTotal: totals.net
      };

      const response = await api.post('/api/inflow/verify-bulk', payload);

      if (response.data.success) {
        alert("Records successfully verified and submitted to the Vault Ledger!");
        // Reset local reconciliation state after success
        setExpenses([{ id: Date.now(), description: '', amount: '' }]);
        setShowExpenses(false);
        setDenominations(DENOMINATIONS.reduce((acc, curr) => ({ ...acc, [curr.label]: '' }), {}));
      }
    } catch (error) {
      console.error("Bulk submission failed:", error);
      alert(error.response?.data?.message || "Failed to submit to Vault. The system automatically rolled back to prevent data corruption.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-12 relative font-['Poppins',sans-serif]">
      
      {/* Header Section */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-[1.75rem] font-semibold text-slate-900 tracking-tight leading-tight">
              Sales Entry Desk
            </h2>
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1.5 font-light tracking-wide">
            Live real-time view of agent submissions. Verify and push to BigQuery Vault.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200/60 shadow-sm flex items-center z-20 relative">
             <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Gross Pending Total</p>
               <p className="text-xl font-bold text-emerald-600 tracking-tight">
                 <span className="text-sm font-medium mr-1 text-emerald-600/50">AED</span>
                 {totals.inflow.toLocaleString(undefined, {minimumFractionDigits: 2})}
               </p>
             </div>
          </div>
        </div>
      </div>

      {/* Main Grid Container (Premium Fintech Card) */}
      <div className="bg-[#FCFCFD] rounded-[2rem] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden z-10 relative">
        <div className="overflow-x-auto pb-2 min-h-[300px]">
          <table className="w-full text-left border-collapse whitespace-nowrap relative">
            <thead>
              <tr className="border-b border-slate-200/60 bg-slate-100/30">
                <th className="p-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-[20%]">Agent Name</th>
                <th className="p-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-[15%]">Date</th>
                <th className="p-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-[30%]">Company Name</th>
                <th className="p-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-[20%]">Invoice No.</th>
                <th className="p-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-[15%] text-right">Collected (AED)</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100/80">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="text-center py-16">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-8 h-8 text-emerald-500 animate-spin mb-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="text-slate-500 font-medium">Connecting to live feed...</p>
                    </div>
                  </td>
                </tr>
              ) : pendingRecords.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-16">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </div>
                      <p className="text-slate-500 font-medium text-lg">No pending agent submissions.</p>
                      <p className="text-slate-400 text-sm mt-1">Listening for new entries in real-time...</p>
                    </div>
                  </td>
                </tr>
              ) : (
                pendingRecords.map((record) => (
                  <tr key={record.id} className="group hover:bg-slate-50/80 transition-colors animate-in fade-in slide-in-from-top-2">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                          {(record.agentName || 'U').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-slate-700">{record.agentName || 'Unknown Agent'}</span>
                      </div>
                    </td>
                    <td className="p-5 text-sm font-medium text-slate-500">
                      {formatDateForDisplay(record.date)}
                    </td>
                    <td className="p-5 text-sm font-semibold text-slate-900">
                      {record.companyName}
                    </td>
                    <td className="p-5 text-sm font-mono text-slate-500">
                      <span className="bg-slate-100 px-2.5 py-1 rounded-md">{record.invoiceNumber}</span>
                    </td>
                    <td className="p-5 text-sm font-bold text-slate-900 text-right">
                      {parseFloat(record.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* --- RECONCILIATION SECTION --- */}
        {pendingRecords.length > 0 && (
          <div className="mt-4 border-t border-slate-200/60 pt-8 px-8 pb-8">
            
            {/* EXPENSES EXPANDABLE SECTION */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Deduct Cash Expenses</h3>
                <button 
                  onClick={() => setShowExpenses(!showExpenses)} 
                  className={`text-xs font-semibold px-4 py-2 rounded-full flex items-center gap-2 transition-all duration-300 ${showExpenses ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 shadow-sm'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4" /></svg>
                  {showExpenses ? 'Hide Expenses' : 'Add Expense'}
                </button>
              </div>

              {showExpenses && (
                <div className="p-6 bg-rose-50/30 border border-rose-100/60 rounded-2xl animate-in slide-in-from-top-4 duration-300">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold text-rose-700">Expense Breakdown</span>
                    <span className="text-sm font-semibold text-rose-600 bg-rose-100/50 px-3 py-1 rounded-full border border-rose-200/50">
                      - AED {totals.expense.toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {expenses.map((exp) => (
                      <div key={exp.id} className="flex gap-4 items-center">
                        <div className="flex-1">
                          <input type="text" placeholder="Expense Description (e.g., Petrol)" value={exp.description} onChange={e => handleExpenseChange(exp.id, 'description', e.target.value)} className={expenseInputClasses} />
                        </div>
                        <div className="relative w-1/3">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-400 text-xs font-medium">AED</span>
                          <input type="number" placeholder="0.00" value={exp.amount} onChange={e => handleExpenseChange(exp.id, 'amount', e.target.value)} className={`${expenseInputClasses} pl-12 text-right font-semibold`} />
                        </div>
                        <button onClick={() => removeExpenseRow(exp.id)} disabled={expenses.length === 1} className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-rose-300 hover:bg-rose-200 hover:text-rose-700 disabled:opacity-30">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    ))}
                    <div className="pt-2">
                      <button onClick={addExpenseRow} className="flex items-center gap-2 text-sm font-semibold text-rose-600 hover:text-rose-700 bg-white px-5 py-2 border border-rose-200 hover:border-rose-300 rounded-full shadow-sm hover:shadow-md transition-all duration-300">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                        Add Expense
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* FINAL DENOMINATION SECTION */}
            <div className="p-8 bg-slate-50/50 rounded-2xl border border-slate-200/60">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-1">Verify Final Bundle</h3>
                  <p className="text-xs font-medium text-slate-500">Breakdown the physical cash remaining.</p>
                </div>
                
                <div className={`px-4 py-2 rounded-xl flex flex-col items-end border shadow-sm transition-colors ${
                  totals.net > 0 && totals.difference === 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'
                }`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Calculated Total</span>
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-bold tracking-tight ${totals.difference === 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
                      AED {totals.denoms.toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </span>
                    {totals.net > 0 && totals.difference !== 0 && (
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${totals.difference > 0 ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                        {totals.difference > 0 ? 'SHORT' : 'OVER'}: {Math.abs(totals.difference).toFixed(2)}
                      </span>
                    )}
                    {totals.net > 0 && totals.difference === 0 && (
                      <span className="bg-emerald-100 text-emerald-600 rounded-full p-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
                {DENOMINATIONS.map((d) => (
                  <div key={d.label} className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-sm hover:border-brand-light/30 transition-colors">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center mb-2">{d.label}</div>
                    <input
                      type="text"
                      placeholder="-"
                      value={denominations[d.label]}
                      onChange={(e) => updateDenomination(d.label, e.target.value)}
                      className="w-full text-center text-lg font-semibold text-slate-800 bg-transparent outline-none focus:text-brand-dark"
                    />
                  </div>
                ))}
              </div>
              
              {/* Action Footer */}
              <div className="mt-8 flex justify-end">
                <button 
                  onClick={handleBulkSubmit} 
                  disabled={isSubmitting || totals.difference !== 0 || totals.net <= 0}
                  className={`px-10 py-4 rounded-full font-semibold shadow-lg transition-all duration-300 flex items-center gap-2 ${
                    totals.difference === 0 && totals.net > 0 && !isSubmitting
                      ? 'bg-brand-dark text-white hover:bg-brand-light hover:-translate-y-0.5 hover:shadow-xl' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-70'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Vaulting...
                    </>
                  ) : (
                    'Verify & Submit to Vault →'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}