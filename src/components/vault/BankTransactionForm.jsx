// frontend/src/components/vault/BankTransactionForm.jsx
import React, { useState, useEffect, useRef } from 'react';
import api from '../../config/api';
import PremiumCalendar from '../shared/PremiumCalendar';

const CEO_NOTE_TIERS = [
  { label: '1,000 AED', value: 1000 },
  { label: '500 AED', value: 500 },
  { label: '200 AED', value: 200 },
  { label: '100 AED', value: 100 },
  { label: '50 AED', value: 50 },
  { label: '20 AED', value: 20 },
  { label: '10 AED', value: 10 },
  { label: '5 AED', value: 5 },
  { label: '1 AED', value: 1 }
];

export default function BankTransactionForm({ onSuccess }) {
  // Mode Switcher: 'CEO_SAFE' (Deposit cash from CEO Vault) or 'MANUAL' (Virtual adjustment)
  const [formMode, setFormMode] = useState('CEO_SAFE');

  // Form State
  const [type, setType] = useState('CREDIT'); // Used in MANUAL mode
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  // CEO Denomination State
  const [ceoStock, setCeoStock] = useState({});
  const [noteCounts, setNoteCounts] = useState(
    CEO_NOTE_TIERS.reduce((acc, tier) => ({ ...acc, [tier.value]: '' }), {})
  );

  // UI State
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [error, setError] = useState(null);

  const dropdownRef = useRef(null);
  const submitLock = useRef(false);

  // Keyboard navigation refs
  const companyRef = useRef(null);
  const amountRef = useRef(null);
  const descRef = useRef(null);
  const noteRefs = useRef([]);
  const submitBtnRef = useRef(null);

  // Fetch live CEO Vault note inventory
  const fetchCeoStock = async () => {
    try {
      const activeBranch = localStorage.getItem('active_branch');
      if (!activeBranch) return;

      const response = await api.get(`/api/vault/summary?branchId=${encodeURIComponent(activeBranch)}&vaultType=ceo`);
      if (response.data && response.data.success) {
        const stockMap = {};
        (response.data.data || []).forEach(item => {
          stockMap[parseFloat(item.denomination_value)] = parseInt(item.total_quantity, 10);
        });
        setCeoStock(stockMap);
      }
    } catch (err) {
      console.error("[BankTransactionForm] Error fetching CEO vault stock:", err);
    }
  };

  useEffect(() => {
    fetchCeoStock();
  }, []);

  // Close type dropdown if clicked outside
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
      setDate(dates[0]);
    } else {
      setDate(new Date().toISOString().split('T')[0]);
    }
    setIsCalendarOpen(false);
  };

  // Denomination input handler with stock auto-clamping
  const handleNoteChange = (denomValue, valStr) => {
    setError(null);
    let cleanVal = valStr.replace(/[^0-9]/g, '');

    if (cleanVal === '') {
      setNoteCounts(prev => ({ ...prev, [denomValue]: '' }));
      return;
    }

    const numQty = parseInt(cleanVal, 10);
    const maxAvailable = ceoStock[denomValue] || 0;

    // Prevent selecting more notes than exist in the CEO Safe
    if (numQty > maxAvailable) {
      cleanVal = maxAvailable.toString();
    }

    setNoteCounts(prev => ({ ...prev, [denomValue]: cleanVal }));
  };

  // 2D Keyboard Grid Navigation across denomination inputs
  const handleNoteKeyDown = (e, idx) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (idx < CEO_NOTE_TIERS.length - 1) {
        noteRefs.current[idx + 1]?.focus();
        noteRefs.current[idx + 1]?.select?.();
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (idx > 0) {
        noteRefs.current[idx - 1]?.focus();
        noteRefs.current[idx - 1]?.select?.();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (idx + 3 < CEO_NOTE_TIERS.length) {
        noteRefs.current[idx + 3]?.focus();
        noteRefs.current[idx + 3]?.select?.();
      } else {
        submitBtnRef.current?.focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (idx - 3 >= 0) {
        noteRefs.current[idx - 3]?.focus();
        noteRefs.current[idx - 3]?.select?.();
      } else {
        descRef.current?.focus();
        descRef.current?.select?.();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (idx < CEO_NOTE_TIERS.length - 1) {
        noteRefs.current[idx + 1]?.focus();
        noteRefs.current[idx + 1]?.select?.();
      } else {
        submitBtnRef.current?.focus();
      }
    }
  };

  // Dynamic calculations for CEO Safe Deposit
  const calculatedNotesTotal = CEO_NOTE_TIERS.reduce((sum, tier) => {
    const qty = parseInt(noteCounts[tier.value], 10) || 0;
    return sum + (qty * tier.value);
  }, 0);

  const cleanTargetAmount = parseFloat(amount) || 0;
  const isExactMatch = cleanTargetAmount > 0 && Math.abs(cleanTargetAmount - calculatedNotesTotal) < 0.01;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError("Please enter a valid positive amount.");
      return;
    }

    if (!description.trim() || description.trim().length < 2) {
      setError("A valid description of at least 2 characters is required.");
      return;
    }

    if (formMode === 'CEO_SAFE') {
      if (!isExactMatch) {
        setError(`Denomination notes sum (AED ${calculatedNotesTotal.toFixed(2)}) must exactly match entered amount (AED ${cleanTargetAmount.toFixed(2)}).`);
        return;
      }
    }

    if (submitLock.current) return;
    submitLock.current = true;
    setIsSubmitting(true);

    try {
      const activeBranch = localStorage.getItem('active_branch');
      if (!activeBranch) {
        setError('Active branch is missing. Please log in again.');
        submitLock.current = false;
        setIsSubmitting(false);
        return;
      }

      if (formMode === 'CEO_SAFE') {
        // High-entropy deterministic key ensuring uniqueness on retry
        const clientTxId = `DEP-${Date.now()}-${Math.floor(100000 + Math.random() * 900000)}`;

        const response = await api.post('/api/vault/deposit-from-ceo', {
          clientTxId,
          branchId: activeBranch,
          date,
          companyName: companyName.trim() || 'General',
          description: description.trim(),
          amount: parseFloat(amount),
          denominations: noteCounts
        });

        if (response.data.success) {
          setSuccessMessage(response.data.message || "Deposit from CEO safe recorded successfully.");

          // Reset inputs
          setCompanyName('');
          setDescription('');
          setAmount('');
          setNoteCounts(CEO_NOTE_TIERS.reduce((acc, tier) => ({ ...acc, [tier.value]: '' }), {}));

          // Refresh physical stock
          fetchCeoStock();

          // Refresh parent overview and logs
          if (onSuccess) onSuccess();

          setTimeout(() => {
            setSuccessMessage(null);
          }, 3500);
        } else {
          setError(response.data.message || "Failed to log safe deposit.");
        }
      } else {
        // Manual Virtual Adjustment
        const clientTxId = `BNK-${Date.now()}-${Math.floor(100000 + Math.random() * 900000)}`;

        const response = await api.post('/api/vault/transaction', {
          clientTxId,
          branchId: activeBranch,
          type,
          date,
          companyName: companyName.trim() || 'General',
          description: description.trim(),
          amount: parseFloat(amount)
        });

        if (response.data.success) {
          setSuccessMessage(response.data.message || "Transaction logged successfully.");

          setCompanyName('');
          setDescription('');
          setAmount('');
          setType('CREDIT');

          if (onSuccess) onSuccess();

          setTimeout(() => {
            setSuccessMessage(null);
          }, 3000);
        } else {
          setError(response.data.message || "Failed to log transaction.");
        }
      }
    } catch (err) {
      console.error("[BankTransactionForm] Submit Error:", err);
      setError(err.response?.data?.message || err.message || "An error occurred while communicating with the server.");
    } finally {
      submitLock.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-[1.75rem] lg:rounded-[2rem] p-5 sm:p-6 lg:p-7 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] relative overflow-visible z-20 transition-all">
      
      {/* Success Overlay Animation */}
      {successMessage && (
        <div className="absolute inset-0 z-[60] bg-white/95 backdrop-blur-sm rounded-[1.75rem] lg:rounded-[2rem] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-3 animate-in zoom-in-50 duration-500 delay-100">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-1.5">Transaction Confirmed</h3>
          <p className="text-xs sm:text-sm font-medium text-slate-500 max-w-sm">{successMessage}</p>
        </div>
      )}

      {/* Segmented Mode Switcher - Compact for Laptop Screen */}
      <div className="flex p-1 bg-slate-100/80 rounded-xl mb-5 border border-slate-200/50">
        <button
          type="button"
          onClick={() => { setFormMode('CEO_SAFE'); setError(null); }}
          className={`flex-1 py-2 px-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
            formMode === 'CEO_SAFE'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>CEO Safe Deposit</span>
          <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700">Physical</span>
        </button>

        <button
          type="button"
          onClick={() => { setFormMode('MANUAL'); setError(null); }}
          className={`flex-1 py-2 px-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
            formMode === 'MANUAL'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <svg className="w-3.5 h-3.5 text-brand-dark shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <span>Direct Adjustment</span>
        </button>
      </div>

      {/* Header Info - Streamlined */}
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-900 tracking-tight">
          {formMode === 'CEO_SAFE' ? 'Deposit from CEO Vault Safe' : 'Log Manual Adjustment'}
        </h3>
        <p className="text-xs text-slate-500 mt-0.5 font-light">
          {formMode === 'CEO_SAFE'
            ? 'Transfer physical cash from the CEO safe into the bank ledger & master expenses.'
            : 'Record non-physical credits or debits directly to the bank ledger.'}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs sm:text-sm font-medium flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 relative z-30">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-40">
          
          {/* Transaction Type */}
          <div className="space-y-1.5 relative" ref={dropdownRef}>
            <label className="block text-xs font-medium text-slate-700">Transaction Type *</label>
            
            {formMode === 'CEO_SAFE' ? (
              // Fixed Credit Indicator for Safe Deposit
              <div className="w-full px-3.5 py-2.5 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center justify-between text-emerald-800">
                <div className="flex items-center gap-2 font-medium tracking-wide text-xs sm:text-sm text-emerald-700">
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                  <span>Credit (+) to Bank</span>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">CEO Safe</span>
              </div>
            ) : (
              // Custom Type Dropdown for Manual Adjustments
              <>
                <div 
                  onClick={() => {
                    setIsTypeDropdownOpen(!isTypeDropdownOpen);
                    setIsCalendarOpen(false);
                  }}
                  className="w-full px-3.5 py-2.5 bg-[#FCFCFD] border border-slate-200 rounded-xl cursor-pointer flex justify-between items-center hover:border-brand-light/50 focus:ring-2 focus:ring-brand-light/10 transition-all"
                >
                  <div className={`flex items-center gap-2 font-medium tracking-wide text-xs sm:text-sm ${type === 'CREDIT' ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {type === 'CREDIT' ? (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4" /></svg>
                    )}
                    {type === 'CREDIT' ? 'Credit (+)' : 'Debit (-)'}
                  </div>
                  <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${isTypeDropdownOpen ? 'rotate-180 text-brand-dark' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {isTypeDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsTypeDropdownOpen(false)}></div>
                    <div className="absolute top-[calc(100%+6px)] left-0 w-full p-1.5 bg-white rounded-xl shadow-[0_15px_30px_-5px_rgba(0,0,0,0.12)] border border-slate-100 z-50 animate-in slide-in-from-top-2 fade-in duration-150">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setType('CREDIT'); setIsTypeDropdownOpen(false); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center justify-between ${
                          type === 'CREDIT' ? 'bg-slate-50 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                          Credit (+)
                        </div>
                        {type === 'CREDIT' && (
                          <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setType('DEBIT'); setIsTypeDropdownOpen(false); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center justify-between mt-0.5 ${
                          type === 'DEBIT' ? 'bg-slate-50 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-3.5 h-3.5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4" /></svg>
                          Debit (-)
                        </div>
                        {type === 'DEBIT' && (
                          <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Date Picker using Custom PremiumCalendar */}
          <div className="space-y-1.5 relative z-30">
            <label className="block text-xs font-medium text-slate-700">Date *</label>
            <div 
              onClick={() => {
                setIsCalendarOpen(!isCalendarOpen);
                setIsTypeDropdownOpen(false);
              }}
              className="w-full px-3.5 py-2.5 bg-[#FCFCFD] border border-slate-200 rounded-xl text-slate-900 cursor-pointer flex justify-between items-center hover:border-brand-light/50 focus:ring-2 focus:ring-brand-light/10 transition-all"
            >
              <span className="font-medium tracking-wide text-xs sm:text-sm">
                {new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
              <svg className={`w-3.5 h-3.5 transition-colors ${isCalendarOpen ? 'text-brand-dark' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>

            <PremiumCalendar 
              isOpen={isCalendarOpen} 
              onClose={() => setIsCalendarOpen(false)} 
              selectedDates={[date]}
              onDateSelect={handleDateSelect}
            />
          </div>
        </div>

        {/* Company / Entity & Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700">Company / Entity</label>
            <input
              ref={companyRef}
              type="text"
              placeholder="e.g. Grandmills / Bank"
              value={companyName}
              onChange={(e) => { setError(null); setCompanyName(e.target.value); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  amountRef.current?.focus();
                  amountRef.current?.select?.();
                }
              }}
              className="w-full px-3.5 py-2.5 bg-[#FCFCFD] border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-light focus:ring-2 focus:ring-brand-light/10 transition-all text-xs sm:text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700">Amount (AED) *</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-xs sm:text-sm">AED</span>
              <input
                ref={amountRef}
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => { setError(null); setAmount(e.target.value); }}
                onWheel={(e) => e.target.blur()}
                onFocus={(e) => e.target.select()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    descRef.current?.focus();
                    descRef.current?.select?.();
                  }
                }}
                className="w-full pl-12 pr-3.5 py-2.5 bg-[#FCFCFD] border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-brand-light focus:ring-2 focus:ring-brand-light/10 transition-all text-sm sm:text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5 relative z-10">
          <label className="block text-xs font-medium text-slate-700">Description *</label>
          <input
            ref={descRef}
            type="text"
            required
            placeholder={formMode === 'CEO_SAFE' ? "e.g., Physical cash deposit from CEO safe into bank account" : "e.g., Monthly office internet bill"}
            value={description}
            onChange={(e) => { setError(null); setDescription(e.target.value); }}
            onFocus={(e) => e.target.select()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'ArrowDown') {
                e.preventDefault();
                if (formMode === 'CEO_SAFE') {
                  noteRefs.current[0]?.focus();
                  noteRefs.current[0]?.select?.();
                } else {
                  submitBtnRef.current?.focus();
                }
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                amountRef.current?.focus();
                amountRef.current?.select?.();
              }
            }}
            className="w-full px-3.5 py-2.5 bg-[#FCFCFD] border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-light focus:ring-2 focus:ring-brand-light/10 transition-all text-xs sm:text-sm"
          />
        </div>

        {/* CEO SAFE DENOMINATIONS SELECTOR - Optimized Compact Grid for Laptop */}
        {formMode === 'CEO_SAFE' && (
          <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-4.5 border border-slate-200/80 space-y-3">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-slate-900 tracking-tight flex items-center gap-1.5">
                  <span>Physical Note Denominations</span>
                  <span className="text-[10px] font-normal text-slate-500">(CEO Safe)</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Specify note quantities being deposited.</p>
              </div>

              {/* Dynamic Live Recalculation Badge */}
              <div className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                isExactMatch 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm' 
                  : cleanTargetAmount > 0 
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {isExactMatch ? (
                  <>
                    <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                    <span>Exact Match: AED {cleanTargetAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </>
                ) : cleanTargetAmount > 0 ? (
                  <span>Selected: {calculatedNotesTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} / {cleanTargetAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                ) : (
                  <span>Selected: AED {calculatedNotesTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                )}
              </div>
            </div>

            {/* Note Denomination Grid - Compact 3-Column on Laptop */}
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5 pt-1">
              {CEO_NOTE_TIERS.map((tier, idx) => {
                const stock = ceoStock[tier.value] || 0;
                const count = noteCounts[tier.value] || '';
                const hasValue = count && parseInt(count, 10) > 0;
                const isOutOfStock = stock <= 0;

                return (
                  <div 
                    key={tier.value} 
                    className={`bg-white p-2.5 rounded-xl border transition-all ${
                      hasValue 
                        ? 'border-emerald-500/80 bg-emerald-50/20 shadow-sm ring-1 ring-emerald-500/20' 
                        : 'border-slate-200/80 hover:border-slate-300 shadow-[0_1px_4px_rgba(0,0,0,0.02)]'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1.5 px-0.5">
                      <span className="text-[11px] sm:text-xs font-bold text-slate-800">{tier.label}</span>
                      <span className={`text-[10px] font-semibold ${isOutOfStock ? 'text-rose-400' : 'text-slate-400'}`}>
                        Stock: {stock}
                      </span>
                    </div>
                    <input
                      ref={el => noteRefs.current[idx] = el}
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      disabled={isOutOfStock}
                      value={count}
                      onChange={(e) => handleNoteChange(tier.value, e.target.value)}
                      onFocus={(e) => e.target.select()}
                      onKeyDown={(e) => handleNoteKeyDown(e, idx)}
                      className={`w-full text-center py-1.5 px-1 rounded-lg border font-semibold text-xs sm:text-sm transition-all outline-none ${
                        isOutOfStock 
                          ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed'
                          : hasValue
                            ? 'bg-white border-emerald-400 text-slate-900 focus:border-brand-dark focus:ring-1 focus:ring-brand-dark/20'
                            : 'bg-[#FCFCFD] border-slate-200 text-slate-900 focus:border-brand-dark focus:bg-white focus:ring-1 focus:ring-brand-dark/20'
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            {/* Quick Sync Button */}
            {calculatedNotesTotal > 0 && cleanTargetAmount !== calculatedNotesTotal && (
              <div className="flex justify-end pt-0.5">
                <button
                  type="button"
                  onClick={() => { setError(null); setAmount(calculatedNotesTotal.toString()); }}
                  className="text-xs text-brand-dark hover:text-slate-900 font-semibold underline underline-offset-2 flex items-center gap-1 transition-colors"
                >
                  <span>Sync Amount to AED {calculatedNotesTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Submit Button - Compact for Laptop */}
        <div className="pt-1 relative z-10">
          <button
            ref={submitBtnRef}
            type="submit"
            disabled={isSubmitting || (formMode === 'CEO_SAFE' && (!isExactMatch || cleanTargetAmount <= 0))}
            className={`w-full py-3.5 rounded-xl text-white font-bold tracking-wide transition-all shadow-md flex items-center justify-center gap-2 text-sm ${
              isSubmitting || (formMode === 'CEO_SAFE' && (!isExactMatch || cleanTargetAmount <= 0))
                ? 'bg-slate-300 cursor-not-allowed text-slate-500 shadow-none' 
                : formMode === 'CEO_SAFE' || type === 'CREDIT'
                  ? 'bg-emerald-500 hover:bg-emerald-600 hover:shadow-lg' 
                  : 'bg-rose-500 hover:bg-rose-600 hover:shadow-lg'
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span>Processing Transaction...</span>
              </>
            ) : formMode === 'CEO_SAFE' ? (
              <>
                <span>Deposit from CEO Safe</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </>
            ) : (
              <>
                <span>{type === 'CREDIT' ? 'Record Credit' : 'Record Debit'}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}