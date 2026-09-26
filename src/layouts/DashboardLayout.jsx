// frontend/src/layouts/DashboardLayout.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

export default function DashboardLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [branchName, setBranchName] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  // Toggle desktop sidebar collapse state
  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar_collapsed', String(next));
      } catch (err) {
        console.error("Failed to persist sidebar state:", err);
      }
      return next;
    });
  };

  // Live Dubai Time & Date State
  const [dubaiTime, setDubaiTime] = useState('');
  const [dubaiDate, setDubaiDate] = useState('');

  useEffect(() => {
    const updateDubaiClock = () => {
      const now = new Date();
      
      const timeFormatted = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Dubai',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).format(now);

      const dateFormatted = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Dubai',
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).format(now);

      setDubaiTime(timeFormatted);
      setDubaiDate(dateFormatted);
    };

    updateDubaiClock();
    const timerId = setInterval(updateDubaiClock, 1000);

    return () => clearInterval(timerId);
  }, []);

  // Reacts to route changes and cross-tab storage updates
  useEffect(() => {
    const updateBranchState = () => {
      const storedBranch = localStorage.getItem('active_branch');
      
      // Prevent redirect loops if the user is on public authentication pages
      const isPublicRoute = ['/', '/login', '/register'].includes(location.pathname);

      if (!storedBranch && !isPublicRoute) {
        navigate('/');
      } else if (storedBranch) {
        setBranchName(storedBranch.toUpperCase());
      }
    };

    // Run immediately on mount and every time the URL path changes
    updateBranchState();

    // Listen for localStorage changes from other browser tabs
    window.addEventListener('storage', updateBranchState);
    
    return () => {
      window.removeEventListener('storage', updateBranchState);
    };
  }, [navigate, location.pathname]);

  // 1. Finance Items 
  const financeItems = [
    { name: 'Dashboard Overview', path: '/dashboard', icon: (<svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>)},
    { name: 'Mass Inflow', path: '/inflow', icon: (<svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>)},
    { name: 'Accountant Vault', path: '/accountant-vault', icon: (<svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>)},
    { name: 'CEO Vault', path: '/vault', icon: (<svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>)},
    { name: 'Bank Vault', path: '/bank-vault', icon: (<svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>)},
    { name: 'Sales Entry', path: '/sales-entry', icon: (<svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>)},
    { name: 'Expenses', path: '/expenses', icon: (<svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>)},
    { name: 'Petty Cash', path: '/petty-cash', icon: (<svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>)},
    { name: 'Exchange', path: '/exchange', icon: (<svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>)},
    { name: 'Master Ledger', path: '/logs', icon: (<svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>)}
  ];

  // 2. Ops Items
  const opsItems = [
    { name: 'Employee Management', path: '/operations/employees', icon: (<svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>)},
    { name: 'Inventory', path: '/inventory', icon: (<svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>)}
  ];

  // 3. Procurement Items
  const procurementItems = [
    { name: 'LPO Generator', path: '/operations/lpo-generator', icon: (<svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>)},
    { name: 'Vendors', path: '/procurement/vendors', icon: (<svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>)}
  ];

  const allNavItems = [...financeItems, ...opsItems, ...procurementItems];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('active_branch'); // Clear session manually on logout
      navigate('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Helper to render navigation links in full or collapsed icon mode
  const renderNavLinks = (items) => {
    return items.map((item) => {
      const isActive = location.pathname.startsWith(item.path);
      return (
        <div key={item.name} className="relative group">
          <Link
            to={item.path}
            onClick={closeMobileMenu}
            title={isSidebarCollapsed ? item.name : ''}
            className={`flex items-center rounded-2xl transition-all duration-200 ${
              isSidebarCollapsed 
                ? 'justify-center p-3.5 mx-auto w-12 h-12' 
                : 'gap-3 px-4 py-3.5'
            } ${
              isActive 
                ? 'bg-white/10 text-white font-medium shadow-sm' 
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className={`shrink-0 ${isActive ? 'text-white' : 'text-brand-light group-hover:text-white'} transition-colors`}>
              {item.icon}
            </span>
            {!isSidebarCollapsed && (
              <span className="truncate transition-opacity duration-200">
                {item.name}
              </span>
            )}
          </Link>

          {/* Minimal Floating Tooltip on Hover when Collapsed */}
          {isSidebarCollapsed && (
            <div className="hidden lg:group-hover:flex items-center absolute left-[68px] top-1/2 -translate-y-1/2 z-50 pointer-events-none">
              <div className="bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xl border border-white/10 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150 flex items-center gap-1.5">
                <span>{item.name}</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
              </div>
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="h-screen overflow-hidden bg-brand-bg flex font-sans antialiased">
      
      {/* SIDEBAR */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-brand-dark flex flex-col justify-between h-screen transform transition-all duration-300 ease-in-out shrink-0 select-none ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${
          isSidebarCollapsed ? 'w-20' : 'w-72'
        }`}
      >
        
        <div className="overflow-y-auto overflow-x-hidden no-scrollbar flex-1">
          
          {/* SIDEBAR HEADER & TOP MINIMIZE BUTTON */}
          <div className="h-16 lg:h-18 shrink-0 flex items-center justify-between px-4 border-b border-white/5 relative">
            
            {/* Expanded Header View */}
            {!isSidebarCollapsed ? (
              <div className="flex items-center justify-between w-full pl-2">
                <h1 className="text-lg font-extrabold text-white tracking-widest truncate">
                  {branchName || 'MANAGEMENT'}
                </h1>
                
                {/* Desktop Collapse Button */}
                <button
                  onClick={toggleSidebar}
                  title="Minimize Sidebar"
                  className="hidden lg:flex items-center justify-center w-8 h-8 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
              </div>
            ) : (
              /* Minimized / Collapsed Header View */
              <div className="flex items-center justify-center w-full">
                <button
                  onClick={toggleSidebar}
                  title="Expand Sidebar"
                  className="flex items-center justify-center w-10 h-10 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all hover:scale-105 shadow-sm group"
                >
                  <span className="font-extrabold text-sm tracking-wider">
                    {branchName ? branchName.charAt(0) : 'M'}
                  </span>
                  <svg className="w-3.5 h-3.5 ml-0.5 text-white/60 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}

            {/* Mobile Close Button */}
            <button onClick={closeMobileMenu} className="lg:hidden absolute right-4 text-white/50 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="p-3 space-y-6 mt-2">
            
            {/* Financial Hub Section */}
            <div className="space-y-1">
              {!isSidebarCollapsed ? (
                <div className="px-3 text-[11px] font-semibold text-brand-light uppercase tracking-wider mb-2">
                  Financial Hub
                </div>
              ) : (
                <div className="h-px bg-white/10 my-2 mx-2" title="Financial Hub" />
              )}
              {renderNavLinks(financeItems)}
            </div>

            {/* Operations Section */}
            <div className="space-y-1">
              {!isSidebarCollapsed ? (
                <div className="px-3 text-[11px] font-semibold text-brand-light uppercase tracking-wider mb-2">
                  Operations
                </div>
              ) : (
                <div className="h-px bg-white/10 my-2 mx-2" title="Operations" />
              )}
              {renderNavLinks(opsItems)}
            </div>

            {/* Procurement Section */}
            <div className="space-y-1">
              {!isSidebarCollapsed ? (
                <div className="px-3 text-[11px] font-semibold text-brand-light uppercase tracking-wider mb-2">
                  Procurement
                </div>
              ) : (
                <div className="h-px bg-white/10 my-2 mx-2" title="Procurement" />
              )}
              {renderNavLinks(procurementItems)}
            </div>
          </nav>
        </div>

        {/* User / Settings / Logout Section */}
        <div className="p-3 border-t border-white/5 shrink-0 bg-brand-dark">
          <div className="relative group">
            <Link 
              to="/settings"
              onClick={closeMobileMenu}
              title={isSidebarCollapsed ? 'Settings' : ''}
              className={`flex items-center rounded-2xl transition-all duration-200 mb-1.5 ${
                isSidebarCollapsed 
                  ? 'justify-center p-3.5 mx-auto w-12 h-12' 
                  : 'gap-3 px-4 py-3'
              } ${
                location.pathname.startsWith('/settings')
                  ? 'bg-white/10 text-white font-medium' 
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {!isSidebarCollapsed && <span className="font-medium text-sm">Settings</span>}
            </Link>

            {isSidebarCollapsed && (
              <div className="hidden lg:group-hover:flex items-center absolute left-[68px] top-1/2 -translate-y-1/2 z-50 pointer-events-none">
                <div className="bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xl border border-white/10 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
                  Settings
                </div>
              </div>
            )}
          </div>

          {auth.currentUser && (
            <div className="relative group">
              <button 
                onClick={handleLogout}
                title={isSidebarCollapsed ? 'Sign Out' : ''}
                className={`flex items-center rounded-2xl text-white/60 hover:bg-red-500/10 hover:text-red-400 transition-colors ${
                  isSidebarCollapsed 
                    ? 'justify-center p-3.5 mx-auto w-12 h-12' 
                    : 'w-full gap-3 px-4 py-3'
                }`}
              >
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {!isSidebarCollapsed && <span className="font-medium text-sm">Sign Out</span>}
              </button>

              {isSidebarCollapsed && (
                <div className="hidden lg:group-hover:flex items-center absolute left-[68px] top-1/2 -translate-y-1/2 z-50 pointer-events-none">
                  <div className="bg-slate-900 text-rose-300 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xl border border-white/10 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
                    Sign Out
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* MOBILE OVERLAY */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-brand-dark/80 backdrop-blur-sm z-40 lg:hidden" onClick={closeMobileMenu} />
      )}

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto relative scroll-smooth transition-all duration-300">
        
        {/* TOP HEADER */}
        <header className="h-16 lg:h-18 shrink-0 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg lg:text-xl font-semibold text-slate-900 tracking-tight hidden sm:block">
              {allNavItems.find(item => location.pathname.startsWith(item.path))?.name || 
               (location.pathname.startsWith('/settings') ? 'Settings' : 'Dashboard')}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Minimal Live Dubai Date & Time Pill */}
            {dubaiTime && (
              <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-slate-500 font-medium text-[11px] tracking-tight">{dubaiDate}</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-900 font-semibold tracking-tight">{dubaiTime}</span>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded-md tracking-wider uppercase ml-0.5">DXB</span>
                </div>
              </div>
            )}

            <button className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors relative">
              <span className="absolute top-2 right-2 w-2 h-2 bg-brand-light rounded-full border-2 border-white"></span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <Link to="/settings" className="w-9 h-9 rounded-full bg-brand-light/10 border border-brand-light/20 flex items-center justify-center text-brand-dark font-medium hover:bg-brand-light/20 transition-colors cursor-pointer text-sm">
              A
            </Link>
          </div>
        </header>

        {/* FLUID LAPTOP & DESKTOP MAIN CONTAINER */}
        <main className="flex-1 p-4 sm:p-5 lg:p-6 xl:p-8 2xl:p-10">
          <Outlet /> 
        </main>
      </div>
    </div>
  );
}