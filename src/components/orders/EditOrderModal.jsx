// frontend/src/components/orders/EditOrderModal.jsx
import React, { useState, useEffect } from 'react';
import api from '../../config/api';

// ✅ Reusable Fintech Dropdown specifically for the Modal
const FintechSelect = ({ name, value, options, onChange, placeholder, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className={`relative w-full outline-none ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`} 
      tabIndex={disabled ? "-1" : "0"} 
      onBlur={() => setIsOpen(false)}
    >
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200/80 rounded-xl text-slate-900 font-medium flex justify-between items-center shadow-sm transition-all focus-within:border-brand-light focus-within:ring-4 focus-within:ring-brand-light/10 ${disabled ? 'bg-slate-100' : 'cursor-pointer'}`}
      >
        <span className={value ? "text-slate-900" : "text-slate-400"}>{value || placeholder}</span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-brand-dark' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
      </div>

      {isOpen && !disabled && (
        <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-slate-100 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)] rounded-2xl z-[300] overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-48 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200">
            {options.length === 0 ? (
               <div className="px-5 py-3 text-sm text-slate-400 italic text-center">No options available</div>
            ) : (
               options.map(opt => (
                 <div
                   key={opt}
                   onClick={(e) => {
                     e.stopPropagation();
                     onChange({ target: { name, value: opt } });
                     setIsOpen(false);
                   }}
                   className={`px-5 py-3 cursor-pointer text-sm font-medium transition-colors ${value === opt ? 'bg-brand-light/10 text-brand-dark' : 'text-slate-700 hover:bg-slate-50'}`}
                 >
                   {opt}
                 </div>
               ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ✅ PREMIUM FINTECH DATE PICKER COMPONENT (For Delivery Date Editing)
const FintechDatePicker = ({ name, value, onChange, disabled }) => {
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
        type="button"
        onClick={(e) => { e.stopPropagation(); handleDateSelect(i); }}
        className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-medium transition-all ${
          isSelected ? 'bg-slate-900 text-white shadow-md' : 
          isToday ? 'text-brand-dark bg-brand-light/10 font-bold' : 
          'text-slate-700 hover:bg-slate-100'
        }`}
      >
        {i}
      </button>
    );
  }

  const displayValue = value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '';

  return (
    <div 
      className={`relative w-full outline-none ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      tabIndex={disabled ? "-1" : "0"}
      onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) {
             setIsOpen(false);
          }
      }}
    >
      {isOpen && <div className="fixed inset-0 z-[250]" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}></div>}
      
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200/80 rounded-xl text-slate-900 font-medium flex justify-between items-center shadow-sm transition-all focus-within:border-brand-light focus-within:ring-4 focus-within:ring-brand-light/10 ${disabled ? 'bg-slate-100 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className={displayValue ? "text-slate-900" : "text-slate-400"}>{displayValue || "Select Date"}</span>
        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
      </div>

      {isOpen && !disabled && (
        <div className="absolute top-[calc(100%+8px)] left-0 bg-white border border-slate-100 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)] rounded-[1.5rem] p-5 z-[300] w-[280px] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex justify-between items-center mb-5">
            <button type="button" onClick={(e) => { e.stopPropagation(); setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1)); }} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="text-[15px] font-bold text-slate-900 tracking-tight">
              {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
            <button type="button" onClick={(e) => { e.stopPropagation(); setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1)); }} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
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
            <button type="button" onClick={(e) => { e.stopPropagation(); onChange({ target: { name, value: '' } }); setIsOpen(false); }} className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">Clear</button>
            <button type="button" onClick={(e) => { e.stopPropagation(); handleToday(); }} className="text-xs font-semibold text-slate-900 hover:text-brand-dark transition-colors">Today</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default function EditOrderModal({ isOpen, onClose, order, onRefresh }) {
  const [liveInventory, setLiveInventory] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    product: '',
    weight: '',
    qty: '',
    companyName: '',
    phone: '',
    location: '',
    date: '',
    deliveryDate: '' // ✅ Added new payload field
  });

  const inputClasses = "w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200/80 focus:border-brand-light focus:ring-4 focus:ring-brand-light/10 rounded-xl text-slate-900 font-medium outline-none transition-all placeholder-slate-400 shadow-sm";
  const labelClasses = "text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block pl-1";

  // 1. Fetch Inventory & Mount Data
  useEffect(() => {
    if (isOpen && order) {
      setFormData({
        product: order.product || '',
        weight: order.weight || '',
        qty: order.qty || '',
        companyName: order.companyName || '',
        phone: order.phone || '',
        location: order.location || '',
        date: order.date || '',
        deliveryDate: order.deliveryDate || '' // ✅ Mount existing delivery date
      });
      setError('');

      const fetchInventory = async () => {
        try {
          const response = await api.get('/api/inventory');
          if (response.data) setLiveInventory(response.data);
        } catch (err) {
          console.error("Failed to fetch inventory for modal", err);
        }
      };
      fetchInventory();
    }
  }, [isOpen, order]);

  if (!isOpen || !order) return null;

  // 2. Dynamic Dropdown Logic
  const availableProducts = [...new Set(liveInventory.map(item => item.product_name))].filter(Boolean);
  
  let availableWeights = [];
  if (formData.product) {
    availableWeights = [...new Set(
      liveInventory
        .filter(item => item.product_name === formData.product)
        .map(item => item.weight)
    )].filter(Boolean);
  }

  // 3. Smart Maximum Quantity Calculator
  const getMaxAllowedQty = () => {
    if (!formData.product || !formData.weight) return 0;

    const dbItem = liveInventory.find(i => i.product_name === formData.product && i.weight === formData.weight);
    let masterStock = dbItem ? parseInt(dbItem.qty, 10) : 0;

    // If they are editing the same product/weight, they are allowed to use the stock already reserved for this order
    if (order.product === formData.product && order.weight === formData.weight) {
      masterStock += parseInt(order.qty, 10);
    }

    return masterStock;
  };

  const maxAllowed = getMaxAllowedQty();

  // 4. Input Handlers
  const handleTextChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;

    if (name === 'product') {
      const validWeightsForNewProduct = liveInventory
        .filter(i => i.product_name === value)
        .map(i => i.weight);
        
      if (formData.weight && !validWeightsForNewProduct.includes(formData.weight)) {
         setFormData({ ...formData, product: value, weight: '', qty: '' });
         return;
      }
      setFormData({ ...formData, product: value, qty: '' }); 
      return;
    }

    if (name === 'weight') {
       setFormData({ ...formData, weight: value, qty: '' });
       return;
    }

    // STRICT Auto-Capping Validation
    if (name === 'qty') {
      if (value === '') {
        setFormData({ ...formData, qty: '' });
        return;
      }

      let numericVal = parseInt(value, 10);
      
      if (!isNaN(numericVal)) {
        if (numericVal > maxAllowed) {
          numericVal = maxAllowed; // Auto-cap to maximum mathematically possible
        }
        setFormData({ ...formData, qty: numericVal });
      }
      return;
    }
  };

  // 5. Submit Update Transaction
  const handleSave = async () => {
    setError('');
    
    if (!formData.product || !formData.weight || !formData.qty) {
      setError('Product, weight, and valid quantity are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { ...formData };
      const response = await api.put(`/api/orders/${order.id}`, payload);
      
      if (response.data.success) {
        onRefresh(); // Trigger table reload
        onClose();   // Close modal
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order. Check stock availability.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={!isSubmitting ? onClose : undefined}
      ></div>

      {/* Modal Box */}
      <div className="bg-white rounded-[2rem] w-full max-w-4xl relative z-10 shadow-[0_20px_60px_rgb(0,0,0,0.12)] flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Edit Order Record</h2>
            <p className="text-xs text-slate-500 mt-1 font-mono">{order.id}</p>
          </div>
          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-8 overflow-y-auto overflow-x-hidden custom-scrollbar">
          
          {error && (
            <div className="mb-6 bg-rose-50 text-rose-600 px-5 py-4 rounded-xl text-sm font-medium border border-rose-100 flex items-start gap-3">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            
            {/* Left Col: Client Details */}
            <div className="space-y-5">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest border-b border-slate-100 pb-3">Client Details</h3>
              
              <div>
                <label className={labelClasses}>Company Name</label>
                <input 
                  type="text" name="companyName" value={formData.companyName} onChange={handleTextChange} className={inputClasses}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Phone</label>
                  <input type="text" name="phone" value={formData.phone} onChange={handleTextChange} className={inputClasses} />
                </div>
                <div>
                  <label className={labelClasses}>Delivery Location</label>
                  <input type="text" name="location" value={formData.location} onChange={handleTextChange} className={inputClasses} />
                </div>
              </div>

              {/* ✅ Dates Layout Update */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Order Date (Locked)</label>
                  <div className="w-full px-4 py-3 bg-slate-100 border border-slate-200/80 rounded-xl text-slate-500 font-medium flex justify-between items-center shadow-inner cursor-not-allowed">
                    <span className="opacity-80">
                      {formData.date ? new Date(formData.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '—'}
                    </span>
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <label className={labelClasses}>Delivery Date</label>
                  <FintechDatePicker 
                    name="deliveryDate" 
                    value={formData.deliveryDate} 
                    onChange={handleTextChange} 
                  />
                </div>
              </div>
            </div>

            {/* Right Col: Product & Math */}
            <div className="space-y-5">
              <h3 className="text-sm font-bold text-brand-dark uppercase tracking-widest border-b border-brand-light/20 pb-3">Product Reconciliation</h3>
              
              <div>
                <label className={labelClasses}>Product Selection</label>
                <FintechSelect 
                  name="product" value={formData.product} options={availableProducts} onChange={handleItemChange} placeholder="Loading..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Weight</label>
                  <FintechSelect 
                    name="weight" value={formData.weight} options={availableWeights} onChange={handleItemChange} placeholder="--" disabled={!formData.product}
                  />
                </div>
                <div>
                  <label className={labelClasses}>
                    Qty <span className="text-brand-light lowercase font-medium ml-1">(Max: {maxAllowed})</span>
                  </label>
                  <input 
                    type="number" name="qty" min="1" max={maxAllowed} value={formData.qty} onChange={handleItemChange} 
                    className={`${inputClasses} font-bold text-brand-dark ${formData.qty == maxAllowed && maxAllowed > 0 ? 'bg-amber-50 border-amber-200 focus:border-amber-400' : ''}`} 
                    disabled={!formData.weight}
                  />
                </div>
              </div>

              {/* Math Helper UI */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mt-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Original Qty:</span>
                  <span className="text-slate-700 font-bold">{order.product === formData.product && order.weight === formData.weight ? order.qty : 0}</span>
                </div>
                <div className="flex justify-between items-center text-xs mt-2">
                  <span className="text-slate-500 font-medium">New Request:</span>
                  <span className="text-brand-dark font-bold">{formData.qty || 0}</span>
                </div>
                <div className="h-px bg-slate-200 my-2"></div>
                <div className="flex justify-between items-center text-[11px] uppercase tracking-widest font-bold">
                  <span className="text-slate-400">Ledger Impact:</span>
                  {(() => {
                    if (order.product !== formData.product || order.weight !== formData.weight) {
                      return <span className="text-amber-500">Full Swap Required</span>;
                    }
                    const diff = (parseInt(formData.qty) || 0) - parseInt(order.qty);
                    if (diff === 0) return <span className="text-slate-400">No Change</span>;
                    if (diff > 0) return <span className="text-rose-500">-{Math.abs(diff)} Stock Deduction</span>;
                    return <span className="text-emerald-500">+{Math.abs(diff)} Stock Refund</span>;
                  })()}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 shrink-0 rounded-b-[2rem]">
          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSubmitting || !formData.product || !formData.weight || !formData.qty}
            className={`px-8 py-3 rounded-xl font-bold tracking-wide transition-all shadow-sm flex items-center gap-2 ${
              !isSubmitting && formData.product && formData.weight && formData.qty
                ? 'bg-slate-900 text-white hover:bg-brand-dark hover:shadow-md' 
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Syncing Ledger...' : 'Save & Reconcile'}
          </button>
        </div>

      </div>
    </div>
  );
}