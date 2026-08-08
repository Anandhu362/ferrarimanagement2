// frontend/src/components/exchange/ReserveExchangeForm.jsx
import React, { useState } from 'react';
import api from '../../config/api';

const RESERVE_TIERS = [
  { value: 10, label: '10', type: 'note' },
  { value: 5, label: '5', type: 'note' },
  { value: 1, label: '1', type: 'coin' } // Represents Coins/1 AED
];

// Restricted to only CEO Vault
const VAULT_OPTIONS = [
  { value: 'ceo', label: 'CEO Vault' }
];

export default function ReserveExchangeForm({ onTransactionSuccess }) {
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState({ 10: '', 5: '', 1: '' });
  
  const [targetVault, setTargetVault] = useState('ceo');
  const [isVaultDropdownOpen, setIsVaultDropdownOpen] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: 'success', message: '' });

  const handleNoteChange = (value, qtyStr) => {
    const cleanQty = qtyStr.replace(/[^0-9]/g, '');
    setNotes(prev => ({ ...prev, [value]: cleanQty }));
  };

  // Calculations
  const totalValue = RESERVE_TIERS.reduce((sum, tier) => {
    return sum + ((parseInt(notes[tier.value]) || 0) * tier.value);
  }, 0);

  const canSubmit = totalValue > 0 && description.trim().length > 2;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);

    try {
      const activeBranch = localStorage.getItem('active_branch');
      if (!activeBranch) throw new Error("No active branch selected.");

      const payload = {
        action: 'ADD', // Hardcoded to always ADD
        notes,
        description: description.trim(),
        branchId: activeBranch,
        targetVault // Includes cross-vault routing instructions
      };

      await api.post('/api/reserve/process', payload);

      setModal({ 
        isOpen: true, 
        type: 'success', 
        message: `Successfully added to the Reserve Vault.` 
      });
      
      // Reset Form
      setDescription('');
      setNotes({ 10: '', 5: '', 1: '' });
      setTargetVault('ceo');
      
      // Notify parent to refresh other components if necessary
      if (onTransactionSuccess) onTransactionSuccess();

    } catch (error) {
      console.error("Reserve submission error:", error);
      const errorMsg = error.response?.data?.message || 'Network error. Could not connect to the server.';
      setModal({ isOpen: true, type: 'error', message: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm relative z-20">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Reserve Float Exchange</h3>
          <p className="text-slate-500 text-xs mt-1 font-light tracking-wide">Manage low-denomination change pool</p>
        </div>
      </div>

      <div className="space-y-6">
        
        {/* Dynamic Cross-Vault Target Dropdown */}
        <div className="space-y-2 relative z-30">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-widest">
            Source Vault
          </label>
          <div 
            onClick={() => setIsVaultDropdownOpen(!isVaultDropdownOpen)}
            className="w-full px-4 py-3 bg-[#FCFCFD] border border-slate-200 rounded-xl text-slate-900 cursor-pointer flex justify-between items-center hover:border-indigo-200 focus:ring-2 focus:ring-indigo-100 transition-all"
          >
            <span className="font-medium tracking-wide text-sm">
              {VAULT_OPTIONS.find(opt => opt.value === targetVault)?.label}
            </span>
            <svg 
              className={`w-4 h-4 transition-transform duration-300 ${isVaultDropdownOpen ? 'rotate-180 text-indigo-600' : 'text-slate-400'}`} 
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
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
                      setTargetVault(option.value);
                      setIsVaultDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between ${
                      targetVault === option.value
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {option.label}
                    {targetVault === option.value && (
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Denomination Inputs */}
        <div className="grid grid-cols-3 gap-3 relative z-10">
          {RESERVE_TIERS.map(tier => (
            <div key={tier.value} className="bg-[#FCFCFD] border border-slate-200 rounded-xl p-3 hover:border-indigo-100 transition-colors">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-slate-700">{tier.label} <span className="text-[10px] text-slate-400 font-medium">AED</span></span>
              </div>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={notes[tier.value]}
                onChange={(e) => handleNoteChange(tier.value, e.target.value)}
                className="w-full text-center font-bold text-slate-900 bg-white border border-slate-200 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
              />
            </div>
          ))}
        </div>

        {/* Remark Input */}
        <div className="space-y-2 relative z-10">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-widest">Remark *</label>
          <input 
            type="text" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            placeholder="e.g., Exchanging 1000s for driver change" 
            className="w-full px-4 py-3 bg-[#FCFCFD] border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-sm" 
          />
        </div>

        {/* Total & Submit */}
        <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between relative z-10">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Transaction Value</p>
            <p className="text-xl font-bold text-indigo-600">
              AED {totalValue.toLocaleString(undefined, {minimumFractionDigits: 2})}
            </p>
          </div>
          
          <button 
            onClick={handleSubmit} 
            disabled={!canSubmit || isSubmitting}
            className={`px-6 py-3 rounded-xl font-medium text-sm transition-all shadow-sm ${
              canSubmit 
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Processing...' : `Confirm ADD`}
          </button>
        </div>
      </div>

      {/* Success / Error Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setModal({ ...modal, isOpen: false })}></div>
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full relative z-10 shadow-xl animate-in zoom-in-95 duration-200 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${modal.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={modal.type === 'success' ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">{modal.type === 'success' ? 'Success' : 'Transaction Failed'}</h3>
            <p className="text-slate-500 text-sm mb-8">{modal.message}</p>
            <button onClick={() => setModal({ ...modal, isOpen: false })} className="w-full py-3.5 bg-slate-900 text-white rounded-full font-medium">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}