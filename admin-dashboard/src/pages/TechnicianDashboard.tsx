import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench, CheckCircle2, Clock, MapPin, Phone, User, Star,
  DollarSign, ShieldCheck, Power, Navigation,
  Check, LogOut
} from 'lucide-react';
import { logoutAdmin, getStoredUser } from '../services/auth';

interface Job {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  serviceType: string;
  scheduledTime: string;
  status: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  amount: number;
  notes?: string;
  lat: number;
  lng: number;
}

const MOCK_JOBS: Job[] = [
  {
    id: 'JOB-9081',
    customerName: 'Priya Sharma',
    customerPhone: '+91 98765 12345',
    customerAddress: '42 Indiranagar, 10th Main Rd, Bangalore',
    serviceType: 'AC Deep Cleaning & Gas Refill',
    scheduledTime: 'Today, 2:30 PM',
    status: 'IN_PROGRESS',
    amount: 1499,
    notes: 'Split AC 1.5 Ton indoor unit leaking water and cooling issue.',
    lat: 12.9784,
    lng: 77.6408,
  },
  {
    id: 'JOB-9084',
    customerName: 'Rahul Verma',
    customerPhone: '+91 98765 67890',
    customerAddress: '15 Koramangala 4th Block, Bangalore',
    serviceType: 'Refrigerator Compressor Check',
    scheduledTime: 'Today, 5:00 PM',
    status: 'ACCEPTED',
    amount: 899,
    notes: 'Double door Whirlpool fridge not cooling freezer section.',
    lat: 12.9352,
    lng: 77.6245,
  },
  {
    id: 'JOB-9077',
    customerName: 'Ananya Deshmukh',
    customerPhone: '+91 98765 44332',
    customerAddress: '88 HSR Layout Sector 1, Bangalore',
    serviceType: 'Washing Machine Repair',
    scheduledTime: 'Yesterday, 11:00 AM',
    status: 'COMPLETED',
    amount: 1200,
    notes: 'Front load drain pump replaced successfully.',
    lat: 12.9121,
    lng: 77.6446,
  }
];

export default function TechnicianDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState<'jobs' | 'earnings' | 'reviews' | 'profile'>('jobs');
  const [jobs, setJobs] = useState<Job[]>(MOCK_JOBS);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const current = getStoredUser();
    if (!current) {
      navigate('/login');
      return;
    }
    setUser(current);
  }, [navigate]);

  const handleLogout = () => {
    logoutAdmin();
    navigate('/login');
  };

  const updateJobStatus = (jobId: string, newStatus: Job['status']) => {
    setStatusUpdating(true);
    setTimeout(() => {
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
      if (selectedJob && selectedJob.id === jobId) {
        setSelectedJob(prev => prev ? { ...prev, status: newStatus } : null);
      }
      setStatusUpdating(false);
      setSuccessMsg(`Job ${jobId} updated to ${newStatus.replace('_', ' ')}`);
      setTimeout(() => setSuccessMsg(''), 3000);
    }, 600);
  };

  const techProfile = user?.technicianProfile || {};
  const verifiedId = user?.technicianVerifiedId || techProfile.technicianVerifiedId || 'TECH-VERIFIED-REG-2026';
  const skillsList = techProfile.skills ? JSON.parse(techProfile.skills || '[]') : ['AC Repair', 'Electrical', 'Appliance Maintenance'];

  const inProgressCount = jobs.filter(j => j.status === 'IN_PROGRESS' || j.status === 'ACCEPTED').length;
  const todayEarnings = jobs.filter(j => j.status === 'COMPLETED').reduce((acc, j) => acc + j.amount, 0) + 1499;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 text-emerald-400">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-white">FieldFix Pro Dispatch</h1>
                <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> ID Verified
                </span>
              </div>
              <p className="text-xs text-slate-400">Technician ID: <span className="text-emerald-300 font-mono font-semibold">{verifiedId}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Duty Online Toggle */}
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
                isOnline
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <Power className={`w-4 h-4 ${isOnline ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
              {isOnline ? 'Duty Active (Online)' : 'Duty Paused (Offline)'}
            </button>

            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto w-full px-6 py-8 flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Sidebar Info & Nav */}
        <div className="lg:col-span-1 space-y-6">
          {/* Tech Info Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-bold text-xl text-white shadow-lg">
                {user?.name?.slice(0, 2).toUpperCase() || 'TECH'}
              </div>
              <div>
                <h2 className="font-bold text-white text-base">{user?.name}</h2>
                <p className="text-xs text-slate-400">{user?.email}</p>
                <div className="flex items-center gap-1 mt-1 text-amber-400 text-xs font-semibold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>4.9 (48 ratings)</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">City:</span>
                <span className="font-medium">{techProfile.city || 'Bangalore'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Exp:</span>
                <span className="font-medium">{techProfile.experienceYears || 5} Years</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className={`font-semibold ${isOnline ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {isOnline ? 'Ready for Dispatch' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <p className="text-xs text-slate-400">Today's Earnings</p>
              <p className="text-xl font-bold text-emerald-400 mt-1">₹{todayEarnings}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <p className="text-xs text-slate-400">Active Jobs</p>
              <p className="text-xl font-bold text-amber-400 mt-1">{inProgressCount}</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="bg-slate-900 border border-slate-800 rounded-2xl p-2 space-y-1">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'jobs'
                  ? 'bg-emerald-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Wrench className="w-4 h-4" />
                <span>Assigned Dispatch Jobs</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'jobs' ? 'bg-slate-950 text-emerald-400' : 'bg-slate-800 text-slate-400'
              }`}>{jobs.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('earnings')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'earnings'
                  ? 'bg-emerald-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <DollarSign className="w-4 h-4" />
                <span>Earnings & Payouts</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('reviews')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'reviews'
                  ? 'bg-emerald-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Star className="w-4 h-4" />
                <span>Customer Reviews</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'profile'
                  ? 'bg-emerald-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified ID & Skills</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Right Main Content */}
        <div className="lg:col-span-3 space-y-6">

          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2 shadow-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: DISPATCH JOBS */}
          {activeTab === 'jobs' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Assigned Field Requests</h2>
                  <p className="text-xs text-slate-400">Accept, navigate to customer address, and update service status</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.map(job => (
                  <div
                    key={job.id}
                    className={`bg-slate-900 border rounded-2xl p-5 space-y-4 transition-all hover:border-slate-700 ${
                      selectedJob?.id === job.id ? 'border-emerald-500/60 shadow-lg shadow-emerald-500/5' : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-mono text-slate-500 font-bold">{job.id}</span>
                        <h3 className="font-bold text-white text-base mt-0.5">{job.serviceType}</h3>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        job.status === 'IN_PROGRESS' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        job.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}>
                        {job.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                      <div className="flex items-center gap-2 text-slate-200">
                        <User className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="font-semibold">{job.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>{job.customerPhone}</span>
                      </div>
                      <div className="flex items-start gap-2 text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
                        <span>{job.customerAddress}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{job.scheduledTime}</span>
                      </div>
                    </div>

                    {job.notes && (
                      <p className="text-xs text-slate-400 italic bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                        "{job.notes}"
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                      <div>
                        <span className="text-xs text-slate-500">Payout</span>
                        <p className="text-lg font-bold text-emerald-400">₹{job.amount}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {job.status === 'ACCEPTED' && (
                          <button
                            onClick={() => updateJobStatus(job.id, 'IN_PROGRESS')}
                            disabled={statusUpdating}
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                          >
                            <Navigation className="w-3.5 h-3.5" /> Start Job
                          </button>
                        )}
                        {job.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => updateJobStatus(job.id, 'COMPLETED')}
                            disabled={statusUpdating}
                            className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Complete Service
                          </button>
                        )}
                        {job.status === 'COMPLETED' && (
                          <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Verified Done
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: EARNINGS */}
          {activeTab === 'earnings' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <h2 className="text-xl font-bold text-white">Earnings & Weekly Payouts</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                  <span className="text-xs text-slate-400">This Week Payout</span>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">₹8,490</p>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                  <span className="text-xs text-slate-400">Completed Jobs</span>
                  <p className="text-2xl font-bold text-white mt-1">14 Jobs</p>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                  <span className="text-xs text-slate-400">Direct Bank Status</span>
                  <p className="text-sm font-semibold text-emerald-300 mt-2 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Auto Payout Active
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-800">
                <h3 className="font-semibold text-sm text-slate-200">Recent Completed Jobs Payout History</h3>
                <div className="space-y-2">
                  {[
                    { id: 'PAY-101', date: 'Yesterday', job: 'AC Gas Charging', customer: 'Ananya D.', amount: 1200 },
                    { id: 'PAY-100', date: '29 Sep 2026', job: 'Geyser Heating Coil', customer: 'Karan M.', amount: 950 },
                    { id: 'PAY-099', date: '28 Sep 2026', job: 'Washing Machine Motor', customer: 'Siddharth P.', amount: 1800 },
                  ].map(p => (
                    <div key={p.id} className="flex items-center justify-between bg-slate-950/60 p-3.5 rounded-xl border border-slate-850 text-xs">
                      <div>
                        <p className="font-semibold text-white">{p.job}</p>
                        <p className="text-slate-400">{p.customer} • {p.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-400 text-sm">+₹{p.amount}</p>
                        <span className="text-slate-500 font-mono text-[10px]">{p.id}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <h2 className="text-xl font-bold text-white">Customer Feedback & Ratings</h2>
              
              <div className="space-y-3">
                {[
                  { reviewer: 'Aarav M.', rating: 5, comment: 'Fixed AC in under an hour. Very professional and tidy work!', date: '2 days ago' },
                  { reviewer: 'Sneha R.', rating: 5, comment: 'Thorough gas recharge service. Explained everything before doing the repair.', date: '1 week ago' },
                  { reviewer: 'Venkatesh K.', rating: 4, comment: 'On time and polite technician. Recommended.', date: '2 weeks ago' },
                ].map((rev, idx) => (
                  <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white text-sm">{rev.reviewer}</span>
                      <div className="flex items-center gap-1 text-amber-400">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 italic font-sans">"{rev.comment}"</p>
                    <p className="text-[10px] text-slate-500 text-right">{rev.date}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: PROFILE */}
          {activeTab === 'profile' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <h2 className="text-xl font-bold text-white">Verified Technician Badge & Credentials</h2>

              <div className="bg-slate-950 p-5 rounded-2xl border border-emerald-500/30 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Government / Govt Reg. Verified ID</h3>
                    <p className="text-xs text-slate-400">Mandatory verification required for dispatch platform authorization</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-500">Verified ID Reg Number:</span>
                    <p className="font-mono font-bold text-emerald-400 text-sm mt-0.5">{verifiedId}</p>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-500">Verification Status:</span>
                    <p className="font-semibold text-emerald-300 text-sm mt-0.5 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Authenticated & Live
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-slate-200">Registered Skills & Specializations</h3>
                <div className="flex flex-wrap gap-2">
                  {skillsList.map((skill: string, i: number) => (
                    <span key={i} className="bg-slate-800 border border-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-xl font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
