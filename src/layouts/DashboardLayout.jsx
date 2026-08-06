// frontend/src/layouts/DashboardLayout.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

export default function DashboardLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [branchName, setBranchName] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ UPDATED: Reacts to route changes and cross-tab storage updates
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
    { name: 'Dashboard Overview', path: '/dashboard', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>)},
    { name: 'Mass Inflow', path: '/inflow', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>)},
    { name: 'Accountant Vault', path: '/accountant-vault', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>)},
    { name: 'CEO Vault', path: '/vault', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>)},
    { name: 'Bank Vault', path: '/bank-vault', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>)},
    { name: 'Sales Entry', path: '/sales-entry', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>)},
    { name: 'Expenses', path: '/expenses', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>)},
    { name: 'Petty Cash', path: '/petty-cash', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>)},
    { name: 'Exchange', path: '/exchange', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>)},
    { name: 'Master Ledger', path: '/logs', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>)}
  ];

  // 2. Ops Items
  const opsItems = [
    { name: 'Employee Management', path: '/operations/employees', icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>)}
  ];

  const allNavItems = [...financeItems, ...opsItems];

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

  return (
    <div className="h-screen overflow-hidden bg-brand-bg flex font-sans antialiased">
      
      {/* SIDEBAR */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-brand-dark flex flex-col justify-between h-screen transform transition-transform duration-300 ease-in-out shrink-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        
        <div className="overflow-y-auto overflow-x-hidden no-scrollbar">
          
          <div className="h-20 shrink-0 flex items-center justify-center px-8 border-b border-white/5 relative">
            <h1 className="text-xl font-extrabold text-white tracking-widest text-center w-full break-words pr-6 lg:pr-0 transition-all duration-300">
              {branchName}
            </h1>
            <button onClick={closeMobileMenu} className="lg:hidden absolute right-4 text-white/50 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <nav className="p-4 space-y-8 mt-4">
            {/* Financial Hub Section */}
            <div className="space-y-1.5">
              <div className="px-4 text-xs font-semibold text-brand-light uppercase tracking-wider mb-3">
                Financial Hub
              </div>
              {financeItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group ${
                      isActive 
                        ? 'bg-white/10 text-white font-medium' 
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className={`${isActive ? 'text-white' : 'text-brand-light group-hover:text-white'} transition-colors`}>
                      {item.icon}
                    </span>
                    {item.name}
                  </Link>
                );
              })}
            </div>

            {/* Operations Section */}
            <div className="space-y-1.5">
              <div className="px-4 text-xs font-semibold text-brand-light uppercase tracking-wider mb-3">
                Operations
              </div>
              {opsItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group ${
                      isActive 
                        ? 'bg-white/10 text-white font-medium' 
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className={`${isActive ? 'text-white' : 'text-brand-light group-hover:text-white'} transition-colors`}>
                      {item.icon}
                    </span>
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>

        {/* User / Logout Section */}
        <div className="p-4 border-t border-white/5 shrink-0 bg-brand-dark">
          <Link 
            to="/settings"
            onClick={closeMobileMenu}
            className={`w-full flex items-center gap-3 px-4 py-3 mb-2 rounded-2xl transition-all duration-200 ${
              location.pathname.startsWith('/settings')
                ? 'bg-white/10 text-white font-medium' 
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="font-medium">Settings</span>
          </Link>

          {auth.currentUser && (
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-white/60 hover:bg-red-500/10 hover:text-red-400 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              <span className="font-medium">Sign Out</span>
            </button>
          )}
        </div>
      </aside>

      {/* MOBILE OVERLAY */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-brand-dark/80 backdrop-blur-sm z-40 lg:hidden" onClick={closeMobileMenu} />
      )}

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto relative scroll-smooth">
        <header className="h-20 shrink-0 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-6 lg:px-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight hidden sm:block">
              {allNavItems.find(item => location.pathname.startsWith(item.path))?.name || 
               (location.pathname.startsWith('/settings') ? 'Settings' : 'Dashboard')}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors relative">
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-brand-light rounded-full border-2 border-white"></span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            </button>
            <Link to="/settings" className="w-10 h-10 rounded-full bg-brand-light/10 border border-brand-light/20 flex items-center justify-center text-brand-dark font-medium hover:bg-brand-light/20 transition-colors cursor-pointer">
              A
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-10">
          <Outlet /> 
        </main>
      </div>
    </div>
  );
}