// frontend/src/components/settings/AlertRoutingCard.jsx
import React, { useState, useEffect } from 'react';
import api from '../../config/api';

export default function AlertRoutingCard({ activeBranch, waStatus, addTerminalLog }) {
  const [alertNumbers, setAlertNumbers] = useState([]);
  const [newNumber, setNewNumber] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [loading, setLoading] = useState(false);

  // Helper to safely extract string Branch ID from objects or strings
  const getBranchId = (branch) => {
    if (!branch) return '';
    if (typeof branch === 'object') {
      return branch.id || branch.name || branch.branchId || '';
    }
    return String(branch);
  };

  // Fetch saved alert numbers with a race-condition guard
  useEffect(() => {
    // This flag prevents older network requests from overwriting newer ones
    const isSubscribed = { current: true };
    const branchIdStr = getBranchId(activeBranch);

    // Strict guard: Do not fetch if there is no branch, or if it's the initial "Loading..." state
    if (branchIdStr && branchIdStr !== 'No Branch Selected' && branchIdStr !== 'Loading...') {
      fetchAlertNumbers(branchIdStr, isSubscribed);
    }

    return () => {
      // If the component unmounts or activeBranch changes, cancel the pending state update
      isSubscribed.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBranch]);

  const fetchAlertNumbers = async (targetBranch, isSubscribed = { current: true }) => {
    const branchIdStr = targetBranch || getBranchId(activeBranch);
    
    if (!branchIdStr || branchIdStr === 'No Branch Selected' || branchIdStr === 'Loading...') return;
    
    setLoading(true);
    try {
      const response = await api.get(`/api/whatsapp/numbers/${encodeURIComponent(branchIdStr)}`);
      
      // Only update state if this request hasn't been superseded by a newer one
      if (isSubscribed.current && response.data && response.data.success) {
        setAlertNumbers(response.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch alert numbers:", error);
      if (isSubscribed.current && addTerminalLog) {
        addTerminalLog("❌ Config Error: Failed to fetch alert numbers from server.");
      }
    } finally {
      if (isSubscribed.current) {
        setLoading(false);
      }
    }
  };

  const handleAddNumber = async (e) => {
    e.preventDefault();
    const phoneTrimmed = newNumber.trim();
    const branchIdStr = getBranchId(activeBranch);
    
    if (!phoneTrimmed || !branchIdStr) return;

    try {
      const response = await api.post(`/api/whatsapp/numbers/${encodeURIComponent(branchIdStr)}`, {
        phone: phoneTrimmed
      });

      if (response.data && response.data.success) {
        // Re-fetch numbers directly from Firestore to guarantee UI-DB sync
        await fetchAlertNumbers(branchIdStr);
        if (addTerminalLog) addTerminalLog(`✓ Config: Added alert route for ${phoneTrimmed}`);
        setNewNumber('');
      }
    } catch (error) {
      if (addTerminalLog) addTerminalLog(`❌ Config Error: Failed to add phone number.`);
    }
  };

  const handleRemoveNumber = async (phone) => {
    const branchIdStr = getBranchId(activeBranch);
    if (!branchIdStr) return;

    try {
      const response = await api.delete(`/api/whatsapp/numbers/${encodeURIComponent(branchIdStr)}/${encodeURIComponent(phone)}`);
      if (response.data && response.data.success) {
        // Re-fetch numbers directly from Firestore to guarantee UI-DB sync
        await fetchAlertNumbers(branchIdStr);
        if (addTerminalLog) addTerminalLog(`> Config: Removed alert route for ${phone}`);
      }
    } catch (error) {
      if (addTerminalLog) addTerminalLog(`❌ Config Error: Failed to remove ${phone}.`);
    }
  };

  const handleTestMessage = async (phone) => {
    const branchIdStr = getBranchId(activeBranch);
    
    if (waStatus !== 'CONNECTED') {
      if (addTerminalLog) addTerminalLog("❌ Test Failed: WhatsApp Engine is not connected.");
      return;
    }

    setIsSendingTest(true);
    if (addTerminalLog) addTerminalLog(`> Dispatching test payload to ${phone}...`);

    try {
      const response = await api.post(`/api/whatsapp/test-message/${encodeURIComponent(branchIdStr)}`, { phone });
      if (response.data && response.data.success) {
        if (addTerminalLog) addTerminalLog(`✓ Alert Test: Successfully dispatched to ${phone}`);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      if (addTerminalLog) addTerminalLog(`❌ Alert Test Failed: ${errorMsg}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="bg-white rounded-[2rem] p-7 border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex-1">
      {/* Container Header */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-slate-400 text-xs font-medium tracking-widest uppercase">Alert Routing</p>
      </div>

      {/* Add Number Form */}
      <form onSubmit={handleAddNumber} className="flex gap-3 mb-6 relative">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <input 
            type="text" 
            placeholder="e.g. 971501234567" 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:border-brand-dark focus:ring-2 focus:ring-brand-light/20 transition-all outline-none"
            value={newNumber}
            onChange={(e) => setNewNumber(e.target.value)}
            required
          />
        </div>
        <button 
          type="submit" 
          className="px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors focus:outline-none flex items-center justify-center shadow-sm"
          title="Add Route"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </form>

      {/* Number List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-4 text-xs text-slate-400 animate-pulse">
            Loading alert routes...
          </div>
        ) : alertNumbers.length === 0 ? (
          <div className="text-center py-4 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
            <p className="text-xs text-slate-500 font-medium">No alert routes configured.</p>
          </div>
        ) : (
          alertNumbers.map((num, idx) => (
            <div 
              key={idx} 
              className="flex items-center justify-between p-3.5 bg-white border border-slate-100 rounded-xl shadow-sm group hover:border-slate-200 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center font-bold text-xs">
                  {idx + 1}
                </div>
                <p className="text-sm font-bold text-slate-700 font-mono tracking-tight">+{num}</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleTestMessage(num)}
                  disabled={isSendingTest}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-[11px] font-bold uppercase tracking-wider rounded-lg hover:bg-emerald-100 transition-colors focus:outline-none disabled:opacity-50 flex items-center gap-1.5"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Test
                </button>
                <button 
                  onClick={() => handleRemoveNumber(num)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors focus:outline-none opacity-0 group-hover:opacity-100"
                  title="Delete Route"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}