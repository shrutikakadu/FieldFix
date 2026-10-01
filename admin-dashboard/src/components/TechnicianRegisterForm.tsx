import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench,
  User,
  Mail,
  Phone,
  Lock,
  ShieldCheck,
  BadgeCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MapPin,
  Sparkles,
  Award,
  DollarSign,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { registerUser } from '../services/auth';

const SKILL_OPTIONS = [
  'HVAC & Air Conditioning',
  'Electrical Wiring',
  'Plumbing Services',
  'Smart Home Installation',
  'Appliance Repair',
  'Cleaning & Sanitation',
  'Geyser & Water Purifier',
  'Carpentry & Hardware'
];

const CITIES = ['Bangalore', 'Mumbai', 'Delhi NCR', 'Pune', 'Chennai', 'Hyderabad', 'Kolkata'];

interface TechnicianRegisterFormProps {
  onSuccess?: () => void;
  isModal?: boolean;
}

export default function TechnicianRegisterForm({ onSuccess, isModal = false }: TechnicianRegisterFormProps) {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('FieldFix@2026');
  const [verifiedId, setVerifiedId] = useState('');
  const [city, setCity] = useState('Bangalore');
  const [specialization, setSpecialization] = useState('HVAC & Air Conditioning');
  const [experience, setExperience] = useState('5');
  const [baseRate, setBaseRate] = useState('499');
  const [skills, setSkills] = useState<string[]>(['HVAC & Air Conditioning']);
  const [avatarUrl, setAvatarUrl] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');
  const [bio, setBio] = useState('Certified HVAC & Electrical technician with 5+ years of commercial and residential field experience.');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState<any>(null);

  const toggleSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const autoGenerateVerifiedId = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setVerifiedId(`TECH-KA-2026-${randomNum}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter technician full name.');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid technician email.');
      return;
    }
    if (!verifiedId.trim() || verifiedId.trim().length < 6) {
      setError('Government / Trade-Board Verified ID is mandatory for technician registration.');
      return;
    }
    if (skills.length === 0) {
      setError('Please select at least one service skill.');
      return;
    }

    setIsLoading(true);

    try {
      // Preserve current admin auth session
      const currentToken = localStorage.getItem('fieldfix_admin_token');
      const currentUser = localStorage.getItem('fieldfix_admin_user');

      await registerUser(
        name,
        email,
        phone,
        password,
        'TECHNICIAN',
        verifiedId.trim().toUpperCase(),
        skills,
        city
      );

      // Restore admin login so admin doesn't get logged out!
      if (currentToken) localStorage.setItem('fieldfix_admin_token', currentToken);
      if (currentUser) localStorage.setItem('fieldfix_admin_user', currentUser);

      setSuccessData({
        name,
        email,
        verifiedId: verifiedId.trim().toUpperCase(),
        city,
        skills
      });

      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to register technician. Check backend connection.');
    } finally {
      setIsLoading(false);
    }
  };

  if (successData) {
    return (
      <div className="bg-white border border-emerald-500/40 rounded-2xl p-6 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 mx-auto shadow-glow-emerald animate-bounce">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold font-mono">
            REGISTRATION COMPLETE
          </span>
          <h3 className="text-2xl font-display font-extrabold text-sage-900 mt-2">Technician Onboarded Successfully!</h3>
          <p className="text-sage-700 text-xs mt-1">
            <strong className="text-emerald-400">{successData.name}</strong> has been added to the active dispatch pool.
          </p>
        </div>

        <div className="bg-sage-50 p-4 rounded-xl border border-sage-200 text-left text-xs space-y-2 font-mono">
          <div className="flex justify-between">
            <span className="text-sage-500">Verified ID:</span>
            <span className="text-emerald-400 font-bold">{successData.verifiedId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sage-500">Email:</span>
            <span className="text-sage-800">{successData.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sage-500">City:</span>
            <span className="text-sage-800">{successData.city}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sage-500">Skills ({successData.skills.length}):</span>
            <span className="text-sage-700">{successData.skills.join(', ')}</span>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-3 pt-2">
          <button
            type="button"
            onClick={() => setSuccessData(null)}
            className="px-4 py-2.5 rounded-xl bg-sage-100 hover:bg-sage-200 text-sage-800 text-xs font-bold transition flex items-center space-x-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Register Another Technician</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/technicians')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-sage-900 text-xs font-bold shadow-glow-emerald transition flex items-center space-x-1.5"
          >
            <span>View Technician Staff</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-sage-200 rounded-2xl p-6 shadow-2xl relative ${isModal ? '' : 'max-w-4xl mx-auto'}`}>
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-6 border-b border-sage-200">
        <div className="flex items-center space-x-3">
          <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-sage-900 shadow-glow-emerald">
            <Wrench className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-display font-extrabold text-sage-900">Technician Registration Form</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Trade Verified</span>
              </span>
            </div>
            <p className="text-xs text-sage-600 mt-0.5">
              Add a new trade-certified field technician to the active dispatch radar network.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={autoGenerateVerifiedId}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-sage-100 hover:bg-sage-200 text-emerald-400 text-xs font-semibold border border-sage-300 transition"
        >
          <Sparkles className="w-4 h-4" />
          <span>Auto-Generate Verified ID</span>
        </button>
      </div>

      {/* Error Message Alert */}
      {error && (
        <div className="mb-6 flex items-start space-x-3 bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-xs text-rose-300 animate-shake">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: PERSONAL & CONTACT INFORMATION */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-sage-700 uppercase tracking-wider flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>1. Personal & Contact Details</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-sage-700 mb-1">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-sage-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. David Miller"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-sage-50 border border-sage-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-sage-700 mb-1">
                Email Address <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-sage-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="e.g. david@fieldfix.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-sage-50 border border-sage-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-sage-700 mb-1">Mobile Contact Phone</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-sage-500 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-sage-50 border border-sage-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-sage-700 mb-1">Dispatch App Login Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-sage-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-sage-50 border border-sage-200 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 font-mono focus:outline-none transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: VERIFICATION & CITY */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-2">
            <BadgeCheck className="w-4 h-4" />
            <span>2. Government / Trade Verification & Location</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Verified ID */}
            <div>
              <label className="block text-xs font-semibold text-sage-700 mb-1 flex items-center justify-between">
                <span>Technician Verified ID <span className="text-rose-400">*</span></span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">Mandatory Verification</span>
              </label>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. TECH-KA-2026-0812"
                  value={verifiedId}
                  onChange={(e) => setVerifiedId(e.target.value.toUpperCase())}
                  className="w-full bg-sage-50 border border-emerald-500/50 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-xl pl-10 pr-4 py-2.5 text-xs text-emerald-300 font-mono font-bold tracking-wider uppercase focus:outline-none transition"
                />
              </div>
              <p className="text-[10px] text-sage-500 mt-1">
                Format: TECH-[STATE]-[YEAR]-[ID]. Issued by government or trade council.
              </p>
            </div>

            {/* Operating City */}
            <div>
              <label className="block text-xs font-semibold text-sage-700 mb-1">Primary Operating City</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-sage-500 absolute left-3.5 top-3" />
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-sage-50 border border-sage-200 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 focus:outline-none transition"
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: SKILLS & CATEGORIES */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-2">
            <Award className="w-4 h-4" />
            <span>3. Technical Skills & Service Categories <span className="text-rose-400">*</span></span>
          </h3>

          <div className="flex flex-wrap gap-2 bg-sage-50 p-4 rounded-xl border border-sage-200">
            {SKILL_OPTIONS.map((skill) => {
              const isSelected = skills.includes(skill);
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border flex items-center space-x-1.5 ${
                    isSelected
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-sage-900 border-emerald-400 shadow-glow-emerald'
                      : 'bg-white text-sage-600 border-sage-200 hover:border-sage-300 hover:text-sage-800'
                  }`}
                >
                  <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? 'text-sage-900' : 'text-slate-600'}`} />
                  <span>{skill}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 4: RATES & BIO */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center space-x-2">
            <DollarSign className="w-4 h-4" />
            <span>4. Experience, Base Rate & Certifications</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-sage-700 mb-1">Primary Specialization</label>
              <input
                type="text"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder="e.g. Master HVAC Technician"
                className="w-full bg-sage-50 border border-sage-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-sage-700 mb-1">Field Experience (Years)</label>
              <input
                type="number"
                min="1"
                max="40"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full bg-sage-50 border border-sage-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-sage-700 mb-1">Standard Base Rate (₹ / hr)</label>
              <input
                type="number"
                value={baseRate}
                onChange={(e) => setBaseRate(e.target.value)}
                className="w-full bg-sage-50 border border-sage-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-sage-700 mb-1">Profile Photo Image URL</label>
            <input
              type="text"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full bg-sage-50 border border-sage-200 rounded-xl px-3.5 py-2.5 text-xs text-sage-700 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-sage-700 mb-1">Technician Bio & Trade Certifications</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-sage-50 border border-sage-200 rounded-xl px-3.5 py-2.5 text-xs text-sage-800 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-4 border-t border-sage-200 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/admin/technicians')}
            className="px-4 py-2.5 rounded-xl border border-sage-200 hover:bg-sage-100 text-sage-700 text-xs font-semibold transition"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-sage-900 font-bold text-xs shadow-glow-emerald transition active:scale-95 flex items-center space-x-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Verified Technician...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Complete Technician Onboarding</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
