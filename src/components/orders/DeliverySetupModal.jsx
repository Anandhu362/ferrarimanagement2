// frontend/src/components/orders/DeliverySetupModal.jsx
import React, { useState } from 'react';

export default function DeliverySetupModal({ isOpen, onClose, onConfirm }) {
  const [location, setLocation] = useState('');
  const [trip, setTrip] = useState('1'); // Defaulting to 1, but now fully editable

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!location.trim() || !String(trip).trim()) return;
    onConfirm({ location, trip });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="bg-white rounded-[2rem] p-8 max-w-md w-full relative z-10 shadow-[0_20px_60px_rgb(0,0,0,0.15)] animate-in zoom-in-95 duration-300">
        
        <div className="mb-6">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">Setup Dispatch PDF</h3>
          <p className="text-slate-500 text-sm mt-1">Enter trip details to generate the loading sheet.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Delivery Location</label>
            <input 
              type="text"
              autoFocus
              required
              placeholder="e.g., Deira, Al Quoz, Sharjah"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-brand-light focus:ring-2 focus:ring-brand-light/10 rounded-xl text-slate-900 font-medium outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Trip Number</label>
            <input 
              type="text"
              required
              placeholder="e.g., 1, 2, 3..."
              value={trip}
              onChange={(e) => setTrip(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-brand-light focus:ring-2 focus:ring-brand-light/10 rounded-xl text-slate-900 font-medium outline-none transition-all"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="flex-1 py-3.5 bg-slate-100 text-slate-700 rounded-full font-bold hover:bg-slate-200 transition-colors">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={!location.trim() || !String(trip).trim()} 
              className="flex-1 py-3.5 bg-brand-dark text-white rounded-full font-bold hover:bg-[#1E1A2F] transition-colors disabled:opacity-50"
            >
              Confirm & Save
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}