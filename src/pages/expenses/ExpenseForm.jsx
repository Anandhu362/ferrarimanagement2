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
  
  // Track vaultType at the page level
  const [expenseData, setExpenseData] = useState({
    vaultType: 'accountant', // Defaults to accountant
    date: new Date().toISOString().split('T')[0],
    category: 'Office Supplies',
    description: '',
    totalAmount: ''
  });

  const [noteCounts, setNoteCounts] = useState(
    NOTE_TIERS.reduce((acc, tier) => ({ ...acc, [tier.value]: '' }), {})
  );

  // Fetch stock specifically for the selected vault type
  const fetchStock = async () => {
    try {
      const activeBranch = localStorage.getItem('active_branch') || 'DXB-MAIN';
      const response = await api.get(`/api/vault/summary?branchId=${encodeURIComponent(activeBranch)}&vaultType=${expenseData.vaultType}`);
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

  const clearAllNotes = () => {
    setNoteCounts(NOTE_TIERS.reduce((acc, tier) => ({ ...acc, [tier.value]: '' }), {}));
  };

  // Trigger re-fetch and input clear whenever the vault type or refreshKey changes
  useEffect(() => {
    fetchStock();
    clearAllNotes();
  }, [refreshKey, expenseData.vaultType]);

  const handleFormChange = (e) => {
    setExpenseData({ ...expenseData, [e.target.name]: e.target.value });
  };

  const handleNoteChange = (value, qtyStr) => {
    let cleanQty = qtyStr.replace(/[^0-9]/g, '');
    
    if (cleanQty === '') {
      setNoteCounts({ ...noteCounts, [value]: '' });
      return;
    }

    const numQty = parseInt(cleanQty, 10);
    const maxAvailable = vaultStock[value] || 0;
    
    if (numQty > maxAvailable) {
      cleanQty = maxAvailable.toString();
    }

    setNoteCounts({ ...noteCounts, [value]: cleanQty });
  };

  const calculatedRemovedCash = NOTE_TIERS.reduce((sum, tier) => {
    const qty = parseInt(noteCounts[tier.value]) || 0;
    return sum + (qty * tier.value);
  }, 0);

  const targetAmount = parseFloat(expenseData.totalAmount) || 0;
  
  const isDescriptionValid = isValidString(expenseData.description);
  const isAmountValid = isValidAmount(expenseData.totalAmount);
  const isMathValid = targetAmount > 0 && Math.abs(targetAmount - calculatedRemovedCash) < 0.01;
  const canSubmit = isDescriptionValid && isAmountValid && isMathValid;

  const handleSubmit = async () => {
    if (!canSubmit) return; 
    setIsSubmitting(true);

    try {
      const activeBranch = localStorage.getItem('active_branch') || 'DXB-MAIN';
      
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

      // ✅ OPTIMISTIC UI UPDATE: Deduct notes from state immediately
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
      
      setExpenseData({
        ...expenseData,
        description: '',
        totalAmount: ''
      });
      clearAllNotes();
      
      // Delay server-sync fetch to allow for BigQuery streaming buffer
      setTimeout(() => {
        setRefreshKey(old => old + 1);
      }, 2500);

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
          Log money leaving the main safe and specify exactly which denominations are being removed.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Child component receives state and the specific onVaultChange handler */}
        <ExpenseDetailsInput 
          expenseData={expenseData}
          onFormChange={handleFormChange}
          onDateChange={(date) => setExpenseData(prev => ({ ...prev, date }))}
          onCategoryChange={(category) => setExpenseData(prev => ({ ...prev, category }))}
          onVaultChange={(vaultType) => setExpenseData(prev => ({ ...prev, vaultType }))}
          onKeyDown={handleKeyDown}
        />

        <div className="lg:col-span-8 flex flex-col gap-6 relative z-10">
          <div className="bg-brand-dark rounded-[2rem] p-8 text-white flex flex-col sm:flex-row items-center justify-between relative overflow-hidden shadow-[0_12px_40px_rgb(43,38,64,0.3)]">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="flex flex-col mb-4 sm:mb-0 relative z-10 w-full sm:w-1/2 border-b sm:border-b-0 sm:border-r border-white/10 pb-4 sm:pb-0">
              <span className="text-white/60 text-xs font-semibold tracking-widest uppercase mb-1">Expense Bill</span>
              <span className="text-3xl font-semibold tracking-tighter">
                <span className="text-lg text-white/50 font-light mr-1 tracking-normal">AED</span>
                {targetAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}
              </span>
            </div>
            <div className="flex flex-col relative z-10 w-full sm:w-1/2 sm:pl-8">
              <span className="text-white/60 text-xs font-semibold tracking-widest uppercase mb-1">Cash Removed from Vault</span>
              <span className={`text-3xl font-semibold tracking-tighter transition-colors ${isMathValid ? 'text-emerald-400' : 'text-white'}`}>
                <span className="text-lg text-white/50 font-light mr-1 tracking-normal">AED</span>
                {calculatedRemovedCash.toLocaleString(undefined, {minimumFractionDigits: 2})}
              </span>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1.5 bg-white/5">
              <div className={`h-full transition-all duration-500 ease-out ${isMathValid ? 'bg-emerald-500 w-full' : targetAmount > 0 ? 'bg-amber-400' : 'bg-transparent'}`} style={{ width: isMathValid ? '100%' : `${Math.min(100, (calculatedRemovedCash / (targetAmount || 1)) * 100)}%` }}></div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-semibold text-slate-900 tracking-widest uppercase">Select Notes to Remove</h3>
              <button onClick={clearAllNotes} className="text-xs font-medium text-slate-400 hover:text-rose-500 transition-colors bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">Clear All</button>
            </div>

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
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Available</div>
                      <div className="text-xs font-semibold text-brand-dark">{vaultStock[tier.value] || 0}</div>
                    </div>
                    <input 
                      type="text"
                      placeholder="0"
                      value={noteCounts[tier.value]}
                      onChange={(e) => handleNoteChange(tier.value, e.target.value)}
                      onKeyDown={handleKeyDown}
                      className={`w-16 px-2 py-2 bg-white border rounded-xl text-center font-semibold focus:outline-none transition-all shadow-sm ${
                        (vaultStock[tier.value] || 0) === 0 ? 'border-rose-100 bg-rose-50/30 text-rose-300' : 'border-slate-200 text-slate-900 focus:border-brand-light focus:ring-2 focus:ring-brand-light/10'
                      }`}
                      disabled={(vaultStock[tier.value] || 0) === 0} 
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-6 border-t border-slate-100">
              <button onClick={handleSubmit} disabled={!canSubmit || isSubmitting} className={`w-full py-4 rounded-full font-medium tracking-wide transition-all duration-300 shadow-sm ${canSubmit ? 'bg-brand-dark text-white hover:bg-[#1E1A2F] hover:shadow-md hover:-translate-y-0.5' : 'bg-slate-100/50 text-slate-400 cursor-not-allowed border border-slate-200/50'}`}>
                {isSubmitting ? 'Recording Expense...' : isMathValid ? 'Confirm Expense & Update Vault' : 'Complete valid details to sync'}
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