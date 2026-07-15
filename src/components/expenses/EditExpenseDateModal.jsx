import React, { useState, useEffect, useRef } from 'react';
import api from '../../config/api';

export default function EditExpenseDateModal({ isOpen, onClose, expense, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Custom Calendar State
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [originalTime, setOriginalTime] = useState('12:00:00');
  
  const calendarRef = useRef(null);

  // Initialize date and extract original time when modal opens
  useEffect(() => {
    if (isOpen && expense) {
      try {
        const dateObj = new Date(expense.createdAt || expense.timestamp);
        if (!isNaN(dateObj.getTime())) {
          setSelectedDate(dateObj);
          setCurrentMonth(dateObj);
          
          // Extract the original time to preserve it (HH:mm:ss)
          const timeString = dateObj.toTimeString().split(' ')[0];
          setOriginalTime(timeString);
        } else {
          setSelectedDate(new Date());
          setCurrentMonth(new Date());
        }
      } catch (err) {
        setSelectedDate(new Date());
        setCurrentMonth(new Date());
      }
      setError(null);
      setShowCalendar(false);
    }
  }, [isOpen, expense]);

  // Handle clicking outside the custom calendar to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };
    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar]);

  if (!isOpen || !expense) return null;

  // --- Calendar Helper Functions ---
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  
  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const handleNextMonth = (e) => {
    e.stopPropagation();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (day) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(newDate);
    setShowCalendar(false);
  };

  const formatDisplayDate = (date) => {
    if (!date) return 'Select a date';
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  // --- Form Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const activeBranch = localStorage.getItem('active_branch');
      if (!activeBranch) throw new Error('Active branch not found. Please log in again.');
      if (!selectedDate) throw new Error('Please select a valid date.');

      // Combine the newly selected date with the preserved original time
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      
      const combinedDateTimeString = `${year}-${month}-${day} ${originalTime}`;

      const response = await api.put('/api/expenses/update-date', {
        branchId: activeBranch,
        id: expense.id,
        newDate: combinedDateTimeString
      });

      if (response.data.success) {
        onSuccess();
        onClose();
      } else {
        throw new Error(response.data.message || 'Failed to update date');
      }
    } catch (err) {
      console.error('Update date error:', err);
      setError(err.response?.data?.message || err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 sm:px-0">
      {/* Blurred Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={!loading ? onClose : undefined}
      ></div>

      {/* Modal Container */}
      <div className="relative bg-white rounded-[2rem] w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-100/60 rounded-t-[2rem]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-slate-800 font-semibold text-lg tracking-tight">Edit Expense Date</h3>
          </div>
          <button 
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-sm font-medium flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}

          {/* Context Card */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Target Transaction</p>
            <p className="text-sm font-medium text-slate-800 line-clamp-2">{expense.description}</p>
            <p className="text-sm font-semibold text-slate-900 mt-2">
              Amount: <span className="text-rose-500">- AED {parseFloat(expense.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </p>
          </div>

          <form id="edit-date-form" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2 relative" ref={calendarRef}>
              <label className="text-sm font-medium text-slate-700 ml-1">New Date</label>
              
              {/* Custom Date Input Trigger */}
              <button
                type="button"
                onClick={() => setShowCalendar(!showCalendar)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm flex items-center justify-between hover:bg-slate-50"
              >
                <span className="font-medium">{formatDisplayDate(selectedDate)}</span>
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>

              <p className="text-[11px] text-slate-400 font-medium mt-1 ml-1">
                The original time ({originalTime}) will be automatically preserved.
              </p>

              {/* ✅ UPDATED: Custom Fintech Calendar Popover referencing PremiumCalendar.jsx styles */}
              {showCalendar && (
                <div className="absolute top-[calc(100%+8px)] left-0 p-5 bg-white rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-slate-100/80 z-[110] w-[300px] animate-in slide-in-from-top-2 fade-in duration-200">
                  
                  {/* Month & Year Navigation */}
                  <div className="flex justify-between items-center mb-5">
                    <button 
                      type="button"
                      onClick={handlePrevMonth}
                      className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    <div className="text-[15px] font-bold text-slate-900 tracking-tight">
                      {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>

                    <button 
                      type="button"
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
                    {/* Empty slots for start of month */}
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                      <div key={`empty-${i}`} className="w-9 h-9"></div>
                    ))}
                    
                    {/* Actual Days */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const dayNumber = i + 1;
                      const isSelected = selectedDate && 
                                         selectedDate.getDate() === dayNumber && 
                                         selectedDate.getMonth() === currentMonth.getMonth() &&
                                         selectedDate.getFullYear() === currentMonth.getFullYear();
                      
                      const isToday = new Date().getDate() === dayNumber && 
                                      new Date().getMonth() === currentMonth.getMonth() &&
                                      new Date().getFullYear() === currentMonth.getFullYear();

                      return (
                        <button
                          key={dayNumber}
                          type="button"
                          onClick={() => handleDateClick(dayNumber)}
                          className={`w-9 h-9 flex items-center justify-center rounded-full text-xs font-medium transition-all ${
                            isSelected 
                              ? 'bg-slate-900 text-white shadow-md' 
                              : isToday 
                                ? 'text-emerald-500 bg-emerald-50 hover:bg-emerald-100 font-bold'
                                : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {dayNumber}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Select Today Footer */}
                  <div className="mt-4 pt-4 border-t border-slate-50 flex justify-center">
                    <button 
                      type="button"
                      onClick={() => {
                        const today = new Date();
                        setSelectedDate(today);
                        setCurrentMonth(today);
                        setShowCalendar(false);
                      }}
                      className="text-[11px] font-bold text-blue-500 hover:text-blue-600 uppercase tracking-widest transition-colors"
                    >
                      Select Today
                    </button>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-100/60 rounded-b-[2rem]">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-date-form"
            disabled={loading || !selectedDate}
            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm shadow-blue-600/20 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              'Save Date'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}