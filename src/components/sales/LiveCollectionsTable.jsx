// frontend/src/components/sales/LiveCollectionsTable.jsx
import React, { useState } from 'react';
import EditCollectionModal from './EditCollectionModal';

export default function LiveCollectionsTable({ collections = [] }) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);

  const handleEditClick = (col) => {
    setSelectedCollection(col);
    setIsEditModalOpen(true);
  };

  // Helper function to generate consistent initials for the avatar badge
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
        {/* Header section */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Batch Collections</h2>
            {collections.length > 0 && (
              <span className="bg-slate-200 text-slate-600 px-2.5 py-0.5 rounded-full text-xs font-bold">
                {collections.length} items
              </span>
            )}
          </div>
          <div className="bg-emerald-100/50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Live Queue
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm">
              <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Agent Name</th>
                <th className="px-6 py-4">Company Name</th>
                <th className="px-6 py-4">Invoice No.</th>
                <th className="px-6 py-4 text-right">Amount (AED)</th>
                <th className="px-4 py-4 w-10"></th> {/* Action column */}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {collections.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>No pending collections waiting for review.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                collections.map((col, index) => (
                  <tr key={col.id || index} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium whitespace-nowrap">
                      {col.date}
                    </td>
                    
                    {/* ENHANCED: Agent Name Column with Visual Avatar */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold border border-indigo-200 shadow-sm">
                          {getInitials(col.agentName)}
                        </div>
                        <span className="text-sm font-bold text-slate-800">
                          {col.agentName}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600 font-medium max-w-[200px] truncate" title={col.companyName}>
                      {col.companyName}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-mono font-bold border border-slate-200">
                        {col.invoiceNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-slate-900 text-right whitespace-nowrap">
                      {parseFloat(col.amount).toFixed(2)}
                    </td>
                    
                    {/* Edit Action Cell */}
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleEditClick(col)}
                        className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Edit Details"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mount the Modal */}
      <EditCollectionModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        collectionData={selectedCollection} 
      />
    </>
  );
}