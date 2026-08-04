// frontend/src/components/shared/PremiumCalendar.jsx
import React, { useState, useEffect } from 'react';

/**
 * PremiumCalendar - A high-end fintech-style date picker dropdown.
 * @param {Array} selectedDates - Array of ISO format date strings (['YYYY-MM-DD', ...]).
 * @param {function} onDateSelect - Callback function(dateStringArray).
 * @param {boolean} isOpen - Controls visibility.
 * @param {function} onClose - Closes the dropdown.
 * @param {node} children - Optional custom UI (like Download buttons) to render at the bottom.
 */
export default function PremiumCalendar({ selectedDates = [], onDateSelect, isOpen, onClose, children }) {
  const [viewDate, setViewDate] = useState(new Date());
  // 'date' (days grid), 'month' (12 months grid), 'year' (decade grid)
  const [viewMode, setViewMode] = useState('date'); 

  // ✅ FIX: Extract the first date as a primitive string to prevent referential equality loops
  const firstSelectedDate = selectedDates && selectedDates.length > 0 ? selectedDates[0] : null;

  // Sync viewDate and reset view mode when the calendar opens
  useEffect(() => {
    if (isOpen) {
      setViewDate(firstSelectedDate ? new Date(firstSelectedDate) : new Date());
      setViewMode('date'); 
    }
  }, [isOpen, firstSelectedDate]); // ✅ FIX: Depend on the primitive string, not the array reference

  if (!isOpen) return null;

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  // Dynamic Header Label
  const getHeaderLabel = () => {
    if (viewMode === 'date') return viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (viewMode === 'month') return currentYear.toString();
    if (viewMode === 'year') {
      const start = Math.floor(currentYear / 12) * 12;
      return `${start} - ${start + 11}`;
    }
  };

  // Header Click Handler (Zoom out)
  const handleHeaderClick = (e) => {
    e.stopPropagation();
    if (viewMode === 'date') setViewMode('year'); // Fast jump to years
    else if (viewMode === 'month') setViewMode('year');
    else setViewMode('date'); // Reset if clicked again
  };

  // Navigation Handlers based on View Mode
  const handlePrev = (e) => {
    e.stopPropagation();
    const d = new Date(viewDate);
    if (viewMode === 'date') d.setMonth(d.getMonth() - 1);
    else if (viewMode === 'month') d.setFullYear(d.getFullYear() - 1);
    else if (viewMode === 'year') d.setFullYear(d.getFullYear() - 12);
    setViewDate(d);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    const d = new Date(viewDate);
    if (viewMode === 'date') d.setMonth(d.getMonth() + 1);
    else if (viewMode === 'month') d.setFullYear(d.getFullYear() + 1);
    else if (viewMode === 'year') d.setFullYear(d.getFullYear() + 12);
    setViewDate(d);
  };

  // Selection Handlers for Fast Zoom-in
  const handleYearSelect = (e, year) => {
    e.stopPropagation();
    const d = new Date(viewDate);
    d.setFullYear(year);
    setViewDate(d);
    setViewMode('month'); // Drop down to month view
  };

  const handleMonthSelect = (e, monthIndex) => {
    e.stopPropagation();
    const d = new Date(viewDate);
    d.setMonth(monthIndex);
    setViewDate(d);
    setViewMode('date'); // Drop down to day view
  };

  const handleDaySelect = (e, day) => {
    e.stopPropagation();
    const m = String(currentMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const dateString = `${currentYear}-${m}-${d}`;
    
    let newSelectedDates;

    if (e.ctrlKey || e.metaKey) {
      if (selectedDates.includes(dateString)) {
        newSelectedDates = selectedDates.filter(date => date !== dateString);
      } else {
        newSelectedDates = [...selectedDates, dateString];
      }
    } else {
      newSelectedDates = [dateString];
    }
    
    onDateSelect(newSelectedDates);
  };

  // Setup for Days Grid
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  const todayStr = new Date().toISOString().split('T')[0];

  // Setup for Years Grid (12-year window)
  const startYear = Math.floor(currentYear / 12) * 12;
  const years = Array.from({length: 12}, (_, i) => startYear + i);
  
  // Setup for Months Grid
  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <>
      {/* Invisible Backdrop */}
      <div 
        className="fixed inset-0 z-[100] bg-transparent" 
        onClick={onClose}
      ></div>
      
      {/* Calendar Box */}
      <div className="absolute top-[calc(100%+12px)] right-0 p-5 bg-white rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-slate-100/80 z-[110] w-[300px] animate-in slide-in-from-top-2 fade-in duration-200">
        
        {/* Navigation Header */}
        <div className="flex justify-between items-center mb-5">
          <button 
            type="button" 
            onClick={handlePrev}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button 
            type="button"
            onClick={handleHeaderClick}
            className="text-[15px] font-bold text-slate-900 tracking-tight hover:text-brand-light transition-colors px-3 py-1 rounded-lg hover:bg-slate-50"
          >
            {getHeaderLabel()}
          </button>

          <button 
            type="button" 
            onClick={handleNext}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* ======================= */}
        {/* VIEW: YEARS GRID        */}
        {/* ======================= */}
        {viewMode === 'year' && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            {years.map(y => (
              <button 
                type="button" 
                key={y}
                onClick={(e) => handleYearSelect(e, y)} 
                className={`py-3 text-sm font-semibold rounded-xl transition-colors ${
                  y === currentYear 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        )}

        {/* ======================= */}
        {/* VIEW: MONTHS GRID       */}
        {/* ======================= */}
        {viewMode === 'month' && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            {shortMonths.map((m, i) => (
              <button 
                type="button" 
                key={m}
                onClick={(e) => handleMonthSelect(e, i)} 
                className={`py-3 text-sm font-semibold rounded-xl transition-colors ${
                  i === currentMonth 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        )}

        {/* ======================= */}
        {/* VIEW: DAYS GRID (Default)*/}
        {/* ======================= */}
        {viewMode === 'date' && (
          <>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {emptyDays.map((_, i) => (
                <div key={`empty-${i}`} className="w-9 h-9"></div>
              ))}

              {days.map((day) => {
                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isSelected = selectedDates.includes(dateStr);
                const isToday = todayStr === dateStr;

                return (
                  <button
                    type="button" 
                    key={day}
                    onClick={(e) => handleDaySelect(e, day)}
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
          </>
        )}

        {/* Footer Actions */}
        {children ? (
          children
        ) : (
          selectedDates.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-center">
              <button 
                type="button" 
                onClick={(e) => { e.stopPropagation(); onDateSelect([]); onClose(); }}
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