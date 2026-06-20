// frontend/src/pages/agent/AgentDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import PremiumCalendar from '../../components/shared/PremiumCalendar';
import RecentCollections from '../../components/agent/RecentCollections'; 
import { Preferences } from '@capacitor/preferences';

export default function AgentDashboard() {
  const navigate = useNavigate();
  
  // Start with default, we will forcefully update it in the useEffect
  const [agentName, setAgentName] = useState('Agent');

  // --- Form & UI State ---
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentCompany, setCurrentCompany] = useState('');
  const [currentInvoice, setCurrentInvoice] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [cartItems, setCartItems] = useState([]);

  const totalAmount = cartItems.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

  // --- Initialization (UPDATED FOR ROUTING RACE CONDITIONS) ---
  useEffect(() => {
    let attempts = 0;
    let intervalId;

    const loadNativeData = async () => {
      const { value: savedName } = await Preferences.get({ key: 'agent_name' });
      
      // If we successfully get the real name, update UI and stop checking
      if (savedName && savedName !== 'Agent') {
        setAgentName(savedName);
        clearInterval(intervalId); 
      } else if (attempts > 10) {
        // Failsafe: stop checking after ~5 seconds to prevent infinite loops
        clearInterval(intervalId);
      }
      attempts++;
    };

    // 1. Check immediately on page load
    loadNativeData();

    // 2. Poll every 500ms. This catches the data the exact moment the background 
    // login function finishes saving it to Capacitor storage.
    intervalId = setInterval(loadNativeData, 500);

    // Cleanup interval if the component unmounts
    return () => clearInterval(intervalId);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      await Preferences.remove({ key: 'agent_name' });
      await Preferences.remove({ key: 'active_branch' });
      localStorage.clear();
      navigate('/agent-login');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // --- Cart Actions ---
  const handleAddToCart = () => {
    // Removed !currentInvoice to make it optional
    if (!currentCompany || !currentAmount) {
      alert("Please enter a Company Name and Amount to add.");
      return;
    }
    
    setCartItems([...cartItems, { 
      companyName: currentCompany, 
      // If currentInvoice is empty, default to 'NIL'
      invoiceNumber: currentInvoice && currentInvoice.trim() !== '' ? currentInvoice.trim() : 'NIL',
      amount: currentAmount 
    }]);
    
    setCurrentCompany('');
    setCurrentInvoice('');
    setCurrentAmount('');
  };

  const handleRemoveFromCart = (indexToRemove) => {
    setCartItems(cartItems.filter((_, index) => index !== indexToRemove));
  };

  // --- Submit Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (cartItems.length === 0) {
      alert("Please add at least one collection to the list.");
      return;
    }

    const { value: activeBranch } = await Preferences.get({ key: 'active_branch' });
    const { value: storedName } = await Preferences.get({ key: 'agent_name' });
    const currentAgentName = storedName || agentName;

    if (!activeBranch || activeBranch.trim() === '') {
      alert("CRITICAL ERROR: Branch ID is missing from your session. Your data cannot be routed to the correct desk. Please log out and log back in.");
      return;
    }

    navigate('/agent/expenses', {
      state: {
        totalCollected: totalAmount,
        collections: cartItems,
        date: date,
        agentName: currentAgentName,
        branchId: activeBranch
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 font-sans flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 mt-4">
        <div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Welcome back,</p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{agentName}</h1>
        </div>
        <button 
          onClick={handleLogout}
          className="w-10 h-10 bg-white rounded-full shadow-sm border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
        </button>
      </div>

      {/* Main Form Container */}
      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200/60 shadow-sm p-5 sm:p-8">
        
        {/* Title and Prominent Total Display */}
        <div className="mb-6 pb-6 border-b border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Log Collection</h2>
            <p className="text-slate-500 text-sm mt-1">Step 1: Record incoming payments.</p>
          </div>
          
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl px-5 py-3 text-right shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Amount</p>
            <div className="text-2xl font-black text-emerald-600 tracking-tight">
              AED {totalAmount.toFixed(2)}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Date Picker (Top Level) */}
          <div className="relative">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Collection Date</label>
            <button
              type="button"
              onClick={() => setIsCalendarOpen(true)}
              className="w-full text-left px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-700 text-sm flex justify-between items-center font-medium"
            >
              {date}
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </button>
            <div className="relative">
              <PremiumCalendar 
                selectedDate={date}
                onDateSelect={(newDate) => {
                  setDate(newDate);
                  setIsCalendarOpen(false);
                }}
                isOpen={isCalendarOpen}
                onClose={() => setIsCalendarOpen(false)}
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Add Collection Details</label>
            
            <div className="flex flex-col md:flex-row gap-3 items-start">
              <div className="w-full md:flex-[1.5]">
                <input 
                  type="text"
                  placeholder="Enter Company Name..."
                  value={currentCompany}
                  onChange={(e) => setCurrentCompany(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 text-sm outline-none placeholder:text-slate-400 font-medium"
                />
              </div>

              <div className="w-full md:flex-1">
                {/* Updated placeholder */}
                <input 
                  type="text"
                  placeholder="Invoice No. (Optional)"
                  value={currentInvoice}
                  onChange={(e) => setCurrentInvoice(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 text-sm outline-none placeholder:text-slate-400 font-medium"
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
                  className="w-full pl-14 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 text-sm outline-none placeholder:text-slate-400 font-bold"
                />
              </div>

              <button 
                type="button"
                onClick={handleAddToCart}
                className="w-full md:w-auto shrink-0 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <span>Add</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>
          </div>

          {cartItems.length > 0 && (
            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-2 space-y-1 mt-6">
              {cartItems.map((item, index) => (
                <div key={index} className="flex justify-between items-center bg-white border border-slate-100 p-3.5 rounded-xl shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">{item.companyName}</span>
                    <span className="text-sm font-semibold text-slate-900">INV: {item.invoiceNumber}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-slate-900">AED {parseFloat(item.amount).toFixed(2)}</span>
                    <button 
                      type="button"
                      onClick={() => handleRemoveFromCart(index)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button 
            type="submit"
            disabled={cartItems.length === 0}
            className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-4 rounded-xl shadow-lg shadow-slate-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {`Continue to Expenses (AED ${totalAmount.toFixed(2)})`}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
        </form>

        {/* Recent Collections Component */}
        <div className="mt-8">
          <RecentCollections agentName={agentName} />
        </div>

      </div>
    </div>
  );
}