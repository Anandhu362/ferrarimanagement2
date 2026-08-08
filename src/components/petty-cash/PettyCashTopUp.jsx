// frontend/src/components/petty-cash/PettyCashTopUp.jsx
import React, { useState, useEffect } from 'react';
import api from '../../config/api';

const PC_DENOMINATIONS = [
  { label: '1000 AED', value: 1000, isNote: true },
  { label: '500 AED', value: 500, isNote: true },
  { label: '200 AED', value: 200, isNote: true },
  { label: '100 AED', value: 100, isNote: true },
  { label: '50 AED', value: 50, isNote: true },
  { label: '20 AED', value: 20, isNote: true },
  { label: '10 AED', value: 10, isNote: true },
  { label: '5 AED', value: 5, isNote: true },
  { label: '1 AED', value: 1, isNote: false },
  { label: '0.50 AED', value: 0.5, isNote: false }
];

const VAULT_SOURCES = [
  "CEO Vault",
  "Accountant Vault"
];

export default function PettyCashTopUp({ onTopUpSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: 'success', message: '' });
  
  const [isSourceOpen, setIsSourceOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());
  
  const [vaultStock, setVaultStock] = useState({});

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    source: 'CEO Vault',
    topUpAmount: '',
    description: '' 
  });

  const [noteCounts, setNoteCounts] = useState(
    PC_DENOMINATIONS.reduce((acc, tier) => ({ ...acc, [tier.value]: '' }), {})
  );

  useEffect(() => {
    const fetchVaultStock = async () => {
      try {
        const activeBranch = localStorage.getItem('active_branch');
        if (!activeBranch) return;
        const response = await api.get(`/api/petty-cash/vault-inventory?branchId=${activeBranch}&vaultSource=${formData.source}`);
        if (response.data.success) {
          setVaultStock(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch vault stock", error);
        setVaultStock({}); 
      }
    };
    
    fetchVaultStock();
  }, [formData.source]);

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSourceSelect = (source) => {
    setFormData({ ...formData, source });
    setIsSourceOpen(false);
  };

  const handleDateSelect = (year, month, day) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    setFormData({ ...formData, date: `${year}-${m}-${d}` });
    setIsCalendarOpen(false);
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleNoteChange = (value, qtyStr) => {
    let cleanQty = qtyStr.replace(/[^0-9]/g, '');
    if (cleanQty === '') {
      setNoteCounts({ ...noteCounts, [value]: '' });
      return;
    }
    setNoteCounts({ ...noteCounts, [value]: cleanQty });
  };

  const calculatedDenomSum = PC_DENOMINATIONS.reduce((sum, tier) => {
    const qty = parseInt(noteCounts[tier.value]) || 0;
    return sum + (qty * tier.value);
  }, 0);

  const targetAmount = parseFloat(formData.topUpAmount) || 0;
  
  let hasInsufficientStock = false;
  PC_DENOMINATIONS.forEach(tier => {
    const requestedQty = parseInt(noteCounts[tier.value]) || 0;
    const availableQty = vaultStock[tier.value] || 0;
    if (requestedQty > availableQty) {
      hasInsufficientStock = true;
    }
  });

  const isAmountMatch = targetAmount > 0 && Math.abs(targetAmount - calculatedDenomSum) < 0.01;
  const canSubmit = isAmountMatch && !hasInsufficientStock;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);

    try {
      const activeBranch = localStorage.getItem('active_branch');
      if (!activeBranch) {
        setModal({ isOpen: true, type: 'error', message: 'Active branch is missing. Please log in again.' });
        setIsSubmitting(false);
        return;
      }
      
      const denominationsToDeduct = {};
      Object.entries(noteCounts).forEach(([value, qty]) => {
        if (qty && parseInt(qty) > 0) {
          denominationsToDeduct[value] = parseInt(qty);
        }
      });
      
      const payload = {
        date: formData.date,
        vaultSource: formData.source,
        amount: targetAmount,
        denominations: denominationsToDeduct,
        branchId: activeBranch,
        description: formData.description 
      };

      await api.post('/api/petty-cash/top-up', payload);

      setModal({ isOpen: true, type: 'success', message: `Successfully transferred AED ${targetAmount.toLocaleString()} to Petty Cash!` });
      
      // Reset form
      setFormData({ ...formData, topUpAmount: '', description: '' });
      setNoteCounts(PC_DENOMINATIONS.reduce((acc, tier) => ({ ...acc, [tier.value]: '' }), {}));

      const refreshResponse = await api.get(`/api/petty-cash/vault-inventory?branchId=${activeBranch}&vaultSource=${formData.source}`);
      if (refreshResponse.data.success) {
        setVaultStock(refreshResponse.data.data);
      }

      if (onTopUpSuccess) onTopUpSuccess();

    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to process top-up. Please check vault balance.";
      setModal({ isOpen: true, type: 'error', message: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] relative z-30 mb-8">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Manual Petty Cash Top-Up</h3>
          <p className="text-xs text-slate-500 mt-1 font-light">Transfer funds from a main vault to the petty cash ledger.</p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mb-1.5">Status</span>
          {hasInsufficientStock ? (
             <span className="bg-rose-50 text-rose-600 px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-rose-100/50 flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
               Insufficient Vault Stock
             </span>
          ) : isAmountMatch ? (
            <span className="bg-emerald-50 text-emerald-600 px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-emerald-100/50 flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
               Ready to Transfer
            </span>
          ) : (
             <span className="bg-amber-50 text-amber-600 px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-amber-100/50 flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
               Pending Match
             </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 relative z-20">
        
        {/* Date Input */}
        <div className="space-y-2 relative">
          <label className="block text-sm font-medium text-slate-700">Date *</label>
          <div 
            onClick={() => { setIsCalendarOpen(!isCalendarOpen); setIsSourceOpen(false); }}
            className="w-full px-4 py-3 bg-[#FCFCFD] border border-slate-200 rounded-xl text-slate-900 cursor-pointer flex justify-between items-center hover:border-brand-light/50 transition-all shadow-sm"
          >
            <span className="font-medium tracking-wide text-sm">{formatDateForDisplay(formData.date)}</span>
            <svg className={`w-4 h-4 transition-colors ${isCalendarOpen ? 'text-brand-dark' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          
          {isCalendarOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsCalendarOpen(false)}></div>
              <div className="absolute top-[calc(100%+8px)] left-0 w-full min-w-[280px] p-5 bg-white rounded-[1.5rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100/80 z-50 animate-in slide-in-from-top-2 fade-in duration-200">
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
                    const isSelected = formData.date === dateString;
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

        {/* Vault Source Dropdown */}
        <div className="space-y-2 relative">
          <label className="block text-sm font-medium text-slate-700">From Vault *</label>
          <div 
            onClick={() => { setIsSourceOpen(!isSourceOpen); setIsCalendarOpen(false); }}
            className="w-full px-4 py-3 bg-[#FCFCFD] border border-slate-200 rounded-xl text-slate-900 cursor-pointer flex justify-between items-center hover:border-brand-light/50 transition-all shadow-sm"
          >
            <span className="font-medium text-sm">{formData.source}</span>
            <svg className={`w-4 h-4 transition-transform duration-200 ${isSourceOpen ? 'rotate-180 text-brand-dark' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
          </div>

          {isSourceOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsSourceOpen(false)}></div>
              <div className="absolute top-[calc(100%+8px)] left-0 w-full p-2 bg-white rounded-[1.5rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100/80 z-50 animate-in slide-in-from-top-2 fade-in duration-200">
                {VAULT_SOURCES.map(source => (
                  <button
                    key={source}
                    onClick={() => handleSourceSelect(source)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-between ${formData.source === source ? 'bg-slate-50 text-brand-dark' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                  >
                    {source}
                    {formData.source === source && <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Top-up Amount Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Top-up Amount *</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">AED</span>
            <input 
              type="number" 
              name="topUpAmount" 
              value={formData.topUpAmount} 
              onChange={handleFormChange} 
              placeholder="0.00" 
              className="w-full pl-14 pr-4 py-3 bg-[#FCFCFD] border border-slate-200 rounded-xl text-slate-900 font-semibold outline-none focus:border-brand-dark transition-all shadow-sm text-lg" 
            />
          </div>
        </div>
      </div>

      {/* Description Input */}
      <div className="space-y-2 mb-8 relative z-10">
        <label className="block text-sm font-medium text-slate-700">Description (Optional)</label>
        <input 
          type="text" 
          name="description" 
          value={formData.description} 
          onChange={handleFormChange} 
          placeholder="e.g. Weekly operational cash reload" 
          className="w-full px-4 py-3 bg-[#FCFCFD] border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-brand-dark transition-all shadow-sm text-sm" 
        />
      </div>

      <div className="bg-slate-50/50 rounded-[2rem] p-8 border border-slate-100/80">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h4 className="text-sm font-semibold text-slate-800">Select Denominations to Deduct</h4>
          <div className="flex items-center gap-4 text-sm font-medium bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
            <span className="text-slate-500">Target: <span className="text-slate-900 font-bold">{targetAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></span>
            <div className="w-px h-4 bg-slate-200"></div>
            <span className={`transition-colors font-bold ${isAmountMatch ? 'text-emerald-500' : 'text-amber-500'}`}>
              Selected: {calculatedDenomSum.toLocaleString(undefined, {minimumFractionDigits: 2})}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
          {PC_DENOMINATIONS.map((tier) => {
            const requestedQty = parseInt(noteCounts[tier.value]) || 0;
            const availableQty = vaultStock[tier.value] || 0;
            const isOverdraft = requestedQty > availableQty;

            return (
              <div key={tier.value} className={`bg-white p-4 rounded-2xl border transition-all ${isOverdraft ? 'border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : 'border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]'}`}>
                <div className="flex justify-between items-center mb-3">
                  <div className="text-xs font-semibold text-slate-500">{tier.label}</div>
                  <div className={`text-[10px] font-bold ${availableQty === 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                    Stock: {availableQty}
                  </div>
                </div>
                <input 
                  type="text"
                  placeholder="0"
                  value={noteCounts[tier.value]}
                  onChange={(e) => handleNoteChange(tier.value, e.target.value)}
                  className={`w-full text-center py-2 rounded-xl border outline-none font-medium text-sm transition-all ${
                    isOverdraft 
                    ? 'border-rose-300 text-rose-600 bg-rose-50' 
                    : 'border-slate-200 text-slate-900 bg-[#FCFCFD] focus:border-brand-dark focus:ring-2 focus:ring-brand-light/10'
                  }`}
                />
              </div>
            );
          })}
        </div>

        <div className="flex justify-end">
          <button 
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className={`px-10 py-4 rounded-xl font-medium tracking-wide transition-all duration-300 shadow-sm ${
              canSubmit 
                ? 'bg-brand-dark text-white hover:bg-slate-800 hover:-translate-y-0.5 hover:shadow-lg' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Processing...' : 'Confirm & Transfer'}
          </button>
        </div>
      </div>

      {modal.isOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
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
                   {modal.type === 'success' ? 'Transfer Complete' : 'Transfer Failed'}
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