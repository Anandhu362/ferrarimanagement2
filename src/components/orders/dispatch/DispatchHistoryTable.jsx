import React, { useState, useEffect } from 'react';
import api from '../../../config/api';

export default function DispatchHistoryTable() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Fetch dispatch history on component mount
  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/orders/dispatch/history');
      if (response.data && response.data.success) {
        setHistory(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch dispatch history", err);
      setError("Failed to load dispatch records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Toggle individual row expansion
  const toggleRow = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // Helper to cleanly format the Dispatch ID
  const displayId = (id) => {
    if (!id) return 'N/A';
    return id.includes('-') ? id.split('-').pop().toUpperCase() : id.substring(0, 6).toUpperCase();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-12 flex flex-col items-center justify-center min-h-[300px] mt-8">
        <div className="w-8 h-8 border-4 border-brand-light/30 border-t-brand-light rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium text-slate-500 animate-pulse">Loading dispatch ledger...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-12 flex flex-col items-center justify-center mt-8">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <p className="text-slate-700 font-semibold">{error}</p>
        <button onClick={fetchHistory} className="mt-4 text-sm text-brand-light font-bold hover:underline">Try Again</button>
      </div>
    );
  }

  return (
    <div className="mt-8 animate-in fade-in duration-500">
      <div className="mb-5 flex justify-between items-end px-2">
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Dispatch Ledger</h3>
          <p className="text-xs text-slate-500 font-medium mt-1">Historical record of all routed and loaded vehicles.</p>
        </div>
        <button 
          onClick={fetchHistory}
          className="text-xs font-bold text-slate-400 hover:text-brand-light flex items-center gap-1.5 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        {history.length === 0 ? (
           <div className="py-20 flex flex-col items-center justify-center text-slate-400">
             <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17l6-6-6-6M3 17l6-6-6-6" /></svg>
             <p className="text-sm font-medium">No dispatch history recorded yet.</p>
           </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-slate-50/50">
                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-5">Dispatch ID / Date</th>
                  <th className="px-6 py-5">Trip Name</th>
                  <th className="px-6 py-5">Location</th>
                  <th className="px-6 py-5 text-center">Utilization</th>
                  <th className="px-6 py-5 text-center">Status</th>
                  <th className="px-6 py-5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {history.map((trip) => {
                  const isExpanded = expandedRows.has(trip.id);
                  const utilPercentage = trip.vehicleCapacity > 0 
                    ? Math.min(100, Math.round((trip.totalLoaded / trip.vehicleCapacity) * 100)) 
                    : 0;

                  return (
                    <React.Fragment key={trip.id}>
                      <tr className={`hover:bg-slate-50/50 transition-colors group cursor-pointer ${isExpanded ? 'bg-slate-50/30' : ''}`} onClick={() => toggleRow(trip.id)}>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 tracking-tight">#{displayId(trip.id)}</span>
                            <span className="text-[11px] text-slate-500 mt-1">
                              {trip.dispatchDate ? new Date(trip.dispatchDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                            </span>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          {trip.tripName}
                        </td>

                        <td className="px-6 py-4">
                          <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider">
                            {trip.location || 'MIXED'}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-col items-center justify-center">
                            <span className="text-xs font-bold text-brand-dark mb-1">
                              {trip.totalLoaded} <span className="text-[10px] text-slate-400 font-medium">/ {trip.vehicleCapacity}</span>
                            </span>
                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${utilPercentage >= 100 ? 'bg-rose-400' : utilPercentage > 85 ? 'bg-amber-400' : 'bg-emerald-400'}`} 
                                style={{ width: `${utilPercentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center">
                           <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase">
                             {trip.status || 'DISPATCHED'}
                           </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button 
                            className="w-8 h-8 inline-flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 group-hover:border-brand-light group-hover:text-brand-light transition-all"
                          >
                            <svg className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Items Details Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/50 border-t border-slate-100">
                          <td colSpan="6" className="p-0">
                            <div className="px-8 py-6 shadow-inner">
                              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Loaded Inventory Manifest</h4>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {trip.items && trip.items.length > 0 ? (
                                  trip.items.map((item, idx) => (
                                    <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3 flex justify-between items-center">
                                      <div className="flex flex-col min-w-0 pr-3">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 truncate">{item.orderId.split('-').pop()}</span>
                                        <span className="text-sm font-bold text-slate-900 truncate" title={item.companyName}>{item.companyName}</span>
                                        <span className="text-xs text-slate-500 truncate mt-0.5">{item.product}</span>
                                      </div>
                                      <div className="shrink-0 bg-brand-bg text-brand-dark px-3 py-1.5 rounded-lg text-sm font-bold border border-brand-light/10">
                                        {item.qtyLoaded}
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-sm text-slate-500 italic">No specific item data recorded for this trip.</div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}