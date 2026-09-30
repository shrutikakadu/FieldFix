import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Wrench, Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle, Loader2, User, Shield, Sparkles } from 'lucide-react';
import { loginAdmin } from '../services/auth';

type UserRole = 'CUSTOMER' | 'ADMIN';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const roleParam = searchParams.get('role');
  const [selectedRole, setSelectedRole] = useState<UserRole>(
    roleParam?.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'CUSTOMER'
  );
  
  const [email, setEmail] = useState(
    selectedRole === 'ADMIN' ? 'admin@fieldfix.com' : 'customer@fieldfix.com'
  );
  const [password, setPassword] = useState(
    selectedRole === 'ADMIN' ? 'admin123' : 'customer123'
  );
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // When tab changes, update default values and clear errors
  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setError('');
    if (role === 'ADMIN') {
      setEmail('admin@fieldfix.com');
      setPassword('admin123');
    } else {
      setEmail('customer@fieldfix.com');
      setPassword('customer123');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (!password.trim()) { setError('Please enter your password.'); return; }

    setIsLoading(true);

    try {
      const response = await loginAdmin(email, password);

      // Check if the user's role matches the selected role
      if (response.user.role !== selectedRole) {
        setError(`This account is registered as ${response.user.role}. Please switch to the ${response.user.role === 'ADMIN' ? 'Admin' : 'Customer'} tab above.`);
        setIsLoading(false);
        return;
      }

      // Store auth data
      localStorage.setItem('fieldfix_admin_token', response.token);
      localStorage.setItem('fieldfix_admin_user', JSON.stringify(response.user));

      // Redirect based on role
      if (response.user.role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/customer/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sage-50 flex items-center justify-center p-4 relative overflow-hidden selection:bg-sage-300 selection:text-sage-900">
      {/* Background decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-sage-200/50 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-sage-300/40 rounded-full blur-[100px] pointer-events-none" />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #4d7f4d 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      {/* ========== LOGIN CARD ========== */}
      <div className="relative z-10 w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center space-x-2.5 bg-sage-500 text-white px-5 py-2.5 rounded-2xl shadow-md mb-4 hover:bg-sage-600 transition">
            <Wrench className="w-6 h-6" />
            <span className="font-display font-extrabold text-xl tracking-wider">FieldFix</span>
          </Link>
          <h1 className="text-2xl font-display font-extrabold text-sage-900 tracking-tight">
            Sign In to FieldFix
          </h1>
          <p className="text-sage-600 text-sm mt-1">
            Choose your account type below to continue
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/90 backdrop-blur-xl border border-sage-200 rounded-2xl p-7 shadow-xl">
          {/* ===== 2 SEPARATE ROLE TABS ===== */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-sage-600 mb-2 uppercase tracking-wider text-center">
              Select Account Type
            </label>
            <div className="grid grid-cols-2 gap-2 bg-sage-100 p-1.5 rounded-xl border border-sage-200">
              {/* Customer Option */}
              <button
                type="button"
                onClick={() => handleRoleChange('CUSTOMER')}
                className={`flex items-center justify-center space-x-2 py-3 px-3 rounded-lg text-sm font-bold transition-all ${
                  selectedRole === 'CUSTOMER'
                    ? 'bg-sage-500 text-white shadow-md scale-[1.02]'
                    : 'text-sage-700 hover:bg-sage-200/70'
                }`}
                id="tab-customer"
              >
                <User className="w-4 h-4" />
                <span>Customer</span>
              </button>

              {/* Admin Option */}
              <button
                type="button"
                onClick={() => handleRoleChange('ADMIN')}
                className={`flex items-center justify-center space-x-2 py-3 px-3 rounded-lg text-sm font-bold transition-all ${
                  selectedRole === 'ADMIN'
                    ? 'bg-sage-800 text-white shadow-md scale-[1.02]'
                    : 'text-sage-700 hover:bg-sage-200/70'
                }`}
                id="tab-admin"
              >
                <Shield className="w-4 h-4" />
                <span>Admin / Staff</span>
              </button>
            </div>
          </div>

          {/* Role Status Tag */}
          <div className={`mb-5 p-3 rounded-xl flex items-center justify-between text-xs font-semibold ${
            selectedRole === 'ADMIN'
              ? 'bg-sage-800 text-sage-100'
              : 'bg-sage-100 text-sage-800 border border-sage-200'
          }`}>
            <span className="flex items-center space-x-1.5">
              {selectedRole === 'ADMIN' ? <Shield className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5 text-sage-600" />}
              <span>Signing in as: <strong>{selectedRole === 'ADMIN' ? 'Admin Portal' : 'Customer Account'}</strong></span>
            </span>
            <span className="text-[10px] uppercase tracking-wider opacity-80">Real Database Auth</span>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 flex items-start space-x-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 animate-shake">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4" id="login-form">
            {/* Email Field */}
            <div>
              <label htmlFor="login-email" className="block text-xs font-bold text-sage-700 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-400" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder={selectedRole === 'ADMIN' ? 'admin@fieldfix.com' : 'customer@fieldfix.com'}
                  autoComplete="email"
                  className="w-full bg-sage-50/70 border border-sage-200 focus:border-sage-500 focus:ring-2 focus:ring-sage-200 rounded-xl pl-11 pr-4 py-3 text-sm text-sage-900 placeholder-sage-400 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="login-password" className="block text-xs font-bold text-sage-700 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-400" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="w-full bg-sage-50/70 border border-sage-200 focus:border-sage-500 focus:ring-2 focus:ring-sage-200 rounded-xl pl-11 pr-12 py-3 text-sm text-sage-900 placeholder-sage-400 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sage-400 hover:text-sage-600 transition p-0.5"
                  id="toggle-password"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center space-x-2 py-3.5 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98] ${
                selectedRole === 'ADMIN'
                  ? 'bg-sage-800 hover:bg-sage-900 text-white'
                  : 'bg-sage-500 hover:bg-sage-600 text-white'
              }`}
              id="login-submit"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In to {selectedRole === 'ADMIN' ? 'Admin Dashboard' : 'Customer Portal'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Autofill Notice */}
          <div className="mt-5 pt-4 border-t border-sage-200 text-center">
            <p className="text-xs text-sage-500 mb-2 font-medium">Quick Demo Credentials (Pre-filled):</p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => handleRoleChange('CUSTOMER')}
                className="text-[11px] bg-sage-100 hover:bg-sage-200 text-sage-800 px-3 py-1.5 rounded-lg border border-sage-200 transition font-medium"
              >
                👤 Customer: customer@fieldfix.com
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange('ADMIN')}
                className="text-[11px] bg-sage-100 hover:bg-sage-200 text-sage-800 px-3 py-1.5 rounded-lg border border-sage-200 transition font-medium"
              >
                🛡️ Admin: admin@fieldfix.com
              </button>
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-5 text-center text-xs text-sage-500">
            Need a new account?{' '}
            <Link to="/register" className="text-sage-700 hover:text-sage-900 font-bold underline underline-offset-2 transition">
              Create one now
            </Link>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-4">
          <Link to="/" className="text-xs text-sage-500 hover:text-sage-700 font-semibold transition">
            ← Back to Landing Page
          </Link>
        </div>
      </div>
    </div>
  );
}
