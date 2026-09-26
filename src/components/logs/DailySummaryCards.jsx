import React from 'react';

/**
 * DailySummaryCards - High-fidelity financial snapshots for a specific date.
 * Features the featured Dark Container for the CEO Vault Closing Balance (Image 3 Style)
 * alongside categorized daily transactional metrics.
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

  // Format active date string for header
  const dateLabel = selectedDates.length === 1
    ? new Date(selectedDates[0]).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : (selectedDates.length > 1 ? `${selectedDates.length} Dates` : 'Day Snapshot');

  const summaryData = [
    { 
      label: 'Total Inflow', 
      value: totals.inflow, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50/50', 
      border: 'border-emerald-100',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    },
    { 
      label: 'Outflow / Exp', 
      value: totals.outflow, 
      color: 'text-rose-600', 
      bg: 'bg-rose-50/50', 
      border: 'border-rose-100',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
        </svg>
      )
    },
    { 
      label: 'Net Exchange', 
      value: totals.exchange, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50/50', 
      border: 'border-amber-100',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      )
    },
    { 
      label: 'Total Transfers', 
      value: totals.transfer, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50/50', 
      border: 'border-blue-100',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      )
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6 animate-in fade-in slide-in-from-top-4 duration-700">
      
      {/* 🏛️ FEATURED CARD: CEO VAULT CLOSING BALANCE */}
      <div className="bg-brand-dark rounded-[2rem] p-5 lg:p-6 text-white relative overflow-hidden shadow-[0_12px_40px_rgb(43,38,64,0.3)] transition-all hover:shadow-[0_16px_48px_rgb(43,38,64,0.4)] flex flex-col justify-between">
        {/* Ambient Glow Orbs */}
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-brand-light/30 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
              <p className="text-white/60 text-[10px] sm:text-[11px] font-medium tracking-widest uppercase">CEO Vault Balance</p>
              <span className="text-[10px] font-bold text-white/50 tracking-wider uppercase bg-white/10 px-2 py-0.5 rounded-full">{dateLabel}</span>
            </div>

            <h3 className="text-2xl sm:text-3xl xl:text-[1.85rem] 2xl:text-[2.1rem] font-semibold tracking-tighter leading-tight mt-1 whitespace-nowrap">
              <span className="text-base sm:text-lg text-white/50 font-light mr-1 tracking-normal">AED</span>
              {closingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {/* Live Data Badge */}
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-medium text-emerald-300 bg-emerald-400/10 backdrop-blur-md w-fit px-2.5 py-1 rounded-xl border border-emerald-400/20">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span>Live Data Connected</span>
            </div>

            {/* Breakdown Pill */}
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-medium text-white/70 bg-white/5 px-2.5 py-1 rounded-xl border border-white/10 w-fit flex-wrap">
              <span>CEO: <span className="text-white tracking-wide">AED {closingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
              <span className="w-px h-3 bg-white/20"></span>
              <span>Res: <span className="text-white tracking-wide">AED {reserveBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 THE 4 CATEGORIZED SUMMARY CARDS */}
      {summaryData.map((card, index) => (
        <div 
          key={index} 
          className={`p-4 sm:p-5 lg:p-5 2xl:p-6 rounded-[2rem] border ${card.bg} ${card.border} backdrop-blur-sm shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2 sm:p-2.5 rounded-xl bg-white shadow-sm ${card.color}`}>
              {card.icon}
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Summary</span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-slate-500 text-xs font-medium mb-1">{card.label}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] font-bold text-slate-400">AED</span>
              <span className={`text-xl lg:text-2xl font-bold tracking-tight whitespace-nowrap ${card.color}`}>
                {card.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}