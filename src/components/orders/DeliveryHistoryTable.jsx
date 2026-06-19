// frontend/src/components/orders/DeliveryHistoryTable.jsx
import React, { useState, useEffect } from 'react';
import api from '../../config/api';

export default function DeliveryHistoryTable({ onViewSession }) {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Assuming you added BULK_HISTORY to your ENDPOINTS in api.js, 
      // otherwise direct route string '/api/orders/bulk-history'
      const response = await api.get('/api/orders/bulk-history');
      
      if (response.data && response.data.success) {
        setSessions(response.data.data);
      } else {
        setError('Failed to load delivery history.');
      }
    } catch (err) {
      console.error("Error fetching delivery history:", err);
      setError('A network error occurred while fetching history.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mt-12 bg-white rounded-[2rem] border border-slate-200 p-8 flex justify-center items-center h-48 shadow-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-dark"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-12 bg-rose-50 rounded-[2rem] border border-rose-200 p-8 text-center shadow-sm">
        <p className="text-rose-600 font-medium">{error}</p>
        <button 
          onClick={fetchHistory}
          className="mt-4 px-4 py-2 bg-white text-rose-600 text-sm font-bold rounded-lg border border-rose-200 hover:bg-rose-100 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="mt-12 bg-white rounded-[2rem] border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Recent Delivery Sessions</h3>
          <p className="text-sm text-slate-500 font-medium mt-0.5">View or edit previously saved mass entry forms.</p>
        </div>
        <button 
          onClick={fetchHistory}
          className="p-2 text-slate-400 hover:text-brand-dark hover:bg-brand-light/10 rounded-full transition-colors"
          title="Refresh History"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-white border-b border-slate-100">
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest w-1/5 pl-6">Delivery Date</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest w-1/4">Location</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest w-1/4">Trip Name</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center w-1/6">Total Bags</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center w-24 pr-6">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm">
            {sessions.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-500 font-medium italic">
                  No recent delivery sessions found.
                </td>
              </tr>
            ) : (
              sessions.map((session) => (
                <tr key={session.sessionId} className="group hover:bg-slate-50 transition-colors">
                  <td className="p-4 pl-6 font-bold text-slate-900">
                    {new Date(session.deliveryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="p-4 font-semibold text-slate-700">
                    {session.location}
                  </td>
                  <td className="p-4 font-semibold text-slate-700">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs tracking-wide">
                      {session.trip}
                    </span>
                  </td>
                  <td className="p-4 text-center font-bold text-brand-dark">
                    {session.totalBags}
                  </td>
                  <td className="p-4 pr-6 text-center">
                    <button
                      onClick={() => onViewSession(session)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-brand-light hover:border-brand-light hover:shadow-sm transition-all duration-200"
                      title="Load this session into the form"
                    >
                      {/* Eye Icon */}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}