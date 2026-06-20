// frontend/src/pages/agent/AgentDenominationEntry.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../config/api';

export default function AgentDenominationEntry() {
  const navigate = useNavigate();
  const location = useLocation();

  // --- Core Session Data ---
  const [sessionData, setSessionData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Denominations State ---
  // Tracks the count of each note/coin entered by the agent
  const [denominations, setDenominations] = useState({
    1000: '', 500: '', 200: '', 100: '', 
    50: '', 20: '', 10: '', 5: '', 
    1: '', 0.5: ''
  });

  // --- Initialization & Fail-Safe Recovery ---
  useEffect(() => {
    const LOCAL_STORAGE_KEY = 'temp_agent_session_data';

    // Check if data was passed via router state from the Expenses page
    if (location.state && location.state.financialSummary) {
      const incomingData = location.state;
      setSessionData(incomingData);
      
      // Rehydrate denominations if they already exist in the payload
      if (incomingData.denominations) {
        setDenominations(incomingData.denominations);
      }

      // Keep local storage updated with the latest step
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(incomingData));
    } else {
      // Recovery mode: if refreshed, pull from local storage
      const recoveredData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (recoveredData) {
        const parsedData = JSON.parse(recoveredData);
        setSessionData(parsedData);

        // Rehydrate denominations on page refresh to prevent wipeouts
        if (parsedData.denominations) {
          setDenominations(parsedData.denominations);
        }
      } else {
        alert("No active session found. Redirecting to Dashboard.");
        navigate('/agent-dashboard');
      }
    }
  }, [location, navigate]);

  // Auto-save denominations to local storage instantly as they are typed
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
  // Calculate total cash entered based on note counts
  const totalEntered = Object.entries(denominations).reduce((sum, [value, count]) => {
    const numericCount = parseInt(count) || 0;
    return sum + (parseFloat(value) * numericCount);
  }, 0);

  const targetAmount = sessionData?.financialSummary?.netHandoverAmount || 0;
  const isBalanced = totalEntered === targetAmount;
  
  // Calculate progress percentage for the bar (capped at 100%)
  const progressPercentage = targetAmount > 0 
    ? Math.min((totalEntered / targetAmount) * 100, 100) 
    : 0;

  // --- Input Handlers ---
  const handleDenominationChange = (value, newCount) => {
    setDenominations(prev => ({
      ...prev,
      [value]: newCount
    }));
  };

  // STRICT Input Validation: Block 'e', '+', '-', and '.'
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

  // --- Final Submission API Call ---
  const handleSubmitFinal = async () => {
    if (!isBalanced) return; // Extra security gate
    
    setIsSubmitting(true);

    try {
      // Build the massive final payload
      const finalPayload = {
        clientSessionId: sessionData.clientSessionId, // ✅ FIX: Added the critical clientSessionId
        sessionDate: sessionData.date, 
        agentName: sessionData.agentName,
        branchId: sessionData.branchId, // Strictly use the branch passed down the pipeline
        financialSummary: sessionData.financialSummary,
        collections: sessionData.collections,
        expenses: sessionData.expenses,
        denominations: denominations // Send the notes breakdown to the backend
      };

      const response = await api.post('/api/inflow/complete-session', finalPayload);

      if (response.data.success) {
        // ONLY clear local storage if the server successfully saved the data
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

  // Don't render UI until session data is recovered
  if (!sessionData) return null; 

  const denomList = [1000, 500, 200, 100, 50, 20, 10, 5, 1, 0.5];

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 font-sans flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 mt-4">
        <div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Step 3 of 3</p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Verify Cash Notes</h1>
        </div>
        <button onClick={handleClearAll} className="text-sm font-semibold text-rose-500 hover:text-rose-600 bg-rose-50 px-4 py-2 rounded-lg transition-colors">
          Clear All
        </button>
      </div>

      {/* Target vs Entered Highlight Card */}
      <div className="bg-[#2A2B3D] rounded-3xl p-6 shadow-lg mb-6 text-white grid grid-cols-2 gap-4 divide-x divide-slate-600/50">
        <div>
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Target Balance</p>
          <p className="text-2xl font-black tracking-tight text-white">
            <span className="text-sm text-slate-400 font-medium mr-1">AED</span> 
            {targetAmount.toFixed(2)}
          </p>
        </div>
        <div className="pl-4">
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Entered Cash</p>
          <p className={`text-2xl font-black tracking-tight ${isBalanced ? 'text-emerald-400' : 'text-amber-400'}`}>
            <span className="text-sm text-slate-400 font-medium mr-1">AED</span> 
            {totalEntered.toFixed(2)}
          </p>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {denomList.map((val) => (
            <div key={val} className="flex items-center justify-between p-3 border border-slate-100 bg-slate-50/50 rounded-2xl">
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
                  className="w-20 text-center font-bold text-slate-900 bg-white border border-slate-200 rounded-xl py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-300"
                  placeholder="0"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Action Button (Sticky Bottom) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent pt-12 z-50">
        <div className="max-w-md mx-auto">
          <button 
            onClick={handleSubmitFinal}
            disabled={!isBalanced || isSubmitting}
            className={`w-full py-4 px-4 rounded-2xl shadow-lg font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300 ${
              isBalanced 
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {isSubmitting ? (
              'Syncing...'
            ) : isBalanced ? (
              <>Complete Valid Details to Sync <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg></>
            ) : (
              `Balance Required: AED ${(targetAmount - totalEntered).toFixed(2)}`
            )}
          </button>
        </div>
      </div>

    </div>
  );
}