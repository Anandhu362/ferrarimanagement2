// frontend/src/pages/auth/RegisterBranch.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';

export default function RegisterBranch() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    branchName: '',
    phone: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
      const user = userCredential.user;

      await setDoc(doc(db, 'branches', user.uid), {
        branchName: formData.branchName,
        phone: formData.phone,
        email: formData.email,
        createdAt: new Date().toISOString(),
        status: 'active'
      });

      // ✅ Dynamically save the branch name for the session
      localStorage.setItem('active_branch', formData.branchName);

      // ✅ Skip the selection screen and go straight to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered to a branch.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError('Failed to register branch. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans antialiased bg-brand-bg">
      
      {/* LEFT SIDE: Brand/Hero Panel (Hidden on smaller screens) */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-dark flex-col justify-between p-12 lg:p-16 text-white relative overflow-hidden">
        
        {/* Abstract Background Element for premium fintech feel */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[80%] h-[80%] rounded-full bg-white opacity-[0.03] blur-[100px]"></div>
          <div className="absolute bottom-[10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-brand-light opacity-[0.15] blur-[120px]"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-20">
             <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg">
               <span className="text-xl font-bold text-brand-dark tracking-tight">FF</span>
             </div>
             <span className="text-2xl font-medium tracking-tight">Ferrari Foods</span>
          </div>
          
          <h1 className="text-5xl xl:text-6xl font-semibold tracking-tight mb-8 leading-[1.1]">
            Secure Enterprise <br/> Cash Management.
          </h1>
          <p className="text-white/80 text-lg max-w-md mb-12 leading-relaxed font-light">
            Set up a new operational branch to track daily inflows, automate petty cash reconciliation, and sync directly with Google BigQuery.
          </p>

          <ul className="space-y-6 text-white/80 font-light">
            <li className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-white"></span>
              </div>
              Real-time CEO Vault Tracking
            </li>
            <li className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-white"></span>
              </div>
              Automated Denomination Analysis
            </li>
            <li className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-white"></span>
              </div>
              End-of-day discrepancy reporting
            </li>
          </ul>
        </div>

        <div className="relative z-10 text-sm text-white/40 font-light">
          © {new Date().getFullYear()} Ferrari Foods LLC. Internal System.
        </div>
      </div>

      {/* RIGHT SIDE: Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative bg-brand-bg lg:bg-transparent">
        
        {/* Modern minimal curved card */}
        <div className="w-full max-w-[500px] bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 sm:p-10 relative z-10">
          
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-medium tracking-tight text-slate-900">
              Register Branch
            </h2>
            <p className="text-slate-500 mt-2 font-light">
              Enter your branch details below to create your account.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-2xl border border-red-100 flex items-start gap-3">
              <span className="mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-6">
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Branch Name *
              </label>
              <input
                type="text"
                name="branchName"
                value={formData.branchName}
                onChange={handleChange}
                required
                className="w-full px-5 py-3.5 bg-brand-bg border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-dark/20 focus:border-brand-dark transition-all"
                placeholder="e.g., Dubai Main Branch"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Contact Phone *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-5 py-3.5 bg-brand-bg border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-dark/20 focus:border-brand-dark transition-all"
                placeholder="+971 50 123 4567"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Branch Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-5 py-3.5 bg-brand-bg border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-dark/20 focus:border-brand-dark transition-all"
                placeholder="branch@ferrarifoods.com"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="6"
                className="w-full px-5 py-3.5 bg-brand-bg border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-dark/20 focus:border-brand-dark transition-all"
                placeholder="••••••••"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 rounded-full font-medium transition-all duration-300 flex justify-center items-center gap-2 ${
                  isLoading 
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                    : 'bg-brand-dark text-white hover:bg-[#1E1A2F] hover:shadow-lg hover:-translate-y-0.5'
                }`}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Already registered?{' '}
            <Link 
              to="/login" 
              className="font-medium text-brand-dark hover:text-brand-light hover:underline transition-colors"
            >
              Log in
            </Link>
          </p>
          
        </div>
      </div>
    </div>
  );
}