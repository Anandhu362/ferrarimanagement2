// frontend/src/components/operations/AddVehicleModal.jsx
import React, { useState } from 'react';
import PremiumCalendar from '../shared/PremiumCalendar';

export default function AddVehicleModal({ isOpen, onClose, onAdd, isSubmitting }) {
  const initialState = {
    plateNo: '',
    chassisNo: '',
    vehicleYear: '',
    renewalExpiry: '',
    insuranceExpiry: '',
    asateelExpiry: ''
  };

  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [openCalendar, setOpenCalendar] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleDateChange = (name, datesArray) => {
    const selectedDateStr = datesArray.length > 0 ? datesArray[0] : '';
    setFormData((prev) => ({ ...prev, [name]: selectedDateStr }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    setOpenCalendar(null);
  };

  // Keyboard Navigation Engine (Enter / ArrowUp / ArrowDown)
  const handleKeyDown = (e) => {
    if (['Enter', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
      e.preventDefault();
      const form = e.target.form || document.getElementById('add-vehicle-form');
      if (!form) return;

      const focusableElements = Array.from(
        form.querySelectorAll('input:not([disabled]), button[type="button"]:not([disabled]), button[type="submit"]:not([disabled])')
      );

      const currentIndex = focusableElements.indexOf(e.target);

      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        if (currentIndex > -1 && currentIndex < focusableElements.length - 1) {
          focusableElements[currentIndex + 1].focus();
        }
      } else if (e.key === 'ArrowUp') {
        if (currentIndex > 0) {
          focusableElements[currentIndex - 1].focus();
        }
      }
    }
  };

  const validateAndSanitize = () => {
    const newErrors = {};
    const sanitized = { ...formData };
    const maxYear = new Date().getFullYear() + 2;

    sanitized.plateNo = sanitized.plateNo.trim().toUpperCase();
    if (!sanitized.plateNo) newErrors.plateNo = 'Plate number is required';

    sanitized.chassisNo = sanitized.chassisNo.trim().toUpperCase();
    if (!sanitized.chassisNo) newErrors.chassisNo = 'Chassis number is required';

    const parsedYear = parseInt(sanitized.vehicleYear, 10);
    if (!sanitized.vehicleYear || isNaN(parsedYear) || parsedYear < 1990 || parsedYear > maxYear) {
      newErrors.vehicleYear = `Enter a valid year (1990 - ${maxYear})`;
    } else {
      sanitized.vehicleYear = parsedYear;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 ? sanitized : null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanData = validateAndSanitize();
    if (cleanData) {
      onAdd(cleanData);
      setFormData(initialState);
    }
  };

  const handleClose = () => {
    setFormData(initialState);
    setErrors({});
    setOpenCalendar(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10 rounded-t-[2rem]">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Register New Vehicle</h2>
            <p className="text-sm text-slate-500 font-light mt-1">
              Enter vehicle identification details and renewal compliance dates.
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-8 overflow-y-auto overflow-x-visible custom-scrollbar relative">
          <form id="add-vehicle-form" onSubmit={handleSubmit} className="space-y-8">
            {/* Vehicle Identity */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Vehicle Identification</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Plate No <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="plateNo"
                    value={formData.plateNo}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g. 57349"
                    className={`w-full bg-slate-50 border ${
                      errors.plateNo ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-brand-dark/20'
                    } text-sm font-medium text-slate-900 rounded-xl px-4 py-3 outline-none focus:ring-2 transition-all uppercase`}
                  />
                  {errors.plateNo && <p className="text-[10px] text-rose-500 mt-1 font-medium">{errors.plateNo}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Chassis No <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="chassisNo"
                    value={formData.chassisNo}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g. JAMKP34T5S7P06976"
                    className={`w-full bg-slate-50 border ${
                      errors.chassisNo ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-brand-dark/20'
                    } text-sm font-medium text-slate-900 rounded-xl px-4 py-3 outline-none focus:ring-2 transition-all uppercase font-mono`}
                  />
                  {errors.chassisNo && <p className="text-[10px] text-rose-500 mt-1 font-medium">{errors.chassisNo}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Vehicle Year <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="vehicleYear"
                    value={formData.vehicleYear}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onWheel={(e) => e.target.blur()}
                    placeholder="e.g. 2025"
                    className={`w-full bg-slate-50 border ${
                      errors.vehicleYear ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-brand-dark/20'
                    } text-sm font-medium text-slate-900 rounded-xl px-4 py-3 outline-none focus:ring-2 transition-all`}
                  />
                  {errors.vehicleYear && <p className="text-[10px] text-rose-500 mt-1 font-medium">{errors.vehicleYear}</p>}
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-slate-100"></div>

            {/* Compliance Expiration Dates */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Compliance Expiration Dates</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Renewal Expiration Date */}
                <div className="relative p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                  <label className="block text-xs font-medium text-slate-700 mb-2">Renewal Expiration Date</label>
                  <button
                    type="button"
                    onKeyDown={handleKeyDown}
                    onClick={() => setOpenCalendar(openCalendar === 'renewal' ? null : 'renewal')}
                    className="w-full flex justify-between items-center bg-white border border-slate-200 text-slate-900 text-sm font-medium rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-dark/20 hover:bg-slate-50 transition-all text-left"
                  >
                    {formData.renewalExpiry || <span className="text-slate-400">Select Date</span>}
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <PremiumCalendar
                    selectedDates={formData.renewalExpiry ? [formData.renewalExpiry] : []}
                    onDateSelect={(dates) => handleDateChange('renewalExpiry', dates)}
                    isOpen={openCalendar === 'renewal'}
                    onClose={() => setOpenCalendar(null)}
                  />
                </div>

                {/* Insurance Expiration Date */}
                <div className="relative p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                  <label className="block text-xs font-medium text-slate-700 mb-2">Insurance Expiration Date</label>
                  <button
                    type="button"
                    onKeyDown={handleKeyDown}
                    onClick={() => setOpenCalendar(openCalendar === 'insurance' ? null : 'insurance')}
                    className="w-full flex justify-between items-center bg-white border border-slate-200 text-slate-900 text-sm font-medium rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-dark/20 hover:bg-slate-50 transition-all text-left"
                  >
                    {formData.insuranceExpiry || <span className="text-slate-400">Select Date</span>}
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <PremiumCalendar
                    selectedDates={formData.insuranceExpiry ? [formData.insuranceExpiry] : []}
                    onDateSelect={(dates) => handleDateChange('insuranceExpiry', dates)}
                    isOpen={openCalendar === 'insurance'}
                    onClose={() => setOpenCalendar(null)}
                  />
                </div>

                {/* ASATEEL Exp Date */}
                <div className="relative p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                  <label className="block text-xs font-medium text-slate-700 mb-2">ASATEEL Exp Date (Optional)</label>
                  <button
                    type="button"
                    onKeyDown={handleKeyDown}
                    onClick={() => setOpenCalendar(openCalendar === 'asateel' ? null : 'asateel')}
                    className="w-full flex justify-between items-center bg-white border border-slate-200 text-slate-900 text-sm font-medium rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-dark/20 hover:bg-slate-50 transition-all text-left"
                  >
                    {formData.asateelExpiry || <span className="text-slate-400">Select Date</span>}
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <PremiumCalendar
                    selectedDates={formData.asateelExpiry ? [formData.asateelExpiry] : []}
                    onDateSelect={(dates) => handleDateChange('asateelExpiry', dates)}
                    isOpen={openCalendar === 'asateel'}
                    onClose={() => setOpenCalendar(null)}
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 sticky bottom-0 rounded-b-[2rem] z-10">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-vehicle-form"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl text-sm font-medium text-white bg-brand-dark hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center min-w-[140px]"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              'Register Vehicle'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

