// frontend/src/components/vault/EditBankLogModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import PremiumCalendar from '../shared/PremiumCalendar';

const EditBankLogModal = ({ isOpen, onClose, logData, onSave }) => {
    const [amount, setAmount] = useState('');
    
    // Calendar & Date State
    const [selectedDates, setSelectedDates] = useState([]);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    // Initialize state when modal opens
    useEffect(() => {
        if (logData && isOpen) {
            setAmount(logData.amount || '');
            
            // Format existing date for the PremiumCalendar
            if (logData.createdAt) {
                const dateStr = logData.createdAt.length === 10 
                    ? logData.createdAt 
                    : new Date(logData.createdAt).toISOString().split('T')[0];
                setSelectedDates([dateStr]);
            }
        } else {
            setIsCalendarOpen(false);
        }
    }, [logData, isOpen]);

    // Handle outside clicks to close the custom calendar dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsCalendarOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!isOpen || !logData) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedDates.length === 0) return; 
        
        setLoading(true);
        try {
            await onSave({ 
                logId: logData.id, 
                newAmount: amount, 
                newDate: selectedDates[0] // Extract the selected single date
            });
            onClose();
        } catch (error) {
            console.error("Failed to save edit:", error);
        } finally {
            setLoading(false);
        }
    };

    // Format the date for the custom dropdown button display
    const displayDate = selectedDates.length > 0 
        ? new Date(selectedDates[0]).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'Select Date';

    // ✅ FIX: Use createPortal to break out of all parent stacking contexts
    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            
            {/* Fintech Premium Curved Modal Box */}
            <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)] border border-slate-100 relative">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Edit Transaction</h2>
                    <button 
                        onClick={onClose} 
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors focus:outline-none"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                {/* Read-Only Context Box */}
                <div className="mb-6 p-4 bg-[#FCFCFD] rounded-2xl border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Log ID</span>
                        <span className="text-xs font-semibold text-slate-700 font-mono">{logData.id}</span>
                    </div>
                    <div className="flex flex-col pt-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Description</span>
                        <span className="text-sm text-slate-600 line-clamp-2 leading-relaxed">{logData.description}</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    
                    {/* Custom Fintech Date Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                            Transaction Date
                        </label>
                        <button 
                            type="button"
                            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                            className={`w-full flex items-center justify-between px-4 py-3.5 bg-white border rounded-xl text-sm font-semibold transition-all shadow-sm focus:outline-none ${
                                isCalendarOpen ? 'border-brand-dark ring-2 ring-brand-light/20 text-slate-900' : 'border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-brand-dark/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>{displayDate}</span>
                            </div>
                            <svg className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isCalendarOpen ? 'rotate-180 text-brand-dark' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        
                        {/* Premium Calendar Implementation */}
                        {isCalendarOpen && (
                            <div className="absolute top-[calc(100%+8px)] left-0 w-full z-50 animate-in slide-in-from-top-2 fade-in duration-200">
                                <PremiumCalendar 
                                    isOpen={true} 
                                    onClose={() => setIsCalendarOpen(false)} 
                                    selectedDates={selectedDates}
                                    onDateSelect={(dates) => {
                                        // Ensure only a single date is captured from the array
                                        setSelectedDates(dates.length > 0 ? [dates[dates.length - 1]] : []);
                                        setIsCalendarOpen(false);
                                    }}
                                />
                            </div>
                        )}
                    </div>
                    
                    {/* Amount Input */}
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                            Adjust Amount
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="text-slate-400 font-bold text-sm">AED</span>
                            </div>
                            <input 
                                type="number" 
                                step="0.01"
                                min="0"
                                /* ✅ FIX: Added Tailwind classes to hide the number input spin buttons */
                                className="w-full pl-14 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-lg font-bold text-slate-900 focus:border-brand-dark focus:ring-2 focus:ring-brand-light/20 transition-all shadow-sm outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                value={amount} 
                                onChange={(e) => setAmount(e.target.value)} 
                                required 
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 flex gap-3">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="flex-1 px-4 py-3.5 bg-[#FCFCFD] border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors focus:outline-none"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="flex-1 px-4 py-3.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center shadow-lg shadow-emerald-500/20 disabled:opacity-70 focus:outline-none"
                        >
                            {loading ? (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body // ✅ Render the modal completely outside the React DOM tree hierarchy
    );
};

export default EditBankLogModal;