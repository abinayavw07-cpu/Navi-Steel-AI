import { useState } from 'react';
import NaviSteelDashboard from './NaviSteelDashboard';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("auth_token") ? true : false;
  });

  const [selectedRole, setSelectedRole] = useState("Chartering Manager");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleEmailLogin = (e) => {
    e.preventDefault();
    if (email && password) {
      localStorage.setItem("auth_token", "sample_secure_token_123");
      localStorage.setItem("user_role", selectedRole);
      setIsLoggedIn(true);
    } else {
      alert("Please enter both email and password.");
    }
  };

  const handleGoogleLogin = () => {
    localStorage.setItem("auth_token", "sample_secure_token_123");
    localStorage.setItem("user_role", selectedRole);
    setIsLoggedIn(true);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-sky-100 to-blue-50 font-sans">
        <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-xl w-96 text-center space-y-4 border border-sky-200">
          <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-blue-600 text-white rounded-2xl mx-auto flex items-center justify-center text-xl shadow-md">
            ⚓
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">NAVI-STEEL AI</h2>
            <p className="text-xs text-slate-500 mt-1">Bulk Freight Intelligence Platform</p>
          </div>
          
          <div className="space-y-3 pt-2 text-left">
            <div>
              <label className="text-xs font-bold text-sky-900 block mb-1 font-mono uppercase">
                Select Your Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full bg-sky-50/50 border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/20 cursor-pointer"
              >
                <option value="Chartering Manager">Chartering Manager</option>
                <option value="Logistics Analyst">Logistics Analyst</option>
                <option value="Port Captain">Port Captain</option>
              </select>
            </div>

            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              Continue with Google
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-mono uppercase">Or with email</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Normal Email / Password Form */}
            <form onSubmit={handleEmailLogin} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="manager@navisteel.ai"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 bg-sky-50/30"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 bg-sky-50/30"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-sky-500/20 mt-1"
              >
                Sign In with Email
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return <NaviSteelDashboard />;
}