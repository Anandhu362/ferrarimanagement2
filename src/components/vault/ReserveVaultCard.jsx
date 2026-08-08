import React, { useState, useEffect } from 'react';
import api from '../../config/api';

// We explicitly restrict this component to track only the low-denomination float
const RESERVE_TIERS = [
  { value: 10, label: '10 AED', type: 'note' },
  { value: 5, label: '5 AED', type: 'note' },
  { value: 1, label: 'Mixed Coins', type: 'coin' },
];

export default function ReserveVaultCard() {
  const [vaultData, setVaultData] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReserveData = async () => {
      try {
        const activeBranch = localStorage.getItem('active_branch');
        if (!activeBranch) return;
        
        // Fetch strictly from the new reserve collection route
        const response = await api.get(`/api/vault/summary?branchId=${encodeURIComponent(activeBranch)}&vaultType=reserve`);
        const result = response.data;

        if (result.success) {
          let currentTotal = 0;
          
          // Map DB data specifically to our 3 reserve tiers
          const mergedData = RESERVE_TIERS.map(tier => {
            const dbMatch = result.data.find(row => parseFloat(row.denomination_value) === tier.value);
            const qty = dbMatch ? parseInt(dbMatch.total_quantity) : 0;
            const totalValue = qty * tier.value;
            
            currentTotal += totalValue;

            return { ...tier, qty, totalValue };
          });

          setTotalBalance(currentTotal);
          setVaultData(mergedData);
        }
      } catch (error) {
        console.error("Error fetching reserve vault data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReserveData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
        <span className="relative flex h-6 w-6 mb-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-200 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-6 w-6 bg-indigo-500"></span>
        </span>
        <p className="text-slate-400 text-sm font-medium tracking-wide animate-pulse">Syncing Reserve Float...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2rem] p-8 lg:p-10 border border-slate-100 shadow-sm flex flex-col relative overflow-hidden">
      {/* Decorative Background Accent */}
      <div className="absolute -right-16 -top-16 w-48 h-48 bg-indigo-50 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 relative z-10">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            Reserve Vault (Float)
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
          </h3>
          <p className="text-slate-500 text-xs mt-1 font-light tracking-wide">
            Isolated low-denomination stock for change-making.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Reserve</p>
          <p className="text-2xl font-bold text-slate-900">
            <span className="text-sm font-medium text-slate-400 mr-1">AED</span>
            {totalBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}
          </p>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 pb-4 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4 relative z-10">
        <div className="col-span-4 pl-2">Denomination</div>
        <div className="col-span-2 text-center">Qty</div>
        <div className="col-span-3 text-right">Value</div>
        <div className="col-span-3 text-right pr-2 hidden sm:block">Share</div>
      </div>

      {/* List */}
      <div className="flex-1 space-y-5 relative z-10">
        {vaultData.map((item, idx) => {
          const percentage = totalBalance > 0 ? (item.totalValue / totalBalance) * 100 : 0;

          return (
            <div key={idx} className="grid grid-cols-12 gap-4 items-center group">
              <div className="col-span-4 flex items-center gap-3">
                <div className={`w-8 h-6 rounded flex items-center justify-center text-[10px] font-bold ${item.type === 'note' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-100 text-slate-600 border border-slate-200 rounded-full w-7 h-7'}`}>
                  {item.type === 'note' ? '💵' : '🪙'}
                </div>
                <span className="text-sm font-medium text-slate-700">{item.label}</span>
              </div>
              
              <div className="col-span-2 flex justify-center">
                <span className="bg-slate-50 border border-slate-100 text-slate-600 text-xs font-medium px-4 py-1.5 rounded-xl">
                  {item.qty === 0 ? '-' : item.qty.toLocaleString()}
                </span>
              </div>
              
              <div className="col-span-6 sm:col-span-3 text-right font-semibold text-slate-900 text-sm">
                {item.totalValue === 0 ? '-' : item.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2})}
              </div>
              
              <div className="col-span-3 hidden sm:flex items-center justify-end pl-4">
                <div className="w-full bg-slate-50 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${percentage > 0 ? 'bg-indigo-400' : 'bg-slate-200'}`} 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}