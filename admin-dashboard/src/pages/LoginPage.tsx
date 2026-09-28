import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { loginAdmin } from '../services/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('fieldfix_admin_token');
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await loginAdmin(email, password);
      // Store auth token
      localStorage.setItem('fieldfix_admin_token', response.token);
      localStorage.setItem('fieldfix_admin_user', JSON.stringify(response.user));
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      // Fallback: allow demo login if backend is not running
      if (email === 'admin@fieldfix.io' && password === 'admin123') {
        localStorage.setItem('fieldfix_admin_token', 'demo_token_fieldfix_2026');
        localStorage.setItem(
          'fieldfix_admin_user',
          JSON.stringify({ name: 'Alex Danvers', email: 'admin@fieldfix.io', role: 'Head Dispatcher' })
        );
        navigate('/dashboard', { replace: true });
      } else {
        setError(err?.response?.data?.message || 'Invalid email or password. Try admin@fieldfix.io / admin123');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden selection:bg-sky-500 selection:text-white">
      {/* ========== ANIMATED BACKGROUND EFFECTS ========== */}
      {/* Gradient orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-sky-500/8 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/8 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] bg-sky-600/5 rounded-full blur-[80px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(56,189,248,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* ========== FLOATING TECH ELEMENTS ========== */}
      <div className="absolute top-[15%] left-[10%] hidden lg:flex items-center space-x-2 px-3 py-2 bg-slate-900/50 backdrop-blur border border-slate-800/50 rounded-xl text-xs text-slate-500 animate-float">
        <ShieldCheck className="w-4 h-4 text-emerald-500/60" />
        <span>256-bit SSL Encrypted</span>
      </div>
      <div className="absolute bottom-[20%] right-[8%] hidden lg:flex items-center space-x-2 px-3 py-2 bg-slate-900/50 backdrop-blur border border-slate-800/50 rounded-xl text-xs text-slate-500 animate-float" style={{ animationDelay: '1.5s' }}>
        <Wrench className="w-4 h-4 text-sky-500/60" />
        <span>Field Operations Platform</span>
      </div>
      <div className="absolute top-[60%] left-[5%] hidden lg:flex items-center space-x-2 px-3 py-2 bg-slate-900/50 backdrop-blur border border-slate-800/50 rounded-xl text-xs text-slate-500 animate-float" style={{ animationDelay: '2.5s' }}>
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span>3 Technicians Active</span>
      </div>

      {/* ========== LOGIN CARD ========== */}
      <div className="relative z-10 w-full max-w-md">
        {/* FieldFix Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-sky-600 to-blue-700 text-white px-5 py-3 rounded-2xl shadow-glow-sky mb-6">
            <Wrench className="w-7 h-7" />
            <span className="font-display font-extrabold text-2xl tracking-wider">FieldFix</span>
          </div>
          <h1 className="text-2xl font-display font-extrabold text-white tracking-tight mt-4">
            Admin Command Center
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Sign in to manage dispatch operations & field service monitoring
          </p>
        </div>

        {/* Glass Card */}
        <div className="bg-slate-900/70 backdrop-blur-2xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl">
          {/* Error Banner */}
          {error && (
            <div className="mb-6 flex items-start space-x-3 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 text-sm text-rose-300 animate-shake">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5" id="admin-login-form">
            {/* Email Field */}
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="admin@fieldfix.io"
                  autoComplete="email"
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-sky-500/80 focus:ring-2 focus:ring-sky-500/20 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-sky-500/80 focus:ring-2 focus:ring-sky-500/20 rounded-xl pl-11 pr-12 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition p-0.5"
                  id="toggle-password-visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2.5 cursor-pointer group" htmlFor="remember-me">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 bg-slate-950 border-2 border-slate-700 rounded text-sky-500 focus:ring-sky-500/20 focus:ring-2 cursor-pointer"
                />
                <span className="text-xs text-slate-400 group-hover:text-slate-300 transition">Remember me</span>
              </label>
              <button
                type="button"
                className="text-xs text-sky-400 hover:text-sky-300 font-medium transition"
                id="forgot-password-link"
              >
                Forgot password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2.5 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:from-sky-500/50 disabled:to-blue-600/50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-glow-sky hover:shadow-glow-sky/80 transition-all active:scale-[0.98] group"
              id="login-submit-button"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Command Center</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="px-3 text-[10px] text-slate-600 uppercase tracking-wider font-semibold">Secure Access</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Demo Credentials Hint */}
          <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-4">
            <p className="text-[11px] text-slate-500 text-center leading-relaxed">
              <span className="text-sky-400/80 font-semibold">Demo Credentials:</span>{' '}
              <code className="bg-slate-800/80 px-1.5 py-0.5 rounded text-slate-300 font-mono text-[10px]">admin@fieldfix.io</code>{' '}
              /{' '}
              <code className="bg-slate-800/80 px-1.5 py-0.5 rounded text-slate-300 font-mono text-[10px]">admin123</code>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-[11px] text-slate-600">
            © 2026 FieldFix Inc. — Real-Time Service Management Architecture
          </p>
          <div className="flex items-center justify-center space-x-1.5 mt-2 text-[10px] text-slate-600">
            <ShieldCheck className="w-3 h-3 text-emerald-500/50" />
            <span>Protected by enterprise-grade authentication</span>
          </div>
        </div>
      </div>
    </div>
  );
}
