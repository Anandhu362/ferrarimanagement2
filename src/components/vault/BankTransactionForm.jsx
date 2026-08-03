// frontend/src/components/vault/BankTransactionForm.jsx
import React, { useState, useEffect, useRef } from 'react';
import api from '../../config/api';
import PremiumCalendar from '../shared/PremiumCalendar';

export default function BankTransactionForm({ onSuccess }) {
  // Form State
  const [type, setType] = useState('CREDIT'); // 'CREDIT' or 'DEBIT'
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  // UI State
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [error, setError] = useState(null);

  const dropdownRef = useRef(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsTypeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateSelect = (dates) => {
    if (dates && dates.length > 0) {
      setDate(dates[0]); // Take the first date since this is a single-date form
    } else {
      setDate(new Date().toISOString().split('T')[0]);
    }
    setIsCalendarOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError("Please enter a valid positive amount.");
      return;
    }
    if (!description.trim()) {
      setError("Description is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const activeBranch = localStorage.getItem('active_branch') || 'DXB-MAIN';
      
      const response = await api.post('/api/vault/transaction', {
        branchId: activeBranch,
        type,
        date,
        companyName,
        description,
        amount: parseFloat(amount)
      });

      if (response.data.success) {
        setSuccessMessage(response.data.message || "Transaction logged successfully.");
        
        // Reset form
        setCompanyName('');
        setDescription('');
        setAmount('');
        setType('CREDIT');
        
        // Trigger parent refresh
        if (onSuccess) onSuccess();

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        setError(response.data.message || "Failed to log transaction.");
      }
    } catch (err) {
      console.error("Transaction Error:", err);
      setError(err.response?.data?.message || "An error occurred while communicating with the server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-[2rem] p-8 lg:p-10 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] relative overflow-visible z-20">
      
      {/* Success Overlay Animation */}
      {successMessage && (
        <div className="absolute inset-0 z-[60] bg-white/90 backdrop-blur-sm rounded-[2rem] flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-4 animate-in zoom-in-50 duration-500 delay-100">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-2">Success!</h3>
          <p className="text-sm font-medium text-slate-500">{successMessage}</p>
        </div>
      )}

      <div className="mb-8">
        <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Log Manual Transaction</h3>
        <p className="text-xs text-slate-500 mt-1 font-light">Record non-physical credits or debits directly to the bank ledger.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm font-medium flex items-center gap-2">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 relative z-30">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-40">
          {/* Custom Type Dropdown */}
          <div className="space-y-2 relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-slate-700">Transaction Type *</label>
            <div 
              onClick={() => {
                setIsTypeDropdownOpen(!isTypeDropdownOpen);
                setIsCalendarOpen(false);
              }}
              className="w-full px-4 py-3 bg-[#FCFCFD] border border-slate-200 rounded-xl cursor-pointer flex justify-between items-center hover:border-brand-light/50 focus:ring-2 focus:ring-brand-light/10 transition-all"
            >
              <div className={`flex items-center gap-2 font-medium tracking-wide text-sm ${type === 'CREDIT' ? 'text-emerald-700' : 'text-rose-700'}`}>
                {type === 'CREDIT' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4" /></svg>
                )}
                {type === 'CREDIT' ? 'Credit (+)' : 'Debit (-)'}
              </div>
              <svg className={`w-4 h-4 transition-transform duration-300 ${isTypeDropdownOpen ? 'rotate-180 text-brand-dark' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {isTypeDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsTypeDropdownOpen(false)}></div>
                <div className="absolute top-[calc(100%+8px)] left-0 w-full p-2 bg-white rounded-[1.25rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100/80 z-50 animate-in slide-in-from-top-2 fade-in duration-200">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setType('CREDIT'); setIsTypeDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between ${
                      type === 'CREDIT' ? 'bg-slate-50 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                        Credit (+)
                    </div>
                    {type === 'CREDIT' && (
                      <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setType('DEBIT'); setIsTypeDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between mt-1 ${
                      type === 'DEBIT' ? 'bg-slate-50 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4" /></svg>
                        Debit (-)
                    </div>
                    {type === 'DEBIT' && (
                      <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Date Picker using PremiumCalendar */}
          <div className="space-y-2 relative z-30">
            <label className="block text-sm font-medium text-slate-700">Date *</label>
            <div 
              onClick={() => {
                setIsCalendarOpen(!isCalendarOpen);
                setIsTypeDropdownOpen(false);
              }}
              className="w-full px-4 py-3 bg-[#FCFCFD] border border-slate-200 rounded-xl text-slate-900 cursor-pointer flex justify-between items-center hover:border-brand-light/50 focus:ring-2 focus:ring-brand-light/10 transition-all"
            >
              <span className="font-medium tracking-wide text-sm">{new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              <svg className={`w-4 h-4 transition-colors ${isCalendarOpen ? 'text-brand-dark' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>

            <PremiumCalendar 
              isOpen={isCalendarOpen} 
              onClose={() => setIsCalendarOpen(false)} 
              selectedDates={[date]} // Pass as array for the updated component
              onDateSelect={handleDateSelect}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Company / Entity</label>
            <input
              type="text"
              placeholder="e.g. Supplier XYZ"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-3 bg-[#FCFCFD] border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-light focus:ring-2 focus:ring-brand-light/10 transition-all text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Amount (AED) *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">AED</span>
              {/* ✅ UPDATED: Added Tailwind classes to hide arrows and onWheel event to prevent scroll-editing */}
              <input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onWheel={(e) => e.target.blur()}
                className="w-full pl-14 pr-4 py-3 bg-[#FCFCFD] border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-brand-light focus:ring-2 focus:ring-brand-light/10 transition-all text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2 relative z-10">
          <label className="block text-sm font-medium text-slate-700">Description *</label>
          <input
            type="text"
            required
            placeholder="e.g., Monthly office internet bill"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 bg-[#FCFCFD] border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-light focus:ring-2 focus:ring-brand-light/10 transition-all text-sm"
          />
        </div>

        <div className="pt-2 relative z-10">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-4 rounded-xl text-white font-bold tracking-wide transition-all shadow-md flex items-center justify-center gap-2 ${
              isSubmitting 
                ? 'bg-slate-400 cursor-not-allowed' 
                : type === 'CREDIT' 
                  ? 'bg-emerald-500 hover:bg-emerald-600 hover:shadow-lg' 
                  : 'bg-rose-500 hover:bg-rose-600 hover:shadow-lg'
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Processing...
              </>
            ) : (
              <>
                {type === 'CREDIT' ? 'Record Credit' : 'Record Debit'}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}