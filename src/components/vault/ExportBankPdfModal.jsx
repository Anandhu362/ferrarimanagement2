// frontend/src/components/vault/ExportBankPdfModal.jsx
import React, { useState } from 'react';
import PremiumCalendar from '../shared/PremiumCalendar';
import api from '../../config/api';
import { generateBankVaultPDF } from '../../utils/bankVaultPdfService';

export default function ExportBankPdfModal({ isOpen, onClose }) {
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
      const rawBranch = localStorage.getItem('active_branch');
      let activeBranch = 'Sharjha';
      if (rawBranch) {
        try {
          const parsed = JSON.parse(rawBranch);
          activeBranch = parsed?.id || parsed?.branchId || parsed;
        } catch (e) {
          activeBranch = rawBranch;
        }
      }
      if (typeof activeBranch === 'string') {
        activeBranch = activeBranch.replace(/['"]+/g, '').trim();
      }

      const formattedDate = typeof selectedDate === 'string' 
        ? selectedDate.split('T')[0] 
        : new Date(selectedDate).toISOString().split('T')[0];

      // 1. In parallel: Fetch Persistent Bank Summary, Date Snapshot, and Logs
      const [summaryRes, snapshotRes, logsRes] = await Promise.all([
        api.get(`/api/vault/bank-summary?branchId=${encodeURIComponent(activeBranch)}`).catch(() => ({ data: { totalBalance: 0 } })),
        api.get(`/api/vault/closing-balance?branchId=${encodeURIComponent(activeBranch)}&date=${encodeURIComponent(formattedDate)}`).catch(() => ({ data: {} })),
        api.get(`/api/vault/bank-logs?branchId=${encodeURIComponent(activeBranch)}&dates=${encodeURIComponent(formattedDate)}`).catch(() => ({ data: { data: [] } }))
      ]);

      const bankSummary = (summaryRes.data && summaryRes.data.success) ? summaryRes.data : { totalBalance: 0 };
      const closingSnapshot = (snapshotRes.data && snapshotRes.data.success) ? snapshotRes.data : {};
      const logs = (logsRes.data && logsRes.data.success) ? (logsRes.data.data || []) : [];

      // 2. Generate FinTech Audit-Grade Bank Statement PDF
      generateBankVaultPDF({
        branchId: activeBranch,
        selectedDate: formattedDate,
        bankSummary,
        closingSnapshot,
        logs
      });

      // Auto-close modal after trigger
      onClose();

    } catch (err) {
      console.error("[ERROR] [ExportBankPdfModal] PDF Generation Error:", err);
      setError('Bank PDF export failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
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
              Compiling Bank Audit Statement...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Download Bank Audit PDF
            </>
          )}
        </button>
      </div>
    </PremiumCalendar>
  );
}

