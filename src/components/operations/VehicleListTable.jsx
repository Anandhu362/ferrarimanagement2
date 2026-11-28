// frontend/src/components/operations/VehicleListTable.jsx
import React, { useState } from 'react';
import { sendManualVehicleAlert, deleteVehicle } from '../../config/api';
import ManageVehicleModal from './ManageVehicleModal';

const getExpiryDetails = (dateString) => {
  if (!dateString) return null;

  const expiry = new Date(dateString);
  if (isNaN(expiry.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);

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
    progress = Math.max((diffDays / 30) * 100, 8);
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

const ExpiryCell = ({ date }) => {
  const details = getExpiryDetails(date);

  if (!details) return <span className="text-slate-400 text-xs font-medium">-</span>;

  return (
    <div className="flex flex-col gap-1.5 w-full max-w-[145px]">
      <div className="flex justify-between items-end gap-2">
        <span className="text-slate-900 font-semibold text-[13px] tracking-tight whitespace-nowrap">
          {details.dateFormatted}
        </span>
        <span className={`text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded-md whitespace-nowrap ${details.bgColor} ${details.textColor}`}>
          {details.days < 0 ? 'EXPIRED' : details.days === 0 ? 'TODAY' : `${details.days}D`}
        </span>
      </div>

      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${details.color} transition-all duration-1000 ease-out`}
          style={{ width: `${details.progress}%` }}
        />
      </div>
    </div>
  );
};

const ChassisCell = ({ chassisNo }) => {
  const [isRevealed, setIsRevealed] = useState(false);

  if (!chassisNo || chassisNo === 'NIL') {
    return <span className="text-slate-400 text-xs font-medium">-</span>;
  }

  const masked = chassisNo.length <= 4 ? '••••' : `•••• •••• ${chassisNo.slice(-5)}`;

  return (
    <div className="flex items-center gap-2 max-w-[190px]">
      <span className="text-[12px] font-semibold text-slate-700 font-mono tracking-wider">
        {isRevealed ? chassisNo : masked}
      </span>
      <button
        type="button"
        onClick={() => setIsRevealed(!isRevealed)}
        className="text-slate-400 hover:text-brand-dark transition-colors p-0.5 rounded focus:outline-none shrink-0"
        title={isRevealed ? 'Hide Chassis No' : 'Reveal Chassis No'}
      >
        {isRevealed ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
      </button>
    </div>
  );
};

const VehicleRowActions = ({ vehicle, branchId, onManageClick, onDeleteClick, onAlertFeedback }) => {
  const [isAlerting, setIsAlerting] = useState(false);

  const handleTestAlert = async () => {
    if (isAlerting) return;
    setIsAlerting(true);

    try {
      let activeBranch = branchId;
      if (!activeBranch || activeBranch === 'null' || activeBranch === 'undefined') {
        activeBranch = localStorage.getItem('active_branch') || localStorage.getItem('activeBranch');
      }
      if (typeof activeBranch === 'string') {
        activeBranch = activeBranch.replace(/['"]+/g, '');
      }

      if (!activeBranch) {
        if (onAlertFeedback) onAlertFeedback('error', 'Branch identity is missing. Please re-select your branch.');
        return;
      }

      const res = await sendManualVehicleAlert(activeBranch, vehicle.id);
      if (res.data?.success && onAlertFeedback) {
        onAlertFeedback('success', res.data.message || 'Test alert dispatched successfully.');
      }
    } catch (error) {
      console.error('Failed to trigger vehicle test alert:', error);
      const errMsg = error.response?.data?.message || 'Failed to dispatch test alert. Verify Email/WhatsApp configuration in Settings.';
      if (onAlertFeedback) onAlertFeedback('error', errMsg);
    } finally {
      setIsAlerting(false);
    }
  };

  return (
    <div className="flex justify-end items-center gap-2">
      <button
        type="button"
        onClick={() => onDeleteClick(vehicle)}
        title="Delete Vehicle"
        className="group flex items-center justify-center p-2 text-slate-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50 focus:outline-none"
      >
        <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>

      <button
        type="button"
        onClick={handleTestAlert}
        disabled={isAlerting}
        title="Send Test Alert via Email & WhatsApp"
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
        Test Alert
      </button>

      <button
        type="button"
        onClick={() => onManageClick(vehicle)}
        className="text-slate-500 hover:text-brand-dark font-semibold text-[13px] transition-colors px-3 py-1.5 rounded-lg border border-transparent hover:border-slate-200 hover:bg-white hover:shadow-sm focus:outline-none"
      >
        Manage
      </button>
    </div>
  );
};

export default function VehicleListTable({ vehicles, branchId, onRefresh, onAlertFeedback }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | EXPIRING | EXPIRED
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [isManageOpen, setIsManageOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getMinDaysLeft = (veh) => {
    const daysList = [veh.renewalExpiry, veh.insuranceExpiry, veh.asateelExpiry]
      .map((d) => getExpiryDetails(d)?.days)
      .filter((d) => d !== null && d !== undefined);
    return daysList.length > 0 ? Math.min(...daysList) : Infinity;
  };

  const filteredVehicles = vehicles.filter((veh) => {
    const q = searchQuery.toLowerCase();
    const plateMatch = String(veh.plateNo || '').toLowerCase().includes(q);
    const chassisMatch = String(veh.chassisNo || '').toLowerCase().includes(q);
    const yearMatch = String(veh.vehicleYear || '').includes(q);
    const matchesSearch = !q || plateMatch || chassisMatch || yearMatch;

    if (!matchesSearch) return false;
    if (statusFilter === 'ALL') return true;

    const minDays = getMinDaysLeft(veh);
    if (statusFilter === 'EXPIRED') return minDays < 0;
    if (statusFilter === 'EXPIRING') return minDays >= 0 && minDays <= 90;
    return true;
  });

  const handleConfirmDelete = async () => {
    if (!vehicleToDelete) return;
    setIsDeleting(true);

    try {
      await deleteVehicle(branchId, vehicleToDelete.id);
      setIsDeleteModalOpen(false);
      setVehicleToDelete(null);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Failed to delete vehicle:', error);
      if (onAlertFeedback) onAlertFeedback('error', 'Failed to delete vehicle. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-[2rem] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden flex flex-col">
        <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white relative z-10">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Fleet Directory</h3>
            <p className="text-sm text-slate-500 mt-1 font-light">Live tracking of fleet registrations, insurance, and ASATEEL permits.</p>
          </div>

          <div className="flex gap-2 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search plate, chassis, year..."
              className="bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-light/20 outline-none w-64 transition-all placeholder-slate-400"
            />
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                title="Filter by Expiry Status"
                className={`border p-2.5 rounded-xl transition-colors ${
                  statusFilter !== 'ALL'
                    ? 'bg-brand-dark text-white border-brand-dark'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-brand-dark hover:bg-slate-100'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </button>

              {isFilterOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                    {[
                      { id: 'ALL', label: 'All Vehicles' },
                      { id: 'EXPIRING', label: 'Expiring (≤ 90 Days)' },
                      { id: 'EXPIRED', label: 'Expired Only' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setStatusFilter(opt.id);
                          setIsFilterOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors ${
                          statusFilter === opt.id ? 'bg-brand-dark text-white' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-8 py-4 whitespace-nowrap border-b border-slate-100">Vehicle Details</th>
                <th className="px-8 py-4 whitespace-nowrap border-b border-slate-100">Chassis No</th>
                <th className="px-8 py-4 whitespace-nowrap border-b border-slate-100">Renewal Expiry</th>
                <th className="px-8 py-4 whitespace-nowrap border-b border-slate-100">Insurance Expiry</th>
                <th className="px-8 py-4 whitespace-nowrap border-b border-slate-100">ASATEEL Exp Date</th>
                <th className="px-8 py-4 text-right whitespace-nowrap border-b border-slate-100">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 text-sm">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-8 py-12 text-center text-slate-500 font-medium">
                    No vehicles match your search.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((veh) => (
                  <tr key={veh.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-slate-900 font-bold tracking-tight uppercase text-[14px]">
                          Plate #{veh.plateNo}
                        </span>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[11px] text-slate-600 font-semibold bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded-md">
                            Year {veh.vehicleYear}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-8 py-5">
                      <ChassisCell chassisNo={veh.chassisNo} />
                    </td>

                    <td className="px-8 py-5">
                      <ExpiryCell date={veh.renewalExpiry} />
                    </td>

                    <td className="px-8 py-5">
                      <ExpiryCell date={veh.insuranceExpiry} />
                    </td>

                    <td className="px-8 py-5">
                      <ExpiryCell date={veh.asateelExpiry} />
                    </td>

                    <td className="px-8 py-5 text-right whitespace-nowrap">
                      <VehicleRowActions
                        vehicle={veh}
                        branchId={branchId}
                        onManageClick={(v) => {
                          setSelectedVehicle(v);
                          setIsManageOpen(true);
                        }}
                        onDeleteClick={(v) => {
                          setVehicleToDelete(v);
                          setIsDeleteModalOpen(true);
                        }}
                        onAlertFeedback={onAlertFeedback}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isManageOpen && selectedVehicle && (
        <ManageVehicleModal
          vehicle={selectedVehicle}
          branchId={branchId}
          onClose={() => {
            setIsManageOpen(false);
            setSelectedVehicle(null);
          }}
          onSuccess={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {isDeleteModalOpen && vehicleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={!isDeleting ? () => setIsDeleteModalOpen(false) : undefined}
          ></div>
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-4">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Vehicle?</h3>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Are you sure you want to remove <strong className="text-slate-800">Plate #{vehicleToDelete.plateNo}</strong> from fleet tracking? This action cannot be undone.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isDeleting}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors disabled:opacity-60"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

