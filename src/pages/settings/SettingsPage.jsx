// frontend/src/pages/settings/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api'; 
import AlertRoutingCard from '../../components/settings/AlertRoutingCard';
import MailRoutingCard from '../../components/settings/MailRoutingCard';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [activeBranch, setActiveBranch] = useState('Loading...');
  
  // Existing System Health State
  const [systemStatus, setSystemStatus] = useState('Checking...');
  const [services, setServices] = useState({ firestore: 'PENDING', bigquery: 'PENDING' });
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [uptime, setUptime] = useState('--h --m');

  // WhatsApp State
  const [waStatus, setWaStatus] = useState('LOADING');
  const [qrCode, setQrCode] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Helper to safely extract string Branch ID from localStorage
  const getBranchId = (branchData) => {
    if (!branchData) return '';
    try {
        // Attempt to parse in case it was stored as a JSON object string
        const parsed = JSON.parse(branchData);
        if (typeof parsed === 'object' && parsed !== null) {
            return parsed.id || parsed.name || parsed.branchId || '';
        }
        return String(parsed);
    } catch (e) {
        // If it's not valid JSON, assume it's just a raw string
        if (typeof branchData === 'object') {
             return branchData.id || branchData.name || branchData.branchId || '';
        }
        return String(branchData);
    }
  };

  useEffect(() => {
    // 1. Fetch Local Session Data safely
    const rawBranchData = localStorage.getItem('active_branch');
    const branchString = getBranchId(rawBranchData) || 'No Branch Selected';
    setActiveBranch(branchString);

    // 2. Fetch Live System Health from Backend
    const fetchHealth = async () => {
      try {
        const response = await api.get('/api/system/health');
        if (response.data && response.data.success) {
          const data = response.data.data;
          setSystemStatus(data.status);
          setServices(data.services);
          setUptime(data.uptime);
          // Only update logs if we haven't manually added WA logs to prevent overwriting
          setTerminalLogs(prev => prev.length > 5 ? prev : data.logs);
        } else {
          setSystemStatus('DEGRADED');
        }
      } catch (error) {
        setSystemStatus('OFFLINE');
      }
    };

    fetchHealth();

    // 3. Setup polling intervals
    const healthInterval = setInterval(fetchHealth, 30000);
    const waInterval = setInterval(checkWaStatus, 10000);
    
    // Initial WA status check
    checkWaStatus();

    return () => {
        clearInterval(healthInterval);
        clearInterval(waInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- WhatsApp Functions ---
  const checkWaStatus = async () => {
    const rawBranchData = localStorage.getItem('active_branch');
    const branch = getBranchId(rawBranchData);
    if (!branch || branch === 'No Branch Selected') return;

    try {
      const response = await api.get(`/api/whatsapp/status/${encodeURIComponent(branch)}`);
      if (response.data.success) {
        setWaStatus(response.data.status);
      }
    } catch (error) {
      setWaStatus('DISCONNECTED');
    }
  };

  const addTerminalLog = (msg) => {
    setTerminalLogs(prev => [...prev, msg]);
  };

  const handleConnect = async () => {
    const rawBranchData = localStorage.getItem('active_branch');
    const branch = getBranchId(rawBranchData);
    
    if (!branch || branch === 'No Branch Selected') {
        addTerminalLog("❌ WhatsApp Error: Cannot connect without an active branch.");
        return;
    }

    setIsConnecting(true);
    setQrCode(null);
    addTerminalLog("> Initializing WhatsApp socket...");
    
    try {
      const response = await api.post(`/api/whatsapp/connect/${encodeURIComponent(branch)}`);
      if (response.data.success) {
        if (response.data.status === 'AWAITING_SCAN' && response.data.qrCode) {
          setQrCode(response.data.qrCode);
          setWaStatus('AWAITING_SCAN');
          addTerminalLog("⚡ WhatsApp Engine: Awaiting QR Scan");
        } else if (response.data.status === 'CONNECTED') {
          setWaStatus('CONNECTED');
          addTerminalLog("✓ WhatsApp Engine: Connected successfully.");
        }
      }
    } catch (error) {
      addTerminalLog(`❌ WhatsApp Error: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    const rawBranchData = localStorage.getItem('active_branch');
    const branch = getBranchId(rawBranchData);
    if (!branch || branch === 'No Branch Selected') return;

    addTerminalLog("> Terminating WhatsApp socket...");
    try {
      await api.post(`/api/whatsapp/disconnect/${encodeURIComponent(branch)}`);
      // ✅ FIX: Update local state to match the new backend SUSPENDED status
      setWaStatus('SUSPENDED');
      setQrCode(null);
      addTerminalLog("✓ WhatsApp Engine: Suspended.");
    } catch (error) {
      addTerminalLog("❌ WhatsApp Disconnect Error.");
    }
  };
  // ------------------------------

  const handleLogout = () => {
    localStorage.removeItem('active_branch');
    localStorage.removeItem('token');
    navigate('/auth/login');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-[1600px] mx-auto pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-[1.75rem] font-semibold text-slate-900 tracking-tight leading-tight">System Settings</h2>
          <p className="text-slate-500 text-sm mt-1.5 font-light tracking-wide">Infrastructure diagnostics, terminal logs, and session management.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${systemStatus === 'ONLINE' ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${systemStatus === 'ONLINE' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
          </span>
          <span className="text-xs font-medium text-slate-600 tracking-wide uppercase">
            Server: {systemStatus}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Session & Connections */}
        <div className="flex flex-col gap-6">
          
          {/* Active Session Card */}
          <div className="bg-white rounded-[2rem] p-7 border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
            <div className="flex justify-between items-start mb-6">
              <p className="text-slate-400 text-xs font-medium tracking-widest uppercase">Active Session</p>
              <span className="bg-brand-dark text-white text-[10px] px-2 py-1 rounded-lg uppercase tracking-wider">Admin</span>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Branch Identity</p>
                <p className="text-lg font-semibold text-slate-900">{activeBranch}</p>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <button 
                  onClick={handleLogout}
                  className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 text-sm font-medium py-2.5 rounded-xl transition-colors"
                >
                  Terminate Session
                </button>
              </div>
            </div>
          </div>

          {/* Infrastructure Health Card */}
          <div className="bg-white rounded-[2rem] p-7 border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex-1">
             <div className="flex justify-between items-center mb-6">
               <p className="text-slate-400 text-xs font-medium tracking-widest uppercase">Infrastructure Links</p>
               <p className="text-[10px] text-slate-400 font-medium">UPTIME: {uptime}</p>
             </div>
             
             <div className="space-y-5">
               {/* Firestore Status */}
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                     <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>
                   </div>
                   <div>
                     <p className="text-sm font-semibold text-slate-900">Firestore DB</p>
                     <p className="text-xs text-slate-500">Live Sync Active</p>
                   </div>
                 </div>
                 <span className={`text-xs font-medium px-2 py-1 rounded-lg ${services.firestore === 'ONLINE' ? 'text-emerald-500 bg-emerald-50' : 'text-rose-500 bg-rose-50'}`}>
                   {services.firestore || 'CHECKING'}
                 </span>
               </div>

               {/* BigQuery Status */}
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                     <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                   </div>
                   <div>
                     <p className="text-sm font-semibold text-slate-900">BigQuery Engine</p>
                     <p className="text-xs text-slate-500">Analytics Ready</p>
                   </div>
                 </div>
                 <span className={`text-xs font-medium px-2 py-1 rounded-lg ${services.bigquery === 'ONLINE' ? 'text-emerald-500 bg-emerald-50' : 'text-rose-500 bg-rose-50'}`}>
                   {services.bigquery || 'CHECKING'}
                 </span>
               </div>
             </div>
          </div>

          {/* Premium Fintech WhatsApp Integration Card */}
          <div className="bg-white rounded-[2rem] p-7 border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex-1">
            <div className="flex justify-between items-center mb-6">
              <p className="text-slate-400 text-xs font-medium tracking-widest uppercase">External Integrations</p>
            </div>
            
            <div className="flex items-start justify-between border-b border-slate-100 pb-5 mb-5">
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
                  waStatus === 'CONNECTED' ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-200'
                }`}>
                  <svg className={`w-5 h-5 transition-colors ${waStatus === 'CONNECTED' ? 'text-emerald-500' : 'text-slate-400'}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                  </svg>
                </div>
                <div>
                  <h5 className="text-sm font-semibold text-slate-900">WhatsApp Engine</h5>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Session: <span className={
                      waStatus === 'CONNECTED' ? 'text-emerald-500' : 
                      waStatus === 'SUSPENDED' ? 'text-amber-500' : // ✅ FIX: Styled the suspended state color
                      'text-slate-700'
                    }>{waStatus.replace('_', ' ')}</span>
                  </p>
                </div>
              </div>
              
              {waStatus === 'CONNECTED' ? (
                <button onClick={handleDisconnect} className="px-4 py-2.5 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl hover:bg-rose-100 transition-colors focus:outline-none">
                  Disconnect
                </button>
              ) : (
                <button onClick={handleConnect} disabled={isConnecting} className="px-4 py-2.5 bg-brand-dark text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-60 focus:outline-none shadow-sm">
                  {isConnecting ? 'Initializing...' : 'Connect'}
                </button>
              )}
            </div>

            {/* Premium QR Code Display Area */}
            {waStatus === 'AWAITING_SCAN' && qrCode && (
              <div className="flex flex-col items-center justify-center p-6 bg-slate-50/50 rounded-[1.5rem] border border-slate-200/60 animate-in fade-in zoom-in-95 duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-light/10 rounded-bl-full -z-10"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-tr-full -z-10"></div>
                
                <p className="text-xs font-semibold text-slate-700 mb-5 text-center leading-relaxed">
                  Scan this QR Code via WhatsApp<br/>
                  <span className="font-normal text-slate-500">Settings {'>'} Linked Devices {'>'} Link a Device</span>
                </p>
                
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
                  <img src={qrCode} alt="WhatsApp QR Code" className="w-44 h-44 object-contain" />
                </div>
              </div>
            )}
          </div>

          {/* Modular Alert Routing Component */}
          <AlertRoutingCard 
            activeBranch={activeBranch} 
            waStatus={waStatus} 
            addTerminalLog={addTerminalLog} 
          />

          {/* Mail Alert Routing Component */}
          <MailRoutingCard 
            activeBranch={activeBranch} 
            addTerminalLog={addTerminalLog} 
          />

        </div>

        {/* Right Column: Server Terminal View */}
        <div className="lg:col-span-2 bg-slate-900 rounded-[2rem] p-8 border border-slate-800 shadow-[0_12px_40px_rgb(0,0,0,0.5)] flex flex-col relative overflow-hidden min-h-[500px]">
          <div className="flex justify-between items-center mb-6 relative z-10 border-b border-slate-700/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              </div>
              <h3 className="text-sm font-semibold text-slate-300 font-mono tracking-tight ml-2">server-output.log</h3>
            </div>
            <button 
              onClick={() => setTerminalLogs([])}
              className="text-xs font-mono text-slate-400 hover:text-white transition-colors bg-slate-800 px-3 py-1.5 rounded-lg focus:outline-none"
            >
              Clear Logs
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto font-mono text-sm relative z-10 custom-scrollbar pr-2">
            <div className="space-y-2">
              {terminalLogs.map((log, index) => {
                let colorClass = "text-slate-400"; // Default
                if (log.includes("✓") || log.includes("running") || log.includes("ONLINE") || log.includes("Active") || log.includes("Ready")) colorClass = "text-emerald-400";
                if (log.includes("⚡") || log.includes("warning")) colorClass = "text-amber-400";
                if (log.includes("Error") || log.includes("❌") || log.includes("failed") || log.includes("DEGRADED")) colorClass = "text-rose-400";
                if (log.startsWith(">")) colorClass = "text-blue-400 font-semibold";

                return (
                  <div key={index} className="flex gap-4 group">
                    <span className="text-slate-600 select-none text-xs mt-0.5 w-12 text-right shrink-0">
                      {String(index + 1).padStart(3, ' ')}
                    </span>
                    <span className={`${colorClass} break-words`}>
                      {log}
                    </span>
                  </div>
                );
              })}
              {/* Blinking Cursor Effect */}
              <div className="flex gap-4 animate-pulse pt-2">
                <span className="text-slate-600 select-none text-xs mt-0.5 w-12 text-right shrink-0">
                  {String(terminalLogs.length + 1).padStart(3, ' ')}
                </span>
                <span className="text-slate-500">_</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}