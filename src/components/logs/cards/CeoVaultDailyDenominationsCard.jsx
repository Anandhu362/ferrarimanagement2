// frontend/src/components/logs/cards/CeoVaultDailyDenominationsCard.jsx
import React from 'react';

/**
 * CeoVaultDailyDenominationsCard - Displays the pre-aggregated closing denomination
 * snapshot of the physical CEO Vault for the selected date.
 * 
 * @param {Object} ceoVaultSummary - Pre-aggregated CEO Vault snapshot data from getCeoVaultDailyBalance
 * @param {Array} selectedDates - Array of active selected date strings
 * @param {boolean} loading - Loading indicator
 */
export default function CeoVaultDailyDenominationsCard({ ceoVaultSummary = null, selectedDates = [], loading = false }) {
  // If no date is selected, render placeholder state
  if (!selectedDates || selectedDates.length === 0) {
    return (
      <div className="bg-white rounded-[2rem] p-8 border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col items-center justify-center min-h-[300px] text-center">
        <div className="bg-slate-50 p-4 rounded-full mb-4">
          <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-slate-700 tracking-tight">CEO Safe Denominations</h3>
        <p className="text-xs text-slate-400 mt-1.5 font-light leading-relaxed max-w-[220px]">
          Select a date on the calendar to view the exact physical safe note distribution.
        </p>
      </div>
    );
  }

  const breakdown = ceoVaultSummary?.denominationBreakdown || [];
  const closingBalance = parseFloat(ceoVaultSummary?.closingBalance || 0);
  const hasDenominations = ceoVaultSummary?.hasDenominations && breakdown.length > 0;

  // Format header date label
  const formattedDate = selectedDates.length === 1 
    ? new Date(selectedDates[0]).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : `${selectedDates.length} Selected Dates`;

  return (
    <div className={`bg-white rounded-[2rem] p-5 sm:p-6 lg:p-7 border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col transition-all duration-300 ${loading || !hasDenominations ? 'min-h-[300px]' : 'h-fit'}`}>
      
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight">CEO Vault Denominations</h3>
            <span className="text-[10px] font-bold text-brand-dark/70 bg-brand-dark/5 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Closing Safe
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-light flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            Physical note distribution as of {formattedDate}
          </p>
        </div>

        <div className="p-2 sm:p-2.5 bg-slate-50 rounded-xl text-slate-400 shrink-0">
          <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
      </div>

      {loading ? (
        // Loading State
        <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-8">
          <span className="relative flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-brand-dark"></span>
          </span>
          <p className="text-[11px] text-slate-400 font-medium tracking-widest uppercase">Loading Vault Distribution...</p>
        </div>
      ) : !hasDenominations ? (
        // Historical / Unlogged Denominations State
        <div className="flex-1 flex flex-col items-center justify-center text-center py-6 px-4">
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-2">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-700">Archived Historical Record</p>
          <p className="text-xs text-slate-400 mt-1 font-light leading-relaxed max-w-[260px]">
            Physical note breakdowns were archived before audit calibration. Closing balance remains preserved at <span className="font-semibold text-slate-700">AED {closingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>.
          </p>
        </div>
      ) : (
        // Populated Denomination Table State
        <div className="flex flex-col mt-1">
          
          <div className="space-y-2.5">
            {/* Table Header */}
            <div className="grid grid-cols-12 text-[10px] font-semibold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 px-1">
              <span className="col-span-4">Note / Coin</span>
              <span className="col-span-2 text-center">Qty</span>
              <span className="col-span-3 text-right">Value (AED)</span>
              <span className="col-span-3 text-right">Share</span>
            </div>

            {/* List Items */}
            <div className="space-y-2 mt-1">
              {breakdown.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 items-center text-sm group hover:bg-slate-50/60 p-1 rounded-lg transition-colors">
                  
                  {/* Note Label */}
                  <div className="col-span-4 flex items-center gap-1.5 sm:gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.noteValue >= 100 ? 'bg-indigo-500' : (item.noteValue >= 10 ? 'bg-emerald-500' : 'bg-amber-400')}`}></span>
                    <span className="font-medium text-slate-700 text-xs sm:text-sm truncate">{item.label}</span>
                  </div>

                  {/* Quantity */}
                  <div className="col-span-2 text-center">
                    <span className="bg-slate-100/70 border border-slate-200/50 text-slate-700 text-[11px] sm:text-xs font-bold px-1.5 py-0.5 rounded-md">
                      {item.quantity.toLocaleString()}
                    </span>
                  </div>

                  {/* Total Value */}
                  <div className="col-span-3 text-right font-semibold text-slate-900 text-xs sm:text-sm whitespace-nowrap">
                    {item.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>

                  {/* Share Bar & Percentage */}
                  <div className="col-span-3 flex items-center justify-end gap-1.5">
                    <div className="w-8 xl:w-10 bg-slate-100 h-1.5 rounded-full overflow-hidden hidden md:block shrink-0">
                      <div 
                        className="bg-brand-dark h-full rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, Math.max(item.percentage, item.quantity > 0 ? 4 : 0))}%` }}
                      ></div>
                    </div>
                    <span className="text-[11px] font-medium text-slate-500 text-right shrink-0">
                      {item.percentage}%
                    </span>
                  </div>

                </div>
              ))}
            </div>
          </div>

          {/* Grand Total Safe Cash Footer */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex justify-between items-end">
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                CEO Safe Closing Total
              </span>
              <span className="text-xs text-slate-400 font-light flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                In Safe Parity
              </span>
            </div>
            <div className="text-2xl font-bold tracking-tighter text-slate-900">
              <span className="text-sm font-medium text-slate-400 mr-1 tracking-normal">AED</span>
              {closingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
