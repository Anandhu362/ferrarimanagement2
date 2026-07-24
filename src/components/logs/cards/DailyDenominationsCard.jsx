// frontend/src/components/logs/cards/DailyDenominationsCard.jsx
import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore'; 
import { db } from '../../../config/firebase'; // Double check this path matches your project structure

export default function DailyDenominationsCard({ selectedDates = [] }) {
  const [denominations, setDenominations] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If no dates are selected, clear the data and don't fetch
    if (!selectedDates || selectedDates.length === 0) {
      setDenominations([]);
      setGrandTotal(0);
      return;
    }

    const fetchDailyDenoms = async () => {
      setLoading(true);
      try {
        const activeBranch = localStorage.getItem('active_branch') || 'DXB-MAIN';
        let totalSum = 0;
        const aggregatedDenoms = {}; // Map to accumulate quantities across multiple days
        
        // 1. Map each selected date to a Firestore getDoc promise
        const promises = selectedDates.map(dateStr => {
          const dateObj = new Date(dateStr);
          // BULLETPROOF DATE FORMATTING: Ensures strict "YYYY-MM-DD" matching
          const formattedDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
          
          const docRef = doc(db, 'branches', activeBranch, 'daily_denominations', formattedDate);
          return getDoc(docRef);
        });

        // 2. Execute all document fetches in parallel
        const snapshots = await Promise.all(promises);

        // 3. Merge the quantities from all existing documents
        snapshots.forEach(docSnap => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            
            Object.entries(data).forEach(([key, qty]) => {
              if (key.startsWith('notes.')) {
                // Extract the denomination part (e.g., "1000" from "notes.1000")
                const noteValue = key.replace('notes.', '');
                const numericQty = parseInt(qty, 10);
                
                // Aggregate the quantity
                if (aggregatedDenoms[noteValue]) {
                  aggregatedDenoms[noteValue] += numericQty;
                } else {
                  aggregatedDenoms[noteValue] = numericQty;
                }
              }
            });
          }
        });

        const formattedBreakdown = [];
        
        // 4. Calculate totals for the aggregated quantities
        Object.entries(aggregatedDenoms).forEach(([noteValue, totalQty]) => {
          const numericNote = noteValue === 'Coins' ? 1 : parseFloat(noteValue);
          const rowTotal = numericNote * totalQty;
          
          totalSum += rowTotal;

          formattedBreakdown.push({
            denomination: noteValue === 'Coins' ? 'Coins' : `${numericNote} AED`, 
            quantity: totalQty,
            totalValue: rowTotal
          });
        });

        // 5. Sort highest denominations first
        formattedBreakdown.sort((a, b) => {
          const valA = a.denomination === 'Coins' ? 1 : parseFloat(a.denomination);
          const valB = b.denomination === 'Coins' ? 1 : parseFloat(b.denomination);
          return valB - valA;
        });

        setDenominations(formattedBreakdown);
        setGrandTotal(totalSum);

      } catch (error) {
        console.error("Error fetching daily denominations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDailyDenoms();
  }, [selectedDates]);

  // 1. Placeholder State (No dates selected)
  if (!selectedDates || selectedDates.length === 0) {
    return (
      <div className="bg-white rounded-[2rem] p-8 border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col items-center justify-center min-h-[350px] text-center">
        <div className="bg-slate-50 p-4 rounded-full mb-4">
          <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-slate-700 tracking-tight">Select a Date</h3>
        <p className="text-xs text-slate-400 mt-1.5 font-light leading-relaxed max-w-[200px]">
          Filter the ledger by date to view the specific cash denominations collected.
        </p>
      </div>
    );
  }

  // Determine dynamic header text based on number of selected dates
  const headerText = selectedDates.length === 1 
    ? `Collected on ${new Date(selectedDates[0]).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
    : `Collected across ${selectedDates.length} selected dates`;

  // 2. Main Render (Loading or Data)
  return (
    <div className={`bg-white rounded-[2rem] p-6 lg:p-8 border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col ${loading || denominations.length === 0 ? 'min-h-[350px]' : 'h-fit'}`}>
      
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Daily Breakdown</h3>
        <p className="text-xs text-slate-400 mt-1 font-light flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-light"></span>
          {headerText}
        </p>
      </div>

      {loading ? (
        // Loading State
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <span className="relative flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-light opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-brand-dark"></span>
          </span>
          <p className="text-[11px] text-slate-400 font-medium tracking-widest uppercase">Fetching Notes...</p>
        </div>
      ) : denominations.length === 0 ? (
        // Empty State (Dates selected, but no cash logged)
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-slate-500">No cash logged</p>
          <p className="text-xs text-slate-400 mt-1 font-light">Zero vault activity recorded for the selected period.</p>
        </div>
      ) : (
        // Data State
        <div className="flex flex-col mt-2">
          
          <div className="space-y-4">
            {/* Table Headers */}
            <div className="flex justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 px-1">
              <span>Note</span>
              <span className="text-center">Qty</span>
              <span className="text-right">Total Value</span>
            </div>

            {/* List Items */}
            <div className="space-y-3 mt-3">
              {denominations.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm group">
                  <div className="flex items-center gap-2 w-28">
                    <span className={`w-1.5 h-1.5 rounded-full ${item.denomination === 'Coins' ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                    <span className="font-medium text-slate-700">{item.denomination}</span>
                  </div>
                  
                  <div className="w-12 text-center">
                    <span className="bg-slate-50 border border-slate-100 text-slate-600 text-xs font-semibold px-2 py-1 rounded-lg">
                      {item.quantity}
                    </span>
                  </div>
                  
                  <div className="w-24 text-right font-semibold text-slate-900">
                    {item.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Grand Total Footer */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex justify-between items-end">
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Grand Total</span>
            </div>
            <div className="text-2xl font-bold tracking-tighter text-emerald-600">
              <span className="text-sm font-medium text-emerald-600/50 mr-1 tracking-normal">AED</span>
              {grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}