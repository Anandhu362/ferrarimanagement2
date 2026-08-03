// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase';

// ✅ NEW: Import the SyncProvider for offline "Store & Forward" capabilities
import { SyncProvider } from './context/SyncManager';

// Import your pages...
import Login from './pages/auth/Login';
import RegisterBranch from './pages/auth/RegisterBranch';
import AgentLogin from './pages/auth/AgentLogin'; 
import AgentRegister from './pages/auth/AgentRegister'; 
import AgentDashboard from './pages/agent/AgentDashboard'; 
import AgentExpenseEntry from './pages/agent/AgentExpenseEntry'; 
import AgentDenominationEntry from './pages/agent/AgentDenominationEntry'; 
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/dashboard/Dashboard';
import MassInflow from './pages/cash-inflow/MassInflow'; 
import VaultOverview from './pages/vault/VaultOverview';
import AccountantVault from './pages/vault/AccountantVault';
import BankVaultOverview from './pages/vault/BankVaultOverview';
import ExpenseForm from './pages/expenses/ExpenseForm';
import PettyCashManager from './pages/petty-cash/PettyCashManager';
import LogsPage from './pages/logs/LogsPage'; 
import ExchangePage from './pages/exchange/ExchangePage'; 
import SettingsPage from './pages/settings/SettingsPage'; 

// Operations pages
import SalesEntry from './pages/sales/SalesEntry'; 
import OrderHistory from './pages/orders/OrderHistory'; 
import InventoryPage from './pages/inventory/InventoryPage';
import CustomerManagement from './pages/customers/CustomerManagement'; 
import DeliveryFormGen from './pages/orders/DeliveryFormGen'; 
import EmployeeManagement from './pages/operations/EmployeeManagement'; // ✅ NEW: Import Employee Management

function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (isAuthLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    // ✅ NEW: Wrap the entire application routing in the SyncProvider
    <SyncProvider>
      <BrowserRouter>
        <Routes>
          {/* ========================================================
              1. ROOT & AUTH GATEWAY
              If accessing '/' -> Go to Dashboard (if logged in) OR Login
              ======================================================== */}
          <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
          
          <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <RegisterBranch />} />
          
          {/* ========================================================
              AGENT ROUTES (Mobile App)
              Protected with redirect logic
              ======================================================== */}
          <Route path="/agent-login" element={user ? <Navigate to="/agent-dashboard" replace /> : <AgentLogin />} />
          <Route path="/agent-register" element={user ? <Navigate to="/agent-dashboard" replace /> : <AgentRegister />} />
          
          {/* Protected Agent Dashboard Route */}
          <Route path="/agent-dashboard" element={user ? <AgentDashboard /> : <Navigate to="/agent-login" replace />} />
          
          {/* Protected Agent Expense Entry Route (Step 2 of Collection) */}
          <Route path="/agent/expenses" element={user ? <AgentExpenseEntry /> : <Navigate to="/agent-login" replace />} />

          {/* Protected Agent Denominations Route (Step 3 of Collection) */}
          <Route path="/agent/denominations" element={user ? <AgentDenominationEntry /> : <Navigate to="/agent-login" replace />} />

          {/* ========================================================
              2. PUBLIC ROUTES (Sales & Ops)
              NO LOGIN REQUIRED. Direct URL access works immediately.
              ======================================================== */}
          <Route element={<DashboardLayout />}>
            <Route path="/sales-entry" element={<SalesEntry />} />
            <Route path="/delivery-form" element={<DeliveryFormGen />} /> 
            <Route path="/customers" element={<CustomerManagement />} /> 
            <Route path="/order-history" element={<OrderHistory />} /> 
            <Route path="/inventory" element={<InventoryPage />} /> 
          </Route>

          {/* ========================================================
              3. PROTECTED ROUTES (Financial Hub)
              LOGIN REQUIRED. Blocks unauthenticated users.
              ======================================================== */}
          <Route element={user ? <DashboardLayout /> : <Navigate to="/login" replace />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inflow" element={<MassInflow />} /> 
            <Route path="/vault" element={<VaultOverview />} />
            <Route path="/accountant-vault" element={<AccountantVault />} />
            <Route path="/bank-vault" element={<BankVaultOverview />} /> 
            <Route path="/expenses" element={<ExpenseForm />} />
            <Route path="/petty-cash" element={<PettyCashManager />} />
            <Route path="/logs" element={<LogsPage />} /> 
            <Route path="/exchange" element={<ExchangePage />} /> 
            <Route path="/settings" element={<SettingsPage />} /> 
            
            {/* ✅ NEW: Protected Employee Management Route */}
            <Route path="/operations/employees" element={<EmployeeManagement />} />
          </Route>

          {/* Fallback route for unmatched paths */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </SyncProvider>
  );
}

export default App;