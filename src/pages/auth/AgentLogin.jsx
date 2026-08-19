// frontend/src/pages/auth/AgentLogin.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../config/firebase'; // Added db import
import { Preferences } from '@capacitor/preferences'; // Imported Capacitor Preferences
import AgentForgotPasswordModal from '../../components/agent/AgentForgotPasswordModal';

export default function AgentLogin() {
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    
    try {
      // 1. Force permanent login session on the device
      await setPersistence(auth, browserLocalPersistence);

      // 2. Format mobile back to the internal email structure expected by Firebase
      const internalEmail = `${mobileNumber}@agent.ferrarifoods.com`;

      // 3. Authenticate with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, internalEmail, password);
      const user = userCredential.user;
      
      // 4. Query the agents collection to get the specific Branch details
      const q = query(collection(db, 'agents'), where('uid', '==', user.uid));
      const querySnapshot = await getDocs(q);

      let agentName = user.displayName || 'Agent';
      let branchName = '';

      if (!querySnapshot.empty) {
        const agentData = querySnapshot.docs[0].data();
        agentName = agentData.fullName || agentName;
        branchName = agentData.branchName; // Extract the branch (e.g., "Sharjha")
      }

      // 🚨 Security Block: Prevent login if the agent is not assigned to a branch
      if (!branchName) {
        // Sign them back out immediately to prevent ghost sessions
        await auth.signOut();
        throw new Error("No branch assigned to this account. Please contact admin.");
      }

      // 5. Save display name and branch natively for the dashboard and data routing
      // Replaced localStorage with Capacitor Preferences for mobile persistence
      await Preferences.set({ key: 'agent_name', value: agentName });
      await Preferences.set({ key: 'active_branch', value: branchName });

      // 6. Route to the secure agent dashboard and pass the name instantly
      navigate('/agent-dashboard', { 
        state: { freshAgentName: agentName } 
      });

    } catch (error) {
      console.error(error);
      // Differentiate between our custom branch error and standard Firebase auth errors
      if (error.message.includes("No branch assigned")) {
        setErrorMsg(error.message);
      } else {
        setErrorMsg("Invalid mobile number or password.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = "w-full px-5 py-4 bg-slate-50/50 border border-slate-200/80 rounded-2xl text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-brand-light focus:ring-4 focus:ring-brand-light/10 transition-all shadow-sm";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto w-full max-w-md">
        
        {/* Logo/Brand Area */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-slate-200/60">
            <svg className="w-8 h-8 text-brand-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Agent Portal</h2>
          <p className="text-slate-500 mt-2 text-sm font-medium">Secure mobile access</p>
        </div>

        {/* Login Card */}
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/40 rounded-[2rem] border border-slate-100 sm:px-10">
          
          {/* Error Message Display */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 text-rose-600 text-sm rounded-xl text-center font-medium border border-rose-100">
              {errorMsg}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            
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
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || !mobileNumber || !password}
                className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-full shadow-md text-base font-semibold text-white bg-brand-dark hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Authenticating...
                  </>
                ) : (
                  'Secure Login'
                )}
              </button>
            </div>
          </form>

          {/* Footer Links */}
          <div className="mt-8 flex flex-col items-center gap-4 text-sm">
            <button 
              type="button"
              onClick={() => setIsForgotModalOpen(true)} 
              className="font-semibold text-brand-dark hover:text-brand-light transition-colors focus:outline-none"
            >
              Forgot your password?
            </button>
            <div className="w-full border-t border-slate-100"></div>
            <p className="text-slate-500">
              New agent?{' '}
              <Link to="/agent-register" className="font-semibold text-brand-dark hover:text-brand-light transition-colors">
                Apply for an account
              </Link>
            </p>
          </div>

        </div>
      </div>

      {/* Agent Forgot Password Modal */}
      <AgentForgotPasswordModal 
        isOpen={isForgotModalOpen} 
        onClose={() => setIsForgotModalOpen(false)} 
        onSuccessMobile={(mob) => setMobileNumber(mob)}
      />
    </div>
  );
}