import React, { useState, useEffect } from 'react';
import api from '../../config/api';

const PC_DENOMINATIONS = [
  { label: '1000 AED', value: 1000 },
  { label: '500 AED', value: 500 },
  { label: '200 AED', value: 200 },
  { label: '100 AED', value: 100 },
  { label: '50 AED', value: 50 },
  { label: '20 AED', value: 20 },
  { label: '10 AED', value: 10 },
  { label: '5 AED', value: 5 },
  { label: '1 AED', value: 1 },
  { label: '0.50 AED', value: 0.5 }
];

const VAULT_DESTINATIONS = [
  "CEO Vault",
  "Accountant Vault"
];

export default function PettyCashReversalModal({ isOpen, onClose, onSuccess, currentBalance }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    destination: 'CEO Vault',
    amount: '',
    description: ''
  });

  const [noteCounts, setNoteCounts] = useState(
    PC_DENOMINATIONS.reduce((acc, tier) => ({ ...acc, [tier.value]: '' }), {})
  );

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        destination: 'CEO Vault',
        amount: '',
        description: ''
      });
      setNoteCounts(PC_DENOMINATIONS.reduce((acc, tier) => ({ ...acc, [tier.value]: '' }), {}));
      setErrorMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg('');
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

  const targetAmount = parseFloat(formData.amount) || 0;
  
  // Validation Checks
  const isAmountMatch = targetAmount > 0 && Math.abs(targetAmount - calculatedDenomSum) < 0.01;
  const isWithinBalance = targetAmount <= (currentBalance || 0);
  const canSubmit = isAmountMatch && isWithinBalance;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const activeBranch = localStorage.getItem('active_branch') || 'DXB-MAIN';
      
      const denominationsToAdd = {};
      Object.entries(noteCounts).forEach(([value, qty]) => {
        if (qty && parseInt(qty) > 0) {
          denominationsToAdd[value] = parseInt(qty);
        }
      });
      
      const payload = {
        date: formData.date,
        vaultDestination: formData.destination,
        amount: targetAmount,
        denominations: denominationsToAdd,
        branchId: activeBranch,
        description: formData.description 
      };

      await api.post('/api/petty-cash/reverse', payload);
      
      if (onSuccess) onSuccess(targetAmount);
      onClose();

    } catch (error) {
      setErrorMsg(error.response?.data?.message || "Failed to process reversal. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>
      
      {/* Modal Content */}
      <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-10 shadow-[0_20px_60px_rgb(0,0,0,0.12)] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-100 px-8 py-5 flex items-center justify-between z-20">
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Reverse Petty Cash</h3>
            <p className="text-sm text-slate-500 font-light mt-0.5">Return unspent funds back to a main vault.</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-8">
          
          {/* Current Balance Alert */}
          <div className="mb-8 flex items-center justify-between bg-blue-50/50 border border-blue-100 rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900/60 uppercase tracking-widest mb-0.5">Available for Reversal</p>
                <p className="text-2xl font-bold text-blue-700 tracking-tight">
                  AED {(currentBalance || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                </p>
              </div>
            </div>
            {!isWithinBalance && targetAmount > 0 && (
              <span className="bg-rose-100 text-rose-600 px-4 py-2 rounded-xl text-sm font-bold border border-rose-200">
                Exceeds Balance!
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Destination Vault */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Return To Vault *</label>
              <select 
                name="destination" 
                value={formData.destination} 
                onChange={handleFormChange}
                className="w-full px-4 py-3 bg-[#FCFCFD] border border-slate-200 rounded-xl text-slate-900 font-medium outline-none focus:border-brand-dark transition-all appearance-none"
              >
                {VAULT_DESTINATIONS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Date *</label>
              <input 
                type="date" 
                name="date" 
                value={formData.date} 
                onChange={handleFormChange}
                className="w-full px-4 py-3 bg-[#FCFCFD] border border-slate-200 rounded-xl text-slate-900 font-medium outline-none focus:border-brand-dark transition-all"
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Reversal Amount *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">AED</span>
                <input 
                  type="number" 
                  name="amount" 
                  value={formData.amount} 
                  onChange={handleFormChange} 
                  placeholder="0.00" 
                  className={`w-full pl-14 pr-4 py-3 bg-[#FCFCFD] border rounded-xl font-semibold outline-none transition-all text-lg ${!isWithinBalance && targetAmount > 0 ? 'border-rose-300 text-rose-600 bg-rose-50' : 'border-slate-200 text-slate-900 focus:border-brand-dark'}`} 
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2 mb-8">
            <label className="block text-sm font-medium text-slate-700">Description / Reason (Optional)</label>
            <input 
              type="text" 
              name="description" 
              value={formData.description} 
              onChange={handleFormChange} 
              placeholder="e.g. Returning excess cash before weekend close" 
              className="w-full px-4 py-3 bg-[#FCFCFD] border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-brand-dark transition-all text-sm" 
            />
          </div>

          {/* Denominations Section */}
          <div className="bg-slate-50/70 rounded-[1.5rem] p-6 border border-slate-100">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <h4 className="text-sm font-bold text-slate-800">Select Notes to Return</h4>
              <div className="flex items-center gap-3 text-sm font-medium bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-slate-500">Target: <span className="text-slate-900 font-bold">{targetAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></span>
                <div className="w-px h-4 bg-slate-200"></div>
                <span className={`transition-colors font-bold ${isAmountMatch ? 'text-emerald-500' : 'text-amber-500'}`}>
                  Selected: {calculatedDenomSum.toLocaleString(undefined, {minimumFractionDigits: 2})}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
              {PC_DENOMINATIONS.map((tier) => (
                <div key={tier.value} className="bg-white p-3 rounded-2xl border border-slate-200 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                  <div className="text-xs font-bold text-slate-500 mb-2 text-center">{tier.label}</div>
                  <input 
                    type="text"
                    placeholder="0"
                    value={noteCounts[tier.value]}
                    onChange={(e) => handleNoteChange(tier.value, e.target.value)}
                    className="w-full text-center py-2 rounded-xl border border-slate-200 text-slate-900 bg-[#FCFCFD] outline-none font-semibold text-sm focus:border-brand-dark focus:ring-2 focus:ring-brand-light/10 transition-all"
                  />
                </div>
              ))}
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm font-medium flex items-center gap-2">
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {errorMsg}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-4">
              <button 
                onClick={onClose}
                className="px-6 py-3 rounded-xl font-medium text-slate-500 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
                className={`px-8 py-3 rounded-xl font-bold tracking-wide transition-all shadow-sm ${
                  canSubmit 
                    ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? 'Processing...' : 'Confirm Reversal'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}