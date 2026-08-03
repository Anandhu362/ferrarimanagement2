// frontend/src/components/operations/AddEmployeeModal.jsx
import React, { useState } from 'react';
import PremiumCalendar from '../shared/PremiumCalendar'; 

export default function AddEmployeeModal({ isOpen, onClose, onAdd, isSubmitting }) {
  const initialState = {
    name: '',
    nationality: '',
    mobile: '',
    emiratesIdNumber: '',
    emiratesIdExpiry: '',
    workPermitNumber: '',
    workPermitExpiry: '',
    passportNumber: '',
    passportExpiry: ''
  };

  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});
  
  // Local state to manage which calendar is currently open
  const [openCalendar, setOpenCalendar] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Adjusted handler to accept array from PremiumCalendar but map to a single string for this form
  const handleDateChange = (name, datesArray) => {
    // If the user clears the filter or selects a date, take the first string or empty
    const selectedDateStr = datesArray.length > 0 ? datesArray[0] : '';
    
    setFormData(prev => ({ ...prev, [name]: selectedDateStr }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    setOpenCalendar(null); // Close calendar after selection for this specific modal use-case
  };

  const validateAndSanitize = () => {
    const newErrors = {};
    const sanitized = { ...formData };

    if (!sanitized.name.trim()) newErrors.name = 'Full name is required';
    sanitized.name = sanitized.name.trim().toUpperCase();

    if (!sanitized.nationality.trim()) newErrors.nationality = 'Nationality is required';
    sanitized.nationality = sanitized.nationality.trim().toUpperCase();

    if (!sanitized.emiratesIdExpiry) newErrors.emiratesIdExpiry = 'EID Expiry date is required';
    if (!sanitized.workPermitExpiry) newErrors.workPermitExpiry = 'Work Permit Expiry date is required';
    if (!sanitized.passportExpiry) newErrors.passportExpiry = 'Passport Expiry date is required';

    sanitized.mobile = sanitized.mobile.trim();
    sanitized.emiratesIdNumber = sanitized.emiratesIdNumber.trim();
    sanitized.workPermitNumber = sanitized.workPermitNumber.trim();
    sanitized.passportNumber = sanitized.passportNumber.trim().toUpperCase();

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 ? sanitized : null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanData = validateAndSanitize();
    
    if (cleanData) {
      onAdd(cleanData);
    }
  };

  // Helper to reset and close
  const handleClose = () => {
    setFormData(initialState);
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl overflow-visible flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10 rounded-t-[2rem]">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Register New Employee</h2>
            <p className="text-sm text-slate-500 font-light mt-1">Enter personnel details and mandatory compliance dates.</p>
          </div>
          <button 
            onClick={handleClose} 
            disabled={isSubmitting} 
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Form Body - Note: overflow-visible is crucial here if calendars need to pop outside the modal boundaries */}
        <div className="p-8 overflow-y-auto overflow-x-visible custom-scrollbar relative">
          <form id="add-employee-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* Basic Info Section */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Personal Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="col-span-1 md:col-span-3">
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Full Name <span className="text-rose-500">*</span></label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. AHMED HASSAN" className={`w-full bg-slate-50 border ${errors.name ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-brand-dark/20'} text-sm font-medium text-slate-900 rounded-xl px-4 py-3 outline-none focus:ring-2 transition-all`} />
                  {errors.name && <p className="text-[10px] text-rose-500 mt-1 font-medium">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Nationality <span className="text-rose-500">*</span></label>
                  <input type="text" name="nationality" value={formData.nationality} onChange={handleChange} placeholder="e.g. INDIA" className={`w-full bg-slate-50 border ${errors.nationality ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-brand-dark/20'} text-sm font-medium text-slate-900 rounded-xl px-4 py-3 outline-none focus:ring-2 transition-all`} />
                  {errors.nationality && <p className="text-[10px] text-rose-500 mt-1 font-medium">{errors.nationality}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Mobile Number (Optional)</label>
                  <input type="text" name="mobile" value={formData.mobile} onChange={handleChange} placeholder="e.g. 050 123 4567" className="w-full bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-dark/20 transition-all" />
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-slate-100"></div>

            {/* Documents Section */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Compliance Documents</h3>
              <div className="space-y-5">
                
                {/* Emirates ID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Emirates ID Number (Optional)</label>
                    <input type="text" name="emiratesIdNumber" value={formData.emiratesIdNumber} onChange={handleChange} placeholder="784-XXXX-XXXXXXX-X" className="w-full bg-white border border-slate-200 text-sm font-medium text-slate-900 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-dark/20 transition-all" />
                  </div>
                  {/* ✅ UPDATED: Wrapped in relative container for positioning */}
                  <div className="relative">
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">EID Expiry Date <span className="text-rose-500">*</span></label>
                    <button 
                      type="button"
                      onClick={() => setOpenCalendar(openCalendar === 'eid' ? null : 'eid')}
                      className={`w-full flex justify-between items-center bg-white border ${errors.emiratesIdExpiry ? 'border-rose-300 text-rose-500' : 'border-slate-200 text-slate-900'} text-sm font-medium rounded-xl px-4 py-2.5 outline-none hover:bg-slate-50 transition-all text-left`}
                    >
                      {formData.emiratesIdExpiry || <span className="text-slate-400">Select Date</span>}
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </button>
                    <PremiumCalendar 
                      selectedDates={formData.emiratesIdExpiry ? [formData.emiratesIdExpiry] : []} 
                      onDateSelect={(dates) => handleDateChange('emiratesIdExpiry', dates)} 
                      isOpen={openCalendar === 'eid'}
                      onClose={() => setOpenCalendar(null)}
                    />
                    {errors.emiratesIdExpiry && <p className="text-[10px] text-rose-500 mt-1 font-medium">{errors.emiratesIdExpiry}</p>}
                  </div>
                </div>

                {/* Work Permit */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Work Permit Number (Optional)</label>
                    <input type="text" name="workPermitNumber" value={formData.workPermitNumber} onChange={handleChange} placeholder="e.g. 121751570" className="w-full bg-white border border-slate-200 text-sm font-medium text-slate-900 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-dark/20 transition-all" />
                  </div>
                  {/* ✅ UPDATED: Wrapped in relative container */}
                  <div className="relative">
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Work Permit Expiry Date <span className="text-rose-500">*</span></label>
                    <button 
                      type="button"
                      onClick={() => setOpenCalendar(openCalendar === 'wp' ? null : 'wp')}
                      className={`w-full flex justify-between items-center bg-white border ${errors.workPermitExpiry ? 'border-rose-300 text-rose-500' : 'border-slate-200 text-slate-900'} text-sm font-medium rounded-xl px-4 py-2.5 outline-none hover:bg-slate-50 transition-all text-left`}
                    >
                      {formData.workPermitExpiry || <span className="text-slate-400">Select Date</span>}
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </button>
                    <PremiumCalendar 
                      selectedDates={formData.workPermitExpiry ? [formData.workPermitExpiry] : []} 
                      onDateSelect={(dates) => handleDateChange('workPermitExpiry', dates)} 
                      isOpen={openCalendar === 'wp'}
                      onClose={() => setOpenCalendar(null)}
                    />
                    {errors.workPermitExpiry && <p className="text-[10px] text-rose-500 mt-1 font-medium">{errors.workPermitExpiry}</p>}
                  </div>
                </div>

                {/* Passport */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Passport Number (Optional)</label>
                    <input type="text" name="passportNumber" value={formData.passportNumber} onChange={handleChange} placeholder="e.g. S7874540" className="w-full bg-white border border-slate-200 text-sm font-medium text-slate-900 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-dark/20 transition-all uppercase" />
                  </div>
                  {/* ✅ UPDATED: Wrapped in relative container */}
                  <div className="relative">
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Passport Expiry Date <span className="text-rose-500">*</span></label>
                    <button 
                      type="button"
                      onClick={() => setOpenCalendar(openCalendar === 'pp' ? null : 'pp')}
                      className={`w-full flex justify-between items-center bg-white border ${errors.passportExpiry ? 'border-rose-300 text-rose-500' : 'border-slate-200 text-slate-900'} text-sm font-medium rounded-xl px-4 py-2.5 outline-none hover:bg-slate-50 transition-all text-left`}
                    >
                      {formData.passportExpiry || <span className="text-slate-400">Select Date</span>}
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </button>
                    <PremiumCalendar 
                      selectedDates={formData.passportExpiry ? [formData.passportExpiry] : []} 
                      onDateSelect={(dates) => handleDateChange('passportExpiry', dates)} 
                      isOpen={openCalendar === 'pp'}
                      onClose={() => setOpenCalendar(null)}
                    />
                    {errors.passportExpiry && <p className="text-[10px] text-rose-500 mt-1 font-medium">{errors.passportExpiry}</p>}
                  </div>
                </div>

              </div>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 sticky bottom-0 rounded-b-[2rem] z-10">
          <button 
            onClick={handleClose} 
            disabled={isSubmitting} 
            className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="add-employee-form" 
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
              'Save Employee'
            )}
          </button>
        </div>

      </div>
    </div>
  );
}