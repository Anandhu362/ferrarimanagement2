// frontend/src/pages/agent/AgentDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import PremiumCalendar from '../../components/shared/PremiumCalendar';
import RecentCollections from '../../components/agent/RecentCollections'; 

export default function AgentDashboard() {
  const [agentName, setAgentName] = useState('Agent');
  const navigate = useNavigate();

  // --- Form & UI State ---
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // Date State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Temporary state for the current item being typed in the Add Row
  const [currentCompany, setCurrentCompany] = useState('');
  const [currentInvoice, setCurrentInvoice] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  
  // Cart state holding all added company collections
  const [cartItems, setCartItems] = useState([]);

  // --- Derived State ---
  // Calculate total amount from all items in the cart
  const totalAmount = cartItems.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

  // --- Initialization ---
  useEffect(() => {
    const savedName = localStorage.getItem('agent_name');
    if (savedName) setAgentName(savedName);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('agent_name');
    navigate('/agent-login');
  };

  // --- Cart Actions ---
  const handleAddToCart = () => {
    if (!currentCompany || !currentInvoice || !currentAmount) {
      alert("Please enter a Company Name, Invoice Number, and Amount to add.");
      return;
    }
    
    setCartItems([...cartItems, { 
      companyName: currentCompany, 
      invoiceNumber: currentInvoice,
      amount: currentAmount 
    }]);
    
    // Clear inputs for the next entry
    setCurrentCompany('');
    setCurrentInvoice('');
    setCurrentAmount('');
  };

  const handleRemoveFromCart = (indexToRemove) => {
    setCartItems(cartItems.filter((_, index) => index !== indexToRemove));
  };

  // --- Submit Handler (UPDATED FOR MULTI-STEP FLOW) ---
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (cartItems.length === 0) {
      alert("Please add at least one collection to the list.");
      return;
    }

    // Instead of API post, navigate to the expense page with the session data attached
    navigate('/agent/expenses', {
      state: {
        totalCollected: totalAmount,
        collections: cartItems,
        date: date,
        agentName: agentName
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
            
            {/* Input Grid: Normal Company Name, Invoice No, and Amount */}
            <div className="flex flex-col md:flex-row gap-3 items-start">
              <div className="w-full md:flex-[1.5]">
                {/* Normal Text Input for Company Name */}
                <input 
                  type="text"
                  placeholder="Enter Company Name..."
                  value={currentCompany}
                  onChange={(e) => setCurrentCompany(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 text-sm outline-none placeholder:text-slate-400 font-medium"
                />
              </div>

              <div className="w-full md:flex-1">
                {/* Invoice Number Input */}
                <input 
                  type="text"
                  placeholder="Invoice No. (e.g. INV-001)"
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

          {/* Cart Items Display List (Review Section) */}
          {cartItems.length > 0 && (
            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-2 space-y-1 mt-6">
              {cartItems.map((item, index) => (
                <div key={index} className="flex justify-between items-center bg-white border border-slate-100 p-3.5 rounded-xl shadow-sm">
                  <div className="flex flex-col">
                    {/* Shows Company Name as the main label, and Invoice Number right underneath */}
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

          {/* Submit Button */}
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