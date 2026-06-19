// frontend/src/components/customers/AddCustomerModal.jsx
import React, { useState } from 'react';
import api from '../../config/api';
import { clearCache } from '../../utils/cacheUtils'; // ✅ Imported caching utility

export default function AddCustomerModal({ isOpen, onClose, onRefresh }) {
  const [formData, setFormData] = useState({
    customerName: '',
    phoneNumber: '',
    deliveryLocation: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing again
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Basic frontend validation
    if (!formData.customerName || !formData.phoneNumber || !formData.deliveryLocation) {
      setError("Please fill out all required fields.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await api.post('/api/customers', formData);
      
      if (response.data && response.data.success) {
        // ✅ CLEAR LOCAL CACHE BEFORE REFRESHING
        // This ensures the directory page fetches the newly updated list from the server
        clearCache('ferrari_customers_cache');

        // Reset form, refresh the table behind it, and close modal
        setFormData({ customerName: '', phoneNumber: '', deliveryLocation: '' });
        onRefresh();
        onClose();
      } else {
        throw new Error(response.data.message || 'Failed to add customer.');
      }
    } catch (err) {
      console.error("Error submitting new customer:", err);
      setError(err.response?.data?.message || err.message || "A network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // Backdrop with glassmorphism blur
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      
      {/* Modal Container */}
      <div 
        className="relative w-full max-w-md bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100 animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Add New Customer</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Create a new client profile in the directory.</p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
            disabled={isSubmitting}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6">
          
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2.5 text-rose-600 text-sm font-medium">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Customer Name */}
            <div>
              <label htmlFor="customerName" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Client Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="customerName"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                disabled={isSubmitting}
                placeholder="e.g., Al Safa Restaurant"
                className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-slate-900 font-medium outline-none transition-all placeholder-slate-400 shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phoneNumber" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                disabled={isSubmitting}
                placeholder="e.g., +971 50 123 4567"
                className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-slate-900 font-medium outline-none transition-all placeholder-slate-400 shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Delivery Location */}
            <div>
              <label htmlFor="deliveryLocation" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Default Delivery Zone <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="deliveryLocation"
                name="deliveryLocation"
                value={formData.deliveryLocation}
                onChange={handleInputChange}
                disabled={isSubmitting}
                placeholder="e.g., Business Bay, Dubai"
                className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-slate-900 font-medium outline-none transition-all placeholder-slate-400 shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-8 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm text-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed text-sm min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <span>Saving...</span>
                </>
              ) : (
                <span>Add Customer</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}