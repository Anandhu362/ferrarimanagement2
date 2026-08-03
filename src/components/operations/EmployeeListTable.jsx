// frontend/src/components/operations/EmployeeListTable.jsx
import React, { useState } from 'react';

// Extracted outside the main component to prevent unnecessary recalculations
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

// Extracted to manage its own 'reveal' state without causing parent re-renders
const ExpiryCell = ({ date, idNumber }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const details = getExpiryDetails(date);
  
  if (!details) return <span className="text-slate-400 text-xs font-medium">-</span>;

  // Mask the ID, showing only the last 4 characters if available
  const getMaskedId = (id) => {
    if (!id) return '•••• ••••';
    if (id.length <= 4) return '••••';
    return `•••• ${id.slice(-4)}`;
  };

  return (
    <div className="flex flex-col gap-1.5 w-full max-w-[140px]">
      
      {/* Date & Days Remaining Badge */}
      <div className="flex justify-between items-end">
        <span className="text-slate-900 font-semibold text-[13px] tracking-tight">{details.dateFormatted}</span>
        <span className={`text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded-md ${details.bgColor} ${details.textColor}`}>
          {details.days < 0 ? 'EXPIRED' : `${details.days}D`}
        </span>
      </div>
      
      {/* Fintech Live Status Bar */}
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full ${details.color} transition-all duration-1000 ease-out`}
          style={{ width: `${details.progress}%` }}
        />
      </div>

      {/* Hidden ID Reveal Section */}
      {idNumber && (
        <div className="flex items-center justify-between mt-0.5">
          {/* ✅ UPDATED: Darkened text from slate-400 to slate-600, increased size to 11px, bolded for better visibility */}
          <span className="text-[11px] font-semibold text-slate-600 font-mono tracking-widest transition-all">
            {isRevealed ? idNumber : getMaskedId(idNumber)}
          </span>
          {/* ✅ UPDATED: Darkened the default icon state from slate-300 to slate-400 */}
          <button 
            onClick={() => setIsRevealed(!isRevealed)}
            className="text-slate-400 hover:text-brand-dark transition-colors p-0.5 rounded focus:outline-none"
            title={isRevealed ? "Hide ID" : "Show ID"}
          >
            {isRevealed ? (
              // Eye Slash Icon
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
            ) : (
              // Eye Open Icon
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default function EmployeeListTable({ employees }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEmployees = employees.filter(emp => {
    const nameMatch = emp.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const nationalityMatch = emp.nationality?.toLowerCase().includes(searchQuery.toLowerCase());
    const mobileMatch = emp.mobile && emp.mobile.includes(searchQuery);
    return nameMatch || nationalityMatch || mobileMatch;
  });

  return (
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
            {/* ✅ UPDATED: Changed from slate-400 to slate-600, increased size to 11px, solid bg */}
            <tr className="bg-slate-50 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
              <th className="px-8 py-4 whitespace-nowrap border-b border-slate-100">Employee Details</th>
              <th className="px-8 py-4 whitespace-nowrap border-b border-slate-100">Emirates ID</th>
              <th className="px-8 py-4 whitespace-nowrap border-b border-slate-100">Work Permit</th>
              <th className="px-8 py-4 whitespace-nowrap border-b border-slate-100">Passport</th>
              <th className="px-8 py-4 text-right whitespace-nowrap border-b border-slate-100">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80 text-sm">
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-8 py-12 text-center text-slate-500 font-medium">No employees match your search.</td>
              </tr>
            ) : (
              filteredEmployees.map((emp, index) => (
                <tr key={index} className="hover:bg-slate-50/70 transition-colors group">
                  
                  {/* 1. Name & Contact */}
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-slate-900 font-bold tracking-tight uppercase text-[13px]">
                        {emp.name}
                      </span>
                      <div className="flex items-center gap-2 mt-1.5">
                        {/* ✅ UPDATED: Darkened badge text and added subtle border */}
                        <span className="text-[11px] text-slate-600 font-semibold bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded-md">
                          {emp.nationality}
                        </span>
                        {emp.mobile && (
                          /* ✅ UPDATED: Darkened mobile number text */
                          <span className="text-[11px] text-slate-500 font-medium tracking-wide">
                            {emp.mobile}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* 2. Emirates ID Tracker */}
                  <td className="px-8 py-5 whitespace-nowrap align-middle">
                    <ExpiryCell 
                      date={emp.emiratesIdExpiry} 
                      idNumber={emp.emiratesIdNumber} 
                    />
                  </td>

                  {/* 3. Work Permit Tracker */}
                  <td className="px-8 py-5 whitespace-nowrap align-middle">
                    <ExpiryCell 
                      date={emp.workPermitExpiry} 
                      idNumber={emp.workPermitNumber} 
                    />
                  </td>

                  {/* 4. Passport Tracker */}
                  <td className="px-8 py-5 whitespace-nowrap align-middle">
                    <ExpiryCell 
                      date={emp.passportExpiry} 
                      idNumber={emp.passportNumber} 
                    />
                  </td>

                  {/* 5. Actions */}
                  <td className="px-8 py-5 text-right whitespace-nowrap align-middle">
                    {/* ✅ UPDATED: Action button text to match improved contrast */}
                    <button className="text-slate-500 hover:text-brand-dark font-semibold text-sm transition-colors px-4 py-2 rounded-xl border border-transparent hover:border-slate-200 hover:bg-white hover:shadow-sm">
                      Manage
                    </button>
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}