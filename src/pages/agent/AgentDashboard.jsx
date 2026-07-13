// frontend/src/pages/agent/AgentDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import PremiumCalendar from '../../components/shared/PremiumCalendar';
import RecentCollections from '../../components/agent/RecentCollections'; 
import ItemDenominationModal from '../../components/agent/ItemDenominationModal'; 
import { Preferences } from '@capacitor/preferences';

export default function AgentDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [agentName, setAgentName] = useState('Agent');

  // --- Form & UI State ---
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  // ✅ Changed initial state to blank string to force mandatory selection
  const [date, setDate] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [currentInvoice, setCurrentInvoice] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [cartItems, setCartItems] = useState([]);
  
  const [activeDenomIndex, setActiveDenomIndex] = useState(null);

  const totalAmount = cartItems.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

  // --- Initialization & Data Recovery ---
  useEffect(() => {
    let attempts = 0;
    let intervalId;

    if (location.state && location.state.collections) {
      setCartItems(location.state.collections);
      if (location.state.date) setDate(location.state.date);
    } else {
      const recoveredData = localStorage.getItem('temp_agent_session_data');
      if (recoveredData) {
        try {
          const parsedData = JSON.parse(recoveredData);
          if (parsedData.collections) setCartItems(parsedData.collections);
          if (parsedData.date) setDate(parsedData.date);
        } catch(e) {
          console.error("Error parsing local session data");
        }
      }
    }

    const loadNativeData = async () => {
      const { value: savedName } = await Preferences.get({ key: 'agent_name' });
      
      if (savedName && savedName !== 'Agent') {
        setAgentName(savedName);
        clearInterval(intervalId); 
      } else if (attempts > 10) {
        clearInterval(intervalId);
      }
      attempts++;
    };

    loadNativeData();
    intervalId = setInterval(loadNativeData, 500);

    return () => clearInterval(intervalId);
  }, [location]);

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
    // ✅ Mandatory Validation Check for Date
    if (!date || date.trim() === '') {
      alert("Please select a Collection Date before adding.");
      return;
    }
    if (!currentCompany || !currentAmount) {
      alert("Please enter a Company Name and Amount to add.");
      return;
    }
    
    // ✅ Store the specific selected date inside the item collection metadata
    setCartItems([...cartItems, { 
      companyName: currentCompany, 
      invoiceNumber: currentInvoice && currentInvoice.trim() !== '' ? currentInvoice.trim() : 'NIL',
      amount: currentAmount,
      date: date,
      itemDenominations: {} 
    }]);
    
    // ✅ Clear all input fields and refresh date back to blank
    setCurrentCompany('');
    setCurrentInvoice('');
    setCurrentAmount('');
    setDate('');
  };

  const handleRemoveFromCart = (indexToRemove) => {
    setCartItems(cartItems.filter((_, index) => index !== indexToRemove));
    if (activeDenomIndex === indexToRemove) setActiveDenomIndex(null);
  };

  const handleSaveItemDenominations = (index, denominations) => {
    const updatedCart = [...cartItems];
    updatedCart[index].itemDenominations = denominations;
    setCartItems(updatedCart);
    setActiveDenomIndex(null); 
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

    let sessionKey = location.state?.clientSessionId;
    if (!sessionKey) {
      const recoveredData = localStorage.getItem('temp_agent_session_data');
      if (recoveredData) {
        try {
           sessionKey = JSON.parse(recoveredData).clientSessionId;
        } catch(e) {}
      }
    }
    
    const uniqueSessionId = sessionKey || `SESSION-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    navigate('/agent/expenses', {
      state: {
        clientSessionId: uniqueSessionId, 
        totalCollected: totalAmount,
        collections: cartItems, 
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
              className={`w-full text-left px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm flex justify-between items-center font-medium ${
                date ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-rose-50/40 border-rose-200 text-rose-400'
              }`}
            >
              {date || "Select Mandatory Collection Date..."}
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
            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-2 space-y-2 mt-6">
              {cartItems.map((item, index) => {
                const hasNotes = item.itemDenominations && Object.keys(item.itemDenominations).length > 0;
                
                return (
                  <div key={index} className="flex flex-col bg-white border border-slate-100 p-3.5 rounded-xl shadow-sm transition-all">
                    
                    {/* Responsive container for cart list item */}
                    <div className="flex flex-wrap items-center justify-between gap-y-3 gap-x-2">
                      
                      <div className="flex flex-col min-w-[120px] flex-1 overflow-hidden pr-2">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest truncate">{item.companyName}</span>
                          {/* ✅ Display the dynamic item-specific date on the card */}
                          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50/60 px-2 py-0.5 rounded-full border border-emerald-100/40">
                            {item.date}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-slate-900 truncate">INV: {item.invoiceNumber}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 mr-1">AED {parseFloat(item.amount).toFixed(2)}</span>
                        
                        <button 
                          type="button"
                          onClick={() => setActiveDenomIndex(activeDenomIndex === index ? null : index)}
                          className={`px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-colors ${
                            hasNotes 
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm' 
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {hasNotes ? 'Notes Verified ✓' : 'Add Notes'}
                        </button>

                        <button 
                          type="button"
                          onClick={() => handleRemoveFromCart(index)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>

                    {/* Expandable Denomination Modal */}
                    {activeDenomIndex === index && (
                      <ItemDenominationModal 
                        amount={item.amount}
                        initialDenominations={item.itemDenominations}
                        onSave={(denominations) => handleSaveItemDenominations(index, denominations)}
                        onClose={() => setActiveDenomIndex(null)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <button 
            type="submit"
            disabled={cartItems.length === 0 || activeDenomIndex !== null}
            className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-4 rounded-xl shadow-lg shadow-slate-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            {activeDenomIndex !== null 
              ? 'Please Save or Cancel Notes to Continue' 
              : `Continue to Expenses (AED ${totalAmount.toFixed(2)})`
            }
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
        </form>

        <div className="mt-8">
          <RecentCollections agentName={agentName} />
        </div>

      </div>
    </div>
  );
}