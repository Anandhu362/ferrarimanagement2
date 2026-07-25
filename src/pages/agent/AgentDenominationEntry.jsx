// frontend/src/pages/agent/AgentDenominationEntry.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../config/api';
import { useSync } from '../../context/SyncManager'; 

export default function AgentDenominationEntry() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { isOnline, queuePayload } = useSync();

  // --- Core Session Data ---
  const [sessionData, setSessionData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Denominations State ---
  const [denominations, setDenominations] = useState({
    1000: '', 500: '', 200: '', 100: '', 
    50: '', 20: '', 10: '', 5: '', 
    1: '', 0.5: ''
  });
  
  // State to lock in the baseline record from Step 1
  const [initialPreVerifiedPool, setInitialPreVerifiedPool] = useState({});

  // --- Initialization & Fail-Safe Recovery ---
  useEffect(() => {
    const LOCAL_STORAGE_KEY = 'temp_agent_session_data';

    // Helper to calculate the aggregated pool from collection data
    const calculateAggregatedPool = (data) => {
      const aggregatedPool = {
        1000: 0, 500: 0, 200: 0, 100: 0, 
        50: 0, 20: 0, 10: 0, 5: 0, 1: 0, 0.5: 0
      };
      
      (data.collections || []).forEach(col => {
        if (col.itemDenominations) {
          Object.entries(col.itemDenominations).forEach(([denom, qty]) => {
            aggregatedPool[denom] += (parseInt(qty) || 0);
          });
        }
      });
      return aggregatedPool;
    };

    if (location.state && location.state.financialSummary) {
      const incomingData = location.state;
      setSessionData(incomingData);
      
      const pool = calculateAggregatedPool(incomingData);
      setInitialPreVerifiedPool(pool);
      
      // Pre-fill inputs with aggregated pool if no existing denominations exist
      if (incomingData.denominations) {
        setDenominations(incomingData.denominations);
      } else {
        setDenominations(pool);
      }

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(incomingData));
    } else {
      const recoveredData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (recoveredData) {
        const parsedData = JSON.parse(recoveredData);
        setSessionData(parsedData);

        const pool = calculateAggregatedPool(parsedData);
        setInitialPreVerifiedPool(pool);

        if (parsedData.denominations) {
          setDenominations(parsedData.denominations);
        } else {
          setDenominations(pool);
        }
      } else {
        alert("No active session found. Redirecting to Dashboard.");
        navigate('/agent-dashboard');
      }
    }
  }, [location, navigate]);

  useEffect(() => {
    if (sessionData && sessionData.financialSummary) {
      const currentBackup = localStorage.getItem('temp_agent_session_data');
      if (currentBackup) {
        const parsedBackup = JSON.parse(currentBackup);
        parsedBackup.denominations = denominations;
        localStorage.setItem('temp_agent_session_data', JSON.stringify(parsedBackup));
      }
    }
  }, [denominations, sessionData]);

  // --- Live Calculations ---
  
  // 1. Determine base target
  const netHandoverAmount = sessionData?.financialSummary?.netHandoverAmount || 0;
  
  // 2. Calculate the value of the locked baseline for UI display purposes
  const preVerifiedTotal = Object.entries(initialPreVerifiedPool).reduce((sum, [value, count]) => {
    return sum + (parseFloat(value) * (parseInt(count) || 0));
  }, 0);

  // 3. Calculate what the user has currently entered
  const totalEntered = Object.entries(denominations).reduce((sum, [value, count]) => {
    const numericCount = parseInt(count) || 0;
    return sum + (parseFloat(value) * numericCount);
  }, 0);

  // 4. Strict Balance check 
  const isBalanced = Math.abs(totalEntered - netHandoverAmount) < 0.01;
  const variance = totalEntered - netHandoverAmount;
  
  const progressPercentage = netHandoverAmount > 0 
    ? Math.min((totalEntered / netHandoverAmount) * 100, 100) 
    : (totalEntered === 0 ? 100 : 0);

  // --- Input Handlers ---
  const handleDenominationChange = (value, newCount) => {
    setDenominations(prev => ({
      ...prev,
      [value]: newCount
    }));
  };

  const blockInvalidChars = (e) => {
    if (['e', 'E', '+', '-', '.'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleClearAll = () => {
    setDenominations({
      1000: '', 500: '', 200: '', 100: '', 
      50: '', 20: '', 10: '', 5: '', 
      1: '', 0.5: ''
    });
  };

  // --- Safe Back Navigation ---
  const handleGoBack = () => {
    if (sessionData) {
      const backupData = {
        ...sessionData,
        denominations: denominations
      };
      localStorage.setItem('temp_agent_session_data', JSON.stringify(backupData));
      navigate('/agent/expenses', { state: backupData });
    } else {
      navigate(-1);
    }
  };

  // --- Final Submission API Call ---
  const handleSubmitFinal = async () => {
    // STRICT BLOCK: Only allow submission if it perfectly balances
    if (!isBalanced) return; 
    
    setIsSubmitting(true);

    const finalPayload = {
      clientSessionId: sessionData.clientSessionId, 
      sessionDate: sessionData.date, 
      agentName: sessionData.agentName,
      branchId: sessionData.branchId, 
      financialSummary: sessionData.financialSummary,
      collections: sessionData.collections,
      expenses: sessionData.expenses,
      denominations: denominations, 
      preVerifiedPool: initialPreVerifiedPool // The locked baseline
    };

    if (!isOnline) {
      queuePayload(finalPayload);
      localStorage.removeItem('temp_agent_session_data');
      alert('You are currently offline. Data has been saved securely to the phone. It will sync automatically when the internet returns.');
      navigate('/agent-dashboard');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await api.post('/api/inflow/complete-session', finalPayload);

      if (response.data.success) {
        localStorage.removeItem('temp_agent_session_data');
        alert('Session Synced Successfully!');
        navigate('/agent-dashboard');
      }
    } catch (error) {
      console.error("Sync Error:", error);
      alert("Failed to sync session with the server. Your data is saved locally. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!sessionData) return null; 

  const denomList = [1000, 500, 200, 100, 50, 20, 10, 5, 1, 0.5];

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 font-sans flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 mt-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleGoBack}
            className="w-10 h-10 bg-white border border-slate-200 shadow-sm rounded-full flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all"
            title="Go Back to Expenses"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Step 3 of 3</p>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Verify Cash Notes</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isOnline && (
            <div className="bg-rose-100 text-rose-600 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-rose-200">
              <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
              Offline Mode
            </div>
          )}
          <button onClick={handleClearAll} className="text-sm font-semibold text-rose-500 hover:text-rose-600 bg-rose-50 px-4 py-2 rounded-lg transition-colors">
            Clear All
          </button>
        </div>
      </div>

      {/* Financial Summary Split Highlight Card */}
      <div className="bg-[#2A2B3D] rounded-3xl p-5 shadow-lg mb-6 text-white divide-y divide-slate-600/50">
        
        {/* Top row: Net Handover & Already Verified */}
        <div className="flex justify-between items-center pb-4">
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Net Handover</p>
            <p className="text-lg font-bold text-white">AED {netHandoverAmount.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] sm:text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Pre-Verified Pool Value</p>
            <p className="text-lg font-bold text-emerald-300">AED {preVerifiedTotal.toFixed(2)}</p>
          </div>
        </div>
        
        {/* Bottom row: Difference vs Entered */}
        <div className="pt-4 grid grid-cols-2 gap-4 divide-x divide-slate-600/50">
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">Difference</p>
            <p className="text-2xl font-black tracking-tight text-white">
              <span className="text-sm text-slate-400 font-medium mr-1">AED</span> 
              {Math.abs(variance).toFixed(2)}
            </p>
          </div>
          <div className="pl-4">
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Entered</p>
            <p className={`text-2xl font-black tracking-tight ${isBalanced ? 'text-emerald-400' : 'text-rose-400'}`}>
              <span className="text-sm text-slate-400 font-medium mr-1">AED</span> 
              {totalEntered.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Live Progress Bar */}
      <div className="mb-8 px-2">
        <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
          <span>Match Progress</span>
          <span>{progressPercentage.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
          <div 
            className={`h-full rounded-full transition-all duration-300 ease-out ${isBalanced ? 'bg-emerald-500' : 'bg-amber-400'}`}
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Denomination Grid */}
      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200/60 shadow-sm p-4 sm:p-6 mb-24">
        {netHandoverAmount === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 border-4 border-emerald-50">
              <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">No Cash Expected</h3>
            <p className="text-sm text-slate-500 font-medium max-w-xs mx-auto">
              Your net handover for this session is AED 0. You are ready to sync.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {denomList.map((val) => (
              <div key={val} className="flex items-center justify-between p-3 border border-slate-100 bg-slate-50/50 rounded-2xl hover:border-emerald-200 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-8 bg-emerald-100/50 rounded flex items-center justify-center border border-emerald-200/50">
                    <span className="text-xs font-bold text-emerald-600">💵</span>
                  </div>
                  <span className="font-bold text-slate-700">{val} <span className="text-xs font-semibold text-slate-400">AED</span></span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Count</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={denominations[val]}
                    onChange={(e) => handleDenominationChange(val, e.target.value)}
                    onKeyDown={blockInvalidChars}
                    className="w-20 text-center font-bold text-slate-900 bg-white border border-slate-200 rounded-xl py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-300 shadow-sm"
                    placeholder="0"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button (Sticky Bottom) - STRICT VALIDATION RESTRICTION */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent pt-12 z-50">
        <div className="max-w-md mx-auto">
          <button 
            onClick={handleSubmitFinal}
            disabled={!isBalanced || isSubmitting} 
            className={`w-full py-4 px-4 rounded-2xl shadow-lg font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300 ${
              !isBalanced 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30' 
            }`}
          >
            {isSubmitting ? (
              'Processing...'
            ) : !isBalanced ? (
              <>Balance Mismatch (AED {Math.abs(variance).toFixed(2)})</>
            ) : (
              <>Sync Balanced Session <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}