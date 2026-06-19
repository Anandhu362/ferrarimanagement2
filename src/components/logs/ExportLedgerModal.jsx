// frontend/src/components/logs/ExportLedgerModal.jsx
import React, { useState } from 'react';
import PremiumCalendar from '../shared/PremiumCalendar';
import api from '../../config/api'; 

export default function ExportLedgerModal({ isOpen, onClose }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!selectedDate) {
      setError('Select a date first');
      return;
    }

    setIsDownloading(true);
    setError(null);

    try {
      const activeBranch = localStorage.getItem('active_branch') || 'DXB-MAIN';
      
      const formattedDate = typeof selectedDate === 'string' 
        ? selectedDate 
        : new Date(selectedDate).toISOString().split('T')[0];

      const response = await api.get('/api/logs/export/daily', {
        params: { branchId: activeBranch, date: formattedDate },
        responseType: 'blob' 
      });

      const blob = response.data;
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `Master-Ledger-${formattedDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      // Auto-close after successful download
      onClose(); 
      
    } catch (err) {
      console.error("Download Error:", err);
      setError('Export failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="relative">
      <PremiumCalendar 
        isOpen={isOpen} 
        onClose={onClose} 
        selectedDate={selectedDate}
        onDateSelect={(date) => {
          setSelectedDate(date);
          setError(null);
        }}
      >
        {/* ✅ This block acts as the "children" and renders inside the Calendar */}
        <div className="mt-4 pt-4 border-t border-slate-50 space-y-3">
          {error && (
            <p className="text-center text-rose-500 text-[10px] font-bold uppercase tracking-widest">
              {error}
            </p>
          )}
          
          <button 
            onClick={(e) => {
                e.stopPropagation();
                handleDownload();
            }}
            disabled={isDownloading || !selectedDate}
            className={`w-full py-3 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
              !selectedDate || isDownloading
                ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                : 'bg-slate-900 text-white hover:bg-black active:scale-95 shadow-md hover:shadow-lg'
            }`}
          >
            {isDownloading ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              'Download Excel'
            )}
          </button>
        </div>
      </PremiumCalendar>
    </div>
  );
}