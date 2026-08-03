// frontend/src/pages/operations/EmployeeManagement.jsx
import React, { useState, useEffect, useRef } from 'react';
import EmployeeListTable from '../../components/operations/EmployeeListTable';
import AddEmployeeModal from '../../components/operations/AddEmployeeModal';
import api from '../../config/api'; // Import your configured axios instance

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // UI State for loading spinner and modals
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: 'success', message: '' });
  
  // ✅ NEW: Synchronous memory lock to prevent rapid double-click API calls
  const submitLock = useRef(false);

  // Fetch real data from Backend / Firestore
  const fetchEmployees = async () => {
    const activeBranch = localStorage.getItem('active_branch');
    if (!activeBranch) return;

    setLoading(true);
    try {
      const response = await api.get(`/api/employees/${activeBranch}`);
      if (response.data.success) {
        setEmployees(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching employees from DB:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddEmployee = async (newEmployeeData) => {
    const activeBranch = localStorage.getItem('active_branch');
    if (!activeBranch) {
      setModal({ isOpen: true, type: 'error', message: "No active branch selected." });
      return;
    }

    // ✅ UPDATED: Check the synchronous lock instead of the async state
    if (submitLock.current) return;
    
    // ✅ NEW: Lock the function instantaneously in memory
    submitLock.current = true;
    setIsSubmitting(true); // Still update state to show the UI loading spinner

    try {
      // Post to backend (which handles encryption and Firestore saving)
      const response = await api.post(`/api/employees/${activeBranch}`, newEmployeeData);
      
      if (response.data.success) {
        // Refresh the list from the DB to ensure sync
        fetchEmployees(); 
        setIsModalOpen(false);
        setModal({ isOpen: true, type: 'success', message: 'Employee securely registered in the system.' });
      }
    } catch (error) {
      console.error("Error saving employee to DB:", error);
      const errorMsg = error.response?.data?.message || 'Network error. Failed to save employee.';
      setModal({ isOpen: true, type: 'error', message: errorMsg });
    } finally {
      // ✅ NEW: Release the lock strictly in the finally block
      submitLock.current = false; 
      setIsSubmitting(false); 
    }
  };

  // Simple KPI Calculators for Top Cards
  const totalEmployees = employees.length;
  
  // Count how many documents across all employees are expiring in < 90 days
  const getCriticalCount = () => {
    let count = 0;
    const today = new Date();
    employees.forEach(emp => {
      [emp.emiratesIdExpiry, emp.workPermitExpiry, emp.passportExpiry, emp.healthInsuranceExpiry].forEach(date => {
        if (date) {
          const daysLeft = (new Date(date) - today) / (1000 * 60 * 60 * 24);
          if (daysLeft <= 90) count++;
        }
      });
    });
    return count;
  };
  const criticalDocs = getCriticalCount();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <span className="relative flex h-6 w-6">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-light opacity-75"></span>
          <span className="relative inline-flex rounded-full h-6 w-6 bg-brand-dark"></span>
        </span>
        <p className="text-slate-500 font-medium tracking-wide animate-pulse">Syncing compliance database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-[1600px] mx-auto pb-12 relative">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-[1.75rem] font-semibold text-slate-900 tracking-tight leading-tight">Employee Tracking</h2>
          <p className="text-slate-500 text-sm mt-1.5 font-light tracking-wide">Monitor personnel documentation, visa statuses, and passport expiries.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-100 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            <span className="text-sm font-medium text-slate-700">Add Employee</span>
          </button>
        </div>
      </div>

      {/* TOP SECTION: KPI Cards focused on Compliance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Brand Dark Card */}
        <div className="bg-brand-dark rounded-[2rem] p-7 text-white relative overflow-hidden shadow-[0_12px_40px_rgb(43,38,64,0.3)]">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-brand-light/30 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <p className="text-white/60 text-xs font-medium mb-1.5 tracking-widest uppercase">Total Workforce</p>
            <h3 className="text-4xl font-semibold tracking-tighter">
              {totalEmployees}
            </h3>
            <div className="mt-5 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-[11px] font-medium text-white/70 bg-white/5 px-3 py-2 rounded-xl border border-white/10 w-max">
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Live Database</span>
              </div>
            </div>
          </div>
        </div>

        {/* Warning Card */}
        <div className="bg-white rounded-[2rem] p-7 border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow duration-300">
          <div className="flex justify-between items-start">
            <p className="text-slate-400 text-xs font-medium mb-1.5 tracking-widest uppercase">Action Required</p>
            <span className={`p-1.5 rounded-full ${criticalDocs > 0 ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}>
               <svg className={`w-3.5 h-3.5 ${criticalDocs > 0 ? 'text-amber-500' : 'text-emerald-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </span>
          </div>
          <h3 className="text-4xl font-semibold text-slate-900 tracking-tighter">
            {criticalDocs}
          </h3>
          <p className="text-xs text-slate-400 mt-2 font-medium">Documents Expiring (90 Days)</p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-[2rem] p-7 border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow duration-300">
          <p className="text-slate-400 text-xs font-medium mb-1.5 tracking-widest uppercase">Compliance Status</p>
          <h3 className={`text-3xl font-semibold tracking-tight ${criticalDocs > 2 ? 'text-amber-600' : 'text-emerald-600'} mt-1`}>
             {criticalDocs > 2 ? 'Review Needed' : 'Healthy'}
          </h3>
          <p className="text-xs text-slate-400 mt-3 font-medium">Based on MOHRE tracking</p>
        </div>

      </div>

      <EmployeeListTable employees={employees} />

      <AddEmployeeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdd={handleAddEmployee} 
        isSubmitting={isSubmitting} // Passes the visual loading state down to the modal
      />

      {/* Custom Premium Success/Error Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" onClick={() => setModal({ ...modal, isOpen: false })}></div>
          
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full relative z-10 shadow-[0_20px_60px_rgb(0,0,0,0.08)] animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center">
              
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 ${
                modal.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'
              }`}>
                {modal.type === 'success' ? (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              
              <h3 className="text-xl font-semibold text-slate-900 mb-2 tracking-tight">
                {modal.type === 'success' ? 'Success' : 'Action Failed'}
              </h3>
              
              <p className="text-slate-500 text-sm font-light leading-relaxed mb-8">
                {modal.message}
              </p>
              
              <button 
                onClick={() => setModal({ ...modal, isOpen: false })}
                className="w-full py-3.5 bg-slate-900 text-white rounded-full font-medium hover:bg-slate-800 transition-colors shadow-md hover:shadow-lg"
              >
                Okay, got it
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}