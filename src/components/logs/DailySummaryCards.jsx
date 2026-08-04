import React from 'react';

/**
 * DailySummaryCards - High-fidelity financial snapshots for a specific date.
 * @param {Array} logs - The filtered logs for the selected date.
 */
export default function DailySummaryCards({ logs = [] }) {
  // Logic to aggregate totals based on transaction type
  const totals = logs.reduce((acc, trx) => {
    const amount = parseFloat(trx.amount || 0);
    const type = trx.type;

    if (type === 'INFLOW' || type === 'TEMP_INFLOW') {
        acc.inflow += amount;
    } else if (type === 'OUTFLOW' || type === 'EXPENSE') {
        // ✅ FIX: Force absolute value so mixed signs in the database add up correctly
        acc.outflow += Math.abs(amount); 
    } else if (type === 'EXCHANGE') {
        acc.exchange += amount;
    } else if (type === 'TRANSFER') {
        acc.transfer += amount;
    }
    
    return acc;
  }, { inflow: 0, outflow: 0, exchange: 0, transfer: 0 });

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
      {summaryData.map((card, index) => (
        <div 
          key={index} 
          className={`p-6 rounded-[1.5rem] border ${card.bg} ${card.border} backdrop-blur-sm shadow-sm transition-all hover:shadow-md hover:-translate-y-1`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2.5 rounded-xl bg-white shadow-sm ${card.color}`}>
              {card.icon}
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Summary</span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-slate-500 text-xs font-medium mb-1">{card.label}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] font-bold text-slate-400">AED</span>
              <span className={`text-2xl font-bold tracking-tight ${card.color}`}>
                {card.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}