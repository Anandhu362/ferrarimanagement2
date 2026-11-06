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
  const accountantBalance = ceoVaultSummary ? (parseFloat(ceoVaultSummary.accountantVaultBalance) || 0) : 0;
  const reserveBalance = ceoVaultSummary ? (parseFloat(ceoVaultSummary.reserveVaultBalance) || 0) : 0;
  const pettyCashBalance = ceoVaultSummary ? (parseFloat(ceoVaultSummary.pettyCashBalance) || 0) : 0;
  const openingBalance = ceoVaultSummary ? (parseFloat(ceoVaultSummary.openingBalance) || 0) : 0;
  const currentBalance = ceoVaultSummary ? (parseFloat(ceoVaultSummary.currentBalance) || closingBalance) : 0;
  const ceoSafeBalance = ceoVaultSummary ? (parseFloat(ceoVaultSummary.ceoSafeBalance ?? ceoVaultSummary.currentBalance) || closingBalance) : 0;
  // Total Branch Cash aggregate balance = CEO Safe Cash + Accountant Vault + Reserve Vault + Petty Cash
  const totalCeoVaultBalance = (ceoVaultSummary && typeof (ceoVaultSummary.totalCeoVaultBalance ?? ceoVaultSummary.totalBranchCash) === 'number')
    ? (ceoVaultSummary.totalCeoVaultBalance ?? ceoVaultSummary.totalBranchCash)
    : (closingBalance + accountantBalance + reserveBalance + pettyCashBalance);

  const netMovement = (ceoVaultSummary && typeof ceoVaultSummary.netChange === 'number')
    ? ceoVaultSummary.netChange
    : (closingBalance - openingBalance);

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
      
      {/* ROW 1: EXECUTIVE TOTAL BRANCH CASH & SUB-VAULT ALLOCATIONS (SINGLE COMPACT FINTECH BANNER) */}
      <div className="bg-[#1E1B2E] rounded-[1.75rem] p-5 sm:p-6 text-white border border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        
        {/* Left Section: Hero Total Branch Cash */}
        <div className="shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-white/60 text-xs font-semibold tracking-wider uppercase">Total Branch Cash (All Vaults)</span>
            <span className="text-[10px] font-bold text-white/80 bg-white/10 px-2.5 py-0.5 rounded-md uppercase tracking-wider">{dateLabel}</span>
          </div>

          <div className="flex items-baseline gap-2 my-1">
            <span className="text-base font-medium text-white/50">AED</span>
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-none whitespace-nowrap">
              {totalCeoVaultBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 mt-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
            <span>Live Safe Cash Connected</span>
          </div>
        </div>

        {/* Right Section: 4 Sub-Vault Allocation Containers Side-by-Side */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 w-full lg:max-w-2xl">
          <div className="bg-white/5 p-3 rounded-2xl border border-white/10 hover:border-white/20 transition-colors">
            <span className="text-[10px] text-white/50 block font-medium uppercase tracking-wider mb-1">CEO Safe Cash</span>
            <span className="text-sm sm:text-base font-bold text-white tracking-tight whitespace-nowrap">
              AED {ceoSafeBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="bg-white/5 p-3 rounded-2xl border border-white/10 hover:border-white/20 transition-colors">
            <span className="text-[10px] text-white/50 block font-medium uppercase tracking-wider mb-1">Accountant Vault</span>
            <span className="text-sm sm:text-base font-bold text-white tracking-tight whitespace-nowrap">
              AED {accountantBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="bg-white/5 p-3 rounded-2xl border border-white/10 hover:border-white/20 transition-colors">
            <span className="text-[10px] text-white/50 block font-medium uppercase tracking-wider mb-1">Reserve Vault</span>
            <span className="text-sm sm:text-base font-bold text-white tracking-tight whitespace-nowrap">
              AED {reserveBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="bg-white/5 p-3 rounded-2xl border border-white/10 hover:border-white/20 transition-colors">
            <span className="text-[10px] text-white/50 block font-medium uppercase tracking-wider mb-1">Petty Cash</span>
            <span className="text-sm sm:text-base font-bold text-white tracking-tight whitespace-nowrap">
              AED {pettyCashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
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