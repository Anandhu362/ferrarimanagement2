// frontend/src/pages/expenses/ExpenseForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RecentExpenses from '../../components/RecentExpenses';
import ExpenseDetailsInput from '../../components/expenses/ExpenseDetailsInput';
import api from '../../config/api';

const NOTE_TIERS = [
  { label: '1,000 AED', value: 1000, isNote: true },
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

// --- STRICT VALIDATION HELPERS ---
const isValidString = (str) => {
  if (!str) return false;
  const sanitized = str.trim().replace(/[^a-zA-Z0-9 ]/g, ''); 
  return sanitized.length >= 2;
};

const isValidAmount = (amount) => {
  const val = parseFloat(amount);
  return !isNaN(val) && val > 0;
};

export default function ExpenseForm() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vaultStock, setVaultStock] = useState({});
  const [refreshKey, setRefreshKey] = useState(0); 
  const [modal, setModal] = useState({ isOpen: false, type: 'success', message: '' });
  
  // Track active allocations for Petty Cash
  const [activeAllocations, setActiveAllocations] = useState([]);
  const [isLoadingAllocations, setIsLoadingAllocations] = useState(false);

  // Track vaultType and expense data at page level
  const [expenseData, setExpenseData] = useState({
    vaultType: 'accountant', // Defaults to accountant
    date: new Date().toISOString().split('T')[0],
    category: 'Office Supplies',
    description: '',
    totalAmount: '',
    allocationId: '',
    allocatedAmount: 0,
    allocationDescription: ''
  });

  const [noteCounts, setNoteCounts] = useState(
    NOTE_TIERS.reduce((acc, tier) => ({ ...acc, [tier.value]: '' }), {})
  );

  const isPettyVault = expenseData.vaultType === 'petty';

  // Fetch stock specifically for the selected vault type (or CEO vault if petty)
  const fetchStock = async () => {
    try {
      const activeBranch = localStorage.getItem('active_branch');
      if (!activeBranch) return;
      const targetVault = isPettyVault ? 'ceo' : expenseData.vaultType;
      const response = await api.get(`/api/vault/summary?branchId=${encodeURIComponent(activeBranch)}&vaultType=${targetVault}`);
      const result = response.data;
      
      if (result.success) {
        const stockMap = {};
        result.data.forEach(item => {
          stockMap[parseFloat(item.denomination_value)] = parseInt(item.total_quantity);
        });
        setVaultStock(stockMap);
      } else {
        setVaultStock({});
      }
    } catch (error) {
      console.error("Error fetching vault stock:", error);
      setVaultStock({});
    }
  };

  // Fetch active petty cash advances / allocations
  const fetchActiveAllocations = async () => {
    setIsLoadingAllocations(true);
    try {
      const activeBranch = localStorage.getItem('active_branch');
      if (!activeBranch) {
        setIsLoadingAllocations(false);
        return;
      }
      const response = await api.get(`/api/petty-cash/active-allocations?branchId=${encodeURIComponent(activeBranch)}`);
      if (response.data && response.data.success) {
        const list = response.data.data || [];
        setActiveAllocations(list);

        // Auto-select first advance if none selected or if previous is no longer active
        setExpenseData(prev => {
          if (prev.vaultType !== 'petty') return prev;
          const match = list.find(a => a.id === prev.allocationId);
          if (!match && list.length > 0) {
            return {
              ...prev,
              allocationId: list[0].id,
              allocatedAmount: parseFloat(list[0].amount || list[0].remainingAmount || 0),
              allocationDescription: list[0].description
            };
          } else if (list.length === 0) {
            return {
              ...prev,
              allocationId: '',
              allocatedAmount: 0,
              allocationDescription: ''
            };
          }
          return prev;
        });
      } else {
        setActiveAllocations([]);
      }
    } catch (error) {
      console.error("Error fetching active petty cash allocations:", error);
      setActiveAllocations([]);
    } finally {
      setIsLoadingAllocations(false);
    }
  };

  const clearAllNotes = () => {
    setNoteCounts(NOTE_TIERS.reduce((acc, tier) => ({ ...acc, [tier.value]: '' }), {}));
  };

  // Trigger re-fetch and input clear whenever the vault type or refreshKey changes
  useEffect(() => {
    fetchStock();
    clearAllNotes();
    if (isPettyVault) {
      fetchActiveAllocations();
    }
  }, [refreshKey, expenseData.vaultType]);

  const handleFormChange = (e) => {
    setExpenseData({ ...expenseData, [e.target.name]: e.target.value });
  };

  const handleAllocationSelect = (alloc) => {
    setExpenseData(prev => ({
      ...prev,
      allocationId: alloc.id,
      allocatedAmount: parseFloat(alloc.amount || alloc.remainingAmount || 0),
      allocationDescription: alloc.description
    }));
  };

  const handleVaultChange = (vaultType) => {
    setExpenseData(prev => ({
      ...prev,
      vaultType,
      allocationId: '',
      allocatedAmount: 0,
      allocationDescription: '',
      totalAmount: ''
    }));
    clearAllNotes();
  };

  const handleNoteChange = (value, qtyStr) => {
    let cleanQty = qtyStr.replace(/[^0-9]/g, '');
    
    if (cleanQty === '') {
      setNoteCounts({ ...noteCounts, [value]: '' });
      return;
    }

    const numQty = parseInt(cleanQty, 10);
    
    // In standard vault mode: cannot remove more notes than are currently available in safe
    // In petty cash mode: cashier is RETURNING cash to the safe, so no stock cap applies
    if (!isPettyVault) {
      const maxAvailable = vaultStock[value] || 0;
      if (numQty > maxAvailable) {
        cleanQty = maxAvailable.toString();
      }
    }

    setNoteCounts({ ...noteCounts, [value]: cleanQty });
  };

  const targetAmount = parseFloat(expenseData.totalAmount) || 0; // Actual Expense Bill
  const allocatedAmount = parseFloat(expenseData.allocatedAmount) || 0;

  // Selected cash notes from the denomination inputs
  const calculatedDenomSum = NOTE_TIERS.reduce((sum, tier) => {
    const qty = parseInt(noteCounts[tier.value]) || 0;
    return sum + (qty * tier.value);
  }, 0);

  // For petty cash: Leftover cash to return to CEO safe
  const rawReturn = isPettyVault ? Math.max(0, allocatedAmount - targetAmount) : 0;
  const leftoverReturnAmount = Math.round(rawReturn * 100) / 100;

  const isDescriptionValid = isValidString(expenseData.description);
  const isAmountValid = isValidAmount(expenseData.totalAmount);

  // Standard Vault Math Validation: Notes removed must match total bill
  const isStandardMathValid = !isPettyVault && targetAmount > 0 && Math.abs(targetAmount - calculatedDenomSum) < 0.01;

  // Petty Vault Math Validation:
  // 1. Advance is selected
  // 2. Expense bill is positive and <= allocated advance
  // 3. Returned notes match leftover balance (or 0 if advance was 100% spent)
  const isAllocationSelected = isPettyVault && !!expenseData.allocationId && allocatedAmount > 0;
  const isPettyBillValid = isPettyVault && targetAmount > 0 && targetAmount <= allocatedAmount;
  const isPettyReturnMatch = isPettyVault && (
    leftoverReturnAmount === 0 
      ? calculatedDenomSum === 0 
      : Math.abs(leftoverReturnAmount - calculatedDenomSum) < 0.01
  );

  const canSubmit = isPettyVault
    ? (isDescriptionValid && isAllocationSelected && isPettyBillValid && isPettyReturnMatch)
    : (isDescriptionValid && isAmountValid && isStandardMathValid);

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
      
      if (isPettyVault) {
        // --- PETTY CASH ADVANCE SETTLEMENT WORKFLOW ---
        const payload = {
          branchId: activeBranch,
          date: expenseData.date,
          category: expenseData.category,
          description: expenseData.description,
          allocationId: expenseData.allocationId,
          allocationDescription: expenseData.allocationDescription,
          allocatedAmount: allocatedAmount,
          expenseAmount: targetAmount,
          returnDenominations: noteCounts
        };

        const response = await api.post('/api/expenses/record-petty', payload);

        setModal({ 
          isOpen: true, 
          type: 'success', 
          message: response.data?.message || 'Petty cash expense recorded successfully.' 
        });

        // Reset inputs
        setExpenseData(prev => ({
          ...prev,
          description: '',
          totalAmount: '',
          allocationId: '',
          allocatedAmount: 0,
          allocationDescription: ''
        }));
        clearAllNotes();

        // Refresh active allocations & ledger
        fetchActiveAllocations();
        setRefreshKey(old => old + 1);

      } else {
        // --- STANDARD VAULT EXPENSE WORKFLOW ---
        const payload = {
          vaultType: expenseData.vaultType,
          date: expenseData.date,
          category: expenseData.category,
          description: expenseData.description,
          totalAmount: targetAmount,
          denominations: noteCounts,
          branchId: activeBranch
        };

        await api.post('/api/expenses/record', payload);

        // OPTIMISTIC UI UPDATE: Deduct notes from state immediately
        setVaultStock(prevStock => {
          const updatedStock = { ...prevStock };
          Object.keys(noteCounts).forEach(denom => {
            const qty = parseInt(noteCounts[denom]) || 0;
            if (qty > 0) {
              const val = parseFloat(denom);
              updatedStock[val] = Math.max(0, (updatedStock[val] || 0) - qty);
            }
          });
          return updatedStock;
        });

        setModal({ 
          isOpen: true, 
          type: 'success', 
          message: `Expense recorded and ${expenseData.vaultType.toUpperCase()} vault stock updated.` 
        });
        
        setExpenseData(prev => ({
          ...prev,
          description: '',
          totalAmount: ''
        }));
        clearAllNotes();
        
        setTimeout(() => {
          setRefreshKey(old => old + 1);
        }, 2500);
      }

    } catch (error) {
      console.error("Submission error:", error);
      const errorMsg = error.response?.data?.message || 'Network error. Could not connect to the server.';
      setModal({ isOpen: true, type: 'error', message: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const container = e.target.closest('.expense-form-container');
      if (container) {
        const inputs = Array.from(container.querySelectorAll('input:not([disabled])'));
        const currentIndex = inputs.indexOf(e.target);
        if (currentIndex > -1 && currentIndex < inputs.length - 1) {
          inputs[currentIndex + 1].focus();
        }
      }
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-12 relative expense-form-container">
      
      <div className="mb-8">
        <h2 className="text-[1.75rem] font-semibold text-slate-900 tracking-tight leading-tight">Record Vault Expense</h2>
        <p className="text-slate-500 text-sm mt-1.5 font-light tracking-wide">
          {isPettyVault 
            ? 'Settle an active petty cash advance by logging the expense bill and returning leftover cash to the CEO Safe.'
            : 'Log money leaving the main safe and specify exactly which denominations are being removed.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Child component receives state and the specific handlers */}
        <ExpenseDetailsInput 
          expenseData={expenseData}
          onFormChange={handleFormChange}
          onDateChange={(date) => setExpenseData(prev => ({ ...prev, date }))}
          onCategoryChange={(category) => setExpenseData(prev => ({ ...prev, category }))}
          onVaultChange={handleVaultChange}
          activeAllocations={activeAllocations}
          onAllocationSelect={handleAllocationSelect}
          isLoadingAllocations={isLoadingAllocations}
          onKeyDown={handleKeyDown}
        />

        <div className="lg:col-span-8 flex flex-col gap-6 relative z-10">
          
          {/* TOP SUMMARY CONTAINER */}
          <div className="bg-brand-dark rounded-[2rem] p-8 text-white flex flex-col sm:flex-row items-center justify-between relative overflow-hidden shadow-[0_12px_40px_rgb(43,38,64,0.3)]">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            
            {/* LEFT SIDE: Expense Bill */}
            <div className="flex flex-col mb-4 sm:mb-0 relative z-10 w-full sm:w-1/2 border-b sm:border-b-0 sm:border-r border-white/10 pb-4 sm:pb-0">
              <span className="text-white/60 text-xs font-semibold tracking-widest uppercase mb-1">
                {isPettyVault ? 'Expense Bill' : 'Expense Bill'}
              </span>
              <span className="text-3xl font-semibold tracking-tighter">
                <span className="text-lg text-white/50 font-light mr-1 tracking-normal">AED</span>
                {targetAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              {isPettyVault && allocatedAmount > 0 && (
                <span className="text-[11px] text-white/50 mt-1 font-mono">
                  From Advance: AED {allocatedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              )}
            </div>

            {/* RIGHT SIDE: Cash Removed vs Return to CEO Safe */}
            <div className="flex flex-col relative z-10 w-full sm:w-1/2 sm:pl-8">
              <span className="text-white/60 text-xs font-semibold tracking-widest uppercase mb-1">
                {isPettyVault ? 'Return to CEO Safe' : 'Cash Removed from Vault'}
              </span>
              <span className={`text-3xl font-semibold tracking-tighter transition-colors ${
                isPettyVault 
                  ? (isPettyReturnMatch ? 'text-emerald-400' : 'text-white')
                  : (isStandardMathValid ? 'text-emerald-400' : 'text-white')
              }`}>
                <span className="text-lg text-white/50 font-light mr-1 tracking-normal">AED</span>
                {calculatedDenomSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              {isPettyVault && (
                <span className={`text-[11px] mt-1 font-medium ${isPettyReturnMatch ? 'text-emerald-300' : 'text-amber-300'}`}>
                  Expected Return: AED {leftoverReturnAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              )}
            </div>

            {/* PROGRESS BAR */}
            <div className="absolute bottom-0 left-0 w-full h-1.5 bg-white/5">
              <div 
                className={`h-full transition-all duration-500 ease-out ${
                  (isPettyVault ? isPettyReturnMatch : isStandardMathValid) 
                    ? 'bg-emerald-500 w-full' 
                    : targetAmount > 0 ? 'bg-amber-400' : 'bg-transparent'
                }`} 
                style={{ 
                  width: (isPettyVault ? isPettyReturnMatch : isStandardMathValid)
                    ? '100%' 
                    : `${Math.min(100, isPettyVault ? (leftoverReturnAmount > 0 ? (calculatedDenomSum / leftoverReturnAmount) * 100 : 0) : (targetAmount > 0 ? (calculatedDenomSum / targetAmount) * 100 : 0))}%` 
                }}
              ></div>
            </div>
          </div>

          {/* DENOMINATIONS CARD */}
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex-1 flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 tracking-widest uppercase">
                  {isPettyVault ? 'Return Balance Cash to CEO Vault' : 'Select Notes to Remove'}
                </h3>
                {isPettyVault && (
                  <p className="text-xs text-slate-400 mt-0.5 font-light">
                    {leftoverReturnAmount > 0 
                      ? `Select notes handed back to the CEO safe (Expected: AED ${leftoverReturnAmount.toFixed(2)}).`
                      : targetAmount > 0 
                        ? 'Advance was fully spent. No cash to return to CEO safe.'
                        : 'Enter expense bill above to determine returned balance.'}
                  </p>
                )}
              </div>
              <button 
                onClick={clearAllNotes} 
                className="self-start sm:self-auto text-xs font-medium text-slate-400 hover:text-rose-500 transition-colors bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100"
              >
                Clear All
              </button>
            </div>

            {/* Notice when advance is fully spent */}
            {isPettyVault && leftoverReturnAmount === 0 && targetAmount > 0 && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-xs text-emerald-800 flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[11px] shrink-0">✓</span>
                <span>The entire AED {allocatedAmount.toFixed(2)} advance is accounted for by this expense bill. No physical cash return to the CEO safe is required.</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {NOTE_TIERS.map((tier) => (
                <div key={tier.value} className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 hover:border-brand-light/30 hover:bg-slate-50/50 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs shadow-sm ${tier.isNote ? 'bg-brand-bg text-brand-dark' : 'bg-amber-50 text-amber-600'}`}>
                      {tier.isNote ? '💵' : '🪙'}
                    </div>
                    <span className="font-medium text-slate-700">{tier.label}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                        {isPettyVault ? 'Safe Stock' : 'Available'}
                      </div>
                      <div className="text-xs font-semibold text-brand-dark">{vaultStock[tier.value] || 0}</div>
                    </div>
                    <input 
                      type="text"
                      placeholder="0"
                      value={noteCounts[tier.value]}
                      onChange={(e) => handleNoteChange(tier.value, e.target.value)}
                      onKeyDown={handleKeyDown}
                      className={`w-16 px-2 py-2 bg-white border rounded-xl text-center font-semibold focus:outline-none transition-all shadow-sm ${
                        !isPettyVault && (vaultStock[tier.value] || 0) === 0 
                          ? 'border-rose-100 bg-rose-50/30 text-rose-300' 
                          : 'border-slate-200 text-slate-900 focus:border-brand-light focus:ring-2 focus:ring-brand-light/10'
                      }`}
                      disabled={!isPettyVault && (vaultStock[tier.value] || 0) === 0} 
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-6 border-t border-slate-100">
              <button 
                onClick={handleSubmit} 
                disabled={!canSubmit || isSubmitting} 
                className={`w-full py-4 rounded-full font-medium tracking-wide transition-all duration-300 shadow-sm ${
                  canSubmit 
                    ? 'bg-brand-dark text-white hover:bg-[#1E1A2F] hover:shadow-md hover:-translate-y-0.5' 
                    : 'bg-slate-100/50 text-slate-400 cursor-not-allowed border border-slate-200/50'
                }`}
              >
                {isSubmitting 
                  ? 'Recording Expense...' 
                  : isPettyVault
                    ? (canSubmit 
                        ? `Confirm Expense (AED ${targetAmount.toFixed(2)})${leftoverReturnAmount > 0 ? ` & Return AED ${leftoverReturnAmount.toFixed(2)} to Safe` : ''}` 
                        : isAllocationSelected
                          ? (targetAmount <= 0 
                              ? 'Enter expense bill amount' 
                              : targetAmount > allocatedAmount 
                                ? 'Expense bill exceeds advance' 
                                : `Match returned cash (AED ${leftoverReturnAmount.toFixed(2)})`)
                          : 'Select an active petty cash top-up')
                    : (isStandardMathValid ? 'Confirm Expense & Update Vault' : 'Complete valid details to sync')}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <RecentExpenses key={refreshKey} />

      {/* SUCCESS/ERROR MODAL */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" onClick={() => setModal({ ...modal, isOpen: false })}></div>
          
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full relative z-10 shadow-[0_20px_60px_rgb(0,0,0,0.08)] animate-in zoom-in-95 duration-300 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 mx-auto ${modal.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={modal.type === 'success' ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">{modal.type === 'success' ? 'Vault Updated' : 'Action Failed'}</h3>
            <p className="text-slate-500 text-sm mb-8">{modal.message}</p>
            <button onClick={() => setModal({ ...modal, isOpen: false })} className="w-full py-3.5 bg-slate-900 text-white rounded-full font-medium">Okay, got it</button>
          </div>
        </div>
      )}
    </div>
  );
}