import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api'; // Adjust path if needed based on your structure

export default function SettingsPage() {
  const navigate = useNavigate();
  const [activeBranch, setActiveBranch] = useState('Loading...');
  const [systemStatus, setSystemStatus] = useState('Checking...');
  const [services, setServices] = useState({ firestore: 'PENDING', bigquery: 'PENDING' });
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [uptime, setUptime] = useState('--h --m');

  useEffect(() => {
    // 1. Fetch Local Session Data
    const branch = localStorage.getItem('active_branch') || 'No Branch Selected';
    setActiveBranch(branch);

    // 2. Fetch Live System Health from Backend
    const fetchHealth = async () => {
      try {
        const response = await api.get('/api/system/health');
        if (response.data && response.data.success) {
          const data = response.data.data;
          setSystemStatus(data.status);
          setServices(data.services);
          setUptime(data.uptime);
          setTerminalLogs(data.logs);
        } else {
          setSystemStatus('DEGRADED');
          setTerminalLogs(prev => [...prev, '❌ Failed to parse health response.']);
        }
      } catch (error) {
        setSystemStatus('OFFLINE');
        setTerminalLogs([
          "> Initializing system diagnostics...",
          "❌ Connection to backend failed.",
          `Error details: ${error.message}`
        ]);
      }
    };

    fetchHealth();

    // Optional: Poll every 30 seconds for live updates
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

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
              className="text-xs font-mono text-slate-400 hover:text-white transition-colors bg-slate-800 px-3 py-1.5 rounded-lg"
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
                    <span className="text-slate-600 select-none text-xs mt-0.5 w-12 text-right">
                      {String(index + 1).padStart(3, ' ')}
                    </span>
                    <span className={`${colorClass} break-all`}>
                      {log}
                    </span>
                  </div>
                );
              })}
              {/* Blinking Cursor Effect */}
              <div className="flex gap-4 animate-pulse pt-2">
                <span className="text-slate-600 select-none text-xs mt-0.5 w-12 text-right">
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