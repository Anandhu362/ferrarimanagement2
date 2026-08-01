// frontend/src/config/api.js
import axios from 'axios';

// Create a central instance
const api = axios.create({
  // This automatically uses your Cloud Run URL in production, and localhost locally!
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 60000, // ✅ Fix: Give the backend up to 60 seconds to process massive batches
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optional but recommended: Add an interceptor if you are passing Firebase tokens to the backend
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('firebase_token'); 
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// ✅ Centralized endpoint dictionary for clean referencing across frontend services
export const ENDPOINTS = {
  CUSTOMERS: '/api/customers',
  ORDERS: '/api/orders',       // Note: Mass Excel-style delivery uses /api/orders/bulk-excel
  INVENTORY: '/api/inventory',
  DASHBOARD: '/api/dashboard',
  BULK_HISTORY: '/api/orders/bulk-history',
  BULK_UPDATE: '/api/orders/bulk-excel/update',
  // DISPATCH endpoint removed as part of the Delivery Form Gen architectural pivot
  
  // ✅ NEW: Reserve Vault Endpoints
  RESERVE_REVERSAL: '/api/reserve/reverse-inflow',
};

// ✅ NEW: Exported API function to handle the Reserve Inflow Reversal
export const reverseReserveInflow = async (payload) => {
  return await api.post(ENDPOINTS.RESERVE_REVERSAL, payload);
};

// ✅ UPDATED: Exported API function to handle updating the Inflow Date (targeting live_ledger)
export const updateInflowDate = async (id, newDate, branchId) => {
  return await api.patch(`/api/inflow/${id}/date`, { newDate, branchId });
};

// ✅ NEW: Exported API function to handle updating the Expense Date (targeting live_ledger)
export const updateExpenseDate = async (id, newDate, branchId) => {
  return await api.patch(`/api/expenses/${id}/date`, { newDate, branchId });
};

// ✅ UPDATED: Exported API function to fetch the bank closing balance for a specific date
export const getBankBalanceForDate = async (branchId, date) => {
  return await api.get('/api/vault/closing-balance', { 
    params: { branchId, date } 
  });
};

export default api;