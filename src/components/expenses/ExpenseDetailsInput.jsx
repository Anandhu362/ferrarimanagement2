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
  { value: 'ceo', label: 'CEO Vault' }
];

const formatDateForDisplay = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function ExpenseDetailsInput({ 
  expenseData, 
  onFormChange, 
  onDateChange, 
  onCategoryChange, 
  onVaultChange, // Add prop to handle vault selection
  onKeyDown 
}) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date(expenseData.date || new Date()));
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isVaultDropdownOpen, setIsVaultDropdownOpen] = useState(false); // State for new dropdown

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
    onVaultChange(vaultValue);
    setIsVaultDropdownOpen(false);
  };

  return (
    <div className="lg:col-span-4 bg-white rounded-[2rem] p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] h-fit relative z-20">
      <h3 className="text-lg font-semibold text-slate-900 tracking-tight mb-6">Expense Details</h3>
      <div className="space-y-6">

        {/* --- NEW: CUSTOM VAULT DROPDOWN --- */}
        <div className="space-y-2 relative">
          <label className="block text-sm font-medium text-slate-700">From Vault *</label>
          <div 
            onClick={() => { 
              setIsVaultDropdownOpen(!isVaultDropdownOpen); 
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
          <label className="block text-sm font-medium text-slate-700">Total Bill Amount *</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">AED</span>
            <input 
              type="number" 
              name="totalAmount" 
              value={expenseData.totalAmount} 
              onChange={onFormChange} 
              onKeyDown={onKeyDown} 
              placeholder="0.00" 
              className="w-full pl-14 pr-4 py-3 bg-[#FCFCFD] border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-brand-light focus:ring-2 focus:ring-brand-light/10 transition-all text-lg" 
            />
          </div>
        </div>
      </div>
    </div>
  );
}