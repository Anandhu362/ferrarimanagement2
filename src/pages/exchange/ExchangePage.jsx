// frontend/src/pages/exchange/ExchangePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api'; 
import DenominationColumn from '../../components/exchange/DenominationColumn';
import ReserveExchangeForm from '../../components/exchange/ReserveExchangeForm'; // ✅ Imported Reserve Component

const DENOMINATIONS = [
  { label: '1000', value: 1000, isNote: true },
  { label: '500', value: 500, isNote: true },
  { label: '200', value: 200, isNote: true },
  { label: '100', value: 100, isNote: true },
  { label: '50', value: 50, isNote: true },
  { label: '20', value: 20, isNote: true },
  { label: '10', value: 10, isNote: true },
  { label: '5', value: 5, isNote: true },
  { label: '1', value: 1, isNote: false },
  { label: '0.50', value: 0.5, isNote: false }
];

const VAULT_OPTIONS = [
  { value: 'accountant', label: 'Accountant Vault' },
  { value: 'ceo', label: 'CEO Vault' }
];

export default function ExchangePage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vaultStock, setVaultStock] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [branchError, setBranchError] = useState(false);

  // Custom UI States
  const [modal, setModal] = useState({ isOpen: false, type: 'success', message: '' });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());
  const [isVaultDropdownOpen, setIsVaultDropdownOpen] = useState(false);

  const [formData, setFormData] = useState({
    vaultType: 'accountant', // Defaults to Accountant Vault
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const [givenNotes, setGivenNotes] = useState(
    DENOMINATIONS.reduce((acc, tier) => ({ ...acc, [tier.value]: '' }), {})
  );

  const [takenNotes, setTakenNotes] = useState(
    DENOMINATIONS.reduce((acc, tier) => ({ ...acc, [tier.value]: '' }), {})
  );

  // Fetch current vault inventory FOR THE SPECIFIC BRANCH & VAULT
  const fetchStock = async () => {
    try {
      const activeBranch = localStorage.getItem('active_branch');
      
      // Safety check: Prevent fetching if local storage is missing
      if (!activeBranch) {
        setBranchError(true);
        return;
      }

      const response = await api.get(`/api/vault/summary?branchId=${encodeURIComponent(activeBranch)}&vaultType=${formData.vaultType}`);
      
      const result = response.data;
      if (result.success) {
        const stockMap = {};
        result.data.forEach(item => {
          stockMap[parseFloat(item.denomination_value)] = parseInt(item.total_quantity);
        });
        setVaultStock(stockMap);
      } else {
        setVaultStock({}); // Reset if no data found
      }
    } catch (error) {
      console.error("Error fetching vault stock:", error);
      setVaultStock({});
    }
  };

  const clearAll = () => {
    setGivenNotes(DENOMINATIONS.reduce((acc, tier) => ({ ...acc, [tier.value]: '' }), {}));
    setTakenNotes(DENOMINATIONS.reduce((acc, tier) => ({ ...acc, [tier.value]: '' }), {}));
  };

  // Re-fetch stock AND clear inputs whenever the vault selection changes
  useEffect(() => {
    fetchStock();
    clearAll();
  }, [refreshKey, formData.vaultType]);

  // Calculations
  const totalGiven = DENOMINATIONS.reduce((sum, tier) => sum + ((parseInt(givenNotes[tier.value]) || 0) * tier.value), 0);
  const totalTaken = DENOMINATIONS.reduce((sum, tier) => sum + ((parseInt(takenNotes[tier.value]) || 0) * tier.value), 0);
  
  const isValidMatch = totalGiven > 0 && Math.abs(totalGiven - totalTaken) < 0.01;
  const canSubmit = isValidMatch && formData.description.trim() !== '';

  // Handlers
  const handleFormChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

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

  const handleGivenChange = (value, qtyStr) => {
    const cleanQty = qtyStr.replace(/[^0-9]/g, '');
    setGivenNotes({ ...givenNotes, [value]: cleanQty });
  };

  const handleTakenChange = (value, qtyStr) => {
    let cleanQty = qtyStr.replace(/[^0-9]/g, '');
    if (cleanQty !== '') {
      const numQty = parseInt(cleanQty, 10);
      const maxAvailable = vaultStock[value] || 0;
      // Front-end safeguard: Prevent user from typing a quantity greater than available stock
      if (numQty > maxAvailable) cleanQty = maxAvailable.toString();
    }
    setTakenNotes({ ...takenNotes, [value]: cleanQty });
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);

    try {
      const activeBranch = localStorage.getItem('active_branch');
      
      // Secondary block during submission just in case storage is cleared mid-session
      if (!activeBranch) {
        setModal({ isOpen: true, type: 'error', message: 'Critical Error: No active branch selected. Please log in or select a branch again.' });
        setIsSubmitting(false);
        return;
      }

      const payload = {
        vaultType: formData.vaultType,
        date: formData.date,
        description: formData.description,
        givenNotes,
        takenNotes,
        branchId: activeBranch
      };

      await api.post('/api/exchange/process', payload);

      setModal({ isOpen: true, type: 'success', message: `Denomination exchange for the ${formData.vaultType.toUpperCase()} Vault was successfully processed and audited.` });
      setFormData({ ...formData, description: '' });
      clearAll();
      setRefreshKey(old => old + 1); 

    } catch (error) {
      console.error("Submission error:", error);
      const errorMsg = error.response?.data?.message || 'Network error. Could not connect to the server.';
      setModal({ isOpen: true, type: 'error', message: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Branch Error Render State
  if (branchError) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="bg-rose-50 border border-rose-100 p-8 rounded-[2rem] text-center max-w-md shadow-sm">
          <svg className="w-12 h-12 text-rose-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <h3 className="text-xl font-semibold text-slate-900 tracking-tight mb-2">Active Branch Missing</h3>
          <p className="text-slate-500 text-sm font-light mb-6">We could not identify your active branch location. Please log in or select a branch to view the exchange ledger.</p>
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

  return (
    <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-12 relative">
      
      <div className="mb-8">
        <h2 className="text-[1.75rem] font-semibold text-slate-900 tracking-tight leading-tight">Denomination Exchange</h2>
        <p className="text-slate-500 text-sm mt-1.5 font-light tracking-wide">
          Swap notes within the vault without altering the total cash balance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT PANEL: Details & Validation */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm relative z-20">
            <h3 className="text-lg font-semibold text-slate-900 tracking-tight mb-6">Exchange Details</h3>
            
            <div className="space-y-5">
              
              {/* Premium Custom Vault Dropdown */}
              <div className="space-y-2 relative">
                <label className="block text-sm font-medium text-slate-700">From Vault *</label>
                <div 
                  onClick={() => setIsVaultDropdownOpen(!isVaultDropdownOpen)}
                  className="w-full px-4 py-3 bg-[#FCFCFD] border border-slate-200 rounded-xl text-slate-900 cursor-pointer flex justify-between items-center hover:border-brand-light/50 focus:ring-2 focus:ring-brand-light/10 transition-all"
                >
                  <span className="font-medium tracking-wide text-sm">
                    {VAULT_OPTIONS.find(opt => opt.value === formData.vaultType)?.label || 'Select Vault'}
                  </span>
                  <svg 
                    className={`w-4 h-4 transition-transform duration-300 ${isVaultDropdownOpen ? 'rotate-180 text-brand-dark' : 'text-slate-400'}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {isVaultDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsVaultDropdownOpen(false)}></div>
                    <div className="absolute top-[calc(100%+8px)] left-0 w-full p-2 bg-white rounded-[1.25rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100/80 z-50 animate-in slide-in-from-top-2 fade-in duration-200">
                      {VAULT_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormData({ ...formData, vaultType: option.value });
                            setIsVaultDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between ${
                            formData.vaultType === option.value
                              ? 'bg-slate-50 text-slate-900'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          {option.label}
                          {formData.vaultType === option.value && (
                            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Date Picker */}
              <div className="space-y-2 relative">
                <label className="block text-sm font-medium text-slate-700">Date *</label>
                <div 
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                  className="w-full px-4 py-3 bg-[#FCFCFD] border border-slate-200 rounded-xl text-slate-900 cursor-pointer flex justify-between items-center hover:border-brand-light/50 focus:ring-2 focus:ring-brand-light/10 transition-all"
                >
                  <span className="font-medium tracking-wide text-sm">{formatDateForDisplay(formData.date)}</span>
                  <svg className={`w-4 h-4 transition-colors ${isCalendarOpen ? 'text-brand-dark' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>

                {isCalendarOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsCalendarOpen(false)}></div>
                    <div className="absolute top-[calc(100%+8px)] left-0 w-full p-5 bg-white rounded-[1.5rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100/80 z-50 animate-in slide-in-from-top-2 fade-in duration-200">
                      <div className="flex justify-between items-center mb-5">
                        <button onClick={(e) => { e.stopPropagation(); setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1)); }} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <div className="text-[15px] font-bold text-slate-900">
                          {calendarViewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1)); }} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                        </button>
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 0).getDate() }).map((_, i) => {
                          const day = i + 1;
                          const dateString = `${calendarViewDate.getFullYear()}-${String(calendarViewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          return (
                            <button
                              key={day}
                              onClick={(e) => { e.stopPropagation(); handleDateSelect(calendarViewDate.getFullYear(), calendarViewDate.getMonth(), day); }}
                              className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-medium transition-all ${formData.date === dateString ? 'bg-slate-900 text-white shadow-md' : 'text-slate-700 hover:bg-slate-100'}`}
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

              <div className="space-y-2 mb-5">
                <label className="block text-sm font-medium text-slate-700">Reason / Description *</label>
                <input type="text" name="description" value={formData.description} onChange={handleFormChange} placeholder="e.g., Exchanging 1000s for customer change" className="w-full px-4 py-3 bg-[#FCFCFD] border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-brand-light transition-all text-sm" />
              </div>
            </div>
          </div>

          {/* Validation Engine */}
          <div className="bg-brand-dark rounded-[2rem] p-8 text-white relative shadow-lg flex-1">
            <h3 className="text-white/60 text-xs font-semibold tracking-widest uppercase mb-6">Validation Engine</h3>
            <div className="space-y-6 relative z-10">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <span className="text-slate-300">Total Given to Vault</span>
                <span className="text-xl font-medium text-emerald-400">AED {totalGiven.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <span className="text-slate-300">Total Taken from Vault</span>
                <span className="text-xl font-medium text-amber-400">AED {totalTaken.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-300 font-medium">Difference</span>
                <span className={`text-2xl font-bold ${isValidMatch ? 'text-white' : 'text-rose-400'}`}>
                  AED {Math.abs(totalGiven - totalTaken).toLocaleString(undefined, {minimumFractionDigits: 2})}
                </span>
              </div>
            </div>

            <div className="mt-10">
              <button 
                onClick={handleSubmit} 
                disabled={!canSubmit || isSubmitting} 
                className={`w-full py-4 rounded-xl font-medium transition-all shadow-sm ${canSubmit ? 'bg-white text-brand-dark hover:bg-slate-100' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}
              >
                {isSubmitting ? 'Processing...' : isValidMatch ? 'Confirm & Audit Exchange' : 'Balances must match'}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANELS: Input Grid */}
        <div className="lg:col-span-8 flex flex-col md:flex-row gap-6 relative z-10">
          
          <DenominationColumn
            title="1. Notes Given"
            subtitle="Adding into the vault"
            titleColorClass="text-emerald-600"
            hoverBgClass="hover:bg-emerald-50/30"
            focusBorderClass="focus:border-emerald-400"
            denominations={DENOMINATIONS}
            notesData={givenNotes}
            onChange={handleGivenChange}
            onClear={() => setGivenNotes(DENOMINATIONS.reduce((acc, tier) => ({ ...acc, [tier.value]: '' }), {}))}
            showAvailable={false}
          />

          <DenominationColumn
            title="2. Notes Taken"
            subtitle="Removing from vault"
            titleColorClass="text-amber-600"
            hoverBgClass="hover:bg-amber-50/30"
            focusBorderClass="focus:border-amber-400"
            denominations={DENOMINATIONS}
            notesData={takenNotes}
            onChange={handleTakenChange}
            onClear={() => setTakenNotes(DENOMINATIONS.reduce((acc, tier) => ({ ...acc, [tier.value]: '' }), {}))}
            showAvailable={true}
            vaultStock={vaultStock}
          />

        </div>
      </div>

      {/* ✅ UPDATED: Reserve Float Exchange Section (Left-Aligned Grid Layout) */}
      <div className="mt-12 pt-6 border-t border-slate-200/60">
        <div className="flex items-center gap-4 mb-6">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Specialized Operations</span>
        </div>
        
        {/* We place it in a grid column matching the left column width (5 out of 12) to align it beautifully to the side */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6 xl:col-span-5">
            <ReserveExchangeForm onTransactionSuccess={() => setRefreshKey(old => old + 1)} />
          </div>
        </div>
      </div>

      {/* SUCCESS/ERROR MODAL */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setModal({ ...modal, isOpen: false })}></div>
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full relative z-10 shadow-xl animate-in zoom-in-95 duration-300 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${modal.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={modal.type === 'success' ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">{modal.type === 'success' ? 'Exchange Complete' : 'Exchange Failed'}</h3>
            <p className="text-slate-500 text-sm mb-8">{modal.message}</p>
            <button onClick={() => setModal({ ...modal, isOpen: false })} className="w-full py-3.5 bg-slate-900 text-white rounded-full font-medium">Okay, got it</button>
          </div>
        </div>
      )}

    </div>
  );
}