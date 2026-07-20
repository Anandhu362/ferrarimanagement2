// frontend/src/components/vault/ReserveReversalModal.jsx
import React, { useState, useEffect } from 'react';
import api from '../../config/api';

export default function ReserveReversalModal({ isOpen, onClose, logData, onSuccess }) {
  const [destination, setDestination] = useState('ceo'); // 'ceo' or 'manual'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setDestination('ceo');
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen || !logData) return null;

  // Extract the notes array from the description string
  const extractedNotesMatch = logData?.description?.match(/\[(.*?)\]/);
  const extractedNotes = extractedNotesMatch ? extractedNotesMatch[1] : 'No exact denominations found';
  const originalAmount = parseFloat(logData?.amount || 0);

  const handleConfirmReversal = async () => {
    setError('');
    setIsSubmitting(true);
    
    try {
      const activeBranch = localStorage.getItem('active_branch');
      
      if (!activeBranch) {
        setError('Active branch not found. Please refresh or select a branch.');
        setIsSubmitting(false);
        return;
      }
      
      const response = await api.post('/api/reserve/reverse-inflow', {
        transactionId: logData.id,
        targetVault: destination,
        branchId: activeBranch
      });

      if (response.data.success) {
        onSuccess(); // Trigger parent refresh
        onClose();
      }
    } catch (err) {
      console.error('Reversal error:', err);
      setError(err.response?.data?.message || 'Failed to process the reversal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      
      {/* Modal Container */}
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-50 px-6 py-5 border-b border-slate-100 flex justify-between items-center relative overflow-hidden">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center border border-rose-200 shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold tracking-tight text-slate-900">Reverse Reserve Inflow</h3>
              <p className="text-slate-400 text-xs mt-0.5 font-medium tracking-wide uppercase">Transaction ID: {logData.id?.split('-')[1] || logData.id}</p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 p-2 rounded-full transition-all relative z-10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 space-y-6">
          
          {/* Read-Only Transaction Details Panel */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Original Amount</span>
              <span className="text-lg font-bold text-emerald-500 tracking-tight">
                +{originalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} AED
              </span>
            </div>
            
            <div className="h-px w-full bg-slate-200/60"></div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Denominations to Deduct</span>
              <div className="flex flex-wrap gap-2">
                {extractedNotes.split(',').map((note, index) => (
                  <div key={index} className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 shadow-sm flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                    {note.trim()}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 text-rose-600 text-xs font-medium p-3 rounded-xl border border-rose-200 flex items-start gap-2">
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}

          {/* Custom Destination Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-3 block">Select Transfer Destination</label>
            <div className="grid grid-cols-2 gap-3">
              
              {/* Option 1: CEO Vault */}
              <button
                type="button"
                onClick={() => setDestination('ceo')}
                className={`relative p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col items-start gap-2 ${
                  destination === 'ceo' 
                    ? 'border-indigo-500 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-500' 
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center absolute top-4 right-4 ${
                  destination === 'ceo' ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'
                }`}>
                  {destination === 'ceo' && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                </div>
                <div className={`p-2 rounded-xl ${destination === 'ceo' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <div>
                  <span className={`block text-sm font-bold ${destination === 'ceo' ? 'text-indigo-900' : 'text-slate-700'}`}>CEO Vault</span>
                  <span className={`text-[10px] block mt-0.5 ${destination === 'ceo' ? 'text-indigo-600/80' : 'text-slate-400'}`}>Route funds directly</span>
                </div>
              </button>

              {/* Option 2: Manual Source */}
              <button
                type="button"
                onClick={() => setDestination('manual')}
                className={`relative p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col items-start gap-2 ${
                  destination === 'manual' 
                    ? 'border-slate-800 bg-slate-50 shadow-sm ring-1 ring-slate-800' 
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center absolute top-4 right-4 ${
                  destination === 'manual' ? 'border-slate-800 bg-slate-800' : 'border-slate-300'
                }`}>
                  {destination === 'manual' && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                </div>
                <div className={`p-2 rounded-xl ${destination === 'manual' ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-500'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </div>
                <div>
                  <span className={`block text-sm font-bold ${destination === 'manual' ? 'text-slate-900' : 'text-slate-700'}`}>Manual Out</span>
                  <span className={`text-[10px] block mt-0.5 ${destination === 'manual' ? 'text-slate-500' : 'text-slate-400'}`}>External adjustment</span>
                </div>
              </button>
              
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm disabled:opacity-50"
          >
            Cancel
          </button>
          
          <button
            onClick={handleConfirmReversal}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-sm shadow-slate-900/20 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Processing...</span>
              </>
            ) : (
              <span>Confirm Reversal</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}