// frontend/src/pages/agent/AgentExpenseEntry.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AgentExpenseEntry() {
  const navigate = useNavigate();
  const location = useLocation();

  // --- Core Session Data (Collections + Total + Branch) ---
  const [sessionData, setSessionData] = useState({
    clientSessionId: '', 
    totalCollected: 0,
    collections: [],
    date: new Date().toISOString().split('T')[0],
    agentName: 'Agent',
    branchId: ''
  });

  // --- Expense Form & Cart State ---
  const [currentDescription, setCurrentDescription] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [expenses, setExpenses] = useState([]);

  // --- Derived Values ---
  const totalExpenses = expenses.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  const remainingBalance = sessionData.totalCollected - totalExpenses;

  // --- Initialization & Local Storage Fail-Safe ---
  useEffect(() => {
    const LOCAL_STORAGE_KEY = 'temp_agent_session_data';

    // 1. Check if we arrived here via standard navigation from the Dashboard
    if (location.state && location.state.totalCollected !== undefined) {
      const incomingData = {
        clientSessionId: location.state.clientSessionId || `SESSION-REC-${Date.now()}`, 
        totalCollected: location.state.totalCollected,
        collections: location.state.collections || [],
        date: location.state.date,
        agentName: location.state.agentName || localStorage.getItem('agent_name') || 'Agent',
        branchId: location.state.branchId || localStorage.getItem('active_branch') || 'AL FAJAR AUH' 
      };
      setSessionData(incomingData);

      // Rehydrate expenses if the user clicked "Back" from Step 3
      if (location.state.expenses && Array.isArray(location.state.expenses)) {
        setExpenses(location.state.expenses);
        incomingData.expenses = location.state.expenses; // Append to backup
      }

      // Immediately backup to local storage in case they refresh the page
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(incomingData));
    } 
    // 2. If no router state (e.g., page refresh), try to recover from Local Storage
    else {
      const recoveredData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (recoveredData) {
        const parsedData = JSON.parse(recoveredData);
        setSessionData(parsedData);

        // Rehydrate expenses if the user refreshed the page mid-entry
        if (parsedData.expenses && Array.isArray(parsedData.expenses)) {
          setExpenses(parsedData.expenses);
        }
      } else {
        // If there is no state and no local storage backup, send them back to start
        alert("No active collection session found. Redirecting to Dashboard.");
        navigate('/agent-dashboard');
      }
    }
  }, [location, navigate]);

  // Auto-save to local storage instantly as expenses are added/removed
  useEffect(() => {
    if (sessionData && sessionData.totalCollected !== undefined) {
      const currentBackup = localStorage.getItem('temp_agent_session_data');
      if (currentBackup) {
        const parsedBackup = JSON.parse(currentBackup);
        parsedBackup.expenses = expenses;
        localStorage.setItem('temp_agent_session_data', JSON.stringify(parsedBackup));
      }
    }
  }, [expenses, sessionData]);

  // --- Expense Cart Actions ---
  const handleAddExpense = () => {
    if (!currentDescription || !currentAmount) {
      alert("Please enter both an expense description and an amount.");
      return;
    }

    setExpenses([...expenses, { 
      description: currentDescription, 
      amount: currentAmount 
    }]);
    
    // Clear inputs
    setCurrentDescription('');
    setCurrentAmount('');
  };

  const handleRemoveExpense = (indexToRemove) => {
    setExpenses(expenses.filter((_, index) => index !== indexToRemove));
  };

  // ✅ NEW: Safe Back Navigation to Dashboard
  const handleGoBack = () => {
    if (sessionData) {
      // Force an immediate local storage sync before leaving
      const backupData = {
        ...sessionData,
        expenses: expenses
      };
      localStorage.setItem('temp_agent_session_data', JSON.stringify(backupData));
      
      // Pass the data back so the dashboard can rehydrate the cart
      navigate('/agent-dashboard', { state: backupData });
    } else {
      navigate(-1);
    }
  };

  // --- Proceed to Step 3 ---
  const handleProceedToDenominations = (e) => {
    e.preventDefault();

    const updatedSessionData = {
      ...sessionData,
      financialSummary: {
        totalCollected: sessionData.totalCollected,
        totalExpenses: totalExpenses,
        netHandoverAmount: remainingBalance
      },
      expenses: expenses
    };

    // Keep the local storage backup updated before leaving the page
    localStorage.setItem('temp_agent_session_data', JSON.stringify(updatedSessionData));

    // Navigate to the final Denominations step
    navigate('/agent/denominations', { state: updatedSessionData });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 font-sans flex flex-col">
      {/* Header with NEW Back Button */}
      <div className="flex justify-between items-center mb-8 mt-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleGoBack}
            className="w-10 h-10 bg-white border border-slate-200 shadow-sm rounded-full flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all"
            title="Go Back to Dashboard"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Step 2 of 3</p>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Record Expenses</h1>
          </div>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200/60 shadow-sm p-5 sm:p-8">
        
        {/* Dynamic Financial Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Collected</p>
            <p className="text-lg sm:text-xl font-bold text-slate-700">AED {sessionData.totalCollected.toFixed(2)}</p>
          </div>
          <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] sm:text-xs font-bold text-rose-400 uppercase tracking-widest mb-1">Total Expenses</p>
            <p className="text-lg sm:text-xl font-bold text-rose-600">- AED {totalExpenses.toFixed(2)}</p>
          </div>
          <div className="col-span-2 md:col-span-1 bg-emerald-50 border border-emerald-100 rounded-2xl p-4 shadow-sm flex flex-col justify-center">
            <p className="text-[10px] sm:text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1">Net Handover Balance</p>
            <p className={`text-2xl font-black tracking-tight ${remainingBalance < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              AED {remainingBalance.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Add Expense Details</label>
          
          {/* Input Grid: Description and Amount */}
          <div className="flex flex-col md:flex-row gap-3 items-start">
            <div className="w-full md:flex-[2]">
              <input 
                type="text"
                placeholder="e.g. Fuel, Toll, Vehicle Wash..."
                value={currentDescription}
                onChange={(e) => setCurrentDescription(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all text-slate-900 text-sm outline-none placeholder:text-slate-400 font-medium"
              />
            </div>

            <div className="w-full md:flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">AED</span>
              <input 
                type="number"
                step="0.01"
                placeholder="0.00"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                className="w-full pl-14 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all text-slate-900 text-sm outline-none placeholder:text-slate-400 font-bold"
              />
            </div>

            <button 
              type="button"
              onClick={handleAddExpense}
              className="w-full md:w-auto shrink-0 bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-6 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <span>Add</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>
        </div>

        {/* Expense Cart Items Display */}
        {expenses.length > 0 && (
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-2 space-y-1 mt-6">
            {expenses.map((item, index) => (
              <div key={index} className="flex justify-between items-center bg-white border border-slate-100 p-3.5 rounded-xl shadow-sm">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Description</span>
                  <span className="text-sm font-semibold text-slate-900">{item.description}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-rose-600">- AED {parseFloat(item.amount).toFixed(2)}</span>
                  <button 
                    type="button"
                    onClick={() => handleRemoveExpense(index)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Button */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <button 
            type="button"
            onClick={handleProceedToDenominations}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 px-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
          >
            {`Continue to Denominations (AED ${remainingBalance.toFixed(2)})`}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
          <p className="text-center text-xs text-slate-400 font-medium mt-3">
            Final Step: Verify cash notes before syncing data.
          </p>
        </div>

      </div>
    </div>
  );
}