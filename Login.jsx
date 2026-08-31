import { useState } from "react";
import { Anchor, ShieldCheck, Mail, Lock, Sparkles, ArrowRight } from "lucide-react";

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate authentication check
    setTimeout(() => {
      setLoading(false);
      if (onLoginSuccess) onLoginSuccess();
    }, 1000);
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    // Simulate Google OAuth popup / login flow
    setTimeout(() => {
      setLoading(false);
      if (onLoginSuccess) onLoginSuccess();
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-sky-100/60 to-blue-50 flex items-center justify-center p-6 text-slate-800 font-sans">
      <div className="max-w-md w-full bg-white/90 border border-sky-200/90 rounded-3xl p-8 shadow-xl backdrop-blur-xl space-y-6">
        
        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-gradient-to-br from-sky-400 to-blue-600 rounded-2xl text-white shadow-lg shadow-sky-500/25 mb-1">
            <Anchor size={28} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Welcome to <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">NaviSteel AI</span>
          </h1>
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">
            Bulk Freight Intelligence Portal
          </p>
        </div>

        {/* Google Sign-in Button */}
        <button
          onClick={handleGoogleLogin}
          type="button"
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold py-3 px-4 rounded-xl text-sm shadow-xs transition-all cursor-pointer active:scale-[0.98]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center my-4">
          <div className="flex-grow border-t border-sky-100"></div>
          <span className="px-3 text-xs font-mono text-slate-400 uppercase">or work email</span>
          <div className="flex-grow border-t border-sky-100"></div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-sky-900/80 font-mono uppercase tracking-wider block mb-1.5">
              Work Email
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-500 pointer-events-none" />
              <input
                type="email5"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="manager@navisteel.ai"
                className="w-full bg-sky-50/50 border border-sky-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-sky-900/80 font-mono uppercase tracking-wider block mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-500 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-sky-50/50 border border-sky-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-extrabold py-3 px-6 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-sky-500/25 transition-all cursor-pointer disabled:opacity-70"
          >
            {loading ? "Authenticating..." : "Sign In to Dashboard"}
            <ArrowRight size={15} />
          </button>
        </form>

        {/* Footer Security Note */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-mono pt-2 border-t border-sky-100">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Secured Maritime Enterprise Auth</span>
        </div>

      </div>
    </div>
  );
}
