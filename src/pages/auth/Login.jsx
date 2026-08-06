// frontend/src/pages/auth/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; 
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore'; // ✅ Updated Firestore readers
import { auth, db } from '../../config/firebase'; 

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 1. Authenticate the user
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Query the 'branches' collection where the email matches the logged-in user's email
      const branchesRef = collection(db, 'branches');
      const q = query(branchesRef, where('email', '==', user.email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Grab the first matching branch document
        const branchDoc = querySnapshot.docs[0];
        const branchData = branchDoc.data();
        
        // 3. Set the correct active branch name in local storage
        localStorage.setItem('active_branch', branchData.branchName || branchDoc.id);
      } else {
        // Fallback if no specific branch document matches this email
        localStorage.setItem('active_branch', 'Unknown Branch'); 
      }

      // 4. Route directly to the dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Invalid credentials. Please check your email and password.');
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
            Enterprise Cash <br/> Operations.
          </h1>
          <p className="text-white/80 text-lg max-w-md mb-12 leading-relaxed font-light">
            Access your branch dashboard to manage daily inflows, reconcile petty cash, and monitor real-time vault balances securely.
          </p>

          <ul className="space-y-6 text-white/80 font-light">
            <li className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              Secure encrypted sessions
            </li>
            <li className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              Real-time synchronization
            </li>
          </ul>
        </div>

        <div className="relative z-10 text-sm text-white/40 font-light">
          © {new Date().getFullYear()} Ferrari Foods LLC. Internal System.
        </div>
      </div>

      {/* RIGHT SIDE: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative bg-brand-bg lg:bg-transparent">
        
        {/* Modern minimal curved card */}
        <div className="w-full max-w-[450px] bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 sm:p-10 relative z-10">
          
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-medium tracking-tight text-slate-900">
              Welcome back
            </h2>
            <p className="text-slate-500 mt-2 font-light">
              Enter your credentials to access the vault.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-2xl border border-red-100 flex items-start gap-3">
              <span className="mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Work Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-5 py-3.5 bg-brand-bg border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-dark/20 focus:border-brand-dark transition-all"
                placeholder="branch@ferrarifoods.com"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                {/* Optional: Add forgot password link here if needed in future */}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-5 py-3.5 bg-brand-bg border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-dark/20 focus:border-brand-dark transition-all"
                placeholder="••••••••"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 rounded-full font-medium transition-all duration-300 flex justify-center items-center gap-2 ${
                  isLoading 
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                    : 'bg-brand-dark text-white hover:bg-[#1E1A2F] hover:shadow-lg hover:-translate-y-0.5'
                }`}
              >
                {isLoading ? 'Authenticating...' : 'Sign In to Dashboard'}
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Setting up a new location?{' '}
            <Link 
              to="/register" 
              className="font-medium text-brand-dark hover:text-brand-light hover:underline transition-colors"
            >
              Register Branch
            </Link>
          </p>
          
        </div>
      </div>
    </div>
  );
}