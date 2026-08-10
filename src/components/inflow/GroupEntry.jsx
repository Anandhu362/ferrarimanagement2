// frontend/src/components/inflow/GroupEntry.jsx
import React, { useState, useEffect, useRef } from 'react';
import api from '../../config/api'; // ✅ Centralized API Import

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

// --- 1. HELPER FUNCTIONS FOR STRICT SANITIZATION ---
const isValidString = (str) => {
  if (!str) return false;
  // Removes leading/trailing whitespace and non-alphanumeric chars to prevent garbage data
  const sanitized = str.trim().replace(/[^a-zA-Z0-9 ]/g, ''); 
  return sanitized.length >= 2;
};

const isValidAmount = (amount) => {
  const val = parseFloat(amount);
  // Amount must be a valid number and strictly greater than zero
  return !isNaN(val) && val > 0;
};

// ✅ NEW: Strict ID Generators for Idempotency
const generateTrxId = () => `TRX-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
const generateExpId = () => `EXP-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

export default function GroupEntry() {
  // ✅ UPDATED: Initialize rows with secure frontend-generated IDs
  const [invoices, setInvoices] = useState([{ id: generateTrxId(), companyName: '', invoiceNo: '', amount: '' }]);
  const [expenses, setExpenses] = useState([{ id: generateExpId(), description: '', amount: '' }]);
  const [showExpenses, setShowExpenses] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: 'success', message: '' });
  
  // ✅ NEW: Hard lock to prevent double-click race conditions entirely
  const submitLock = useRef(false);
  
  // Batch Date State (Defaults to Today)
  const [batchDate, setBatchDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Custom Calendar State
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());
  
  const [denominations, setDenominations] = useState(
    DENOMINATIONS.reduce((acc, curr) => ({ ...acc, [curr.label]: '' }), {})
  );

  const [totals, setTotals] = useState({ inflow: 0, expense: 0, net: 0, denoms: 0, difference: 0 });

  const baseInputClasses = "w-full px-4 py-3 bg-white hover:bg-slate-50 focus:bg-white border border-slate-200/80 focus:border-brand-light focus:ring-4 focus:ring-brand-light/10 rounded-xl text-slate-900 font-medium outline-none transition-all placeholder-slate-300 shadow-sm";
  const expenseInputClasses = "w-full px-4 py-3 bg-white hover:bg-rose-50/30 focus:bg-white border border-rose-100 focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 rounded-xl text-rose-900 font-medium outline-none transition-all placeholder-rose-300 shadow-sm";

  useEffect(() => {
    const inflowTotal = invoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
    const expTotal = showExpenses ? expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0) : 0;
    const netTotal = inflowTotal - expTotal;

    const denomTotal = DENOMINATIONS.reduce((sum, item) => {
      const val = parseFloat(denominations[item.label]) || 0;
      return sum + (item.isValue ? val : val * item.value);
    }, 0);

    setTotals({ inflow: inflowTotal, expense: expTotal, net: netTotal, denoms: denomTotal, difference: netTotal - denomTotal });
  }, [invoices, expenses, showExpenses, denominations]);

  // --- 2. MASTER VALIDATION CHECK ---
  const isFormValid = () => {
    if (!invoices || invoices.length === 0) return false;

    const areInvoicesValid = invoices.every(inv => 
      isValidString(inv.companyName) && 
      isValidAmount(inv.amount)
    );

    let areExpensesValid = true;
    if (showExpenses) {
      areExpensesValid = expenses.every(exp => 
        isValidString(exp.description) && 
        isValidAmount(exp.amount)
      );
    }

    const isMathValid = (totals.net > 0) && (totals.difference === 0);
    return areInvoicesValid && areExpensesValid && isMathValid;
  };

  const handleInvoiceChange = (id, field, value) => {
    setInvoices(invoices.map(inv => inv.id === id ? { ...inv, [field]: value } : inv));
  };

  const handleExpenseChange = (id, field, value) => {
    setExpenses(expenses.map(exp => exp.id === id ? { ...exp, [field]: value } : exp));
  };

  const updateDenomination = (denomLabel, value) => {
    const cleanValue = value.replace(/[^0-9.]/g, ''); 
    setDenominations({ ...denominations, [denomLabel]: cleanValue });
  };

  // ✅ UPDATED: Add new rows with secure IDs
  const addInvoiceRow = () => setInvoices([...invoices, { id: generateTrxId(), companyName: '', invoiceNo: '', amount: '' }]);
  const addExpenseRow = () => setExpenses([...expenses, { id: generateExpId(), description: '', amount: '' }]);

  const removeInvoiceRow = (id) => {
    if (invoices.length > 1) setInvoices(invoices.filter(inv => inv.id !== id));
  };
  
  const removeExpenseRow = (id) => {
    if (expenses.length > 1) setExpenses(expenses.filter(exp => exp.id !== id));
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const toggleCalendar = () => {
    if (!isCalendarOpen) {
      setCalendarViewDate(batchDate ? new Date(batchDate) : new Date());
    }
    setIsCalendarOpen(!isCalendarOpen);
  };

  const handleDateSelect = (year, month, day) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    setBatchDate(`${year}-${m}-${d}`);
    setIsCalendarOpen(false);
  };

  const handleSubmit = async () => {
    if (!isFormValid() || submitLock.current) return;
    
    submitLock.current = true; // Engage hard lock
    setIsSubmitting(true);
    try {
      // 1. Get the branch without the hardcoded fallback
      const activeBranch = localStorage.getItem('active_branch');

      // 2. Block the API call if the branch is missing
      if (!activeBranch) {
        setModal({ isOpen: true, type: 'error', message: 'Critical Error: No active branch selected. Please log in or select a branch again.' });
        setIsSubmitting(false);
        submitLock.current = false;
        return; 
      }

      const payload = {
        branchId: activeBranch,
        date: batchDate, 
        // Filter out completely empty rows, but allow rows with amount + companyName. If no invoiceNo, default to 'NIL'
        invoices: invoices
          .filter(i => isValidString(i.companyName) && parseFloat(i.amount) > 0)
          .map(i => ({
            ...i,
            invoiceNo: i.invoiceNo && i.invoiceNo.trim() !== '' ? i.invoiceNo.trim() : 'NIL'
          })),
        expenses: showExpenses ? expenses.filter(e => e.description && parseFloat(e.amount) > 0) : [],
        denominations,
        netTotal: totals.net
      };

      // ✅ POST triggers the Backend Firestore Outbox Transaction
      const response = await api.post('/api/group-entry/submit', payload);
      const result = response.data; 
      
      if (result.success) {
        // UI updated to reflect the new real-time architecture
        setModal({ isOpen: true, type: 'success', message: 'Group Entry successfully queued to the live Outbox for processing.' });
        // ✅ UPDATED: Reset rows with fresh IDs for the next entry
        setInvoices([{ id: generateTrxId(), companyName: '', invoiceNo: '', amount: '' }]);
        setExpenses([{ id: generateExpId(), description: '', amount: '' }]);
        setShowExpenses(false);
        setDenominations(DENOMINATIONS.reduce((acc, curr) => ({ ...acc, [curr.label]: '' }), {}));
      } else {
        setModal({ isOpen: true, type: 'error', message: result.message || 'Failed to sync with the database.' });
      }
    } catch (err) {
      console.error(err);
      setModal({ isOpen: true, type: 'error', message: 'Network error. Could not connect to the server.' });
    } finally {
      submitLock.current = false; // Release hard lock
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const container = e.target.closest('.group-entry-container');
      if (container) {
        const inputs = Array.from(container.querySelectorAll('input:not([disabled])'));
        const currentIndex = inputs.indexOf(e.target);
        if (currentIndex > -1 && currentIndex < inputs.length - 1) {
          inputs[currentIndex + 1].focus();
        }
      }
    }
  };

  const formIsValid = isFormValid();

  return (
    <div className="max-w-[1200px] mx-auto animate-in fade-in duration-500 pb-12 relative group-entry-container">
      
      {/* Header Section */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-[1.75rem] font-semibold text-slate-900 tracking-tight leading-tight">Batch Cash Entry</h2>
          <p className="text-slate-500 text-sm mt-1.5 font-light tracking-wide">Add multiple invoices and deduct cash expenses against a single physical bundle.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {/* PREMIUM CUSTOM DATE SELECTOR */}
          <div className="relative z-30">
            <div 
              onClick={toggleCalendar}
              className="bg-white px-5 py-3.5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-3 cursor-pointer hover:border-brand-light/40 transition-colors group"
            >
               <div className="bg-brand-light/10 p-2 rounded-xl text-brand-dark transition-colors group-hover:bg-brand-light/20">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
               </div>
               <div className="flex flex-col pr-2">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 cursor-pointer group-hover:text-brand-light transition-colors">Entry Date</label>
                 <div className="text-sm font-semibold text-slate-800 outline-none cursor-pointer bg-transparent whitespace-nowrap">
                   {formatDateForDisplay(batchDate)}
                 </div>
               </div>
            </div>

            {isCalendarOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsCalendarOpen(false)}></div>
                <div className="absolute top-[calc(100%+8px)] right-0 md:left-0 p-5 bg-white rounded-[1.5rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100/80 z-50 w-[280px] animate-in slide-in-from-top-2 fade-in duration-200">
                  
                  <div className="flex justify-between items-center mb-5">
                    <button onClick={(e) => { e.stopPropagation(); setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1)); }} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div className="text-[15px] font-bold text-slate-900 tracking-tight">
                      {calendarViewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1)); }} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                      <div key={day} className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">{day}</div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth(), 1).getDay() }).map((_, i) => (
                      <div key={`empty-${i}`} className="w-8 h-8"></div>
                    ))}

                    {Array.from({ length: new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 0).getDate() }).map((_, i) => {
                      const day = i + 1;
                      const dateString = `${calendarViewDate.getFullYear()}-${String(calendarViewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      
                      const isSelected = batchDate === dateString;
                      const isToday = new Date().toISOString().split('T')[0] === dateString;

                      return (
                        <button
                          key={day}
                          onClick={(e) => { e.stopPropagation(); handleDateSelect(calendarViewDate.getFullYear(), calendarViewDate.getMonth(), day); }}
                          className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-medium transition-all ${
                            isSelected ? 'bg-slate-900 text-white shadow-md' : isToday ? 'text-emerald-500 bg-emerald-50 hover:bg-emerald-100 font-bold' : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Live Net Summary */}
          <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-6 z-20 relative">
             <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Live Net Total</p>
               <p className="text-2xl font-bold text-emerald-600 tracking-tight">
                 <span className="text-sm font-medium text-emerald-600/50 mr-1">AED</span>
                 {totals.net.toLocaleString(undefined, {minimumFractionDigits: 2})}
               </p>
             </div>
          </div>
        </div>
      </div>

      {/* Main Grid Card */}
      <div className="bg-[#FCFCFD] rounded-[2rem] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden z-10 relative">
        
        {/* INVOICES SECTION */}
        <div className="p-8 border-b border-slate-200/60">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">1. Invoices Received</h3>
            <button 
              onClick={() => setShowExpenses(!showExpenses)} 
              className={`text-xs font-semibold px-4 py-2 rounded-full flex items-center gap-2 transition-all duration-300 ${showExpenses ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 shadow-sm'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4" /></svg>
              {showExpenses ? 'Hide Expenses' : 'Deduct Cash Expense'}
            </button>
          </div>
          
          <div className="space-y-3">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex gap-4 items-center group">
                <div className="flex-1">
                  <input type="text" placeholder="Company Name" value={inv.companyName} onChange={e => handleInvoiceChange(inv.id, 'companyName', e.target.value)} onKeyDown={handleKeyDown} className={baseInputClasses} />
                </div>
                <div className="w-1/4">
                  {/* Updated placeholder to show it's optional */}
                  <input type="text" placeholder="INV-001 (Optional)" value={inv.invoiceNo} onChange={e => handleInvoiceChange(inv.id, 'invoiceNo', e.target.value)} onKeyDown={handleKeyDown} className={`${baseInputClasses} uppercase`} />
                </div>
                <div className="relative w-1/3">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">AED</span>
                  <input type="number" placeholder="0.00" value={inv.amount} onChange={e => handleInvoiceChange(inv.id, 'amount', e.target.value)} onKeyDown={handleKeyDown} className={`${baseInputClasses} pl-12 text-right font-semibold text-emerald-700`} />
                </div>
                <button 
                  onClick={() => removeInvoiceRow(inv.id)} 
                  disabled={invoices.length === 1}
                  className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-slate-300 hover:bg-red-100 hover:text-red-600 transition-all duration-200 disabled:opacity-30"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}
            <div className="pt-2">
              <button 
                onClick={addInvoiceRow} 
                className="flex items-center gap-2 text-sm font-semibold text-brand-dark hover:text-brand-light bg-white px-5 py-2 border border-slate-200 hover:border-brand-light/30 rounded-full shadow-sm hover:shadow-md transition-all duration-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                Add Invoice
              </button>
            </div>
          </div>
        </div>

        {/* EXPENSES EXPANDABLE SECTION */}
        {showExpenses && (
          <div className="p-8 bg-rose-50/30 border-b border-rose-100/60 animate-in slide-in-from-top-4 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-rose-700 uppercase tracking-widest">2. Cash Deducted (Expenses)</h3>
              <span className="text-sm font-semibold text-rose-600 bg-rose-100/50 px-3 py-1 rounded-full border border-rose-200/50">
                - AED {totals.expense.toLocaleString(undefined, {minimumFractionDigits: 2})}
              </span>
            </div>
            
            <div className="space-y-3">
              {expenses.map((exp) => (
                <div key={exp.id} className="flex gap-4 items-center">
                  <div className="flex-1">
                    <input type="text" placeholder="Expense Description (e.g., Petrol, Petty Cash)" value={exp.description} onChange={e => handleExpenseChange(exp.id, 'description', e.target.value)} onKeyDown={handleKeyDown} className={expenseInputClasses} />
                  </div>
                  <div className="relative w-1/3">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-400 text-xs font-medium">AED</span>
                    <input type="number" placeholder="0.00" value={exp.amount} onChange={e => handleExpenseChange(exp.id, 'amount', e.target.value)} onKeyDown={handleKeyDown} className={`${expenseInputClasses} pl-12 text-right font-semibold`} />
                  </div>
                  <button 
                    onClick={() => removeExpenseRow(exp.id)} 
                    disabled={expenses.length === 1}
                    className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-rose-300 hover:bg-rose-200 hover:text-rose-700 transition-all duration-200 disabled:opacity-30"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))}
              <div className="pt-2">
                <button 
                  onClick={addExpenseRow} 
                  className="flex items-center gap-2 text-sm font-semibold text-rose-600 hover:text-rose-700 bg-white px-5 py-2 border border-rose-200 hover:border-rose-300 rounded-full shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                  Add Expense
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FINAL DENOMINATION SECTION */}
        <div className="p-8 bg-slate-50/50">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-1">3. Verify Final Bundle</h3>
              <p className="text-xs font-medium text-slate-500">Breakdown the physical cash remaining.</p>
            </div>
            
            <div className={`px-4 py-2 rounded-xl flex flex-col items-end border shadow-sm transition-colors ${
              totals.net > 0 && totals.difference === 0 
                ? 'bg-emerald-50 border-emerald-200' 
                : 'bg-white border-slate-200'
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
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center mb-2">
                  {d.label}
                </div>
                <input
                  type="text"
                  placeholder="-"
                  value={denominations[d.label]}
                  onChange={(e) => updateDenomination(d.label, e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full text-center text-lg font-semibold text-slate-800 bg-transparent outline-none focus:text-brand-dark"
                />
              </div>
            ))}
          </div>

          {/* Action Footer */}
          <div className="mt-10 flex justify-end">
            <button 
              onClick={handleSubmit} 
              disabled={isSubmitting || !formIsValid}
              className={`px-10 py-4 rounded-full font-semibold shadow-lg transition-all duration-300 flex items-center gap-2 ${
                formIsValid && !isSubmitting
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
                  Processing...
                </>
              ) : (
                `Sync Net AED ${totals.net.toLocaleString(undefined, {minimumFractionDigits: 2})} →`
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Premium Success/Error Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" onClick={() => setModal({ ...modal, isOpen: false })}></div>
          
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full relative z-10 shadow-[0_20px_60px_rgb(0,0,0,0.08)] animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 ${
                modal.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'
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
                {modal.type === 'success' ? 'Batch Synced' : 'Sync Failed'}
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