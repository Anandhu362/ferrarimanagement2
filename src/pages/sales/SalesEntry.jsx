// frontend/src/pages/sales/SalesEntry.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore'; 
import { db } from '../../config/firebase';
import api from '../../config/api';

// Import the modular components
import SalesTopBar from '../../components/sales/SalesTopBar';
import LiveCollectionsTable from '../../components/sales/LiveCollectionsTable';
import LiveExpensesList from '../../components/sales/LiveExpensesList';
import DenominationSidebar from '../../components/sales/DenominationSidebar';

export default function SalesEntry() {
  // --- Live Real-Time Data Pools ---
  const [allPendingCollections, setAllPendingCollections] = useState([]);
  const [allPendingExpenses, setAllPendingExpenses] = useState([]);
  const [allPendingSessions, setAllPendingSessions] = useState([]);
  
  // --- UI State (MULTI-SELECT) ---
  const [selectedSessionIds, setSelectedSessionIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Real-Time Firestore Listeners ---
  useEffect(() => {
    setIsLoading(true);
    const activeBranch = localStorage.getItem('active_branch') || 'AL FAJAR AUH'; 

    // 1. Listen to ALL Pending Master Sessions
    const qSess = query(collection(db, 'agent_sessions'), where('status', '==', 'PENDING_REVIEW'), where('branchId', '==', activeBranch));
    const unsubSess = onSnapshot(qSess, (snapshot) => {
      const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort oldest first (FIFO queue for accountants)
      sessions.sort((a, b) => a.createdAt?.toMillis() - b.createdAt?.toMillis());
      setAllPendingSessions(sessions);
      
      // Smart Auto-Selection Logic
      setSelectedSessionIds(prev => {
        // Remove any selected IDs that are no longer in the pending queue (e.g., just vaulted)
        const validIds = prev.filter(id => sessions.some(s => s.id === id));
        // If nothing is selected but bags exist, auto-select the oldest one
        if (validIds.length === 0 && sessions.length > 0) {
          return [sessions[0].id];
        }
        return validIds;
      });
      setIsLoading(false); 
    });

    // 2. Listen to ALL Pending Collections
    const qCol = query(collection(db, 'collections'), where('status', '==', 'PENDING_REVIEW'), where('branchId', '==', activeBranch));
    const unsubCol = onSnapshot(qCol, (snapshot) => {
      setAllPendingCollections(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 3. Listen to ALL Pending Expenses
    const qExp = query(collection(db, 'expenses'), where('status', '==', 'PENDING_REVIEW'), where('branchId', '==', activeBranch));
    const unsubExp = onSnapshot(qExp, (snapshot) => {
      setAllPendingExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubCol(); unsubExp(); unsubSess(); };
  }, []); // Empty dependency array, relies on internal state functions

  // --- Toggle Multi-Select ---
  const toggleSessionSelection = (sessionId) => {
    setSelectedSessionIds(prev => {
      if (prev.includes(sessionId)) {
        return prev.filter(id => id !== sessionId); // Deselect
      } else {
        return [...prev, sessionId]; // Select
      }
    });
  };

  // --- AGGREGATE Data for the Selected Sessions ---
  const aggregatedSessionData = useMemo(() => {
    if (selectedSessionIds.length === 0) return null;

    const selectedMasters = allPendingSessions.filter(s => selectedSessionIds.includes(s.id));
    
    // Filter collections and expenses that belong ONLY to the selected sessions
    const selectedCollections = allPendingCollections.filter(c => selectedSessionIds.includes(c.sessionId));
    const selectedExpenses = allPendingExpenses.filter(e => selectedSessionIds.includes(e.sessionId));

    const grossTotal = selectedCollections.reduce((sum, col) => sum + (parseFloat(col.amount) || 0), 0);
    const totalExp = selectedExpenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);

    // Aggregate physical cash denominations across all selected bags
    const aggregatedDenominations = {};
    const denomKeys = [1000, 500, 200, 100, 50, 20, 10, 5, 1, 0.5];
    
    selectedMasters.forEach(session => {
      if (session.denominations) {
        denomKeys.forEach(key => {
          const count = parseInt(session.denominations[key]) || 0;
          aggregatedDenominations[key] = (aggregatedDenominations[key] || 0) + count;
        });
      }
    });

    return {
      masters: selectedMasters,
      collections: selectedCollections,
      expenses: selectedExpenses,
      grossTotal: grossTotal,
      totalExpenses: totalExp,
      netTotal: grossTotal - totalExp,
      denominations: aggregatedDenominations
    };
  }, [selectedSessionIds, allPendingSessions, allPendingCollections, allPendingExpenses]);

  // --- Enterprise Verification & Vaulting (MULTI-BAG) ---
  const handleVaultSync = async () => {
    if (!aggregatedSessionData || aggregatedSessionData.collections.length === 0) return;
    
    setIsSubmitting(true);
    // Use branch ID from the first selected master as fallback
    const fallbackBranchId = aggregatedSessionData.masters[0]?.branchId;
    const activeBranch = localStorage.getItem('active_branch') || fallbackBranchId;

    try {
      // Construct the secure payload mapping ALL selected sessions
      const payload = {
        branchId: activeBranch, 
        transactionIds: aggregatedSessionData.collections.map(record => record.id),
        expenses: aggregatedSessionData.expenses, 
        sessionIds: selectedSessionIds, 
        denominations: aggregatedSessionData.denominations,
        netTotal: aggregatedSessionData.netTotal
      };

      const response = await api.post('/api/inflow/verify-bulk', payload);

      if (response.data.success) {
        alert(`Successfully verified and vaulted ${selectedSessionIds.length} batched sessions!`);
        setSelectedSessionIds([]); // Reset selection entirely
      }
    } catch (error) {
      console.error("Vault submission failed:", error);
      alert(error.response?.data?.message || "Failed to submit to Vault. Please check console.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Top Bar global aggregations (Totals across ALL pending queues)
  const globalGrossPending = allPendingCollections.reduce((sum, col) => sum + (parseFloat(col.amount) || 0), 0);
  const pendingCount = allPendingSessions.length;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 font-sans animate-in fade-in duration-500">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Global Overview Bar */}
        <SalesTopBar 
          grossPendingTotal={globalGrossPending} 
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
          <div className="flex flex-col gap-6">
            
            {/* Session Selection Queue (MULTI-SELECT) */}
            {allPendingSessions.length > 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 overflow-x-auto">
                <div className="flex gap-3 min-w-max">
                  {allPendingSessions.map(session => (
                    <button
                      key={session.id}
                      onClick={() => toggleSessionSelection(session.id)}
                      className={`px-5 py-3 rounded-xl border flex flex-col items-start transition-all ${
                        selectedSessionIds.includes(session.id)
                          ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1 flex items-center gap-1">
                        {selectedSessionIds.includes(session.id) && (
                          <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                        )}
                        {session.date}
                      </span>
                      <span className="font-bold text-sm">
                        {session.agentName}'s Bag
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center text-slate-500 font-medium">
                No pending sessions in the queue.
              </div>
            )}

            {/* Display Aggregated Active Details */}
            {aggregatedSessionData && selectedSessionIds.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-300">
                
                {/* Left/Center Column: Data Tables */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                  <div className="h-[400px]">
                    <LiveCollectionsTable collections={aggregatedSessionData.collections} />
                  </div>
                  
                  <div className="h-[300px]">
                    <LiveExpensesList expenses={aggregatedSessionData.expenses} />
                  </div>
                </div>

                {/* Right Column: Physical Cash Verification & Action */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                  <div className="flex-1 min-h-[500px]">
                    {/* Passes down the freshly calculated sum of all selected cash */}
                    <DenominationSidebar denominations={aggregatedSessionData.denominations} />
                  </div>

                  {/* Action Card */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4">
                    <div className="flex justify-between items-center text-sm font-bold text-slate-500 uppercase tracking-widest">
                      <span>Net Expected ({selectedSessionIds.length} Bags)</span>
                      <span className="text-emerald-600">AED {aggregatedSessionData.netTotal.toFixed(2)}</span>
                    </div>
                    
                    <button 
                      onClick={handleVaultSync} 
                      disabled={isSubmitting || aggregatedSessionData.collections.length === 0}
                      className={`w-full py-4 px-6 rounded-xl font-bold text-lg shadow-lg transition-all duration-300 flex items-center justify-center gap-3 ${
                        aggregatedSessionData.collections.length > 0 && !isSubmitting
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
                        <>
                          Verify {selectedSessionIds.length} Selected Bag{selectedSessionIds.length > 1 ? 's' : ''} 
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}