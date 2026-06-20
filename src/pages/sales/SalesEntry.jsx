// frontend/src/pages/sales/SalesEntry.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore'; // Removed writeBatch and doc
import { db } from '../../config/firebase';
import api from '../../config/api';

// Import the new modular components
import SalesTopBar from '../../components/sales/SalesTopBar';
import LiveCollectionsTable from '../../components/sales/LiveCollectionsTable';
import LiveExpensesList from '../../components/sales/LiveExpensesList';
import DenominationSidebar from '../../components/sales/DenominationSidebar';

export default function SalesEntry() {
  // --- Live Real-Time State ---
  const [pendingCollections, setPendingCollections] = useState([]);
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [pendingSessions, setPendingSessions] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Real-Time Firestore Listeners ---
  useEffect(() => {
    setIsLoading(true);
    
    // Get the active branch from local storage to filter the live queue
    const activeBranch = localStorage.getItem('active_branch') || 'AL FAJAR AUH'; 

    // 1. Listen to Pending Collections
    const qCol = query(collection(db, 'collections'), where('status', '==', 'PENDING_REVIEW'), where('branchId', '==', activeBranch));
    const unsubCol = onSnapshot(qCol, (snapshot) => {
      setPendingCollections(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 2. Listen to Pending Expenses
    const qExp = query(collection(db, 'expenses'), where('status', '==', 'PENDING_REVIEW'), where('branchId', '==', activeBranch));
    const unsubExp = onSnapshot(qExp, (snapshot) => {
      setPendingExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 3. Listen to Pending Agent Sessions (for Denominations & Queue Count)
    const qSess = query(collection(db, 'agent_sessions'), where('status', '==', 'PENDING_REVIEW'), where('branchId', '==', activeBranch));
    const unsubSess = onSnapshot(qSess, (snapshot) => {
      setPendingSessions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false); // Data has arrived
    });

    // Cleanup listeners on unmount
    return () => { 
      unsubCol(); 
      unsubExp(); 
      unsubSess(); 
    };
  }, []);

  // --- Dynamic Aggregations ---
  const grossPendingTotal = pendingCollections.reduce((sum, col) => sum + (parseFloat(col.amount) || 0), 0);
  const totalExpenses = pendingExpenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
  const netTotal = grossPendingTotal - totalExpenses;
  const pendingCount = pendingSessions.length;

  // Aggregate denominations across all pending sessions
  const aggregatedDenominations = {};
  pendingSessions.forEach(session => {
    if (session.denominations) {
      Object.entries(session.denominations).forEach(([note, count]) => {
        aggregatedDenominations[note] = (parseInt(aggregatedDenominations[note]) || 0) + (parseInt(count) || 0);
      });
    }
  });

  // --- Enterprise Verification & Vaulting ---
  const handleVaultSync = async () => {
    if (pendingCollections.length === 0 || netTotal <= 0) return;
    
    setIsSubmitting(true);
    const activeBranch = localStorage.getItem('active_branch') || pendingCollections[0]?.branchId;

    try {
      // 1. Construct the payload with sessionIds so the backend can clean them up
      const payload = {
        branchId: activeBranch, 
        transactionIds: pendingCollections.map(record => record.id),
        expenses: pendingExpenses, 
        sessionIds: pendingSessions.map(session => session.id), // NEW: Pass session IDs
        denominations: aggregatedDenominations,
        netTotal: netTotal
      };

      // 2. Fire the core transaction to the Admin backend
      const response = await api.post('/api/inflow/verify-bulk', payload);

      if (response.data.success) {
        // 3. SUCCESS! No frontend batch needed. The backend handles the state shift.
        alert("Records successfully verified and submitted to the Vault Ledger!");
      }
    } catch (error) {
      console.error("Bulk submission failed:", error);
      alert(error.response?.data?.message || "Failed to submit to Vault. Please check console.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 font-sans animate-in fade-in duration-500">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Top Overview Bar */}
        <SalesTopBar 
          grossPendingTotal={grossPendingTotal} 
          pendingCount={pendingCount} 
        />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <span className="flex h-12 w-12 relative mb-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-12 w-12 bg-emerald-500"></span>
            </span>
            <p className="text-slate-500 font-medium text-lg tracking-wide">Connecting to live agent feed...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left/Center Column: Data Tables */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="h-[400px]">
                <LiveCollectionsTable collections={pendingCollections} />
              </div>
              
              <div className="h-[300px]">
                <LiveExpensesList expenses={pendingExpenses} />
              </div>
            </div>

            {/* Right Column: Physical Cash Verification & Action */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              <div className="flex-1 min-h-[500px]">
                <DenominationSidebar denominations={aggregatedDenominations} />
              </div>

              {/* Action Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4">
                <div className="flex justify-between items-center text-sm font-bold text-slate-500 uppercase tracking-widest">
                  <span>Net Expected</span>
                  <span className="text-emerald-600">AED {netTotal.toFixed(2)}</span>
                </div>
                
                <button 
                  onClick={handleVaultSync} 
                  disabled={isSubmitting || pendingCollections.length === 0}
                  className={`w-full py-4 px-6 rounded-xl font-bold text-lg shadow-lg transition-all duration-300 flex items-center justify-center gap-3 ${
                    pendingCollections.length > 0 && !isSubmitting
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30 hover:-translate-y-0.5' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing Vault...
                    </>
                  ) : (
                    <>Verify & Vault Queue <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></>
                  )}
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}