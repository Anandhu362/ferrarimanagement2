import React from 'react';

/**
 * DailySummaryCards - High-visibility financial snapshots for selected dates.
 * Organized into two dedicated rows:
 * - Row 1 (Executive Vault Cards): 2 spacious columns for CEO Vault Balance & Daily Audit.
 * - Row 2 (Transaction Volume Cards): 4 balanced columns for Inflows, Expenses, Exchanges & Transfers.
 * Strictly gradient-free, emoji-free, with zero truncation on numeric balances.
 * 
 * @param {Array} logs - The filtered logs for the selected date.
 * @param {Object} ceoVaultSummary - Pre-aggregated CEO Vault snapshot data.
 * @param {Array} selectedDates - Array of active selected date strings.
 */
export default function DailySummaryCards({ logs = [], ceoVaultSummary = null, selectedDates = [] }) {
  // Logic to aggregate totals based on transaction type
  const totals = logs.reduce((acc, trx) => {
    const amount = parseFloat(trx.amount || 0);
    const type = trx.type;

    if (type === 'INFLOW' || type === 'TEMP_INFLOW') {
      acc.inflow += amount;
    } else if (type === 'OUTFLOW' || type === 'EXPENSE') {
      // Force absolute value so mixed signs in the database add up correctly
      acc.outflow += Math.abs(amount); 
    } else if (type === 'EXCHANGE') {
      acc.exchange += amount;
    } else if (type === 'TRANSFER') {
      acc.transfer += amount;
    }
    
    return acc;
  }, { inflow: 0, outflow: 0, exchange: 0, transfer: 0 });

  // CEO Vault Snapshot Numbers
  const closingBalance = ceoVaultSummary ? (parseFloat(ceoVaultSummary.closingBalance) || 0) : 0;
  const reserveBalance = ceoVaultSummary ? (parseFloat(ceoVaultSummary.reserveVaultBalance) || 0) : 0;
  const pettyCashBalance = ceoVaultSummary ? (parseFloat(ceoVaultSummary.pettyCashBalance) || 0) : 0;
  const openingBalance = ceoVaultSummary ? (parseFloat(ceoVaultSummary.openingBalance) || 0) : 0;
  const currentBalance = ceoVaultSummary ? (parseFloat(ceoVaultSummary.currentBalance) || closingBalance) : 0;

  // Format active date string for header
  const dateLabel = selectedDates.length === 1
    ? new Date(selectedDates[0]).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : (selectedDates.length > 1 ? `${selectedDates.length} Dates Selected` : 'Day Snapshot');

  const summaryData = [
    { 
      label: 'Total Inflow', 
      value: totals.inflow, 
      color: 'text-emerald-700', 
      bg: 'bg-[#F0FDF4]', 
      border: 'border-[#BBF7D0]',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    },
    { 
      label: 'Outflow / Expenses', 
      value: totals.outflow, 
      color: 'text-rose-700', 
      bg: 'bg-[#FFF1F2]', 
      border: 'border-[#FECDD3]',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
        </svg>
      )
    },
    { 
      label: 'Net Currency Exchange', 
      value: totals.exchange, 
      color: 'text-amber-700', 
      bg: 'bg-[#FFFBEB]', 
      border: 'border-[#FDE68A]',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      )
    },
    { 
      label: 'Total Transfers', 
      value: totals.transfer, 
      color: 'text-blue-700', 
      bg: 'bg-[#EFF6FF]', 
      border: 'border-[#BFDBFE]',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      )
    }
  ];

  return (
    <div className="mb-6 space-y-4 lg:space-y-5">
      
      {/* ROW 1: EXECUTIVE VAULT STATUS CARDS (2 COLUMNS FOR MAXIMUM WIDTH & ZERO TRUNCATION) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
        
        {/* CARD 1: CEO VAULT BALANCE & SUB-VAULT ALLOCATIONS */}
        <div className="bg-[#1E1B2E] rounded-[1.75rem] p-6 text-white border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/60 text-xs font-semibold tracking-wider uppercase">CEO Vault Total Balance</span>
              <span className="text-[11px] font-bold text-white/80 bg-white/10 px-3 py-1 rounded-lg uppercase tracking-wider">{dateLabel}</span>
            </div>

            <div className="flex items-baseline gap-2 my-2">
              <span className="text-base lg:text-lg font-medium text-white/50">AED</span>
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-none whitespace-nowrap">
                {closingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 mt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
              <span>Live Safe Cash Connected</span>
            </div>
          </div>

          {/* Sub-Vault Allocation Breakdown (3 Spacious Dedicated Containers) */}
          <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-[11px] text-white/50 block font-medium uppercase tracking-wider mb-1">CEO Safe Cash</span>
              <span className="text-sm font-bold text-white tracking-tight whitespace-nowrap">
                AED {closingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-[11px] text-white/50 block font-medium uppercase tracking-wider mb-1">Reserve Vault</span>
              <span className="text-sm font-bold text-white tracking-tight whitespace-nowrap">
                AED {reserveBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-[11px] text-white/50 block font-medium uppercase tracking-wider mb-1">Petty Cash</span>
              <span className="text-sm font-bold text-white tracking-tight whitespace-nowrap">
                AED {pettyCashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* CARD 2: CEO VAULT DAILY AUDIT (OPENING, CLOSING, CURRENT & NET) */}
        <div className="bg-[#1E1B2E] rounded-[1.75rem] p-6 text-white border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/60 text-xs font-semibold tracking-wider uppercase">CEO Vault Daily Audit</span>
              <span className="text-[11px] font-bold text-white/80 bg-white/10 px-3 py-1 rounded-lg uppercase tracking-wider">{dateLabel}</span>
            </div>

            {/* Opening & Closing Balance Side-by-Side Containers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <span className="text-[11px] text-white/50 uppercase tracking-wider font-semibold block mb-1">Daily Opening Balance</span>
                <p className="text-xl sm:text-2xl font-bold text-white tracking-tight whitespace-nowrap">
                  <span className="text-xs text-white/50 font-normal mr-1">AED</span>
                  {openingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <span className="text-[11px] text-white/50 uppercase tracking-wider font-semibold block mb-1">Daily Closing Balance</span>
                <p className="text-xl sm:text-2xl font-bold text-white tracking-tight whitespace-nowrap">
                  <span className="text-xs text-white/50 font-normal mr-1">AED</span>
                  {closingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Current Safe Cash & Day Net Movement Symmetrical Footer */}
          <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 bg-white/5 px-3.5 py-2 rounded-xl border border-white/10">
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
              <span className="text-white/70">Current Safe Cash: <strong className="text-white font-bold ml-1">AED {currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
            </div>

            <div className="flex items-center gap-2 bg-white/5 px-3.5 py-2 rounded-xl border border-white/10">
              <span className="text-white/70">Day Net Movement:</span>
              <strong className={`font-bold ml-1 ${closingBalance >= openingBalance ? 'text-emerald-400' : 'text-rose-400'}`}>
                {closingBalance >= openingBalance ? '+' : ''}{(closingBalance - openingBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED
              </strong>
            </div>
          </div>
        </div>

      </div>

      {/* ROW 2: TRANSACTION FLOW SUMMARY CARDS (4 BALANCED COLUMNS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        {summaryData.map((card, index) => (
          <div 
            key={index} 
            className={`p-6 rounded-[1.75rem] border ${card.bg} ${card.border} shadow-sm transition-all hover:shadow-md flex flex-col justify-between min-h-[155px]`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm border border-slate-100 ${card.color}`}>
                {card.icon}
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white/80 px-2.5 py-1 rounded-md border border-slate-200/50">Live Summary</span>
            </div>
            
            <div>
              <span className="text-slate-600 text-xs font-semibold block mb-1.5">{card.label}</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs font-bold text-slate-400">AED</span>
                <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight whitespace-nowrap ${card.color}`}>
                  {card.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}