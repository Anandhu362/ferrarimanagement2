import React, { useState, useEffect } from 'react';
import api from '../../config/api';

export default function VendorFormModal({ initialData, onSuccess, onCancel }) {
  const [vendorName, setVendorName] = useState('');
  const [payeeDetails, setPayeeDetails] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Populate form if editing an existing vendor
  useEffect(() => {
    if (initialData) {
      setVendorName(initialData.vendorName || '');
      setPayeeDetails(initialData.payeeDetails || '');
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic Validation
    if (!vendorName.trim() || !payeeDetails.trim()) {
      setError('Both Vendor Name and Payee Details are required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        vendorName: vendorName.trim(),
        payeeDetails: payeeDetails.trim()
      };

      if (initialData && initialData.vendor_id) {
        // Update existing vendor
        await api.put(`/api/vendors/${initialData.vendor_id}`, payload);
      } else {
        // Create new vendor
        await api.post('/api/vendors', payload);
      }

      onSuccess(); // Triggers the table refresh and closes the modal in the parent component
    } catch (err) {
      console.error("Error saving vendor:", err);
      setError(err.response?.data?.message || 'Failed to save vendor details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Error Message Display */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2 animate-in fade-in">
          <svg className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-rose-600 font-medium">{error}</p>
        </div>
      )}

      {/* Vendor Name Input */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Vendor Name
        </label>
        <input
          type="text"
          value={vendorName}
          onChange={(e) => setVendorName(e.target.value)}
          placeholder="e.g. Almasa IT Distribution"
          className="w-full px-4 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200/80 focus:border-brand-dark focus:ring-4 focus:ring-brand-dark/10 rounded-xl text-slate-900 font-medium outline-none transition-all placeholder-slate-400 text-sm shadow-sm"
          disabled={isSubmitting}
          required
        />
      </div>

      {/* Payee Details Input (Textarea for IBANs, Bank Names, etc.) */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Payee / Bank Details
        </label>
        <textarea
          value={payeeDetails}
          onChange={(e) => setPayeeDetails(e.target.value)}
          placeholder="Enter IBAN, Account No, or payment instructions..."
          rows="4"
          className="w-full px-4 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200/80 focus:border-brand-dark focus:ring-4 focus:ring-brand-dark/10 rounded-xl text-slate-900 font-medium outline-none transition-all placeholder-slate-400 text-sm shadow-sm resize-none"
          disabled={isSubmitting}
          required
        ></textarea>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-5 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors shadow-sm flex items-center justify-center min-w-[120px] disabled:opacity-70"
        >
          {isSubmitting ? (
            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            initialData ? 'Save Changes' : 'Add Vendor'
          )}
        </button>
      </div>
    </form>
  );
}