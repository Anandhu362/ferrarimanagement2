// frontend/src/components/agent/RecentCollections.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';

export default function RecentCollections({ agentName }) {
  const [recentRecords, setRecentRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!agentName) return;

    setIsLoading(true);
    
    // Query collections where agent matches, order by newest, limit to 5
    const q = query(
      collection(db, 'collections'),
      where('agentName', '==', agentName),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecentRecords(records);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching recent collections:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [agentName]);

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="mt-8 border-t border-slate-100 pt-6 animate-pulse">
        <div className="h-4 w-40 bg-slate-200 rounded mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-slate-50 rounded-xl w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (recentRecords.length === 0) {
    return null; // Don't show the section if they have no history
  }

  return (
    <div className="mt-8 border-t border-slate-100 pt-6 animate-in fade-in duration-500">
      <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">
        Your Recent Submissions
      </h3>
      
      <div className="flex flex-col gap-3">
        {recentRecords.map((record) => (
          <div 
            key={record.id} 
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-slate-100/80 bg-slate-50/50 hover:bg-slate-50 transition-colors gap-3 sm:gap-0"
          >
            {/* Left Side: Company & Date */}
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-800 line-clamp-1">
                {record.companyName}
              </span>
              <span className="text-xs font-medium text-slate-400 mt-0.5">
                {formatDateForDisplay(record.date)}
              </span>
            </div>

            {/* Right Side: Invoice Pill & Amount */}
            <div className="flex items-center justify-between sm:justify-end gap-4">
              <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-md text-xs font-mono text-slate-500 shadow-sm">
                {record.invoiceNumber}
              </span>
              
              <div className="text-right flex flex-col items-end min-w-[80px]">
                <span className="text-sm font-bold text-emerald-600">
                  <span className="text-[10px] mr-0.5 font-medium text-emerald-600/60">AED</span>
                  {parseFloat(record.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                
                {/* Status Indicator */}
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${record.status === 'VERIFIED' ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    {record.status === 'VERIFIED' ? 'Vaulted' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}