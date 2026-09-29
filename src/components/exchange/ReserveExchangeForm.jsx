// frontend/src/components/exchange/ReserveExchangeForm.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../config/api';

const RESERVE_TIERS = [
  { value: 1000, label: '1000', type: 'note' },
  { value: 500, label: '500', type: 'note' },
  { value: 200, label: '200', type: 'note' },
  { value: 100, label: '100', type: 'note' },
  { value: 50, label: '50', type: 'note' },
  { value: 20, label: '20', type: 'note' },
  { value: 10, label: '10', type: 'note' },
  { value: 5, label: '5', type: 'note' },
  { value: 1, label: '1', type: 'coin' }
];

const VAULT_OPTIONS = [
  { value: 'ceo', label: 'CEO Vault' },
  { value: 'accountant', label: 'Accountant Vault' }
];

const FILTER_OPTIONS = [
  { key: 'ALL', label: 'All Notes' },
  { key: 'HIGH', label: '1000 - 100' },
  { key: 'LOW', label: '50 - 1' },
  { key: 'IN_STOCK', label: 'In Stock' }
];

export default function ReserveExchangeForm({ onTransactionSuccess }) {
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState(
    RESERVE_TIERS.reduce((acc, tier) => ({ ...acc, [tier.value]: '' }), {})
  );
  
  const [targetVault, setTargetVault] = useState('ceo');
  const [isVaultDropdownOpen, setIsVaultDropdownOpen] = useState(false);
  const [vaultStock, setVaultStock] = useState({});
  const [loadingStock, setLoadingStock] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: 'success', message: '' });
  const isSubmittingRef = useRef(false);

  // Fetch available stock for the selected source vault
  const fetchVaultStock = useCallback(async () => {
    try {
      const activeBranch = localStorage.getItem('active_branch');
      if (!activeBranch) return;

      setLoadingStock(true);
      const response = await api.get(
        `/api/vault/summary?branchId=${encodeURIComponent(activeBranch)}&vaultType=${targetVault}`
      );
      
      const result = response.data;
      if (result && result.success && Array.isArray(result.data)) {
        const stockMap = {};
        result.data.forEach(item => {
          stockMap[parseFloat(item.denomination_value)] = parseInt(item.total_quantity, 10);
        });
        setVaultStock(stockMap);
      } else {
        setVaultStock({});
      }
    } catch (error) {
      console.error("[ReserveExchangeForm] Error fetching vault stock:", error);
      setVaultStock({});
    } finally {
      setLoadingStock(false);
    }
  }, [targetVault]);

  useEffect(() => {
    fetchVaultStock();
  }, [fetchVaultStock]);

  const handleNoteChange = (value, qtyStr) => {
    const cleanQty = qtyStr.replace(/[^0-9]/g, '');
    setNotes(prev => ({ ...prev, [value]: cleanQty }));
  };

  const clearAllNotes = () => {
    setNotes(RESERVE_TIERS.reduce((acc, tier) => ({ ...acc, [tier.value]: '' }), {}));
  };

  // Calculations
  const totalValue = RESERVE_TIERS.reduce((sum, tier) => {
    return sum + ((parseInt(notes[tier.value], 10) || 0) * tier.value);
  }, 0);

  const totalNotesCount = RESERVE_TIERS.reduce((sum, tier) => {
    return sum + (parseInt(notes[tier.value], 10) || 0);
  }, 0);

  // Check if any entered quantity exceeds available source vault stock
  const hasExceededStock = RESERVE_TIERS.some(tier => {
    const entered = parseInt(notes[tier.value], 10) || 0;
    const available = vaultStock[tier.value] || 0;
    return entered > available;
  });

  const canSubmit = totalValue > 0 && description.trim().length > 2 && !hasExceededStock;

  // Filtered tiers for display
  const displayedTiers = RESERVE_TIERS.filter(tier => {
    if (activeFilter === 'HIGH') return tier.value >= 100;
    if (activeFilter === 'LOW') return tier.value < 100;
    if (activeFilter === 'IN_STOCK') return (vaultStock[tier.value] || 0) > 0;
    return true; // 'ALL'
  });

  const handleSubmit = async () => {
    if (!canSubmit || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const activeBranch = localStorage.getItem('active_branch');
      if (!activeBranch) throw new Error("No active branch selected.");

      // Generate enterprise idempotency key
      const clientTxId = `RES-ADD-${activeBranch}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const payload = {
        action: 'ADD', // Process addition to Reserve Float
        notes,
        description: description.trim(),
        branchId: activeBranch,
        targetVault, // Source Vault to deduct notes from
        idempotencyKey: clientTxId,
        clientTxId
      };

      await api.post('/api/reserve/process', payload);

      setModal({ 
        isOpen: true, 
        type: 'success', 
        message: `Successfully transferred AED ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} into the Reserve Vault.` 
      });
      
      // Reset Form & Refetch live stock
      setDescription('');
      clearAllNotes();
      fetchVaultStock();
      
      // Notify parent to refresh siblings (e.g. Master Exchange columns, Logs, Overview)
      if (onTransactionSuccess) onTransactionSuccess();

    } catch (error) {
      console.error("[ReserveExchangeForm] Reserve submission error:", error);
      const errorMsg = error.response?.data?.message || 'Network error. Could not connect to the server.';
      setModal({ isOpen: true, type: 'error', message: errorMsg });
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-slate-100 shadow-sm relative z-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Reserve Float Exchange</h3>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Specialized Float
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1 font-light tracking-wide">
            Exchange notes into isolated change-making float with live vault synchronization.
          </p>
        </div>

        {totalNotesCount > 0 && (
          <button
            type="button"
            onClick={clearAllNotes}
            className="text-xs font-semibold text-slate-400 hover:text-rose-500 transition-colors self-start sm:self-auto px-2.5 py-1 rounded-lg hover:bg-rose-50"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="space-y-6">
        
        {/* Source Vault Selector */}
        <div className="space-y-2 relative z-30">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-widest">
              Source Vault
            </label>
            {loadingStock && (
              <span className="text-[10px] text-indigo-500 font-medium animate-pulse flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                Checking stock...
              </span>
            )}
          </div>
          
          <div 
            onClick={() => setIsVaultDropdownOpen(!isVaultDropdownOpen)}
            className="w-full px-4 py-3 bg-[#FCFCFD] border border-slate-200 rounded-xl text-slate-900 cursor-pointer flex justify-between items-center hover:border-indigo-200 focus:ring-2 focus:ring-indigo-100 transition-all shadow-xs"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-semibold tracking-wide text-sm">
                {VAULT_OPTIONS.find(opt => opt.value === targetVault)?.label}
              </span>
            </div>
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
              <div className="absolute top-[calc(100%+8px)] left-0 w-full p-2 bg-white rounded-2xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100 z-50 animate-in slide-in-from-top-2 fade-in duration-200">
                {VAULT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTargetVault(option.value);
                      setIsVaultDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between ${
                      targetVault === option.value
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${targetVault === option.value ? 'bg-indigo-600' : 'bg-slate-300'}`}></span>
                      {option.label}
                    </div>
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

        {/* Denomination Quick Filter & Selection Pills */}
        <div className="space-y-2.5 relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-widest">
              Denominations
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              {displayedTiers.length} available denominations
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-100">
            {FILTER_OPTIONS.map(filter => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setActiveFilter(filter.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeFilter === filter.key
                    ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Denomination Containers Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 relative z-10">
          {displayedTiers.map(tier => {
            const currentQty = parseInt(notes[tier.value], 10) || 0;
            const availableStock = vaultStock[tier.value] || 0;
            const isExceeded = currentQty > availableStock;
            const isZeroStock = availableStock === 0;

            return (
              <div 
                key={tier.value} 
                className={`border rounded-2xl p-3 transition-all duration-200 flex flex-col justify-between ${
                  isExceeded
                    ? 'bg-rose-50/40 border-rose-200 ring-1 ring-rose-200'
                    : currentQty > 0
                      ? 'bg-indigo-50/30 border-indigo-200 ring-1 ring-indigo-200'
                      : isZeroStock
                        ? 'bg-slate-50/60 border-slate-100 opacity-80'
                        : 'bg-[#FCFCFD] border-slate-200/90 hover:border-indigo-200 hover:bg-white'
                }`}
              >
                {/* Container Header */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-800">
                    {tier.label} <span className="text-[10px] text-slate-400 font-normal">AED</span>
                  </span>
                  
                  {/* Small text showing available notes in source vault */}
                  <span 
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border tracking-tight ${
                      isZeroStock
                        ? 'bg-slate-100 text-slate-400 border-slate-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                    }`}
                    title={`${availableStock} notes available in ${VAULT_OPTIONS.find(opt => opt.value === targetVault)?.label}`}
                  >
                    Avail: {availableStock}
                  </span>
                </div>

                {/* Input Field */}
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={notes[tier.value]}
                    onChange={(e) => handleNoteChange(tier.value, e.target.value)}
                    className={`w-full text-center font-bold text-slate-900 bg-white border rounded-xl py-2 px-3 text-sm focus:outline-none transition-all shadow-xs ${
                      isExceeded
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 text-rose-600'
                        : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                    }`}
                  />
                </div>

                {/* Container Footer: Subtotal / Warning */}
                <div className="mt-2 min-h-[16px] flex items-center justify-between text-[10px]">
                  {isExceeded ? (
                    <span className="text-rose-500 font-medium">Exceeds vault stock</span>
                  ) : currentQty > 0 ? (
                    <>
                      <span className="text-slate-400 font-medium">{currentQty}x</span>
                      <span className="font-bold text-indigo-600">
                        AED {(currentQty * tier.value).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-400 font-light">AED 0.00</span>
                  )}
                </div>

              </div>
            );
          })}
        </div>

        {/* Remark Input */}
        <div className="space-y-2 relative z-10">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-widest">
            Remark *
          </label>
          <input 
            type="text" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            placeholder="e.g., Exchanging 1000s for driver change pool" 
            className="w-full px-4 py-3 bg-[#FCFCFD] border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-sm shadow-xs" 
          />
        </div>

        {/* Transaction Summary & Submission */}
        <div className="pt-4 mt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transaction Value</p>
              {totalNotesCount > 0 && (
                <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-600 px-2 py-0.2 rounded-full border border-indigo-100">
                  {totalNotesCount} notes
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-indigo-600 tracking-tight">
              AED {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            {hasExceededStock && (
              <p className="text-xs text-rose-500 font-medium mt-1">
                Some entered notes exceed available stock in {VAULT_OPTIONS.find(opt => opt.value === targetVault)?.label}.
              </p>
            )}
          </div>
          
          <button 
            type="button"
            onClick={handleSubmit} 
            disabled={!canSubmit || isSubmitting}
            className={`px-8 py-3.5 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 ${
              canSubmit 
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-indigo-200'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/60'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Processing...</span>
              </>
            ) : (
              <span>Confirm ADD</span>
            )}
          </button>
        </div>
      </div>

      {/* Success / Error Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setModal({ ...modal, isOpen: false })}></div>
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full relative z-10 shadow-xl animate-in zoom-in-95 duration-200 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${modal.type === 'success' ? 'bg-emerald-50 text-emerald-500 border border-emerald-100' : 'bg-rose-50 text-rose-500 border border-rose-100'}`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={modal.type === 'success' ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">{modal.type === 'success' ? 'Success' : 'Transaction Failed'}</h3>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">{modal.message}</p>
            <button 
              type="button"
              onClick={() => setModal({ ...modal, isOpen: false })} 
              className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors shadow-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}