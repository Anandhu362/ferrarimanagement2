// frontend/src/pages/auth/AgentRegister.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../config/api'; // Centralized Axios instance

export default function AgentRegister() {
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  
  // Custom Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  // Fetch branches from the backend API when the component mounts
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await api.get('/api/agents/branches'); 
        if (response.data.success) {
          setBranches(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching branches:", error);
        setErrorMsg("Failed to load available branches.");
      }
    };

    fetchBranches();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Additional validation for the branch dropdown
    if (!selectedBranch) {
      setErrorMsg('Please select an assigned branch.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    
    try {
      // API call to the centralized backend route with new branch data
      const response = await api.post('/api/agents/register', {
        fullName,
        mobileNumber,
        password,
        branchId: selectedBranch.value,
        branchName: selectedBranch.label
      });

      if (response.data.success) {
        alert('Application submitted! You can now login.');
        navigate('/agent-login');
      }
    } catch (error) {
      setErrorMsg(error.response?.data?.message || "Registration failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = "w-full px-5 py-4 bg-slate-50/50 border border-slate-200/80 rounded-2xl text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-brand-light focus:ring-4 focus:ring-brand-light/10 transition-all shadow-sm";

  // Filter branches based on search query
  const filteredBranches = branches.filter(branch => 
    branch.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans">
      
      <div className="sm:mx-auto w-full max-w-md">
        
        {/* Logo/Brand Area */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-slate-200/60">
            <svg className="w-8 h-8 text-brand-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Apply for Account</h2>
          <p className="text-slate-500 mt-2 text-sm font-medium">Join the agent network</p>
        </div>

        {/* Registration Card */}
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/40 rounded-[2rem] border border-slate-100 sm:px-10">
          
          {/* Error Message Alert */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 text-rose-600 text-sm rounded-xl text-center font-medium border border-rose-100">
              {errorMsg}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleRegister}>
            
            {/* Full Name Input */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 pl-1">
                Full Name
              </label>
              <input
                type="text"
                required
                className={inputClasses}
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            {/* Inline Custom Fintech Dropdown */}
            <div className="relative z-20" ref={dropdownRef}>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 pl-1">
                Assigned Branch
              </label>
              
              {/* Dropdown Trigger */}
              <div 
                className={`${inputClasses} flex justify-between items-center cursor-pointer ${isDropdownOpen ? 'ring-4 ring-brand-light/10 border-brand-light' : ''}`}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span className={selectedBranch ? "text-slate-900" : "text-slate-400"}>
                  {selectedBranch ? selectedBranch.label : "Select a branch"}
                </span>
                <svg 
                  className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-[1.25rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  
                  {/* Search Bar inside dropdown */}
                  <div className="p-3 border-b border-slate-50">
                    <div className="relative">
                      <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200/60 rounded-xl text-sm focus:outline-none focus:border-brand-light focus:bg-white transition-colors"
                        placeholder="Search branches..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onClick={(e) => e.stopPropagation()} // Prevent closing when typing
                      />
                    </div>
                  </div>

                  {/* Options List */}
                  <div className="max-h-56 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                    {filteredBranches.length > 0 ? (
                      filteredBranches.map((branch) => (
                        <div
                          key={branch.value}
                          className={`px-4 py-3.5 mb-1 text-sm rounded-xl cursor-pointer transition-all flex justify-between items-center ${
                            selectedBranch?.value === branch.value 
                              ? 'bg-emerald-500 text-white shadow-sm font-semibold' 
                              : 'text-slate-700 hover:bg-slate-50 font-medium'
                          }`}
                          onClick={() => {
                            setSelectedBranch(branch);
                            setIsDropdownOpen(false);
                            setSearchQuery(''); // Reset search on select
                          }}
                        >
                          {branch.label}
                          
                          {/* Checkmark for selected item */}
                          {selectedBranch?.value === branch.value && (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-6 text-sm text-slate-400 text-center font-medium">
                        No branches found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Number Input */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 pl-1">
                Mobile Number
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 font-medium">
                  +971
                </span>
                <input
                  type="tel"
                  required
                  className={`${inputClasses} pl-14`}
                  placeholder="50 123 4567"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/[^0-9]/g, ''))}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 pl-1">
                Password
              </label>
              <input
                type="password"
                required
                className={inputClasses}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading || !fullName || !mobileNumber || !password || !selectedBranch}
                className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-full shadow-md text-base font-semibold text-white bg-brand-dark hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Submit Application'
                )}
              </button>
            </div>
          </form>

          {/* Footer Links */}
          <div className="mt-8 flex flex-col items-center gap-4 text-sm">
            <div className="w-full border-t border-slate-100"></div>
            <p className="text-slate-500">
              Already have an account?{' '}
              <Link to="/agent-login" className="font-semibold text-brand-dark hover:text-brand-light transition-colors">
                Secure Login
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}