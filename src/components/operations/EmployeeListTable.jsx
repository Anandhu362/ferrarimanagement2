// frontend/src/components/operations/EmployeeListTable.jsx
import React, { useState } from 'react';
import { sendManualEmployeeAlert, deleteEmployee } from '../../config/api'; // ✅ IMPORTED deleteEmployee
// ✅ IMPORTED NEW COMPONENT
import ManageEmployeeModal from './ManageEmployeeModal';

const getExpiryDetails = (dateString) => {
  if (!dateString) return null;
  
  const expiry = new Date(dateString);
  const today = new Date(); 
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let color = 'bg-emerald-500';
  let bgColor = 'bg-emerald-50';
  let textColor = 'text-emerald-700';
  let progress = 100;

  if (diffDays < 0) {
    color = 'bg-rose-600';
    bgColor = 'bg-rose-50';
    textColor = 'text-rose-700';
    progress = 100;
  } else if (diffDays <= 30) {
    color = 'bg-rose-500';
    bgColor = 'bg-rose-50';
    textColor = 'text-rose-700';
    progress = (diffDays / 30) * 100;
  } else if (diffDays <= 90) {
    color = 'bg-amber-500';
    bgColor = 'bg-amber-50';
    textColor = 'text-amber-700';
    progress = (diffDays / 90) * 100;
  } else {
    progress = Math.min((diffDays / 365) * 100, 100);
  }

  return { 
    dateFormatted: expiry.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    days: diffDays, 
    color, 
    bgColor, 
    textColor, 
    progress 
  };
};

const ExpiryCell = ({ date, idNumber }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const details = getExpiryDetails(date);
  
  if (!details) return <span className="text-slate-400 text-xs font-medium">-</span>;

  const getMaskedId = (id) => {
    if (!id) return '•••• ••••';
    if (id.length <= 4) return '••••';
    return `•••• ${id.slice(-4)}`;
  };

  return (
    <div className="flex flex-col gap-1.5 w-full max-w-[140px]">
      <div className="flex justify-between items-end">
        <span className="text-slate-900 font-semibold text-[13px] tracking-tight">{details.dateFormatted}</span>
        <span className={`text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded-md ${details.bgColor} ${details.textColor}`}>
          {details.days < 0 ? 'EXPIRED' : `${details.days}D`}
        </span>
      </div>
      
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full ${details.color} transition-all duration-1000 ease-out`}
          style={{ width: `${details.progress}%` }}
        />
      </div>

      {idNumber && (
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-[11px] font-semibold text-slate-600 font-mono tracking-widest transition-all">
            {isRevealed ? idNumber : getMaskedId(idNumber)}
          </span>
          <button 
            onClick={() => setIsRevealed(!isRevealed)}
            className="text-slate-400 hover:text-brand-dark transition-colors p-0.5 rounded focus:outline-none"
            title={isRevealed ? "Hide ID" : "Show ID"}
          >
            {isRevealed ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

// ✅ FIX: Added onDeleteClick prop to pass the employee up to the delete modal state
const EmployeeRowActions = ({ employee, branchId, onManageClick, onDeleteClick }) => {
  const [isAlerting, setIsAlerting] = useState(false);

  const handleAlertClick = async () => {
    if (isAlerting) return;
    setIsAlerting(true);
    
    try {
      let activeBranch = branchId;
      
      if (!activeBranch || activeBranch === 'null' || activeBranch === 'undefined') {
        const storedBranch = localStorage.getItem('activeBranch');
        if (storedBranch) {
          try {
            const parsed = JSON.parse(storedBranch);
            activeBranch = parsed?.id || parsed?.branchId || parsed;
          } catch (e) {
            activeBranch = storedBranch;
          }
        }
      }

      if (typeof activeBranch === 'string') {
        activeBranch = activeBranch.replace(/['"]+/g, '');
      }

      if (!activeBranch || activeBranch === 'null' || activeBranch === 'undefined') {
        alert("System Error: Branch Identity is missing. Please refresh or re-select your branch from the dashboard.");
        setIsAlerting(false);
        return;
      }

      await sendManualEmployeeAlert(activeBranch, employee.id);
      
    } catch (error) {
      console.error("Failed to trigger manual alert:", error);
    } finally {
      setIsAlerting(false);
    }
  };

  return (
    <div className="flex justify-end items-center gap-2">
      {/* ✅ NEW: Delete Action Button */}
      <button 
        onClick={() => onDeleteClick(employee)}
        title="Delete Employee"
        className="group flex items-center justify-center p-2 text-slate-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50 focus:outline-none"
      >
        <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>

      <button 
        onClick={handleAlertClick}
        disabled={isAlerting}
        title="Send WhatsApp Status Alert"
        className="group flex items-center justify-center gap-1.5 text-amber-600 hover:text-amber-700 font-semibold text-[13px] transition-all px-3 py-1.5 rounded-lg border border-transparent hover:border-amber-200 hover:bg-amber-50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isAlerting ? (
          <svg className="animate-spin h-3.5 w-3.5 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        )}
        Alert
      </button>

      <button 
        onClick={() => onManageClick(employee)}
        className="text-slate-500 hover:text-brand-dark font-semibold text-[13px] transition-colors px-3 py-1.5 rounded-lg border border-transparent hover:border-slate-200 hover:bg-white hover:shadow-sm focus:outline-none"
      >
        Manage
      </button>
    </div>
  );
};

export default function EmployeeListTable({ employees, branchId, onRefresh }) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State Management (Manage)
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);

  // Modal State Management (Delete)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredEmployees = employees.filter(emp => {
    const nameMatch = emp.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const nationalityMatch = emp.nationality?.toLowerCase().includes(searchQuery.toLowerCase());
    const mobileMatch = emp.mobile && emp.mobile.includes(searchQuery);
    // ✅ NEW: Added visa area search filter
    const visaAreaMatch = emp.visaArea && emp.visaArea !== 'NIL' && emp.visaArea.toLowerCase().includes(searchQuery.toLowerCase());
    
    return nameMatch || nationalityMatch || mobileMatch || visaAreaMatch;
  });

  const openManageModal = (employee) => {
    setSelectedEmp(employee);
    setIsManageOpen(true);
  };

  const closeManageModal = () => {
    setIsManageOpen(false);
    setSelectedEmp(null);
  };

  // Delete Handlers
  const openDeleteModal = (employee) => {
    setEmployeeToDelete(employee);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setEmployeeToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;
    setIsDeleting(true);
    
    try {
      await deleteEmployee(branchId, employeeToDelete.id);
      closeDeleteModal();
      if (onRefresh) {
        onRefresh();
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to delete employee:", error);
      alert("Failed to delete employee. Please try again or check your connection.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-[2rem] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden flex flex-col">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white relative z-10">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Employee Directory</h3>
            <p className="text-sm text-slate-500 mt-1 font-light">Live tracking of personnel documents and compliance.</p>
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employees..." 
              className="bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-light/20 outline-none w-64 transition-all placeholder-slate-400"
            />
            <button className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-slate-500 hover:text-brand-dark hover:bg-slate-100 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-8 py-4 whitespace-nowrap border-b border-slate-100">Employee Details</th>
                {/* ✅ NEW: Visa Area Column Header */}
                <th className="px-8 py-4 whitespace-nowrap border-b border-slate-100">Visa Area</th>
                <th className="px-8 py-4 whitespace-nowrap border-b border-slate-100">Emirates ID</th>
                <th className="px-8 py-4 whitespace-nowrap border-b border-slate-100">Work Permit</th>
                <th className="px-8 py-4 whitespace-nowrap border-b border-slate-100">Passport</th>
                <th className="px-8 py-4 whitespace-nowrap border-b border-slate-100">Health Insurance</th>
                <th className="px-8 py-4 text-right whitespace-nowrap border-b border-slate-100">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 text-sm">
              {filteredEmployees.length === 0 ? (
                <tr>
                  {/* ✅ UPDATED: colSpan to 7 to account for new column */}
                  <td colSpan="7" className="px-8 py-12 text-center text-slate-500 font-medium">No employees match your search.</td>
                </tr>
              ) : (
                filteredEmployees.map((emp, index) => (
                  <tr key={index} className="hover:bg-slate-50/70 transition-colors group">
                    
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-slate-900 font-bold tracking-tight uppercase text-[13px]">
                          {emp.name}
                        </span>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[11px] text-slate-600 font-semibold bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded-md">
                            {emp.nationality}
                          </span>
                          {emp.mobile && (
                            <span className="text-[11px] text-slate-500 font-medium tracking-wide">
                              {emp.mobile}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* ✅ NEW: Visa Area Data Cell */}
                    <td className="px-8 py-5 whitespace-nowrap align-middle">
                      {emp.visaArea && emp.visaArea !== 'NIL' ? (
                        <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100/60 px-2 py-1 rounded-md tracking-wide">
                          {emp.visaArea}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs font-medium">-</span>
                      )}
                    </td>

                    <td className="px-8 py-5 whitespace-nowrap align-middle">
                      <ExpiryCell 
                        date={emp.emiratesIdExpiry} 
                        idNumber={emp.emiratesIdNumber} 
                      />
                    </td>

                    <td className="px-8 py-5 whitespace-nowrap align-middle">
                      <ExpiryCell 
                        date={emp.workPermitExpiry} 
                        idNumber={emp.workPermitNumber} 
                      />
                    </td>

                    <td className="px-8 py-5 whitespace-nowrap align-middle">
                      <ExpiryCell 
                        date={emp.passportExpiry} 
                        idNumber={emp.passportNumber} 
                      />
                    </td>

                    <td className="px-8 py-5 whitespace-nowrap align-middle">
                      <ExpiryCell 
                        date={emp.healthInsuranceExpiry} 
                        idNumber={emp.healthInsuranceNumber} 
                      />
                    </td>

                    <td className="px-8 py-5 whitespace-nowrap align-middle">
                      <EmployeeRowActions 
                        employee={emp} 
                        branchId={branchId} 
                        onManageClick={openManageModal} 
                        onDeleteClick={openDeleteModal}
                      />
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manage Modal */}
      {isManageOpen && selectedEmp && (
        <ManageEmployeeModal
          employee={selectedEmp}
          branchId={branchId}
          onClose={closeManageModal}
          onSuccess={() => {
            if (onRefresh) {
              onRefresh();
            } else {
              window.location.reload();
            }
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && employeeToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 animate-in fade-in duration-200">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
            onClick={!isDeleting ? closeDeleteModal : undefined}
          ></div>
          
          <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-8 text-center overflow-hidden">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Employee</h3>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed">
              Are you sure you want to permanently delete <span className="font-bold text-slate-800">{employeeToDelete.name}</span>? This action cannot be undone and will remove all their document records from the system.
            </p>
            
            <div className="flex justify-center gap-3">
              <button
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-sm transition-colors flex items-center gap-2 disabled:opacity-70"
              >
                {isDeleting && (
                  <svg className="animate-spin w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}