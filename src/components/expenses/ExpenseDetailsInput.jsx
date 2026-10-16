import React, { useState } from 'react';

const CATEGORIES = [
  "Office Supplies", 
  "Vendor Payment", 
  "Maintenance", 
  "Petty Cash Top-up", 
  "Transportation",
  "Bank Account",
  "Others"
];

const VAULT_OPTIONS = [
  { value: 'accountant', label: 'Accountant Vault' },
  { value: 'ceo', label: 'CEO Vault' },
  { value: 'petty', label: 'Petty Cash Vault' }
];

const formatDateForDisplay = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return String(dateString);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function ExpenseDetailsInput({ 
  expenseData, 
  onFormChange, 
  onDateChange, 
  onCategoryChange, 
  onVaultChange, // Add prop to handle vault selection
  activeAllocations = [],
  onAllocationSelect,
  isLoadingAllocations = false,
  onKeyDown 
}) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date(expenseData.date || new Date()));
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isVaultDropdownOpen, setIsVaultDropdownOpen] = useState(false); // State for new dropdown
  const [isAllocationDropdownOpen, setIsAllocationDropdownOpen] = useState(false);

  const selectedAllocation = activeAllocations.find(a => a.id === expenseData.allocationId);

  const handleDateSelect = (year, month, day) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    onDateChange(`${year}-${m}-${d}`);
    setIsCalendarOpen(false);
  };

  const handleCategorySelect = (category) => {
    onCategoryChange(category);
    setIsCategoryOpen(false);
  };

  const handleVaultSelect = (vaultValue) => {
    setIsAllocationDropdownOpen(false);
    setIsVaultDropdownOpen(false);
    onVaultChange(vaultValue);
  };

  return (
    <div className="lg:col-span-4 bg-white rounded-[2rem] p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] h-fit relative z-20">
      <h3 className="text-lg font-semibold text-slate-900 tracking-tight mb-6">Expense Details</h3>
      <div className="space-y-6">

        {/* --- CUSTOM VAULT DROPDOWN --- */}
        <div className="space-y-2 relative">
          <label className="block text-sm font-medium text-slate-700">From Vault *</label>
          <div 
            onClick={() => { 
              setIsVaultDropdownOpen(!isVaultDropdownOpen); 
              setIsAllocationDropdownOpen(false);
              setIsCalendarOpen(false); 
              setIsCategoryOpen(false); 
            }}
            className="w-full px-4 py-3 bg-[#FCFCFD] border border-slate-200 rounded-xl text-slate-900 cursor-pointer flex justify-between items-center hover:border-brand-light/50 focus:ring-2 focus:ring-brand-light/10 transition-all"
          >
            <span className="font-medium tracking-wide text-sm">
              {VAULT_OPTIONS.find(opt => opt.value === expenseData.vaultType)?.label || 'Select Vault'}
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
                      handleVaultSelect(option.value);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between ${
                      expenseData.vaultType === option.value
                        ? 'bg-slate-50 text-slate-900'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {option.label}
                    {expenseData.vaultType === option.value && (
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

        {/* --- PETTY CASH TOP-UP ALLOCATION DROPDOWN --- */}
        {expenseData.vaultType === 'petty' && (
          <div className="space-y-2 relative animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-slate-700">Select Petty Cash Top-Up *</label>
              {isLoadingAllocations && (
                <span className="text-[11px] text-slate-400 animate-pulse font-medium">Loading...</span>
              )}
            </div>

            <div 
              onClick={() => { 
                setIsAllocationDropdownOpen(!isAllocationDropdownOpen); 
                setIsVaultDropdownOpen(false);
                setIsCalendarOpen(false); 
                setIsCategoryOpen(false); 
              }}
              className="w-full px-4 py-3 bg-[#FCFCFD] border border-slate-200 rounded-xl text-slate-900 cursor-pointer flex justify-between items-center hover:border-brand-light/50 focus:ring-2 focus:ring-brand-light/10 transition-all"
            >
              <div className="truncate pr-2">
                {selectedAllocation ? (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-sm truncate">{selectedAllocation.description}</span>
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      AED {parseFloat(selectedAllocation.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-400 text-sm font-light">Select active petty cash advance</span>
                )}
              </div>
              <svg 
                className={`w-4 h-4 shrink-0 transition-transform duration-300 ${isAllocationDropdownOpen ? 'rotate-180 text-brand-dark' : 'text-slate-400'}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {isAllocationDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsAllocationDropdownOpen(false)}></div>
                <div className="absolute top-[calc(100%+8px)] left-0 w-full p-2 bg-white rounded-[1.25rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100/80 z-50 max-h-64 overflow-y-auto animate-in slide-in-from-top-2 fade-in duration-200">
                  {activeAllocations.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No active petty cash advances found. Please top up petty cash first.
                    </div>
                  ) : (
                    activeAllocations.map((alloc) => (
                      <button
                        key={alloc.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAllocationSelect && onAllocationSelect(alloc);
                          setIsAllocationDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between gap-2 mb-1 last:mb-0 ${
                          expenseData.allocationId === alloc.id
                            ? 'bg-slate-50 text-slate-900 border border-slate-200/80'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <div className="truncate">
                          <div className="font-semibold text-slate-900 text-xs truncate">{alloc.description}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {formatDateForDisplay(alloc.date || alloc.createdAt)} &bull; Source: {alloc.vaultSource || 'CEO Vault'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-800">
                            AED {parseFloat(alloc.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                          {expenseData.allocationId === alloc.id && (
                            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}

            {selectedAllocation && (
              <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl border border-slate-200/60 text-xs">
                <span className="text-slate-500 font-medium">Advance Amount:</span>
                <span className="font-bold text-slate-900">
                  AED {parseFloat(selectedAllocation.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>
        )}
        
        {/* --- EXISTING CALENDAR INPUT --- */}
        <div className="space-y-2 relative">
          <label className="block text-sm font-medium text-slate-700">Date *</label>
          <div 
            onClick={() => { 
              setIsCalendarOpen(!isCalendarOpen); 
              setIsCategoryOpen(false); 
              setIsVaultDropdownOpen(false); // Close vault dropdown
              setCalendarViewDate(new Date(expenseData.date)); 
            }}
            className="w-full px-4 py-3 bg-[#FCFCFD] border border-slate-200 rounded-xl text-slate-900 cursor-pointer flex justify-between items-center hover:border-brand-light/50 focus:ring-2 focus:ring-brand-light/10 transition-all"
          >
            <span className="font-medium tracking-wide text-sm">{formatDateForDisplay(expenseData.date)}</span>
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
                    const isSelected = expenseData.date === dateString;
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

        {/* --- EXISTING CATEGORY DROPDOWN --- */}
        <div className="space-y-2 relative">
          <label className="block text-sm font-medium text-slate-700">Category *</label>
          <div 
            onClick={() => { 
              setIsCategoryOpen(!isCategoryOpen); 
              setIsCalendarOpen(false); 
              setIsVaultDropdownOpen(false); // Close vault dropdown
            }}
            className="w-full px-4 py-3 bg-[#FCFCFD] border border-slate-200 rounded-xl text-slate-900 cursor-pointer flex justify-between items-center hover:border-brand-light/50 focus:ring-2 focus:ring-brand-light/10 transition-all"
          >
            <span className="font-medium text-sm">{expenseData.category}</span>
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
                      expenseData.category === cat ? 'bg-slate-50 text-brand-dark' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {cat}
                    {expenseData.category === cat && (
                      <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* --- EXISTING STANDARD INPUTS --- */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Description *</label>
          <input 
            type="text" 
            name="description" 
            value={expenseData.description} 
            onChange={onFormChange} 
            onKeyDown={onKeyDown} 
            placeholder="e.g., Monthly office internet bill" 
            className="w-full px-4 py-3 bg-[#FCFCFD] border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-light focus:ring-2 focus:ring-brand-light/10 transition-all text-sm" 
          />
        </div>

        <div className="space-y-2 pt-2">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-slate-700">
              {expenseData.vaultType === 'petty' ? 'Expense Bill Amount *' : 'Total Bill Amount *'}
            </label>
            {expenseData.vaultType === 'petty' && selectedAllocation && (
              <span className={`text-[11px] font-medium ${
                parseFloat(expenseData.totalAmount || 0) > parseFloat(selectedAllocation.amount || 0)
                  ? 'text-rose-500 font-bold'
                  : 'text-slate-400'
              }`}>
                Max: AED {parseFloat(selectedAllocation.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">AED</span>
            <input 
              type="number" 
              name="totalAmount" 
              value={expenseData.totalAmount} 
              onChange={onFormChange} 
              onKeyDown={onKeyDown} 
              placeholder="0.00" 
              className={`w-full pl-14 pr-4 py-3 bg-[#FCFCFD] border rounded-xl font-semibold focus:outline-none transition-all text-lg ${
                expenseData.vaultType === 'petty' && selectedAllocation && parseFloat(expenseData.totalAmount || 0) > parseFloat(selectedAllocation.amount || 0)
                  ? 'border-rose-300 text-rose-600 bg-rose-50'
                  : 'border-slate-200 text-slate-900 focus:border-brand-light focus:ring-2 focus:ring-brand-light/10'
              }`} 
            />
          </div>
          {expenseData.vaultType === 'petty' && selectedAllocation && parseFloat(expenseData.totalAmount || 0) > parseFloat(selectedAllocation.amount || 0) && (
            <p className="text-xs text-rose-500 font-medium">
              Expense bill cannot exceed the allocated advance amount (AED {parseFloat(selectedAllocation.amount || 0).toFixed(2)}).
            </p>
          )}
        </div>
      </div>
    </div>
  );
}