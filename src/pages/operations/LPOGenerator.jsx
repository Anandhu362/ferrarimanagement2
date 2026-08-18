// frontend/src/pages/operations/LPOGenerator.jsx
import React, { useState, useEffect, useRef } from 'react';
import api from '../../config/api';
import { generateLPOPdf } from '../../utils/pdfGeneratorService'; 
import RecentLPOLogs from '../../components/operations/RecentLPOLogs'; 
import { fetchWithCache } from '../../utils/cacheUtils'; 
import LPOItemTypeahead from '../../components/operations/LPOItemTypeahead'; 

// --- HELPER FUNCTIONS ---
const generateItemId = () => `ITEM-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const numberToWordsAED = (num) => {
  if (num === 0) return 'ZERO AED ONLY';
  const a = ['', 'ONE ', 'TWO ', 'THREE ', 'FOUR ', 'FIVE ', 'SIX ', 'SEVEN ', 'EIGHT ', 'NINE ', 'TEN ', 'ELEVEN ', 'TWELVE ', 'THIRTEEN ', 'FOURTEEN ', 'FIFTEEN ', 'SIXTEEN ', 'SEVENTEEN ', 'EIGHTEEN ', 'NINETEEN '];
  const b = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
  
  const inWords = (n) => {
    if ((n = n.toString()).length > 9) return 'OVERFLOW';
    n = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return; 
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'CRORE ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'LAKH ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'THOUSAND ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'HUNDRED ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'AND ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str.trim();
  };

  const parts = parseFloat(num).toFixed(2).split('.');
  const dirhams = parseInt(parts[0], 10);
  const fils = parseInt(parts[1], 10);

  let result = `${inWords(dirhams)} DIRHAMS`;
  if (fils > 0) {
    result += ` AND ${inWords(fils)} FILS`;
  }
  return result + ' ONLY';
};

export default function LPOGenerator() {
  // --- STATE ---
  const [vendorData, setVendorData] = useState({
    deliveryDate: new Date().toISOString().split('T')[0],
    deliveryTime: 'MORNING', 
    deliveryAddress: 'Al Fajar Al Sadiq Gen Trdg BR 1\nABUDHABI- MUSSAHFA\nUnited Arab Emirates',
    purchaseOrganization: 'Al Fajar Al Sadiq Gen Trdg LLc BR 1',
    vendorName: '',
    payeeDetails: '',
    paymentTerms: '60 days (SOA Date)'
  });

  const [footerData, setFooterData] = useState({
    remarks: '',
    preparedBy: ''
  });

  const [items, setItems] = useState([
    { id: generateItemId(), description: '', kg: '50', qty: '', uom: 'BAGS', uomConversion: '1 BAG=50 KG', purchasePrice: '', total: 0 }
  ]);

  const [totals, setTotals] = useState({ subTotal: 0, vat: 0, netAmount: 0 });
  const [amountInWords, setAmountInWords] = useState('ZERO AED ONLY');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: 'success', message: '' });
  const submitLock = useRef(false);

  // Trigger to refresh the logs component automatically
  const [refreshLogs, setRefreshLogs] = useState(0);

  // Custom UI State
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const timeOptions = ['MORNING', 'AFTERNOON', 'EVENING'];

  // Master Inventory State for the Typeahead Search
  const [masterInventory, setMasterInventory] = useState([]);

  // ✅ NEW: Saved Vendors State for Typeahead Auto-fill
  const [savedVendors, setSavedVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [vendorActiveIndex, setVendorActiveIndex] = useState(-1);
  
  const payeeRef = useRef(null);
  const vendorListRef = useRef(null);

  // --- STYLES ---
  const baseInputClasses = "w-full px-4 py-3 bg-white hover:bg-slate-50 focus:bg-white border border-slate-200/80 focus:border-brand-light focus:ring-4 focus:ring-brand-light/10 rounded-xl text-slate-900 font-medium outline-none transition-all placeholder-slate-300 shadow-sm";
  const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";

  // Reset vendor active index when filtered list updates
  useEffect(() => {
    setVendorActiveIndex(-1);
  }, [filteredVendors]);

  // Scroll active vendor item into view
  useEffect(() => {
    if (showVendorDropdown && vendorActiveIndex >= 0 && vendorListRef.current) {
      const activeEl = vendorListRef.current.children[vendorActiveIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [vendorActiveIndex, showVendorDropdown]);

  // --- EFFECTS ---
  // Load Master Inventory Data on Mount
  useEffect(() => {
    const loadInventory = async () => {
      try {
        const response = await fetchWithCache('ferrari_inventory_cache', () => api.get('/api/inventory'), 60);
        if (response.data) {
          setMasterInventory(response.data);
        }
      } catch (error) {
        console.error("Failed to load inventory for typeahead:", error);
      }
    };
    loadInventory();
  }, []);

  // ✅ NEW: Load Saved Vendors on Mount
  useEffect(() => {
    const loadVendors = async () => {
      try {
        const response = await api.get('/api/vendors');
        if (response.data && response.data.data) {
          setSavedVendors(response.data.data);
        }
      } catch (error) {
        console.error("Failed to load vendors:", error);
      }
    };
    loadVendors();
  }, []);

  // Subtotal recalculation effect
  useEffect(() => {
    let sub = 0;
    items.forEach(item => {
      sub += item.total;
    });
    const vatAmt = parseFloat((sub * 0.05).toFixed(2));
    const net = parseFloat((sub + vatAmt).toFixed(2));

    setTotals({ subTotal: sub, vat: vatAmt, netAmount: net });
    setAmountInWords(numberToWordsAED(net));
  }, [items]);

  // --- HANDLERS ---
  const handleVendorChange = (field, value) => setVendorData(prev => ({ ...prev, [field]: value }));
  const handleFooterChange = (field, value) => setFooterData(prev => ({ ...prev, [field]: value }));
  
  // ✅ NEW: Vendor Search & Auto-Fill Handlers
  const handleVendorSearch = (e) => {
    const value = e.target.value;
    handleVendorChange('vendorName', value);

    if (value.trim().length > 0) {
      const upperValue = value.toUpperCase();
      const matches = savedVendors.filter(v => 
        v.vendorName?.toUpperCase().includes(upperValue) || 
        v.vendor_id?.toUpperCase().includes(upperValue)
      );
      setFilteredVendors(matches);
      setShowVendorDropdown(true);
    } else {
      setShowVendorDropdown(false);
    }
  };

  const handleVendorSelect = (vendor) => {
    handleVendorChange('vendorName', vendor.vendorName);
    handleVendorChange('payeeDetails', vendor.payeeDetails);
    setShowVendorDropdown(false);
    setVendorActiveIndex(-1);

    // Auto-shift focus to Payee Details textarea
    setTimeout(() => {
      if (payeeRef.current) {
        payeeRef.current.focus();
        payeeRef.current.select();
      }
    }, 50);
  };

  const handleItemChange = (id, field, value) => {
    let cleanValue = value;
    if (['kg', 'qty', 'purchasePrice'].includes(field)) {
      if (parseFloat(value) < 0) cleanValue = '0';
    }

    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: cleanValue };
        
        const qty = Math.max(0, parseFloat(updatedItem.qty) || 0);
        const price = Math.max(0, parseFloat(updatedItem.purchasePrice) || 0);
        updatedItem.total = parseFloat((qty * price).toFixed(2));
        
        if (field === 'kg' && updatedItem.uom === 'BAGS') {
          updatedItem.uomConversion = `1 BAG=${cleanValue} KG`;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const handleProductSelect = (rowId, product) => {
    const kgMatch = product.weight?.match(/\d+/);
    const kgVal = kgMatch ? kgMatch[0] : '50';
    const priceVal = product.price ? product.price.toString() : '';

    setItems(items.map(item => {
      if (item.id === rowId) {
        const updatedItem = { 
          ...item, 
          description: product.product_name,
          kg: kgVal,
          purchasePrice: priceVal,
          uomConversion: `1 BAG=${kgVal} KG`
        };
        
        const qty = Math.max(0, parseFloat(updatedItem.qty) || 0);
        updatedItem.total = parseFloat((qty * Math.max(0, parseFloat(priceVal || 0))).toFixed(2));
        
        return updatedItem;
      }
      return item;
    }));
  };

  const addItemRow = () => setItems([...items, { id: generateItemId(), description: '', kg: '50', qty: '', uom: 'BAGS', uomConversion: '1 BAG=50 KG', purchasePrice: '', total: 0 }]);
  
  const removeItemRow = (id) => {
    if (items.length > 1) setItems(items.filter(item => item.id !== id));
  };

  const handleVendorKeyDown = (e) => {
    if (showVendorDropdown && filteredVendors.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setVendorActiveIndex(prev => (prev < filteredVendors.length - 1 ? prev + 1 : prev));
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setVendorActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
        return;
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (vendorActiveIndex >= 0 && filteredVendors[vendorActiveIndex]) {
          e.preventDefault();
          handleVendorSelect(filteredVendors[vendorActiveIndex]);
          return;
        }
      } else if (e.key === 'Escape') {
        setShowVendorDropdown(false);
        return;
      }
    }

    handleKeyDown(e);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const isTextInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
      if (!isTextInput) return;

      e.preventDefault();
      const container = e.target.closest('.lpo-container');
      if (container) {
        const inputs = Array.from(
          container.querySelectorAll('input[type="text"]:not([disabled]):not([readonly]), input[type="number"]:not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly])')
        );
        const currentIndex = inputs.indexOf(e.target);
        if (currentIndex > -1 && currentIndex < inputs.length - 1) {
          inputs[currentIndex + 1].focus();
        } else if (currentIndex === inputs.length - 1) {
          // Pressing Enter on the last input auto-adds a new row and focuses its item search input
          addItemRow();
          setTimeout(() => {
            const updatedInputs = Array.from(
              container.querySelectorAll('input[type="text"]:not([disabled]):not([readonly]), input[type="number"]:not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly])')
            );
            if (updatedInputs.length > inputs.length) {
              updatedInputs[currentIndex + 1].focus();
            }
          }, 100);
        }
      }
    }
  };

  const handleDateSelect = (year, month, day) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    handleVendorChange('deliveryDate', `${year}-${m}-${d}`);
    setIsCalendarOpen(false);
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  };

  const isFormValid = () => {
    const isVendorValid = vendorData.vendorName && vendorData.deliveryAddress && vendorData.payeeDetails;
    const isFooterValid = footerData.preparedBy;
    const areItemsValid = items.every(i => i.description && parseFloat(i.qty) > 0 && parseFloat(i.purchasePrice) > 0);
    return isVendorValid && isFooterValid && areItemsValid && totals.netAmount > 0;
  };

  const handleSubmit = async () => {
    if (!isFormValid() || submitLock.current) return;
    
    submitLock.current = true;
    setIsSubmitting(true);
    
    try {
      const activeBranch = localStorage.getItem('active_branch');
      if (!activeBranch) throw new Error('No active branch selected.');

      const payload = {
        branchId: activeBranch,
        ...vendorData,
        ...footerData,
        items,
        amountInWords
      };

      let response;
      
      try {
        response = await api.post('/api/lpo/generate', payload);
      } catch (networkError) {
        if (!networkError.response) {
          console.warn("Network connection dropped. Retrying LPO sync...");
          await new Promise(res => setTimeout(res, 1500)); 
          response = await api.post('/api/lpo/generate', payload);
        } else {
          throw networkError;
        }
      }
      
      if (response.data.success) {
        const generatedLPO = response.data.data;
        
        try {
          const fullPdfPayload = {
              ...payload,
              orderNo: generatedLPO.orderNo,
              orderDate: generatedLPO.orderDate,
              subTotal: generatedLPO.subTotal,
              vatAmount: generatedLPO.vatAmount,
              netAmount: generatedLPO.netAmount
          };
          await generateLPOPdf(fullPdfPayload);
          setModal({ isOpen: true, type: 'success', message: `LPO ${generatedLPO.orderNo} generated, synced, and downloaded successfully.` });
        } catch (pdfError) {
          console.error("PDF Generation blocked:", pdfError);
          setModal({ isOpen: true, type: 'success', message: `LPO ${generatedLPO.orderNo} was successfully saved to the database, but the browser blocked the PDF download.` });
        }
        
        setItems([{ id: generateItemId(), description: '', kg: '50', qty: '', uom: 'BAGS', uomConversion: '1 BAG=50 KG', purchasePrice: '', total: 0 }]);
        setTotals({ subTotal: 0, vat: 0, netAmount: 0 });
        setAmountInWords('ZERO AED ONLY');
        setRefreshLogs(prev => prev + 1);

      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      console.error(err);
      setModal({ isOpen: true, type: 'error', message: err.response?.data?.message || err.message || 'Failed to generate LPO. Please check your network connection.' });
    } finally {
      submitLock.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-12 relative lpo-container">
      
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-[1.75rem] font-semibold text-slate-900 tracking-tight leading-tight">LPO Generator</h2>
          <p className="text-slate-500 text-sm mt-1.5 font-light tracking-wide">Create, calculate, and sync Local Purchase Orders.</p>
        </div>
        
        <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-6 z-20 relative">
           <div>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Net LPO Amount</p>
             <p className="text-2xl font-bold text-emerald-600 tracking-tight">
               <span className="text-sm font-medium text-emerald-600/50 mr-1">AED</span>
               {totals.netAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}
             </p>
           </div>
        </div>
      </div>

      <div className="bg-[#FCFCFD] rounded-[2rem] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden relative z-10">
        
        {/* SECTION 1: Vendor & Logistics */}
        <div className="p-8 border-b border-slate-200/60">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-6">1. Logistics & Vendor Data</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className={`relative ${isCalendarOpen ? 'z-[100]' : 'z-10'}`}>
              <label className={labelClasses}>Delivery Date</label>
              <button 
                type="button"
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                className={`${baseInputClasses} flex justify-between items-center cursor-pointer text-left`}
              >
                <span>{formatDateForDisplay(vendorData.deliveryDate)}</span>
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </button>

              {isCalendarOpen && (
                <>
                  <div className="fixed inset-0 z-[110]" onClick={() => setIsCalendarOpen(false)}></div>
                  <div className="absolute top-[calc(100%+8px)] left-0 p-5 bg-white rounded-[1.5rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100/80 z-[120] w-[280px] animate-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-5">
                      <button type="button" onClick={(e) => { e.stopPropagation(); setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1)); }} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <div className="text-[15px] font-bold text-slate-900">{calendarViewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1)); }} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500">
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
                        const isSelected = vendorData.deliveryDate === dateString;
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleDateSelect(calendarViewDate.getFullYear(), calendarViewDate.getMonth(), day); }}
                            className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-medium transition-all ${isSelected ? 'bg-slate-900 text-white shadow-md' : 'text-slate-700 hover:bg-slate-100'}`}
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

            <div className={`relative ${isDropdownOpen ? 'z-[100]' : 'z-10'}`}>
              <label className={labelClasses}>Delivery Time</label>
              <button 
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`${baseInputClasses} flex justify-between items-center cursor-pointer text-left`}
              >
                <span className="capitalize">{vendorData.deliveryTime.toLowerCase()}</span>
                <svg className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
              </button>
              
              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-[110]" onClick={() => setIsDropdownOpen(false)}></div>
                  <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white rounded-xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.15)] border border-slate-100/80 z-[120] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {timeOptions.map((option) => (
                      <div 
                        key={option} 
                        onClick={() => { handleVendorChange('deliveryTime', option); setIsDropdownOpen(false); }}
                        className={`px-4 py-3 cursor-pointer text-sm font-medium transition-colors ${vendorData.deliveryTime === option ? 'bg-brand-light/10 text-brand-dark' : 'text-slate-700 hover:bg-slate-50'}`}
                      >
                        {option.charAt(0) + option.slice(1).toLowerCase()}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div>
              <label className={labelClasses}>Payment Terms</label>
              <input type="text" onKeyDown={handleKeyDown} value={vendorData.paymentTerms} onChange={e => handleVendorChange('paymentTerms', e.target.value)} className={baseInputClasses} placeholder="e.g., 60 days (SOA Date)" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* ✅ UPDATED: Dynamic stacking context for Vendor Name typeahead */}
            <div className={`relative ${showVendorDropdown ? 'z-[100]' : 'z-10'}`}>
              <label className={labelClasses}>Vendor Name & Address</label>
              <textarea 
                rows="3" 
                onKeyDown={handleVendorKeyDown} 
                value={vendorData.vendorName} 
                onChange={handleVendorSearch}
                onFocus={() => {
                  if (vendorData.vendorName && filteredVendors.length > 0) setShowVendorDropdown(true);
                }}
                onBlur={() => setTimeout(() => setShowVendorDropdown(false), 200)}
                className={`${baseInputClasses} resize-none uppercase`} 
                placeholder="AL GHURAIR FOODS LLC&#10;DUBAI, U.A.E" 
              />
              
              {showVendorDropdown && filteredVendors.length > 0 && (
                <div 
                  ref={vendorListRef}
                  className="absolute top-[calc(100%+4px)] left-0 w-full bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-slate-100 z-[120] max-h-56 overflow-y-auto animate-in fade-in zoom-in-95"
                >
                  {filteredVendors.map((vendor, index) => (
                    <div 
                      key={vendor.vendor_id}
                      onClick={() => handleVendorSelect(vendor)}
                      className={`px-4 py-3 cursor-pointer border-b border-slate-50 last:border-0 transition-colors ${
                        vendorActiveIndex === index 
                          ? 'bg-brand-light/10 border-l-4 border-l-brand-dark' 
                          : 'hover:bg-slate-50 border-l-4 border-transparent'
                      }`}
                    >
                      <div className={`text-sm font-bold ${vendorActiveIndex === index ? 'text-brand-dark' : 'text-slate-800'}`}>
                        {vendor.vendorName}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 truncate">{vendor.payeeDetails}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className={labelClasses}>Payee Details</label>
              <textarea 
                ref={payeeRef}
                rows="3" 
                onKeyDown={handleKeyDown} 
                value={vendorData.payeeDetails} 
                onChange={e => handleVendorChange('payeeDetails', e.target.value)} 
                className={`${baseInputClasses} resize-none uppercase`} 
                placeholder="AL GHURAIR FOODS LLC&#10;DUBAI, U.A.E" 
              />
            </div>
            <div>
              <label className={labelClasses}>Purchase Organization</label>
              <textarea rows="2" onKeyDown={handleKeyDown} value={vendorData.purchaseOrganization} onChange={e => handleVendorChange('purchaseOrganization', e.target.value)} className={`${baseInputClasses} resize-none uppercase`} />
            </div>
            <div>
              <label className={labelClasses}>Delivery Address</label>
              <textarea rows="2" onKeyDown={handleKeyDown} value={vendorData.deliveryAddress} onChange={e => handleVendorChange('deliveryAddress', e.target.value)} className={`${baseInputClasses} resize-none uppercase`} />
            </div>
          </div>
        </div>

        {/* SECTION 2: Items Grid */}
        <div className="p-8 border-b border-slate-200/60 bg-slate-50/30">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">2. Item Details</h3>
          </div>

          <div className="space-y-3">
            <div className="hidden lg:flex gap-4 px-2">
              <div className="w-[30%]"><span className={labelClasses}>Item Description</span></div>
              <div className="w-[10%]"><span className={labelClasses}>KG</span></div>
              <div className="w-[10%]"><span className={labelClasses}>QTY</span></div>
              <div className="w-[10%]"><span className={labelClasses}>UOM</span></div>
              <div className="w-[15%]"><span className={labelClasses}>Conversion</span></div>
              <div className="w-[12%]"><span className={labelClasses}>Price (AED)</span></div>
              <div className="w-[13%] text-right"><span className={labelClasses}>Total (AED)</span></div>
              <div className="w-10"></div>
            </div>

            {items.map((item) => (
              <div key={item.id} className="flex flex-col lg:flex-row gap-4 items-start lg:items-center bg-white p-4 lg:p-0 rounded-2xl lg:bg-transparent lg:border-none border border-slate-100 shadow-sm lg:shadow-none">
                
                <LPOItemTypeahead
                  value={item.description}
                  onChange={(val) => handleItemChange(item.id, 'description', val)}
                  onSelect={(product) => handleProductSelect(item.id, product)}
                  inventory={masterInventory}
                  baseInputClasses={baseInputClasses}
                  parentOnKeyDown={handleKeyDown}
                />

                <div className="w-full lg:w-[10%] flex gap-2">
                  <span className="lg:hidden text-xs text-slate-400 self-center w-12">KG:</span>
                  <input type="number" min="0" onKeyDown={handleKeyDown} placeholder="50" value={item.kg} onChange={e => handleItemChange(item.id, 'kg', e.target.value)} className={baseInputClasses} />
                </div>
                <div className="w-full lg:w-[10%] flex gap-2">
                  <span className="lg:hidden text-xs text-slate-400 self-center w-12">QTY:</span>
                  <input type="number" min="0" onKeyDown={handleKeyDown} placeholder="0" value={item.qty} onChange={e => handleItemChange(item.id, 'qty', e.target.value)} className={baseInputClasses} />
                </div>
                <div className="w-full lg:w-[10%] flex gap-2">
                  <span className="lg:hidden text-xs text-slate-400 self-center w-12">UOM:</span>
                  <input type="text" onKeyDown={handleKeyDown} value={item.uom} onChange={e => handleItemChange(item.id, 'uom', e.target.value)} className={baseInputClasses} readOnly />
                </div>
                <div className="w-full lg:w-[15%] flex gap-2">
                  <span className="lg:hidden text-xs text-slate-400 self-center w-12">Conv:</span>
                  <input type="text" onKeyDown={handleKeyDown} value={item.uomConversion} className={`${baseInputClasses} bg-slate-50 text-slate-500`} readOnly />
                </div>
                <div className="w-full lg:w-[12%] flex gap-2">
                  <span className="lg:hidden text-xs text-slate-400 self-center w-12">Price:</span>
                  <input type="number" min="0" step="0.01" onKeyDown={handleKeyDown} placeholder="0.00" value={item.purchasePrice} onChange={e => handleItemChange(item.id, 'purchasePrice', e.target.value)} className={baseInputClasses} />
                </div>
                <div className="w-full lg:w-[13%] flex justify-end">
                  <span className="lg:hidden text-xs text-slate-400 self-center mr-auto">Total:</span>
                  <div className="px-4 py-3 text-slate-800 font-bold bg-slate-50 rounded-xl border border-slate-100 w-full text-right">
                    {item.total.toLocaleString('en-US', {minimumFractionDigits: 2})}
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => removeItemRow(item.id)} 
                  disabled={items.length === 1}
                  className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-slate-300 hover:bg-red-100 hover:text-red-600 transition-all duration-200 disabled:opacity-30 lg:mt-0 mt-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}
            
            <div className="pt-4">
              <button type="button" onClick={addItemRow} className="flex items-center gap-2 text-sm font-semibold text-brand-dark hover:text-brand-light bg-white px-5 py-2.5 border border-slate-200 hover:border-brand-light/30 rounded-full shadow-sm hover:shadow-md transition-all duration-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                Add Item Row
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 3: Summary & Footer */}
        <div className="p-8 bg-white">
          <div className="flex flex-col lg:flex-row justify-between gap-12">
            <div className="flex-1 space-y-5">
              <div>
                <label className={labelClasses}>Amount In Words</label>
                <div className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 font-semibold tracking-wide uppercase text-sm">
                  {amountInWords}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClasses}>Prepared By</label>
                  <input type="text" onKeyDown={handleKeyDown} placeholder="e.g., NASEEM" value={footerData.preparedBy} onChange={e => handleFooterChange('preparedBy', e.target.value)} className={`${baseInputClasses} uppercase`} />
                </div>
                <div>
                  <label className={labelClasses}>Remarks (Optional)</label>
                  <input type="text" onKeyDown={handleKeyDown} value={footerData.remarks} onChange={e => handleFooterChange('remarks', e.target.value)} className={baseInputClasses} />
                </div>
              </div>
            </div>

            <div className="w-full lg:w-[350px] bg-slate-50/80 rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-end">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-500">Subtotal</span>
                  <span className="text-base font-semibold text-slate-800">{totals.subTotal.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-500">VAT 5%</span>
                  <span className="text-base font-semibold text-slate-800">{totals.vat.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                </div>
                <div className="pt-4 border-t border-slate-200/80 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-900 uppercase tracking-wider">Net Amount</span>
                  <span className="text-xl font-bold text-emerald-600">AED {totals.netAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 flex justify-end">
            <button 
              type="button"
              onClick={handleSubmit} 
              disabled={isSubmitting || !isFormValid()}
              className={`px-10 py-4 rounded-full font-semibold shadow-lg transition-all duration-300 flex items-center gap-2 ${
                isFormValid() && !isSubmitting
                  ? 'bg-brand-dark text-white hover:bg-brand-light hover:-translate-y-0.5 hover:shadow-xl' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-70'
              }`}
            >
              {isSubmitting ? 'Syncing & Generating...' : 'Generate & Sync LPO →'}
            </button>
          </div>
        </div>
      </div>

      <RecentLPOLogs refreshTrigger={refreshLogs} />

      {/* Success/Error Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" onClick={() => setModal({ ...modal, isOpen: false })}></div>
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full relative z-50 shadow-[0_20px_60px_rgb(0,0,0,0.08)] animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 ${modal.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {modal.type === 'success' ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />}
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2 tracking-tight">{modal.type === 'success' ? 'LPO Synced' : 'Sync Failed'}</h3>
              <p className="text-slate-500 text-sm font-light leading-relaxed mb-8">{modal.message}</p>
              <button type="button" onClick={() => setModal({ ...modal, isOpen: false })} className="w-full py-3.5 bg-slate-900 text-white rounded-full font-medium hover:bg-slate-800 transition-colors shadow-md hover:shadow-lg">
                Okay, got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}