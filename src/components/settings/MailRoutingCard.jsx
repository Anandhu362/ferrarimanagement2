// frontend/src/components/settings/MailRoutingCard.jsx
import React, { useState, useEffect } from 'react';
import api from '../../config/api';

export default function MailRoutingCard({ activeBranch, addTerminalLog }) {
  const [emailInput, setEmailInput] = useState('');
  const [savedEmail, setSavedEmail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Fetch existing mail config on load
  useEffect(() => {
    // 🛑 Added 'Loading...' to prevent the premature 404 error
    if (!activeBranch || activeBranch === 'No Branch Selected' || activeBranch === 'Loading...') return;

    const fetchConfig = async () => {
      try {
        const response = await api.get(`/api/mail-config/${encodeURIComponent(activeBranch)}`);
        if (response.data.success && response.data.data.alertEmail) {
          setSavedEmail(response.data.data.alertEmail);
        }
      } catch (error) {
        console.error("Failed to fetch mail config", error);
      }
    };

    fetchConfig();
  }, [activeBranch]);

  const handleSave = async () => {
    if (!emailInput || !emailInput.includes('@')) {
      addTerminalLog('❌ Mail Routing: Invalid email format.');
      return;
    }
    
    if (!activeBranch || activeBranch === 'No Branch Selected') {
      addTerminalLog('❌ Mail Routing: No active branch selected.');
      return;
    }

    setIsLoading(true);
    addTerminalLog(`> Saving mail configuration for ${activeBranch}...`);

    try {
      const response = await api.post(`/api/mail-config/${encodeURIComponent(activeBranch)}`, {
        alertEmail: emailInput
      });

      if (response.data.success) {
        setSavedEmail(emailInput);
        setEmailInput('');
        addTerminalLog('✓ Mail Routing: Email configuration saved.');
      }
    } catch (error) {
      addTerminalLog(`❌ Mail Routing Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async () => {
    if (!activeBranch || activeBranch === 'No Branch Selected') return;

    setIsTesting(true);
    addTerminalLog(`> Dispatching test email to ${savedEmail}...`);

    try {
      const response = await api.post(`/api/mail-config/${encodeURIComponent(activeBranch)}/test`);
      
      if (response.data.success) {
        addTerminalLog('✓ Mail Routing: Test email dispatched successfully.');
      }
    } catch (error) {
      addTerminalLog(`❌ Mail Routing Test Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleRemove = async () => {
    if (!activeBranch || activeBranch === 'No Branch Selected') return;

    setIsLoading(true);
    addTerminalLog(`> Removing mail configuration for ${activeBranch}...`);

    try {
      const response = await api.post(`/api/mail-config/${encodeURIComponent(activeBranch)}`, {
        alertEmail: ''
      });

      if (response.data.success) {
        setSavedEmail(null);
        addTerminalLog('✓ Mail Routing: Email configuration removed.');
      }
    } catch (error) {
      addTerminalLog(`❌ Mail Routing Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[2rem] p-7 border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-6">
        <p className="text-slate-400 text-xs font-medium tracking-widest uppercase">Mail Alert Routing</p>
      </div>

      {/* Input Group */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <input 
            type="email" 
            placeholder="e.g. branch.alerts@domain.com" 
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            disabled={isLoading || savedEmail !== null}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900/20 transition-all disabled:opacity-60 disabled:bg-slate-100"
          />
        </div>
        <button 
          onClick={handleSave} 
          disabled={isLoading || !emailInput || savedEmail !== null}
          className="w-11 h-11 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-slate-800 transition-colors shrink-0 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
        >
          {isLoading && !savedEmail ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          )}
        </button>
      </div>

      {/* Saved Configuration List Area */}
      {savedEmail && (
        <div className="flex items-center justify-between p-3.5 border border-slate-100 rounded-[1rem] bg-white shadow-sm transition-all hover:border-slate-200">
          <div className="flex items-center gap-3.5 truncate pr-2">
            <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
              1
            </span>
            <span className="text-sm font-medium text-slate-700 truncate">
              {savedEmail}
            </span>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={handleTest} 
              disabled={isTesting}
              className="px-3.5 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold tracking-widest rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1.5 disabled:opacity-60"
            >
              {isTesting ? 'TESTING...' : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                  TEST
                </>
              )}
            </button>
            <button 
              onClick={handleRemove}
              disabled={isLoading}
              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors disabled:opacity-60"
              title="Remove Email"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}