// frontend/src/components/inventory/InventoryForm.jsx
import React, { useState, useEffect } from 'react';
import api from '../../config/api';
import { clearCache } from '../../utils/cacheUtils'; 

export default function InventoryForm({ initialData, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    productName: '',
    weight: '',
    qty: '',
    price: '' // ✅ Added price to state
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);

  // Populate form if editing an existing item
  useEffect(() => {
    if (initialData) {
      setFormData({
        productName: initialData.product_name || '',
        weight: initialData.weight || '',
        qty: initialData.qty !== undefined ? initialData.qty.toString() : '',
        price: initialData.price !== undefined ? initialData.price.toString() : '' // ✅ Populate price
      });
    } else {
      setFormData({ productName: '', weight: '', qty: '', price: '' });
    }
    setLocalError(null);
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    
    // Basic validation (Price is optional, but if entered, must be valid)
    if (!formData.productName || !formData.weight || !formData.qty) {
      setLocalError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        product_name: formData.productName,
        weight: formData.weight,
        qty: Math.max(0, parseInt(formData.qty, 10) || 0),
        price: Math.max(0, parseFloat(formData.price) || 0)
      };

      if (initialData && initialData.inv_id) {
        // Edit existing product 
        await api.put(`/api/inventory/${initialData.inv_id}`, payload);
      } else {
        // Add new product
        await api.post('/api/inventory', payload);
      }
      
      // Clear cache so the table fetches the fresh data
      clearCache('ferrari_inventory_cache');

      // Notify parent to close modal and refresh data
      onSuccess();
    } catch (error) {
      console.error("Save error:", error);
      setLocalError(error.response?.data?.message || 'Failed to save product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Shared premium input styling
  const inputClasses = "w-full px-4 py-3 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 focus:border-brand-light focus:ring-2 focus:ring-brand-light/10 rounded-xl text-slate-900 font-medium outline-none transition-all placeholder-slate-400 disabled:opacity-60 disabled:bg-slate-100 disabled:cursor-not-allowed disabled:hover:border-slate-200";

  const isEditing = !!initialData;

  return (
    <form onSubmit={handleSubmit} className="space-y-5 w-full">
      
      {/* Local Error Display */}
      {localError && (
        <div className="p-3 mb-4 text-sm text-rose-600 bg-rose-50 border border-rose-100/50 rounded-xl flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {localError}
        </div>
      )}

      {/* Row 1: Product Name */}
      <div>
        <div className="flex justify-between items-end mb-2 ml-1">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">
            Product Name
          </label>
        </div>
        <input 
          type="text" 
          placeholder="e.g., Premium Almonds" 
          value={formData.productName}
          onChange={(e) => setFormData({...formData, productName: e.target.value})}
          className={inputClasses}
          disabled={isSubmitting || isEditing}
          required
        />
      </div>

      {/* Row 2: Price Input */}
      <div>
        <div className="flex justify-between items-end mb-2 ml-1">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">
            Default Price (AED)
          </label>
        </div>
        <input 
          type="number" 
          min="0"
          step="0.01"
          placeholder="0.00" 
          value={formData.price}
          onChange={(e) => setFormData({...formData, price: e.target.value < 0 ? '0' : e.target.value})}
          className={inputClasses}
          disabled={isSubmitting}
        />
      </div>

      {/* Row 3: Weight & QTY */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
            Weight / Size
          </label>
          <input 
            type="text" 
            placeholder="e.g., 500g, 1kg" 
            value={formData.weight}
            onChange={(e) => setFormData({...formData, weight: e.target.value})}
            className={inputClasses}
            disabled={isSubmitting || isEditing}
            required
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
            Stock QTY
          </label>
          <input 
            type="number" 
            min="0"
            placeholder="0" 
            value={formData.qty}
            onChange={(e) => setFormData({...formData, qty: e.target.value < 0 ? '0' : e.target.value})}
            className={inputClasses}
            disabled={isSubmitting}
            required
          />
        </div>
      </div>

      {isEditing && (
        <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
          <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Name and weight act as the unique ID and cannot be changed. Delete and recreate to alter these fields.
        </div>
      )}

      <div className="pt-4 flex gap-3 mt-6">
        <button 
          type="button" 
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 py-3.5 text-slate-600 bg-slate-100 rounded-full font-medium hover:bg-slate-200 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="flex-1 py-3.5 bg-brand-dark text-white rounded-full font-medium hover:bg-[#1E1A2F] shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          ) : (
            isEditing ? 'Save Stock Update' : 'Add to Inventory'
          )}
        </button>
      </div>
    </form>
  );
}