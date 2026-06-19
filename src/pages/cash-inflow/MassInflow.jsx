// frontend/src/pages/cash-inflow/MassInflow.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GroupEntry from '../../components/inflow/GroupEntry'; 
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
  { label: 'Coins(AED)', value: 1, isValue: true }
];

const getEmptyRow = () => ({
  id: Date.now() + Math.random(),
  date: new Date().toISOString().split('T')[0],
  companyName: '', // Swapped logical order here
  invoiceNumber: '',
  billedAmount: '', 
  expectedAmount: '',
  denominations: DENOMINATIONS.reduce((acc, curr) => ({ ...acc, [curr.label]: '' }), {})
});

// --- 1. STRICT VALIDATION HELPERS ---
const isValidString = (str) => {
  if (!str) return false;
  const sanitized = str.trim().replace(/[^a-zA-Z0-9 ]/g, ''); 
  return sanitized.length >= 2;
};

const isValidAmount = (amount) => {
  const val = parseFloat(amount);
  return !isNaN(val) && val > 0;
};

export default function MassInflow() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([getEmptyRow()]);
  const [isPreview, setIsPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: 'success', message: '' });

  const [openCalendarId, setOpenCalendarId] = useState(null);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());

  const calculateRowTotal = (denoms) => {
    return DENOMINATIONS.reduce((sum, item) => {
      const val = parseFloat(denoms[item.label]) || 0;
      return sum + (item.isValue ? val : val * item.value);
    }, 0);
  };

  const handleAddRow = () => setRows([...rows, getEmptyRow()]);
  const handleRemoveRow = (id) => setRows(rows.filter(r => r.id !== id));
  
  const updateRowData = (id, field, value) => {
    setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const updateDenomination = (id, denomLabel, value) => {
    const cleanValue = value.replace(/[^0-9.]/g, ''); 
    setRows(rows.map(row => {
      if (row.id === id) {
        return { ...row, denominations: { ...row.denominations, [denomLabel]: cleanValue } };
      }
      return row;
    }));
  };

  const toggleCalendar = (id, currentDate) => {
    if (openCalendarId === id) {
      setOpenCalendarId(null);
    } else {
      setOpenCalendarId(id);
      setCalendarViewDate(currentDate ? new Date(currentDate) : new Date());
    }
  };

  const handleDateSelect = (id, year, month, day) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    updateRowData(id, 'date', `${year}-${m}-${d}`);
    setOpenCalendarId(null);
  };

  // ✅ NEW: DOM Traversal for moving to the next input on Enter key press
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentRow = e.target.closest('tr');
      if (currentRow) {
        const inputs = Array.from(currentRow.querySelectorAll('input'));
        const currentIndex = inputs.indexOf(e.target);
        
        // If not the last input in the row, focus the next one
        if (currentIndex > -1 && currentIndex < inputs.length - 1) {
          inputs[currentIndex + 1].focus();
        }
      }
    }
  };

  const isFormValid = rows.every(row => {
    const target = parseFloat(row.expectedAmount) || 0;
    const actual = calculateRowTotal(row.denominations);
    
    const isTextValid = isValidString(row.invoiceNumber) && isValidString(row.companyName);
    const isAmountValid = isValidAmount(row.billedAmount) && isValidAmount(row.expectedAmount);
    const isMathValid = Math.abs(target - actual) < 0.01;

    return isTextValid && isAmountValid && isMathValid;
  });

  const handleBulkSubmit = async () => {
    if (!isFormValid) return; 
    
    setIsSubmitting(true);
    try {
      const activeBranch = localStorage.getItem('active_branch') || 'DXB-MAIN';

      const response = await api.post('/api/inflow/bulk', { 
        transactions: rows, 
        branchId: activeBranch 
      });
      
      setModal({ isOpen: true, type: 'success', message: 'Successfully synced to the master ledger.' });
      setRows([getEmptyRow()]);
      setIsPreview(false);
      
    } catch (error) {
      console.error("Error submitting bulk data:", error);
      const errorMsg = error.response?.data?.message || 'Network error. Could not connect to the server.';
      setModal({ isOpen: true, type: 'error', message: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (isPreview) {
    return (
      <div className="max-w-6xl mx-auto p-10 bg-[#FCFCFD] rounded-[2rem] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-in fade-in">
        <h2 className="text-2xl font-semibold text-slate-900 mb-2 tracking-tight">Confirm Mass Entry</h2>
        <p className="text-slate-500 text-sm mb-8 font-light">Verify the reconciliation data before syncing to the ledger.</p>
        
        <div className="overflow-hidden mb-10 border border-slate-200/60 rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-100/50 text-slate-500 text-[11px] font-semibold uppercase tracking-widest border-b border-slate-200/60">
              <tr>
                <th className="px-6 py-4">Date</th>
                {/* 🔄 Swapped Company and Invoice Headers */}
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Invoice</th>
                <th className="px-6 py-4 text-right">Billed (AED)</th>
                <th className="px-6 py-4 text-right">Target (AED)</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(row => (
                <tr key={row.id} className="hover:bg-white transition-colors">
                  <td className="px-6 py-5 text-slate-600 font-medium">{formatDateForDisplay(row.date)}</td>
                  {/* 🔄 Swapped Company and Invoice Cells */}
                  <td className="px-6 py-5 text-slate-600">{row.companyName}</td>
                  <td className="px-6 py-5 font-semibold text-slate-900">{row.invoiceNumber}</td>
                  <td className="px-6 py-5 text-right font-medium text-slate-600">
                    {parseFloat(row.billedAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </td>
                  <td className="px-6 py-5 text-right font-semibold text-slate-900">
                    {parseFloat(row.expectedAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide border border-emerald-100/50">Verified</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end gap-4">
          <button 
            onClick={() => setIsPreview(false)} 
            className="px-8 py-3.5 text-slate-500 font-medium hover:bg-slate-100 hover:text-slate-700 rounded-full transition-colors"
          >
            Edit Data
          </button>
          <button 
            onClick={handleBulkSubmit} 
            disabled={isSubmitting} 
            className="px-8 py-3.5 bg-brand-dark text-white font-medium rounded-full hover:bg-brand-light shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {isSubmitting ? 'Syncing to Ledger...' : 'Confirm & Sync All'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-12 relative">
      
      {/* Header Section */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-[1.75rem] font-semibold text-slate-900 tracking-tight leading-tight">Cash Flow</h2>
          <p className="text-slate-500 text-sm mt-1.5 font-light tracking-wide">High-efficiency reconciliation grid.</p>
        </div>
        <button 
          onClick={() => setIsPreview(true)} 
          disabled={!isFormValid}
          className={`px-8 py-3 rounded-full font-medium transition-all duration-300 shadow-sm ${
            isFormValid 
              ? 'bg-brand-dark text-white hover:bg-[#1E1A2F] hover:shadow-md hover:-translate-y-0.5' 
              : 'bg-slate-200/50 text-slate-400 cursor-not-allowed opacity-70'
          }`}
        >
          Review & Submit →
        </button>
      </div>

      {/* Main Grid Card */}
      <div className="bg-[#FCFCFD] rounded-[2rem] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden">
        
        <div className="overflow-x-auto pb-4 min-h-[450px] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200/60 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300/80 [&::-webkit-scrollbar-thumb]:rounded-full">
          <table className="w-full text-left border-collapse whitespace-nowrap relative">
            
            <thead>
              <tr className="border-b border-slate-200/60 bg-slate-100/30">
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest min-w-[170px]">Date</th>
                {/* 🔄 Swapped Headers: Company Name is wider, Invoice No is smaller */}
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest min-w-[200px]">Company Name</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest min-w-[160px]">Invoice No.</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest min-w-[150px] text-right">Billed (AED)</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest min-w-[150px] text-right">Target (AED)</th>
                
                {DENOMINATIONS.map(d => (
                  <th key={d.label} className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center min-w-[80px]">
                    {d.label}
                  </th>
                ))}
                
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest min-w-[140px] text-right pl-6 border-l border-slate-200/60">Calc Total</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center w-[60px]"></th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100/80 text-sm">
              {rows.map((row) => {
                const target = parseFloat(row.expectedAmount) || 0;
                const actual = calculateRowTotal(row.denominations);
                const diff = target - actual;
                const isMatch = target > 0 && Math.abs(diff) < 0.01;

                const inputClasses = "w-full px-3 py-2.5 bg-white/60 hover:bg-white focus:bg-white border border-transparent hover:border-slate-200 focus:border-brand-light focus:ring-2 focus:ring-brand-light/10 rounded-xl text-slate-900 font-medium outline-none transition-all placeholder-slate-300";

                return (
                  <tr key={row.id} className="group hover:bg-slate-50/50 transition-colors">
                    
                    {/* CUSTOM CALENDAR IMPLEMENTATION */}
                    <td className="p-2 relative">
                      <div 
                        onClick={() => toggleCalendar(row.id, row.date)}
                        className={`${inputClasses} flex items-center justify-between relative overflow-hidden group/date cursor-pointer`}
                      >
                        <span className="text-slate-700 font-medium tracking-wide text-[13px]">
                          {formatDateForDisplay(row.date)}
                        </span>
                        <svg className={`w-4 h-4 transition-colors ${openCalendarId === row.id ? 'text-brand-dark' : 'text-slate-400 group-hover/date:text-brand-light'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>

                      {openCalendarId === row.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setOpenCalendarId(null)}></div>
                          <div className="absolute top-[calc(100%+8px)] left-2 p-5 bg-white rounded-[1.5rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100/80 z-50 w-[280px] animate-in slide-in-from-top-2 fade-in duration-200">
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
                                const isSelected = row.date === dateString;
                                const isToday = new Date().toISOString().split('T')[0] === dateString;
                                return (
                                  <button key={day} onClick={(e) => { e.stopPropagation(); handleDateSelect(row.id, calendarViewDate.getFullYear(), calendarViewDate.getMonth(), day); }} className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-medium transition-all ${isSelected ? 'bg-slate-900 text-white shadow-md' : isToday ? 'text-emerald-500 bg-emerald-50 hover:bg-emerald-100 font-bold' : 'text-slate-700 hover:bg-slate-100'}`}>
                                    {day}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </>
                      )}
                    </td>

                    {/* 🔄 Swapped Inputs: Company First, then Invoice */}
                    <td className="p-2">
                      <input type="text" placeholder="Company LLC" value={row.companyName} onChange={(e) => updateRowData(row.id, 'companyName', e.target.value)} onKeyDown={handleKeyDown} className={inputClasses} />
                    </td>
                    <td className="p-2">
                      <input type="text" placeholder="INV-001" value={row.invoiceNumber} onChange={(e) => updateRowData(row.id, 'invoiceNumber', e.target.value)} onKeyDown={handleKeyDown} className={`${inputClasses} uppercase`} />
                    </td>
                    
                    <td className="p-2">
                      <input type="number" placeholder="0.00" value={row.billedAmount} onChange={(e) => updateRowData(row.id, 'billedAmount', e.target.value)} onKeyDown={handleKeyDown} className={`${inputClasses} text-right text-slate-600 font-medium`} />
                    </td>
                    <td className="p-2">
                      <input type="number" placeholder="0.00" value={row.expectedAmount} onChange={(e) => updateRowData(row.id, 'expectedAmount', e.target.value)} onKeyDown={handleKeyDown} className={`${inputClasses} text-right font-semibold text-brand-dark`} />
                    </td>
                    
                    {DENOMINATIONS.map(d => (
                      <td key={d.label} className="p-2">
                        <input 
                          type="text" 
                          placeholder="-"
                          value={row.denominations[d.label]} 
                          onChange={(e) => updateDenomination(row.id, d.label, e.target.value)} 
                          onKeyDown={handleKeyDown}
                          className={`${inputClasses} text-center`}
                        />
                      </td>
                    ))}
                    
                    <td className="p-2 border-l border-slate-200/60 pl-4 align-middle">
                      <div className="flex flex-col items-end justify-center pr-2">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide border transition-all ${
                          isMatch 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' 
                            : target > 0 
                              ? 'bg-rose-50 text-rose-600 border-rose-100/50' 
                              : 'bg-white text-slate-400 border-slate-200'
                        }`}>
                          {actual.toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </span>
                        {target > 0 && !isMatch && (
                          <span className="text-[10px] text-rose-500 font-medium mt-1 mr-1">
                            {diff > 0 ? 'Short' : 'Over'}: {Math.abs(diff).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-2 text-center align-middle">
                      <button 
                        onClick={() => handleRemoveRow(row.id)} 
                        disabled={rows.length === 1} 
                        className="w-8 h-8 mx-auto rounded-full flex items-center justify-center text-slate-300 hover:bg-red-100 hover:text-red-600 hover:shadow-sm disabled:opacity-30 transition-all duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="p-6 bg-slate-100/30 border-t border-slate-200/60 flex items-center justify-center">
          <button 
            onClick={handleAddRow} 
            className="flex items-center gap-2 text-sm font-semibold text-brand-dark hover:text-brand-light bg-white px-6 py-2.5 border border-slate-200 hover:border-brand-light/30 rounded-full shadow-sm hover:shadow-md transition-all duration-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
            Add New Record
          </button>
        </div>
      </div>

      {/* --- ✅ BATCH CASH ENTRY SECTION --- */}
      <div className="mt-20">
        <div className="flex items-center justify-center gap-4 mb-12 opacity-60">
          <div className="h-px bg-slate-300 w-full max-w-[250px]"></div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest px-4">Or Use Batch Entry</span>
          <div className="h-px bg-slate-300 w-full max-w-[250px]"></div>
        </div>
        
        {/* Render the new Group Entry component here */}
        <GroupEntry />
      </div>

      {/* Custom Premium Success/Error Modal */}
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
                {modal.type === 'success' ? 'Sync Complete' : 'Sync Failed'}
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