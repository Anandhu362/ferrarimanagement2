import React, { useState, useEffect } from 'react';

export default function SplitItemModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  item, 
  tripName, 
  availableCapacity 
}) {
  const [loadQty, setLoadQty] = useState('');
  const [error, setError] = useState('');

  // Reset and pre-fill the input whenever the modal opens with new data
  useEffect(() => {
    if (isOpen && item) {
      // Default to the maximum possible amount that fits in the vehicle
      const defaultLoad = Math.min(item.totalQty, availableCapacity);
      setLoadQty(defaultLoad.toString());
      setError('');
    }
  }, [isOpen, item, availableCapacity]);

  if (!isOpen || !item) return null;

  const remainingInQueue = item.totalQty - (parseInt(loadQty) || 0);

  const handleConfirm = () => {
    const qtyToLoad = parseInt(loadQty, 10);

    if (isNaN(qtyToLoad) || qtyToLoad <= 0) {
      setError('Please enter a valid quantity greater than 0.');
      return;
    }
    if (qtyToLoad > availableCapacity) {
      setError(`Cannot exceed available vehicle capacity (${availableCapacity}).`);
      return;
    }
    if (qtyToLoad > item.totalQty) {
      setError(`Cannot load more than the item's total quantity (${item.totalQty}).`);
      return;
    }

    // Pass the valid quantity back to DeliveryDispatch.jsx
    onConfirm(qtyToLoad);
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl w-full max-w-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-rose-100 bg-rose-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Capacity Exceeded</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Split item to fit vehicle limits</p>
            </div>
          </div>
        </div>
        
        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Warning Banner */}
          <div className="bg-amber-50 border border-amber-100 text-amber-800 px-4 py-3 rounded-xl text-sm font-medium leading-relaxed">
            <strong className="block text-amber-900 mb-1">Not enough space in {tripName}.</strong>
            You are trying to load <strong>{item.totalQty} bags</strong>, but the vehicle only has space for <strong>{availableCapacity} bags</strong>.
          </div>

          {/* Item Details Summary */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex justify-between items-center">
             <div>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Loading Item</p>
               <p className="text-sm font-bold text-slate-900 truncate max-w-[200px]" title={item.company_name}>{item.company_name}</p>
               <p className="text-xs text-slate-500 mt-0.5">{item.product}</p>
             </div>
             <div className="text-right">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Total Bags</span>
               <span className="text-lg font-bold text-brand-dark">{item.totalQty}</span>
             </div>
          </div>

          {/* Input Area */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Quantity to Load Now
            </label>
            <input
              type="number"
              value={loadQty}
              onChange={(e) => {
                setLoadQty(e.target.value);
                setError(''); // Clear error on type
              }}
              className={`w-full px-4 py-3 bg-white border rounded-xl text-lg font-bold outline-none transition-all ${error ? 'border-rose-300 ring-4 ring-rose-50 text-rose-900' : 'border-slate-200 focus:border-brand-light focus:ring-4 focus:ring-brand-light/10 text-slate-900'}`}
              max={availableCapacity}
              min={1}
              autoFocus
            />
            
            {/* Visual Split Indicator */}
            {!error && loadQty && (
              <div className="flex justify-between items-center text-xs px-1 mt-2">
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                  {loadQty} to Vehicle
                </span>
                <span className="text-slate-400 font-medium">
                  {remainingInQueue > 0 ? `${remainingInQueue} stays in queue` : 'Fully loaded'}
                </span>
              </div>
            )}

            {error && (
              <p className="text-xs font-bold text-rose-500 mt-2 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 items-center">
          <button 
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200/50 rounded-xl transition-colors"
          >
            Cancel
          </button>
          
          <button 
            onClick={handleConfirm}
            className="px-6 py-2.5 text-sm font-bold text-white bg-brand-dark rounded-xl hover:bg-[#1E1A2F] focus:ring-4 focus:ring-brand-dark/20 transition-all flex items-center gap-2 shadow-sm"
          >
            Confirm Split
          </button>
        </div>
        
      </div>
    </div>
  );
}