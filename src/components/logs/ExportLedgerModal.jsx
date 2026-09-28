// frontend/src/components/logs/ExportLedgerModal.jsx
import React, { useState } from 'react';
import PremiumCalendar from '../shared/PremiumCalendar';
import api from '../../config/api'; 
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { generateMasterLedgerPDF } from '../../utils/masterLedgerPdfService';

export default function ExportLedgerModal({ isOpen, onClose }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleDownloadPDF = async () => {
    if (!selectedDate) {
      setError('Select a date first');
      return;
    }

    setIsDownloading(true);
    setError(null);

    try {
      const activeBranch = localStorage.getItem('active_branch') || 'Sharjha';
      
      const formattedDate = typeof selectedDate === 'string' 
        ? selectedDate 
        : new Date(selectedDate).toISOString().split('T')[0];

      // 1. Fetch Daily Ledger Logs & CEO Vault Summary
      const ledgerRes = await api.get('/api/logs/daily', {
        params: { branchId: activeBranch, dates: formattedDate }
      });

      const logs = (ledgerRes.data && ledgerRes.data.data) ? ledgerRes.data.data : [];
      const ceoVaultSummary = (ledgerRes.data && ledgerRes.data.ceoVaultSummary) ? ledgerRes.data.ceoVaultSummary : null;

      // 2. Fetch Collection Daily Breakdown Denominations from Firestore
      const aggregatedDenoms = {};
      try {
        const denomDocRef = doc(db, 'branches', activeBranch, 'daily_denominations', formattedDate);
        const denomSnap = await getDoc(denomDocRef);
        if (denomSnap.exists()) {
          const dData = denomSnap.data();
          Object.entries(dData).forEach(([key, qty]) => {
            if (key.startsWith('notes.')) {
              const noteValue = key.replace('notes.', '');
              const numericQty = parseInt(qty, 10);
              aggregatedDenoms[noteValue] = (aggregatedDenoms[noteValue] || 0) + numericQty;
            }
          });
        }
      } catch (denomErr) {
        console.warn('[WARN] Could not fetch daily_denominations:', denomErr);
      }

      const dailyDenominations = [];
      Object.entries(aggregatedDenoms).forEach(([noteValue, totalQty]) => {
        if (totalQty > 0) {
          const numericNote = noteValue === 'Coins' ? 1 : parseFloat(noteValue);
          dailyDenominations.push({
            denomination: noteValue === 'Coins' ? 'Coins' : `${numericNote} AED`,
            note: noteValue,
            quantity: totalQty,
            totalValue: numericNote * totalQty
          });
        }
      });

      dailyDenominations.sort((a, b) => {
        const valA = a.note === 'Coins' ? 1 : parseFloat(a.note);
        const valB = b.note === 'Coins' ? 1 : parseFloat(b.note);
        return valB - valA;
      });

      // 3. Generate FinTech Audit-Grade PDF
      generateMasterLedgerPDF({
        branchId: activeBranch,
        selectedDate: formattedDate,
        logs,
        ceoVaultSummary,
        dailyDenominations
      });

      // Auto-close after download
      onClose(); 
      
    } catch (err) {
      console.error("[ERROR] PDF Export Error:", err);
      setError('PDF generation failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Optional Excel fallback
  const handleDownloadExcel = async () => {
    if (!selectedDate) return;
    setIsDownloading(true);
    try {
      const activeBranch = localStorage.getItem('active_branch') || 'Sharjha';
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
      onClose();
    } catch (err) {
      console.error("[ERROR] Excel Export Error:", err);
      setError('Excel export failed.');
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
        selectedDates={selectedDate ? (Array.isArray(selectedDate) ? selectedDate : [selectedDate]) : []}
        onDateSelect={(date) => {
          const resolvedDate = Array.isArray(date) ? date[0] : date;
          setSelectedDate(resolvedDate);
          setError(null);
        }}
        accentColor="rose"
      >
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
          {error && (
            <p className="text-center text-rose-500 text-[10px] font-bold uppercase tracking-widest">
              {error}
            </p>
          )}

          {/* Primary FinTech PDF Button */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleDownloadPDF();
            }}
            disabled={isDownloading || !selectedDate}
            className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
              !selectedDate || isDownloading
                ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                : 'bg-rose-600 text-white hover:bg-rose-700 active:scale-95 shadow-md shadow-rose-600/20 hover:shadow-lg hover:shadow-rose-600/30'
            }`}
          >
            {isDownloading ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Compiling Audit Report...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Download Audit PDF Report
              </>
            )}
          </button>

          {/* Secondary Excel fallback */}
          {selectedDate && !isDownloading && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownloadExcel();
              }}
              className="w-full text-center text-[10px] text-slate-400 hover:text-slate-600 font-semibold transition-colors"
            >
              Export as Excel (.xlsx) instead
            </button>
          )}
        </div>
      </PremiumCalendar>
    </div>
  );
}