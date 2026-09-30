import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Wrench, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle,
  Loader2, User, Phone, Settings, CheckCircle2, Shield, BadgeCheck
} from 'lucide-react';
import { registerUser } from '../services/auth';

type UserRole = 'CUSTOMER' | 'TECHNICIAN' | 'ADMIN';

const SKILL_OPTIONS = [
  'AC & Cooling', 'Electrical', 'Plumbing', 'Appliances',
  'Cleaning', 'Carpentry', 'Painting', 'Pest Control', 'Smart Home', 'Geyser & Water',
];

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

  // Technician-specific fields
  const [techVerifiedId, setTechVerifiedId] = useState('');
  const [techSkills, setTechSkills] = useState<string[]>([]);
  const [techCity, setTechCity] = useState('Bangalore');

  const toggleSkill = (skill: string) => {
    setTechSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Please enter your full name.'); return; }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email address.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (selectedRole === 'TECHNICIAN' && !techVerifiedId.trim()) {
      setError('Government / Trade-Board Verified ID is mandatory for technician registration.');
      return;
    }
    if (selectedRole === 'TECHNICIAN' && techSkills.length === 0) {
      setError('Please select at least one service skill.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await registerUser(
        name, email, phone, password, selectedRole,
        selectedRole === 'TECHNICIAN' ? techVerifiedId : undefined,
        selectedRole === 'TECHNICIAN' ? techSkills : undefined,
        selectedRole === 'TECHNICIAN' ? techCity : undefined,
      );

      localStorage.setItem('fieldfix_admin_token', result.token);
      localStorage.setItem('fieldfix_admin_user', JSON.stringify(result.user));

      if (result.user.role === 'ADMIN') navigate('/admin/dashboard', { replace: true });
      else if (result.user.role === 'TECHNICIAN') navigate('/technician/dashboard', { replace: true });
      else navigate('/customer/dashboard', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const roles: { id: UserRole; icon: React.ElementType; label: string; desc: string }[] = [
    { id: 'CUSTOMER',   icon: User,        label: 'Customer',   desc: 'Book verified home services' },
    { id: 'TECHNICIAN', icon: Wrench,      label: 'Technician', desc: 'Sign up & accept service jobs' },
    { id: 'ADMIN',      icon: Settings,    label: 'Admin',      desc: 'Manage the platform' },
  ];

  return (
    <div className="min-h-screen bg-sage-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-sage-200/40 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] bg-sage-300/30 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #4d7f4d 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

      <div className="relative z-10 w-full max-w-lg">
        {/* Brand */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center space-x-3 bg-[#2d5a27] text-white px-5 py-3 rounded-2xl shadow-md mb-5 hover:bg-[#3d6b3d] transition">
            <Wrench className="w-7 h-7" />
            <span className="font-display font-extrabold text-2xl tracking-wider">FieldFix</span>
          </Link>
          <h1 className="text-2xl font-display font-extrabold text-sage-900 tracking-tight mt-3">Create Your Account</h1>
          <p className="text-sage-500 text-sm mt-1">Join FieldFix — trusted home services platform</p>
        </div>

        <div className="bg-white/80 backdrop-blur-2xl border border-sage-200 rounded-2xl p-8 shadow-xl">
          {/* Role Selector */}
          <div className="mb-5">
            <label className="block text-xs font-bold text-sage-600 mb-3 uppercase tracking-wider">I want to join as</label>
            <div className="grid grid-cols-3 gap-2">
              {roles.map(r => {
                const Icon = r.icon;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => { setSelectedRole(r.id); setError(''); }}
                    className={`flex flex-col items-center p-3 rounded-xl border-2 text-center transition-all ${
                      selectedRole === r.id
                        ? 'border-[#2d5a27] bg-[#f0f7ee]'
                        : 'border-sage-200 hover:border-sage-300 bg-white'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1 ${selectedRole === r.id ? 'text-[#2d5a27]' : 'text-sage-400'}`} />
                    <span className={`text-xs font-bold ${selectedRole === r.id ? 'text-[#2d5a27]' : 'text-sage-500'}`}>{r.label}</span>
                    <span className="text-[10px] text-sage-400 mt-0.5 leading-tight">{r.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Technician verified ID notice */}
          {selectedRole === 'TECHNICIAN' && (
            <div className="mb-4 flex items-start space-x-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
              <Shield className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
              <span><strong>Technician verification required:</strong> You must enter your Government-issued or Trade-Board Verified Technician ID (e.g., TECH-KA-2021-0041). Fake IDs will result in permanent ban.</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-start space-x-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 animate-shake">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4" id="register-form">
            {/* Name */}
            <div>
              <label htmlFor="reg-name" className="block text-xs font-bold text-sage-600 mb-1.5 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-400" />
                <input id="reg-name" type="text" value={name} onChange={e => { setName(e.target.value); setError(''); }}
                  placeholder="Enter your full name"
                  className="w-full bg-sage-50 border border-sage-200 focus:border-[#2d5a27] focus:ring-2 focus:ring-sage-200 rounded-xl pl-11 pr-4 py-3 text-sm text-sage-900 placeholder-sage-400 focus:outline-none transition-all" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="block text-xs font-bold text-sage-600 mb-1.5 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-400" />
                <input id="reg-email" type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="you@example.com" autoComplete="email"
                  className="w-full bg-sage-50 border border-sage-200 focus:border-[#2d5a27] focus:ring-2 focus:ring-sage-200 rounded-xl pl-11 pr-4 py-3 text-sm text-sage-900 placeholder-sage-400 focus:outline-none transition-all" />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="reg-phone" className="block text-xs font-bold text-sage-600 mb-1.5 uppercase tracking-wider">Phone <span className="text-sage-400 normal-case font-normal">(Optional)</span></label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-400" />
                <input id="reg-phone" type="tel" value={phone} onChange={e => { setPhone(e.target.value); setError(''); }}
                  placeholder="9876543210"
                  className="w-full bg-sage-50 border border-sage-200 focus:border-[#2d5a27] focus:ring-2 focus:ring-sage-200 rounded-xl pl-11 pr-4 py-3 text-sm text-sage-900 placeholder-sage-400 focus:outline-none transition-all" />
              </div>
            </div>

            {/* ── TECHNICIAN-ONLY FIELDS ── */}
            {selectedRole === 'TECHNICIAN' && (
              <>
                {/* Verified ID */}
                <div>
                  <label htmlFor="reg-techid" className="block text-xs font-bold text-sage-600 mb-1.5 uppercase tracking-wider flex items-center space-x-1.5">
                    <BadgeCheck className="w-3.5 h-3.5 text-[#2d5a27]" />
                    <span>Technician Verified ID <span className="text-red-500">*</span></span>
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2d5a27]" />
                    <input id="reg-techid" type="text" value={techVerifiedId} onChange={e => { setTechVerifiedId(e.target.value.toUpperCase()); setError(''); }}
                      placeholder="e.g. TECH-KA-2024-0099"
                      className="w-full bg-amber-50 border border-amber-300 focus:border-[#2d5a27] focus:ring-2 focus:ring-sage-200 rounded-xl pl-11 pr-4 py-3 text-sm text-sage-900 placeholder-amber-400 focus:outline-none transition-all font-mono uppercase tracking-wider" />
                  </div>
                  <p className="text-[10px] text-sage-400 mt-1">Format: TECH-[STATE]-[YEAR]-[NUMBER] — issued by Trade Board or Govt. agency</p>
                </div>

                {/* Service Skills */}
                <div>
                  <label className="block text-xs font-bold text-sage-600 mb-2 uppercase tracking-wider">Service Skills <span className="text-red-500">*</span></label>
                  <div className="flex flex-wrap gap-2">
                    {SKILL_OPTIONS.map(skill => (
                      <button key={skill} type="button" onClick={() => toggleSkill(skill)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                          techSkills.includes(skill)
                            ? 'bg-[#2d5a27] text-white border-[#2d5a27]'
                            : 'bg-white text-sage-600 border-sage-200 hover:border-sage-400'
                        }`}>
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>

                {/* City */}
                <div>
                  <label htmlFor="reg-city" className="block text-xs font-bold text-sage-600 mb-1.5 uppercase tracking-wider">Operating City</label>
                  <select id="reg-city" value={techCity} onChange={e => setTechCity(e.target.value)}
                    className="w-full bg-sage-50 border border-sage-200 focus:border-[#2d5a27] rounded-xl px-4 py-3 text-sm text-sage-900 focus:outline-none transition-all">
                    {['Bangalore', 'Mumbai', 'Delhi NCR', 'Pune', 'Chennai', 'Hyderabad', 'Kolkata'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="block text-xs font-bold text-sage-600 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-400" />
                <input id="reg-password" type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="Min 6 characters"
                  className="w-full bg-sage-50 border border-sage-200 focus:border-[#2d5a27] focus:ring-2 focus:ring-sage-200 rounded-xl pl-11 pr-12 py-3 text-sm text-sage-900 placeholder-sage-400 focus:outline-none transition-all" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sage-400 hover:text-sage-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="reg-confirm" className="block text-xs font-bold text-sage-600 mb-1.5 uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <CheckCircle2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-400" />
                <input id="reg-confirm" type="password" value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                  placeholder="Re-enter your password"
                  className="w-full bg-sage-50 border border-sage-200 focus:border-[#2d5a27] focus:ring-2 focus:ring-sage-200 rounded-xl pl-11 pr-4 py-3 text-sm text-sage-900 placeholder-sage-400 focus:outline-none transition-all" />
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={isLoading} id="register-submit"
              className="w-full flex items-center justify-center space-x-2.5 py-3.5 rounded-xl bg-[#2d5a27] hover:bg-[#3d6b3d] disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all group mt-2">
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /><span>Creating Account…</span></>
              ) : (
                <><span>Create {selectedRole === 'ADMIN' ? 'Admin' : selectedRole === 'TECHNICIAN' ? 'Technician' : 'Customer'} Account</span><ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>
              )}
            </button>
          </form>

          <div className="flex items-center my-5">
            <div className="flex-1 h-px bg-sage-200" />
            <span className="px-3 text-[10px] text-sage-400 uppercase tracking-wider font-semibold">Already registered?</span>
            <div className="flex-1 h-px bg-sage-200" />
          </div>
          <p className="text-center text-sm text-sage-500">
            <Link to="/login" className="text-[#2d5a27] hover:text-[#3d6b3d] font-bold underline underline-offset-2 transition">Sign in to your account →</Link>
          </p>
        </div>

        <div className="text-center mt-4">
          <Link to="/" className="text-xs text-sage-400 hover:text-sage-600 transition">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
