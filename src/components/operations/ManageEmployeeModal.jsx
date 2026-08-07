// frontend/src/components/operations/ManageEmployeeModal.jsx
import React, { useState, useEffect } from 'react';
import api from '../../config/api';
import PremiumCalendar from '../shared/PremiumCalendar';

export default function ManageEmployeeModal({ employee, branchId, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    emiratesIdNumber: '',
    emiratesIdExpiry: '',
    workPermitNumber: '',
    workPermitExpiry: '',
    passportNumber: '',
    passportExpiry: '',
    healthInsuranceNumber: '',
    healthInsuranceExpiry: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Track which calendar dropdown is currently open ('emiratesId', 'workPermit', 'passport', 'healthInsurance')
  const [openCalendar, setOpenCalendar] = useState(null);

  // Initialize form with existing employee data
  useEffect(() => {
    if (employee) {
      setFormData({
        emiratesIdNumber: employee.emiratesIdNumber || '',
        emiratesIdExpiry: employee.emiratesIdExpiry || '',
        workPermitNumber: employee.workPermitNumber || '',
        workPermitExpiry: employee.workPermitExpiry || '',
        passportNumber: employee.passportNumber || '',
        passportExpiry: employee.passportExpiry || '',
        healthInsuranceNumber: employee.healthInsuranceNumber || '',
        healthInsuranceExpiry: employee.healthInsuranceExpiry || ''
      });
    }
  }, [employee]);

  if (!employee) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateSelect = (field, dates) => {
    const selectedDate = dates && dates.length > 0 ? dates[0] : '';
    setFormData(prev => ({ ...prev, [field]: selectedDate }));
    setOpenCalendar(null); // Close calendar after selection
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Patch request to the new backend controller
      const response = await api.patch(`/api/employees/${encodeURIComponent(branchId)}/${encodeURIComponent(employee.id)}`, formData);
      
      if (response.data.success) {
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      console.error('Failed to update documents:', err);
      setError(err.response?.data?.message || 'Failed to update employee documents.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderDocumentRow = (label, fieldPrefix) => {
    const idField = `${fieldPrefix}Number`;
    const expiryField = `${fieldPrefix}Expiry`;
    const isCalOpen = openCalendar === fieldPrefix;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-slate-50/50 border border-slate-100 rounded-[1.5rem] hover:border-slate-200 transition-colors">
        {/* Document ID Input */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            {label} Number
          </label>
          <input
            type="text"
            value={formData[idField]}
            onChange={(e) => handleChange(idField, e.target.value)}
            placeholder={`Enter ${label} ID`}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all"
          />
        </div>

        {/* Expiry Date Picker (PremiumCalendar Integration) */}
        <div className="relative">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            Expiry Date
          </label>
          <button
            type="button"
            onClick={() => setOpenCalendar(isCalOpen ? null : fieldPrefix)}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 flex justify-between items-center hover:bg-slate-50 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all"
          >
            <span className={formData[expiryField] ? 'text-slate-800' : 'text-slate-400 font-normal'}>
              {formData[expiryField] || 'Select Date'}
            </span>
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${isCalOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* Custom Fintech Calendar Dropdown */}
          <PremiumCalendar
            isOpen={isCalOpen}
            onClose={() => setOpenCalendar(null)}
            selectedDates={formData[expiryField] ? [formData[expiryField]] : []}
            onDateSelect={(dates) => handleDateSelect(expiryField, dates)}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={!isLoading ? onClose : undefined}
      ></div>

      {/* Modal Container */}
      <div className="relative w-full max-w-3xl bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0 z-20">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Manage Compliance Documents</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Updating records for <span className="text-slate-800 font-bold">{employee.name}</span>
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

        {/* Scrollable Form Body */}
        <div className="p-8 overflow-y-auto custom-scrollbar bg-white">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 text-rose-600 text-sm font-medium rounded-xl border border-rose-100 flex items-center gap-3">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}

          <form id="document-update-form" onSubmit={handleSubmit} className="space-y-4">
            {renderDocumentRow('Emirates ID', 'emiratesId')}
            {renderDocumentRow('Work Permit', 'workPermit')}
            {renderDocumentRow('Passport', 'passport')}
            {renderDocumentRow('Health Insurance', 'healthInsurance')}
          </form>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 shrink-0">
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
            form="document-update-form"
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