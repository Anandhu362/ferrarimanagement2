import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';
import PremiumCalendar from '../shared/PremiumCalendar'; 

const DeliveryExportModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState('');
  const [availableLocations, setAvailableLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [error, setError] = useState('');

  // UI States for Custom Dropdowns
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  
  const locationDropdownRef = useRef(null);
  const calendarRef = useRef(null);

  // Close custom dropdowns if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target)) {
        setIsLocationDropdownOpen(false);
      }
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setIsCalendarOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedDate('');
      setSelectedLocation('');
      setAvailableLocations([]);
      setError('');
      setIsCalendarOpen(false);
      setIsLocationDropdownOpen(false);
    }
  }, [isOpen]);

  // Fetch locations when a date is selected
  useEffect(() => {
    const fetchLocations = async () => {
      if (!selectedDate) {
        setAvailableLocations([]);
        setSelectedLocation('');
        return;
      }
      
      setIsLoadingLocations(true);
      setError('');
      
      try {
        const response = await api.get(`/api/orders/delivery-locations?date=${selectedDate}`);
        
        if (response.data && response.data.success) {
          setAvailableLocations(response.data.locations || []);
          setSelectedLocation(''); 
        } else {
          setAvailableLocations([]);
        }
      } catch (err) {
        console.error("Error fetching locations:", err);
        setError("Failed to fetch available locations for this date.");
        setAvailableLocations([]);
      } finally {
        setIsLoadingLocations(false);
      }
    };

    fetchLocations();
  }, [selectedDate]);

  // ✅ UPDATED: Navigate to the new interactive Dispatch Board instead of downloading
  const handleProceedToDispatch = () => {
    if (!selectedDate || !selectedLocation) return;
    
    // Close the modal
    onClose();
    
    // Navigate to the Dispatch page and pass the selected filters via state or query params
    // We'll use standard navigation, and the Dispatch page can read the state or you can manually set it there.
    // For simplicity, we are just navigating. The Dispatch page will auto-load today's date, 
    // but you can enhance this to read query params if you add them to DeliveryDispatch.jsx.
    navigate('/dispatch');
  };

  // Helper to format date for the custom input display
  const displayDate = selectedDate 
    ? new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Select dispatch date...';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl w-full max-w-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 overflow-visible animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Prepare Delivery Dispatch</h3>
          <p className="text-xs text-slate-500 mt-1 font-medium">Select a date and location to sort and route deliveries.</p>
        </div>
        
        {/* Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-600 rounded-lg text-xs font-semibold flex items-start gap-2 border border-rose-100">
               <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               <span>{error}</span>
            </div>
          )}

          {/* Date Picker */}
          <div className="space-y-1.5 relative" ref={calendarRef}>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              1. Select Date
            </label>
            <button
              type="button"
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className={`w-full flex justify-between items-center text-left px-4 py-3 rounded-xl transition-all text-sm font-medium border ${
                isCalendarOpen 
                  ? 'bg-white border-brand-light ring-4 ring-brand-light/10 shadow-sm text-slate-900' 
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/50'
              }`}
            >
              <span className={selectedDate ? 'text-slate-900 font-semibold' : 'text-slate-400'}>
                {displayDate}
              </span>
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </button>

            <div className="absolute top-full left-0 mt-2 w-full z-[105]">
              <PremiumCalendar
                isOpen={isCalendarOpen}
                onClose={() => setIsCalendarOpen(false)}
                selectedDate={selectedDate}
                onDateSelect={(newDate) => {
                  setSelectedDate(newDate || '');
                  if(newDate) setIsCalendarOpen(false);
                }}
              />
            </div>
          </div>

          {/* Location Select Dropdown */}
          <div className="space-y-1.5 relative" ref={locationDropdownRef}>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              2. Select Location
            </label>
            
            <button
              type="button"
              onClick={() => {
                if (selectedDate && !isLoadingLocations && availableLocations.length > 0) {
                  setIsLocationDropdownOpen(!isLocationDropdownOpen);
                }
              }}
              disabled={!selectedDate || isLoadingLocations || availableLocations.length === 0}
              className={`w-full flex justify-between items-center text-left px-4 py-3 rounded-xl transition-all text-sm font-medium border disabled:opacity-50 disabled:cursor-not-allowed ${
                isLocationDropdownOpen 
                  ? 'bg-white border-brand-light ring-4 ring-brand-light/10 shadow-sm' 
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100/50'
              }`}
            >
              <span className={selectedLocation ? 'text-slate-900 font-bold' : 'text-slate-500'}>
                {isLoadingLocations ? 'Scanning ledger...' : 
                 !selectedDate ? 'Awaiting date selection...' : 
                 availableLocations.length === 0 ? 'No deliveries recorded' : 
                 selectedLocation || 'Choose dispatch location...'}
              </span>
              <svg className={`w-4 h-4 transition-transform duration-200 ${isLocationDropdownOpen ? 'rotate-180 text-brand-light' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
            </button>

            {isLocationDropdownOpen && (
              <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 py-2 z-[110] animate-in fade-in slide-in-from-top-2 duration-200 max-h-48 overflow-y-auto">
                {availableLocations.map((loc, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setSelectedLocation(loc);
                      setIsLocationDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors flex items-center justify-between group ${
                      selectedLocation === loc ? 'bg-indigo-50 text-brand-light' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{loc}</span>
                    {selectedLocation === loc && (
                      <svg className="w-4 h-4 text-brand-light" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 items-center rounded-b-2xl">
          <button 
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200/50 rounded-xl transition-colors"
          >
            Cancel
          </button>
          
          <button 
            onClick={handleProceedToDispatch}
            disabled={!selectedDate || !selectedLocation}
            className="px-5 py-2.5 text-sm font-bold text-white bg-brand-dark rounded-xl hover:bg-[#1E1A2F] focus:ring-4 focus:ring-brand-dark/20 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-sm"
          >
            <span>Open Dispatch Board</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default DeliveryExportModal;