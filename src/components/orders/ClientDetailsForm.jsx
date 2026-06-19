// frontend/src/components/orders/ClientDetailsForm.jsx
import React, { useState, useEffect, useRef } from 'react';
import api from '../../config/api'; 

// ✅ PREMIUM FINTECH DATE PICKER COMPONENT 
const FintechDatePicker = ({ name, value, onChange, onKeyDown }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());

  const formatDate = (date) => {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    
    if (month.length < 2) month = '0' + month; 
    if (day.length < 2) day = '0' + day;
    
    return [year, month, day].join('-');
  };

  const handleDateSelect = (day) => {
    const selected = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    onChange({ target: { name, value: formatDate(selected) } });
    setIsOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    setViewDate(today);
    onChange({ target: { name, value: formatDate(today) } });
    setIsOpen(false);
  };

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const dateString = formatDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), i));
    const isSelected = value === dateString;
    const isToday = formatDate(new Date()) === dateString;

    days.push(
      <button
        key={i}
        onClick={(e) => { e.stopPropagation(); handleDateSelect(i); }}
        className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-medium transition-all ${
          isSelected ? 'bg-slate-900 text-white shadow-md' : 
          isToday ? 'text-indigo-600 bg-indigo-50 font-bold' : 
          'text-slate-700 hover:bg-slate-100'
        }`}
      >
        {i}
      </button>
    );
  }

  const parsedValue = new Date(value);
  const displayValue = (value && !isNaN(parsedValue)) 
    ? parsedValue.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) 
    : '';

  return (
    <div 
      className="relative w-full outline-none" 
      tabIndex="0" 
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          if (!isOpen) setIsOpen(true);
          else if (onKeyDown) onKeyDown(e);
        }
      }}
    >
      {isOpen && <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}></div>}
      
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white hover:bg-slate-50 focus:bg-white border border-slate-200/80 rounded-xl text-slate-900 font-medium cursor-pointer flex justify-between items-center shadow-sm transition-all focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10"
      >
        <span className={displayValue ? "text-slate-900" : "text-slate-300"}>{displayValue || "Select Date"}</span>
        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 bg-white border border-slate-100 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)] rounded-[1.5rem] p-5 z-50 w-[280px] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex justify-between items-center mb-5">
            <button onClick={(e) => { e.stopPropagation(); setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1)); }} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="text-[15px] font-bold text-slate-900 tracking-tight">
              {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
            <button onClick={(e) => { e.stopPropagation(); setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1)); }} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 mb-4">
            {days}
          </div>

          <div className="flex justify-between items-center border-t border-slate-100 pt-3">
            <button onClick={(e) => { e.stopPropagation(); onChange({ target: { name, value: '' } }); setIsOpen(false); }} className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">Clear</button>
            <button onClick={(e) => { e.stopPropagation(); handleToday(); }} className="text-xs font-semibold text-slate-900 hover:text-indigo-600 transition-colors">Today</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default function ClientDetailsForm({ companyDetails = {}, onChange, onKeyDown }) {
  const [customers, setCustomers] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Quick Save States
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null

  // ✅ CACHED FETCH LOGIC IMPLEMENTED HERE
  useEffect(() => {
    let isMounted = true; 

    const fetchCustomers = async () => {
      // 1. CHECK CACHE FIRST
      const cachedCustomers = sessionStorage.getItem('ferrari_customers');
      
      if (cachedCustomers) {
        // Use the saved data, NO API CALL MADE!
        if (isMounted) setCustomers(JSON.parse(cachedCustomers));
        return; 
      }

      // 2. IF NO CACHE, FETCH FROM FIREBASE
      try {
        const response = await api.get('/api/customers');
        // Backend returns { success: true, data: [...] }
        if (isMounted && response.data && response.data.success) {
          setCustomers(response.data.data);
          // 3. SAVE TO CACHE FOR NEXT TIME
          sessionStorage.setItem('ferrari_customers', JSON.stringify(response.data.data));
        }
      } catch (error) {
        console.error("Failed to fetch customers:", error);
      }
    };

    fetchCustomers();

    return () => { isMounted = false; };
  }, []); 

  // Handle clicking outside the custom dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle Quick Save API Call
  const handleQuickSave = async () => {
    if (!selectedCustomerId) return;
    setIsSaving(true);
    setSaveStatus(null);
    
    try {
      const response = await api.patch(`/api/customers/${selectedCustomerId}`, {
        phoneNumber: companyDetails.phone,
        deliveryLocation: companyDetails.location
      });
      
      if (response.data && response.data.success) {
        setSaveStatus('success');
        
        // Update local state AND sessionStorage cache so the dropdown reflects the new data immediately
        setCustomers(prev => {
          const updatedCustomers = prev.map(c => 
            c.id === selectedCustomerId 
              ? { ...c, phoneNumber: companyDetails.phone, deliveryLocation: companyDetails.location }
              : c
          );
          sessionStorage.setItem('ferrari_customers', JSON.stringify(updatedCustomers));
          return updatedCustomers;
        });

        // Clear success icon after 3 seconds
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch (error) {
      console.error("Failed to quick save customer details:", error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Shared CSS classes
  const inputClasses = "w-full px-4 py-3 bg-white hover:bg-slate-50 focus:bg-white border border-slate-200/80 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-slate-900 font-medium outline-none transition-all placeholder-slate-300 shadow-sm";
  const labelClasses = "text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block pl-1";

  const displayDate = companyDetails.date 
    ? new Date(companyDetails.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) 
    : 'Auto-Generated';

  // Filter logic for the dropdown
  const filteredCustomers = customers.filter(c => 
    c.customerName.toLowerCase().includes((companyDetails.name || '').toLowerCase())
  );

  return (
    <div className="bg-[#FCFCFD] rounded-[2rem] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] p-8 relative z-30">
      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-6 border-b border-slate-100 pb-4">1. Client Details</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
        <div>
          <label className={labelClasses}>Order Date</label>
          <div 
            className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium flex justify-between items-center shadow-inner cursor-not-allowed" 
            title="Date is securely auto-generated by the system"
          >
            <span className="opacity-80">{displayDate}</span>
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>

        <div>
          <label className={labelClasses}>Delivery Date</label>
          <FintechDatePicker 
            name="deliveryDate"
            value={companyDetails.deliveryDate}
            onChange={onChange}
            onKeyDown={onKeyDown}
          />
        </div>
        
        {/* CUSTOMER DROPDOWN WRAPPER */}
        <div className="relative" ref={dropdownRef}>
          <label className={labelClasses}>Company Name</label>
          <input 
            type="text" 
            name="name" 
            placeholder="Search or enter company..." 
            value={companyDetails.name || ''} 
            onChange={(e) => {
              onChange(e); 
              setIsDropdownOpen(true);
              setSelectedCustomerId(null); // Clear ID if they start typing manually to avoid saving to wrong profile
              setSaveStatus(null);
            }} 
            onFocus={() => setIsDropdownOpen(true)}
            onKeyDown={onKeyDown}
            autoComplete="off"
            className={inputClasses} 
          />
          
          {/* Custom Dropdown List */}
          {isDropdownOpen && customers.length > 0 && (
            <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-slate-100 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)] rounded-xl max-h-60 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map(customer => (
                  <div 
                    key={customer.id}
                    onClick={() => {
                      onChange({ target: { name: 'name', value: customer.customerName } });
                      onChange({ target: { name: 'phone', value: customer.phoneNumber || '' } });
                      onChange({ target: { name: 'location', value: customer.deliveryLocation || '' } });
                      setSelectedCustomerId(customer.id); // Save the selected ID
                      setIsDropdownOpen(false); 
                      setSaveStatus(null);
                    }}
                    className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors flex flex-col group"
                  >
                    <span className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{customer.customerName}</span>
                    <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500 mt-1">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{customer.deliveryLocation || 'No Location'}</span>
                      <span>{customer.phoneNumber || 'No Phone'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-4 text-xs font-medium text-slate-500 text-center">
                  No existing customer found.<br/>
                  <span className="font-normal text-slate-400 mt-1 block">Continue typing to add as a new entry.</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <label className={labelClasses}>Phone Number</label>
          <input 
            type="text" 
            name="phone" 
            placeholder="+971 50 123 4567" 
            value={companyDetails.phone || ''} 
            onChange={onChange}
            onKeyDown={onKeyDown} 
            className={inputClasses} 
          />
        </div>

        <div className="relative">
          <label className={labelClasses}>Delivery Location</label>
          <div className="relative">
            <input 
              type="text" 
              name="location" 
              placeholder="e.g. Business Bay, Dubai" 
              value={companyDetails.location || ''} 
              onChange={onChange} 
              onKeyDown={onKeyDown}
              className={`${inputClasses} ${selectedCustomerId ? 'pr-12' : ''}`} 
            />
            
            {/* Quick Save Button inside Input */}
            {selectedCustomerId && (
              <button
                type="button"
                onClick={handleQuickSave}
                disabled={isSaving}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all shadow-sm ${
                  saveStatus === 'success' ? 'bg-emerald-100 text-emerald-600' :
                  saveStatus === 'error' ? 'bg-red-100 text-red-600' :
                  'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                }`}
                title="Save changes to Customer Directory"
              >
                {isSaving ? (
                  <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : saveStatus === 'success' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                )}
              </button>
            )}
          </div>
          {selectedCustomerId && (
            <p className="text-[10px] text-slate-400 mt-1.5 ml-1 absolute">
              Click icon to sync changes to directory
            </p>
          )}
        </div>
      </div>
    </div>
  );
}