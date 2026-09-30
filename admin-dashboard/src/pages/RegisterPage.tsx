import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Wrench, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Loader2, User, Phone, Settings, CheckCircle2 } from 'lucide-react';
import { registerUser } from '../services/auth';

type UserRole = 'CUSTOMER' | 'ADMIN';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('CUSTOMER');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Please enter your full name.'); return; }
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email address.'); return; }
    if (!password.trim()) { setError('Please create a password.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setIsLoading(true);

    try {
      const response = await registerUser(name, email, phone, password, selectedRole);

      // Store auth data and redirect
      localStorage.setItem('fieldfix_admin_token', response.token);
      localStorage.setItem('fieldfix_admin_user', JSON.stringify(response.user));

      if (response.user.role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/customer/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sage-50 flex items-center justify-center p-4 relative overflow-hidden selection:bg-sage-300 selection:text-sage-900">
      {/* Background */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-sage-200/40 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] bg-sage-300/30 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />

      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #4d7f4d 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      {/* ========== REGISTER CARD ========== */}
      <div className="relative z-10 w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center space-x-3 bg-sage-500 text-white px-5 py-3 rounded-2xl shadow-md mb-5 hover:bg-sage-600 transition">
            <Wrench className="w-7 h-7" />
            <span className="font-display font-extrabold text-2xl tracking-wider">FieldFix</span>
          </Link>
          <h1 className="text-2xl font-display font-extrabold text-sage-900 tracking-tight mt-3">
            Create Your Account
          </h1>
          <p className="text-sage-500 text-sm mt-2">
            Join FieldFix and get expert home services in minutes
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-2xl border border-sage-200 rounded-2xl p-8 shadow-xl">
          {/* Role Toggle */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-sage-600 mb-3 uppercase tracking-wider">
              I want to sign up as
            </label>
            <div className="grid grid-cols-2 gap-2 bg-sage-100 p-1.5 rounded-xl">
              <button
                type="button"
                onClick={() => { setSelectedRole('CUSTOMER'); setError(''); }}
                className={`flex items-center justify-center space-x-2 py-3 rounded-lg text-sm font-semibold transition-all ${
                  selectedRole === 'CUSTOMER'
                    ? 'bg-sage-500 text-white shadow-md'
                    : 'text-sage-600 hover:bg-sage-200/60'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Customer</span>
              </button>
              <button
                type="button"
                onClick={() => { setSelectedRole('ADMIN'); setError(''); }}
                className={`flex items-center justify-center space-x-2 py-3 rounded-lg text-sm font-semibold transition-all ${
                  selectedRole === 'ADMIN'
                    ? 'bg-sage-500 text-white shadow-md'
                    : 'text-sage-600 hover:bg-sage-200/60'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Admin</span>
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start space-x-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 animate-shake">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4" id="register-form">
            {/* Name */}
            <div>
              <label htmlFor="register-name" className="block text-xs font-semibold text-sage-600 mb-2 uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-400" />
                <input
                  id="register-name"
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(''); }}
                  placeholder="Enter your full name"
                  className="w-full bg-sage-50 border border-sage-200 focus:border-sage-500 focus:ring-2 focus:ring-sage-200 rounded-xl pl-11 pr-4 py-3 text-sm text-sage-900 placeholder-sage-400 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="register-email" className="block text-xs font-semibold text-sage-600 mb-2 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-400" />
                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full bg-sage-50 border border-sage-200 focus:border-sage-500 focus:ring-2 focus:ring-sage-200 rounded-xl pl-11 pr-4 py-3 text-sm text-sage-900 placeholder-sage-400 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="register-phone" className="block text-xs font-semibold text-sage-600 mb-2 uppercase tracking-wider">
                Phone Number <span className="text-sage-400">(Optional)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-400" />
                <input
                  id="register-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setError(''); }}
                  placeholder="9876543210"
                  className="w-full bg-sage-50 border border-sage-200 focus:border-sage-500 focus:ring-2 focus:ring-sage-200 rounded-xl pl-11 pr-4 py-3 text-sm text-sage-900 placeholder-sage-400 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="register-password" className="block text-xs font-semibold text-sage-600 mb-2 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-400" />
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Min 6 characters"
                  className="w-full bg-sage-50 border border-sage-200 focus:border-sage-500 focus:ring-2 focus:ring-sage-200 rounded-xl pl-11 pr-12 py-3 text-sm text-sage-900 placeholder-sage-400 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sage-400 hover:text-sage-600 transition p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="register-confirm" className="block text-xs font-semibold text-sage-600 mb-2 uppercase tracking-wider">
                Confirm Password
              </label>
              <div className="relative">
                <CheckCircle2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-400" />
                <input
                  id="register-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                  placeholder="Re-enter your password"
                  className="w-full bg-sage-50 border border-sage-200 focus:border-sage-500 focus:ring-2 focus:ring-sage-200 rounded-xl pl-11 pr-4 py-3 text-sm text-sage-900 placeholder-sage-400 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2.5 py-3.5 rounded-xl bg-sage-500 hover:bg-sage-600 disabled:bg-sage-400 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98] group mt-2"
              id="register-submit"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create {selectedRole === 'ADMIN' ? 'Admin' : 'Customer'} Account</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-sage-200" />
            <span className="px-3 text-[10px] text-sage-400 uppercase tracking-wider font-semibold">Or</span>
            <div className="flex-1 h-px bg-sage-200" />
          </div>

          {/* Login Link */}
          <p className="text-center text-sm text-sage-500">
            Already have an account?{' '}
            <Link to="/login" className="text-sage-600 hover:text-sage-700 font-bold underline underline-offset-2 transition">
              Sign In
            </Link>
          </p>
        </div>

        {/* Footer link */}
        <div className="text-center mt-4">
          <Link to="/" className="text-xs text-sage-400 hover:text-sage-600 transition">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
