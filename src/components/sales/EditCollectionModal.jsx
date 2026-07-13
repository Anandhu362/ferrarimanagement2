import React, { useState, useEffect } from 'react';
import api from '../../config/api';
// ✅ Import the custom Premium Calendar
import PremiumCalendar from '../../components/shared/PremiumCalendar';

export default function EditCollectionModal({ isOpen, onClose, collectionData }) {
  const [companyName, setCompanyName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [date, setDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // ✅ State to manage the custom calendar modal/dropdown visibility
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Re-populate the form whenever the modal opens with new data
  useEffect(() => {
    if (collectionData && isOpen) {
      setCompanyName(collectionData.companyName || '');
      setInvoiceNumber(collectionData.invoiceNumber === 'NIL' ? '' : (collectionData.invoiceNumber || ''));
      setDate(collectionData.date || ''); 
    }
  }, [collectionData, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!companyName || companyName.trim().length < 2) {
      alert("Company Name must be at least 2 characters long.");
      return;
    }

    if (!date) {
      alert("Collection Date is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        collectionId: collectionData.id,
        companyName: companyName.trim(),
        invoiceNumber: invoiceNumber.trim() || 'NIL',
        date: date
      };

      const response = await api.put('/api/inflow/collection/edit-text', payload);

      if (response.data.success) {
        onClose();
      }
    } catch (error) {
      console.error("Error updating collection:", error);
      alert(error.response?.data?.message || "Failed to update collection details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Edit Collection</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Update text & date details for the ledger.</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 p-2 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* ✅ CUSTOM FINTECH CALENDAR IMPLEMENTATION */}
          <div className="relative">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Collection Date <span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setIsCalendarOpen(true)}
              className="w-full text-left px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 text-sm flex justify-between items-center font-medium"
            >
              {date || "Select Date..."}
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            
            {/* The actual calendar component renders conditionally inside */}
            <div className="relative">
              <PremiumCalendar 
                selectedDate={date}
                onDateSelect={(newDate) => {
                  setDate(newDate);
                  setIsCalendarOpen(false); // Close on select
                }}
                isOpen={isCalendarOpen}
                onClose={() => setIsCalendarOpen(false)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Company Name <span className="text-rose-500">*</span>
            </label>
            <input 
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. FARADY LLC"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 text-sm outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Invoice Number
            </label>
            <input 
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="Leave blank for NIL"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 text-sm outline-none font-medium"
            />
          </div>

          {/* SECURE FIELD: Read-Only Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex justify-between items-center">
              <span>Collected Amount</span>
              <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded uppercase">Locked</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">AED</span>
              <input 
                type="text"
                value={parseFloat(collectionData?.amount || 0).toFixed(2)}
                readOnly
                disabled
                className="w-full pl-14 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm font-bold cursor-not-allowed select-none"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-2 font-medium leading-tight">
              Amounts cannot be edited to preserve physical cash denomination balances. If the amount is incorrect, the session must be rejected or reversed.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold py-3 px-4 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}