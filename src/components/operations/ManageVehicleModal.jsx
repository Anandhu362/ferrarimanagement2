// frontend/src/components/operations/ManageVehicleModal.jsx
import React, { useState, useEffect } from 'react';
import { updateVehicleDocuments } from '../../config/api';
import PremiumCalendar from '../shared/PremiumCalendar';

export default function ManageVehicleModal({ vehicle, branchId, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    plateNo: '',
    chassisNo: '',
    vehicleYear: '',
    renewalExpiry: '',
    insuranceExpiry: '',
    asateelExpiry: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [openCalendar, setOpenCalendar] = useState(null);

  useEffect(() => {
    if (vehicle) {
      setFormData({
        plateNo: vehicle.plateNo || '',
        chassisNo: vehicle.chassisNo || '',
        vehicleYear: vehicle.vehicleYear || '',
        renewalExpiry: vehicle.renewalExpiry || '',
        insuranceExpiry: vehicle.insuranceExpiry || '',
        asateelExpiry: vehicle.asateelExpiry || ''
      });
    }
  }, [vehicle]);

  if (!vehicle) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDateSelect = (field, dates) => {
    const selectedDate = dates && dates.length > 0 ? dates[0] : '';
    setFormData((prev) => ({ ...prev, [field]: selectedDate }));
    setOpenCalendar(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await updateVehicleDocuments(branchId, vehicle.id, formData);
      if (response.data.success) {
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      console.error('Failed to update vehicle:', err);
      setError(err.response?.data?.message || 'Failed to update vehicle compliance documents.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderDateField = (label, fieldKey, calKey) => {
    const isCalOpen = openCalendar === calKey;
    return (
      <div className="relative p-5 bg-slate-50/50 border border-slate-100 rounded-[1.5rem] hover:border-slate-200 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {label}
          </label>
          {formData[fieldKey] && (
            <button
              type="button"
              onClick={() => handleChange(fieldKey, '')}
              className="text-[10px] font-semibold text-rose-500 hover:text-rose-700"
            >
              Clear
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpenCalendar(isCalOpen ? null : calKey)}
          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 flex justify-between items-center hover:bg-slate-50 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all"
        >
          <span className={formData[fieldKey] ? 'text-slate-800' : 'text-slate-400 font-normal'}>
            {formData[fieldKey] || 'Select Date'}
          </span>
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform ${isCalOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <PremiumCalendar
          isOpen={isCalOpen}
          onClose={() => setOpenCalendar(null)}
          selectedDates={formData[fieldKey] ? [formData[fieldKey]] : []}
          onDateSelect={(dates) => handleDateSelect(fieldKey, dates)}
        />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={!isLoading ? onClose : undefined}
      ></div>

      <div className="relative w-full max-w-3xl bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0 z-20 rounded-t-[2rem]">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Manage Vehicle Compliance</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Updating records for <span className="text-slate-800 font-bold">Plate #{vehicle.plateNo}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-8 overflow-y-auto overflow-x-visible custom-scrollbar bg-white">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 text-rose-600 text-sm font-medium rounded-xl border border-rose-100 flex items-center gap-3">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <form id="vehicle-update-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-slate-50/50 border border-slate-100 rounded-[1.5rem]">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Plate No
                </label>
                <input
                  type="text"
                  value={formData.plateNo}
                  onChange={(e) => handleChange('plateNo', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 uppercase outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Chassis No
                </label>
                <input
                  type="text"
                  value={formData.chassisNo}
                  onChange={(e) => handleChange('chassisNo', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 uppercase font-mono outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Vehicle Year
                </label>
                <input
                  type="number"
                  value={formData.vehicleYear}
                  onChange={(e) => handleChange('vehicleYear', e.target.value)}
                  onWheel={(e) => e.target.blur()}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderDateField('Renewal Expiration Date', 'renewalExpiry', 'renewal')}
              {renderDateField('Insurance Expiration Date', 'insuranceExpiry', 'insurance')}
              {renderDateField('ASATEEL Exp Date', 'asateelExpiry', 'asateel')}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 shrink-0 rounded-b-[2rem]">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200/50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="vehicle-update-form"
            disabled={isLoading}
            className="px-8 py-2.5 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2"
          >
            {isLoading && (
              <svg className="animate-spin w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            Save Updates
          </button>
        </div>
      </div>
    </div>
  );
}

