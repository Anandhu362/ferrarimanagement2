// frontend/src/components/shared/PremiumCalendar.jsx
import React, { useState, useEffect } from 'react';

/**
 * PremiumCalendar - A high-end fintech-style date picker dropdown.
 * @param {string} selectedDate - ISO format date string (YYYY-MM-DD).
 * @param {function} onDateSelect - Callback function(dateString).
 * @param {boolean} isOpen - Controls visibility.
 * @param {function} onClose - Closes the dropdown.
 * @param {node} children - Optional custom UI (like Download buttons) to render at the bottom.
 */
export default function PremiumCalendar({ selectedDate, onDateSelect, isOpen, onClose, children }) {
  const [viewDate, setViewDate] = useState(new Date());

  // Sync viewDate when the calendar opens to the already selected date
  useEffect(() => {
    if (isOpen) {
      setViewDate(selectedDate ? new Date(selectedDate) : new Date());
    }
  }, [isOpen, selectedDate]);

  if (!isOpen) return null;

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  // Calendar Logic
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleSelect = (day) => {
    const m = String(currentMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const dateString = `${currentYear}-${m}-${d}`;
    onDateSelect(dateString);
    // Note: We deliberately DO NOT call onClose() here anymore. 
    // This keeps the calendar open so the user can click the "Download" button.
  };

  // Helper to check today
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <>
      {/* Invisible Backdrop to handle click-outside */}
      <div 
        className="fixed inset-0 z-[60] bg-transparent" 
        onClick={onClose}
      ></div>
      
      {/* Calendar Box */}
      <div className="absolute top-[calc(100%+12px)] right-0 p-5 bg-white rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-slate-100/80 z-[70] w-[300px] animate-in slide-in-from-top-2 fade-in duration-200">
        
        {/* Month & Year Navigation */}
        <div className="flex justify-between items-center mb-5">
          <button 
            onClick={handlePrevMonth}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="text-[15px] font-bold text-slate-900 tracking-tight">
            {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>

          <button 
            onClick={handleNextMonth}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days Grid */}
        <div className="grid grid-cols-7 gap-1">
          {emptyDays.map((_, i) => (
            <div key={`empty-${i}`} className="w-9 h-9"></div>
          ))}

          {days.map((day) => {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSelected = selectedDate === dateStr;
            const isToday = todayStr === dateStr;

            return (
              <button
                key={day}
                onClick={(e) => { e.stopPropagation(); handleSelect(day); }}
                className={`w-9 h-9 flex items-center justify-center rounded-full text-xs font-medium transition-all ${
                  isSelected 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : isToday 
                      ? 'text-emerald-500 bg-emerald-50 hover:bg-emerald-100 font-bold'
                      : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* ✅ DYNAMIC FOOTER: Shows custom children (Download Button) OR standard Clear Filter */}
        {children ? (
          children
        ) : (
          selectedDate && (
            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-center">
              <button 
                onClick={(e) => { e.stopPropagation(); onDateSelect(null); onClose(); }}
                className="text-[11px] font-bold text-rose-500 hover:text-rose-600 uppercase tracking-widest transition-colors"
              >
                Clear Filter
              </button>
            </div>
          )
        )}
      </div>
    </>
  );
}