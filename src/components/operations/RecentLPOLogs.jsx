// frontend/src/components/operations/RecentLPOLogs.jsx
import React, { useState, useEffect } from 'react';
import api from '../../config/api';
import { generateLPOPdf } from '../../utils/pdfGeneratorService';
import EditLPOModal from './EditLPOModal';

export default function RecentLPOLogs({ refreshTrigger }) {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Custom Calendar State
  const [filterDate, setFilterDate] = useState(null); // null means 'All Dates'
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLPO, setEditingLPO] = useState(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const activeBranch = localStorage.getItem('active_branch');
      if (!activeBranch) return;

      // Fetching the latest 50 records to allow local instant filtering
      const response = await api.get(`/api/lpo/history?branchId=${activeBranch}&limit=50`);
      if (response.data.success) {
        setLogs(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch LPO logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-fetch when the component mounts OR when a new LPO is generated
  useEffect(() => {
    fetchLogs();
  }, [refreshTrigger]);

  const handleDownloadPDF = async (lpoData) => {
    try {
      await generateLPOPdf(lpoData);
    } catch (error) {
      console.error("Failed to generate PDF from history:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const handleEditClick = async (lpo) => {
    // Fetch full details of the specific LPO before opening the modal
    try {
      const activeBranch = localStorage.getItem('active_branch');
      const response = await api.get(`/api/lpo/${lpo.lpoId}?branchId=${activeBranch}`);
      if (response.data.success) {
        setEditingLPO(response.data.data);
        setIsEditModalOpen(true);
      }
    } catch (error) {
      console.error("Failed to fetch LPO details for editing:", error);
      alert("Failed to load LPO details.");
    }
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setEditingLPO(null);
    fetchLogs(); // Refresh the table after successful edit
  };

  // Calendar Helpers
  const handleDateSelect = (year, month, day) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    setFilterDate(`${year}-${m}-${d}`);
    setIsCalendarOpen(false);
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'Filter by Date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredLogs = filterDate
    ? logs.filter(log => log.orderDate === filterDate)
    : logs;

  return (
    <>
      <div className="bg-[#FCFCFD] rounded-[2rem] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] mt-8 animate-in slide-in-from-bottom-4 duration-500 relative z-20">

        {/* Header & Filters */}
        <div className="p-6 md:p-8 border-b border-slate-200/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Recent LPOs</h3>
            <p className="text-xs font-medium text-slate-400 mt-1">View, edit, and regenerate historical purchase orders.</p>
          </div>

          <div className="flex items-center gap-3">
            {filterDate && (
              <button
                onClick={() => setFilterDate(null)}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 uppercase tracking-wider px-3 py-2 bg-rose-50 rounded-lg transition-colors"
              >
                Clear Filter
              </button>
            )}

            {/* Custom Date Filter Dropdown */}
            <div className="relative z-30">
              <button
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                className="flex items-center gap-3 px-4 py-2.5 bg-white border border-slate-200/80 hover:border-brand-light/40 rounded-xl text-sm font-medium text-slate-700 shadow-sm transition-all"
              >
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                {formatDateForDisplay(filterDate)}
              </button>

              {isCalendarOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsCalendarOpen(false)}></div>
                  <div className="absolute top-[calc(100%+8px)] right-0 p-5 bg-white rounded-[1.5rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100/80 z-50 w-[280px] animate-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-5">
                      <button onClick={(e) => { e.stopPropagation(); setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1)); }} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <div className="text-[15px] font-bold text-slate-900">{calendarViewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                      <button onClick={(e) => { e.stopPropagation(); setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1)); }} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                        <div key={day} className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">{day}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth(), 1).getDay() }).map((_, i) => (
                        <div key={`empty-${i}`} className="w-8 h-8"></div>
                      ))}
                      {Array.from({ length: new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 0).getDate() }).map((_, i) => {
                        const day = i + 1;
                        const dateString = `${calendarViewDate.getFullYear()}-${String(calendarViewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const isSelected = filterDate === dateString;
                        return (
                          <button
                            key={day}
                            onClick={(e) => { e.stopPropagation(); handleDateSelect(calendarViewDate.getFullYear(), calendarViewDate.getMonth(), day); }}
                            className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-medium transition-all ${isSelected ? 'bg-brand-dark text-white shadow-md' : 'text-slate-700 hover:bg-slate-100'}`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto rounded-b-[2rem]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200/60">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">LPO ID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vendor Name</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Amount (AED)</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-medium">
                    <div className="flex items-center justify-center gap-3">
                      <svg className="animate-spin h-5 w-5 text-brand-light" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Fetching Logs...
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-medium bg-slate-50/30">
                    No LPO records found for the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.lpoId} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 text-sm font-medium text-slate-600 whitespace-nowrap">
                      {log.orderDate}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/60">
                        {log.orderNo}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                      {log.vendorName.split('\n')[0]} {/* Shows only the first line of the vendor name */}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-emerald-600 text-right whitespace-nowrap">
                      {log.netAmount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Edit Button */}
                        <button
                          onClick={() => handleEditClick(log)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-brand-dark hover:border-brand-dark/30 hover:bg-slate-50 transition-all shadow-sm group-hover:shadow"
                          title="Edit LPO"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        {/* Download PDF Button */}
                        <button
                          onClick={() => handleDownloadPDF(log)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-brand-dark hover:border-brand-light hover:bg-brand-light/10 transition-all shadow-sm group-hover:shadow"
                          title="Download PDF"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal Rendering */}
      {isEditModalOpen && editingLPO && (
        <EditLPOModal
          lpoData={editingLPO}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}