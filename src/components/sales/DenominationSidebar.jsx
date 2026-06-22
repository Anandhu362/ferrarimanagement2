// frontend/src/components/sales/DenominationSidebar.jsx
import React from 'react';

export default function DenominationSidebar({ denominations = {} }) {
  // Standard UAE denominations order ensures consistent layout
  const denomList = ['1000', '500', '200', '100', '50', '20', '10', '5', '1', '0.5'];

  // Calculate total cash exactly as represented by the physical notes
  const totalPhysicalCash = denomList.reduce((sum, denom) => {
    // Added radix 10 to parseInt for stricter parsing of aggregated strings
    const count = parseInt(denominations[denom], 10) || 0;
    return sum + (parseFloat(denom) * count);
  }, 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">Aggregated Cash</h2>
        <p className="text-xs font-medium text-slate-500 mt-1">Combined batch vault breakdown</p>
      </div>

      {/* Denomination List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="space-y-3">
          {denomList.map((denom) => {
            const count = parseInt(denominations[denom], 10) || 0;
            const totalValue = count * parseFloat(denom);
            
            // Dim rows with 0 count to highlight the actual cash held
            const isZero = count === 0;

            return (
              <div 
                key={denom} 
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  isZero 
                    ? 'border-transparent bg-slate-50/50 opacity-60 grayscale' 
                    : 'border-emerald-100 bg-emerald-50/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-xs ${
                    isZero ? 'bg-slate-200 text-slate-500' : 'bg-emerald-200 text-emerald-800'
                  }`}>
                    {denom}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Count</span>
                    <span className={`text-sm font-black ${isZero ? 'text-slate-500' : 'text-slate-800'}`}>
                      x {count}
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  <span className={`text-sm font-bold ${isZero ? 'text-slate-400' : 'text-slate-900'}`}>
                    {totalValue.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold ml-1">AED</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Total */}
      <div className="p-6 bg-[#2A2B3D] text-white border-t border-slate-800">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Batch Value</p>
            <p className="text-2xl font-black tracking-tight text-emerald-400">
              <span className="text-sm text-slate-400 font-medium mr-1">AED</span> 
              {totalPhysicalCash.toFixed(2)}
            </p>
          </div>
          <svg className="w-8 h-8 text-emerald-500/30 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
    </div>
  );
}