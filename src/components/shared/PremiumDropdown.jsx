import React, { useState, useRef, useEffect } from 'react';

export default function PremiumDropdown({ options, value, onChange, placeholder = "Select Customer" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🛡️ CRITICAL FIX: The "Deep Extract" Array Finder
  // This ensures the dropdown works even if the cache passes a nested API object 
  let safeOptions = [];
  if (Array.isArray(options)) {
    safeOptions = options; // It's already a clean array
  } else if (options?.data && Array.isArray(options.data)) {
    safeOptions = options.data; // It's nested one level { data: [...] }
  } else if (options?.data?.data && Array.isArray(options.data.data)) {
    safeOptions = options.data.data; // It's nested two levels { data: { data: [...] } }
  }
  
  // Filter for the search bar
  const filteredOptions = safeOptions.filter(opt => {
    const name = opt.customer_name || opt.customerName || "";
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="relative font-['Poppins',sans-serif]" ref={dropdownRef}>
      
      {/* Closed State Button - Premium Fintech Styling */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left px-5 py-3.5 bg-white border ${isOpen ? 'border-emerald-500 ring-4 ring-emerald-500/10' : 'border-slate-200/80'} rounded-2xl hover:border-slate-300 hover:shadow-md transition-all duration-300 text-sm flex justify-between items-center shadow-sm outline-none`}
      >
        <span className={value ? "text-slate-900 font-semibold tracking-wide" : "text-slate-400 font-medium tracking-wide"}>
          {value?.customer_name || value?.customerName || placeholder}
        </span>
        <div className={`p-1 rounded-full transition-colors ${isOpen ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400'}`}>
          <svg className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Open State Menu - Curved, Shadowed, with Search */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-3 bg-white/95 backdrop-blur-xl border border-slate-100 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Subtle Search Input Area */}
          <div className="p-3 border-b border-slate-50 bg-slate-50/50">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200/60 rounded-xl text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 placeholder:text-slate-400 transition-all font-medium text-slate-700"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto p-1.5 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-sm font-medium text-slate-400 text-center tracking-wide">
                {safeOptions.length === 0 ? 'No customer data available' : 'No matching customers'}
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = value?.id === option.id;
                return (
                  <button
                    key={option.id || Math.random()}
                    type="button"
                    onClick={() => {
                      onChange(option);
                      setIsOpen(false);
                      setSearchTerm(""); // Reset search on selection
                    }}
                    className={`w-full text-left px-4 py-3 text-sm rounded-xl transition-all duration-200 flex items-center justify-between mb-0.5 last:mb-0
                      ${isSelected 
                        ? 'bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-500/20' 
                        : 'text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900'}`}
                  >
                    <span>{option.customer_name || option.customerName || 'Unnamed Customer'}</span>
                    
                    {/* Checkmark for selected item */}
                    {isSelected && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}