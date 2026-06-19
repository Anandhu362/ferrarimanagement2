// frontend/src/pages/petty-cash/PettyCashManager.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api'; 
import PettyCashTopUp from '../../components/petty-cash/PettyCashTopUp';
import PettyCashReversalModal from '../../components/petty-cash/PettyCashReversalModal';

const PC_DENOMINATIONS = [
  { label: '1000 AED', value: 1000, isNote: true }, // Added 1000 AED to align with top-up
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

const CATEGORIES = [
  "Office Supplies & Stationery",
  "Pantry & Groceries",
  "Transportation",
  "Miscellaneous"
];

export default function PettyCashManager() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for Custom Premium Modal, Calendar, and Dropdown
  const [modal, setModal] = useState({ isOpen: false, type: 'success', message: '' });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  
  // NEW: State for Reversal Modal & Balance Tracking
  const [isReversalOpen, setIsReversalOpen] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(0);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'Office Supplies & Stationery',
    description: '',
    receiptAmount: ''
  });

  const [noteCounts, setNoteCounts] = useState(
    PC_DENOMINATIONS.reduce((acc, tier) => ({ ...acc, [tier.value]: '' }), {})
  );

  // NEW: Fetch live balance for validation
  const fetchBalance = async () => {
    try {
      const activeBranch = localStorage.getItem('active_branch') || 'DXB-MAIN';
      // Adjust this endpoint to match your dashboard balance fetcher
      const response = await api.get(`/api/petty-cash/balance?branchId=${activeBranch}`);
      if (response.data && response.data.success) {
        setCurrentBalance(response.data.balance || 0);
      }
    } catch (error) {
      console.error("Could not fetch petty cash balance", error);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDateSelect = (year, month, day) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    setFormData({ ...formData, date: `${year}-${m}-${d}` });
    setIsCalendarOpen(false);
  };

  const handleCategorySelect = (category) => {
    setFormData({ ...formData, category });
    setIsCategoryOpen(false);
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

  const calculatedRemovedCash = PC_DENOMINATIONS.reduce((sum, tier) => {
    const qty = parseInt(noteCounts[tier.value]) || 0;
    return sum + (qty * tier.value);
  }, 0);

  const targetAmount = parseFloat(formData.receiptAmount) || 0;
  
  // NEW: Validation Checks
  const isWithinBalance = targetAmount <= currentBalance;
  const isValidMatch = targetAmount > 0 && Math.abs(targetAmount - calculatedRemovedCash) < 0.01;
  const canSubmit = isValidMatch && formData.description.trim() !== '' && isWithinBalance;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);

    try {
      const activeBranch = localStorage.getItem('active_branch') || 'DXB-MAIN';
      
      const payload = {
        date: formData.date,
        category: formData.category,
        description: formData.description,
        amount: targetAmount,
        branchId: activeBranch
      };

      await api.post('/api/petty-cash/process', payload);

      setModal({ isOpen: true, type: 'success', message: 'Petty cash expense successfully logged.' });
      
      // Reset Form State
      setFormData({
        date: new Date().toISOString().split('T')[0],
        category: 'Office Supplies & Stationery',
        description: '',
        receiptAmount: ''
      });
      
      setNoteCounts(PC_DENOMINATIONS.reduce((acc, tier) => ({ ...acc, [tier.value]: '' }), {}));
      
      // Refresh the balance
      fetchBalance();

    } catch (error) {
      console.error("Submission error:", error);
      const errorMsg = error.response?.data?.message || "Network error. Could not connect to the server.";
      setModal({ isOpen: true, type: 'error', message: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const container = e.target.closest('.petty-cash-container');
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
    <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-12 relative petty-cash-container">
      
      {/* Header with Reverse Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-[1.75rem] font-semibold text-slate-900 tracking-tight leading-tight">Petty Cash Management</h2>
          <p className="text-slate-500 text-sm mt-1.5 font-light tracking-wide">Manage your petty cash fund by logging minor expenses or manually topping up the balance from a main vault.</p>
        </div>
        
        {/* NEW: Reversal Trigger Button */}
        <button 
          onClick={() => setIsReversalOpen(true)}
          className="shrink-0 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
          Reverse Funds
        </button>
      </div>

      <PettyCashTopUp onTopUpSuccess={fetchBalance} />

      {/* EXPENSE LOGGING SECTION */}
      <div className="flex flex-col gap-8 relative z-20 mt-12">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Log an Expense</h3>
            <p className="text-xs text-slate-500 mt-1 font-light">Record a purchase and deduct notes from the physical petty cash box.</p>
          </div>
          <div className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-sm font-semibold border border-slate-200">
            Available: AED {currentBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm relative z-20">
          <h3 className="text-sm font-semibold text-slate-900 mb-6">1. Expense Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            
            {/* CUSTOM CALENDAR INPUT */}
            <div className="space-y-2 relative">
              <label className="block text-sm font-medium text-slate-700">Date *</label>
              <div 
                onClick={() => { 
                  setIsCalendarOpen(!isCalendarOpen); 
                  setIsCategoryOpen(false); 
                  setCalendarViewDate(new Date(formData.date)); 
                }}
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

            {/* CUSTOM CATEGORY DROPDOWN */}
            <div className="space-y-2 relative">
              <label className="block text-sm font-medium text-slate-700">Category *</label>
              <div 
                onClick={() => { setIsCategoryOpen(!isCategoryOpen); setIsCalendarOpen(false); }}
                className="w-full px-4 py-3 bg-[#FCFCFD] border border-slate-200 rounded-xl text-slate-900 cursor-pointer flex justify-between items-center hover:border-brand-light/50 focus:ring-2 focus:ring-brand-light/10 transition-all"
              >
                <span className="font-medium text-sm">{formData.category}</span>
                <svg className={`w-4 h-4 transition-transform duration-200 ${isCategoryOpen ? 'rotate-180 text-brand-dark' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {isCategoryOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsCategoryOpen(false)}></div>
                  <div className="absolute top-[calc(100%+8px)] left-0 w-full p-2 bg-white rounded-2xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100/80 z-50 animate-in slide-in-from-top-2 fade-in duration-200">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => handleCategorySelect(cat)}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-between ${
                          formData.category === cat ? 'bg-slate-50 text-brand-dark' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        {cat}
                        {formData.category === cat && (
                          <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

          </div>
          
          <div className="space-y-2 mb-6">
            <label className="block text-sm font-medium text-slate-700">Description *</label>
            <input type="text" name="description" value={formData.description} onChange={handleFormChange} onKeyDown={handleKeyDown} placeholder="e.g., Coffee and sugar for pantry" className="w-full px-4 py-3 bg-[#FCFCFD] border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-brand-dark transition-all text-sm" />
          </div>
          
          {/* Amount Input with Live Validation Feedback */}
          <div className="space-y-2 relative mb-2">
            <label className="block text-sm font-medium text-slate-700">Receipt Amount *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">AED</span>
              <input 
                type="number" 
                name="receiptAmount" 
                value={formData.receiptAmount} 
                onChange={handleFormChange} 
                onKeyDown={handleKeyDown} 
                placeholder="0.00" 
                className={`w-full pl-14 pr-4 py-3 bg-[#FCFCFD] border rounded-xl font-semibold outline-none transition-all text-lg ${
                  !isWithinBalance && targetAmount > 0 
                  ? 'border-rose-300 text-rose-600 bg-rose-50' 
                  : 'border-slate-200 text-slate-900 focus:border-brand-dark'
                }`} 
              />
            </div>
            {!isWithinBalance && targetAmount > 0 && (
              <p className="text-xs text-rose-500 font-medium absolute -bottom-5 left-1">
                Amount exceeds current Petty Cash balance (AED {currentBalance.toLocaleString()})
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm relative z-10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-semibold text-slate-900">2. Notes removed from Petty Cash</h3>
            <span className={`text-sm font-semibold ${isValidMatch ? 'text-emerald-500' : 'text-amber-500'}`}>Selected: AED {calculatedRemovedCash.toFixed(2)}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
            {PC_DENOMINATIONS.map((tier) => (
              <div key={tier.value} className="bg-[#FCFCFD] p-4 rounded-2xl border border-slate-100 hover:border-brand-light/30 transition-all">
                <div className="text-xs font-semibold text-slate-500 mb-3 text-center">{tier.label}</div>
                <input 
                  type="text"
                  placeholder="0"
                  value={noteCounts[tier.value]}
                  onChange={(e) => handleNoteChange(tier.value, e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full text-center py-2 rounded-xl border border-slate-200 focus:border-brand-dark outline-none font-medium text-slate-900 bg-white shadow-sm transition-all focus:ring-2 focus:ring-brand-light/10"
                />
              </div>
            ))}
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex justify-end">
          <button 
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className={`px-10 py-4 rounded-xl font-medium tracking-wide transition-all duration-300 shadow-sm ${
              canSubmit 
                ? 'bg-brand-dark text-white hover:bg-slate-800 hover:-translate-y-0.5' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Processing...' : 'Log Expense'}
          </button>
        </div>

      </div>

      {/* NEW: Reversal Modal Binding */}
      <PettyCashReversalModal 
        isOpen={isReversalOpen}
        onClose={() => setIsReversalOpen(false)}
        currentBalance={currentBalance}
        onSuccess={(amount) => {
          setModal({ isOpen: true, type: 'success', message: `Successfully reversed AED ${amount} back to the vault.` });
          fetchBalance();
        }}
      />

      {/* CUSTOM PREMIUM SUCCESS/ERROR MODAL */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
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
                {modal.type === 'success' ? 'Success' : 'Action Failed'}
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