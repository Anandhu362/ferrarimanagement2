import React, { useState } from 'react';
import API from '../../config/api';

export default function AgentForgotPasswordModal({ isOpen, onClose, onSuccessMobile }) {
  const [mobileNumber, setMobileNumber] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanMobile = mobileNumber.replace(/\D/g, '');
    if (!cleanMobile) {
      setErrorMsg('Please enter a valid mobile number.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirm password do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await API.post('/api/agents/reset-password', {
        mobileNumber: cleanMobile,
        newPassword
      });

      if (response.data?.success) {
        setSuccessMsg(response.data.message || 'Password reset successfully!');
        if (onSuccessMobile) {
          onSuccessMobile(cleanMobile);
        }
        setTimeout(() => {
          onClose();
          setMobileNumber('');
          setNewPassword('');
          setConfirmPassword('');
          setSuccessMsg('');
        }, 2200);
      } else {
        setErrorMsg(response.data?.message || 'Failed to reset password.');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setErrorMsg(error.response?.data?.message || error.message || 'Failed to reset password. Please check the mobile number.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = "w-full px-5 py-3.5 bg-slate-50/70 border border-slate-200/80 rounded-2xl text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-brand-dark focus:ring-4 focus:ring-slate-900/10 transition-all shadow-sm text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in font-sans">
      <div 
        className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative pt-8 px-6 pb-4 text-center border-b border-slate-100 bg-slate-50/40">
          <button
            onClick={onClose}
            type="button"
            className="absolute top-6 right-6 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3 text-amber-600">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>

          <h3 className="text-xl font-bold text-slate-900 tracking-tight">Reset Agent Password</h3>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Enter your registered agent mobile number to create a new password.
          </p>
        </div>

        {/* Body Form */}
        <div className="p-6 sm:p-8">
          
          {/* Feedback Badges */}
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-rose-50 text-rose-600 text-xs font-semibold rounded-xl text-center border border-rose-200/80 flex items-center justify-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl text-center border border-emerald-200 flex items-center justify-center gap-2">
              <svg className="w-4 h-4 shrink-0 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleResetPassword}>
            
            {/* Registered Mobile Number */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 pl-1">
                Registered Mobile Number
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 text-sm font-semibold">
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

            {/* New Password */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 pl-1">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                className={inputClasses}
                placeholder="Enter new password (min. 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 pl-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                className={inputClasses}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {/* Submit Action */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={isLoading || !mobileNumber || !newPassword || !confirmPassword}
                className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-full shadow-md text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating Password...
                  </>
                ) : (
                  'Reset & Save Password'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
