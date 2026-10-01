import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Wrench, CheckCircle2, Clock, MapPin, Phone, User, Star,
  DollarSign, ShieldCheck, Power, Navigation, Settings, FileText,
  Check, LogOut, Menu, X, Users, Briefcase, BadgeCheck,
  CreditCard, TrendingUp, Calendar, MessageSquare, Award,
  Mail, Building
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
  },
  {
    id: 'JOB-9090',
    customerName: 'Meera Nair',
    customerPhone: '+91 98765 55566',
    customerAddress: '22 Whitefield Main Rd, Bangalore',
    serviceType: 'Water Heater Installation',
    scheduledTime: 'Tomorrow, 10:00 AM',
    status: 'PENDING',
    amount: 2200,
    notes: 'New Racold 25L instant water heater wall mount.',
    lat: 12.9698,
    lng: 77.7500,
  }
];

type TabId = 'jobs' | 'form' | 'earnings' | 'reviews' | 'customers' | 'profile' | 'settings';

export default function TechnicianDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('jobs');
  const [jobs, setJobs] = useState<Job[]>(MOCK_JOBS);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Service form state
  const [formData, setFormData] = useState({
    serviceType: '',
    description: '',
    customerName: '',
    customerPhone: '',
    address: '',
    preferredDate: '',
    priority: 'NORMAL',
    notes: ''
  });

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
      setStatusUpdating(false);
      setSuccessMsg(`Job ${jobId} updated to ${newStatus.replace('_', ' ')}`);
      setTimeout(() => setSuccessMsg(''), 3000);
    }, 600);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('Service report submitted successfully!');
    setFormData({ serviceType: '', description: '', customerName: '', customerPhone: '', address: '', preferredDate: '', priority: 'NORMAL', notes: '' });
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const techProfile = user?.technicianProfile || {};
  const verifiedId = user?.technicianVerifiedId || techProfile.technicianVerifiedId || 'TECH-VERIFIED-REG-2026';
  const skillsList = techProfile.skills ? JSON.parse(techProfile.skills || '[]') : ['AC Repair', 'Electrical', 'Appliance Maintenance', 'Plumbing', 'Smart Home'];
  const inProgressCount = jobs.filter(j => j.status === 'IN_PROGRESS' || j.status === 'ACCEPTED').length;
  const todayEarnings = jobs.filter(j => j.status === 'COMPLETED').reduce((acc, j) => acc + j.amount, 0) + 1499;

  const navItems: { id: TabId; label: string; icon: any; badge?: string; badgeColor?: string; description: string }[] = [
    { id: 'jobs', label: 'Dispatch Jobs', icon: Briefcase, badge: `${inProgressCount} Active`, badgeColor: 'bg-amber-500/20 text-amber-600 border-amber-500/30', description: 'View assigned field requests' },
    { id: 'form', label: 'Service Report', icon: FileText, badge: 'Form', badgeColor: 'bg-sage-500/20 text-sage-700 border-sage-500/30', description: 'Submit service completion form' },
    { id: 'earnings', label: 'Earnings & Payouts', icon: DollarSign, badge: `₹${todayEarnings}`, badgeColor: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30', description: 'Track income & payouts' },
    { id: 'reviews', label: 'Customer Reviews', icon: Star, badge: '4.9★', badgeColor: 'bg-amber-500/20 text-amber-600 border-amber-500/30', description: 'Feedback from customers' },
    { id: 'customers', label: 'Recent Customers', icon: Users, badge: '6 Recent', badgeColor: 'bg-blue-500/20 text-blue-600 border-blue-500/30', description: 'Recently contacted customers' },
    { id: 'profile', label: 'Verified ID & Skills', icon: ShieldCheck, badge: 'Verified', badgeColor: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30', description: 'Credentials & specializations' },
    { id: 'settings', label: 'Settings', icon: Settings, description: 'Account & preferences' },
  ];

  return (
    <div className="min-h-screen bg-sage-50 text-slate-800 flex flex-col md:flex-row font-sans selection:bg-sage-300 selection:text-sage-900 antialiased">

      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className={`hidden md:flex flex-col justify-between bg-white/95 backdrop-blur-2xl border-r border-sage-200/80 transition-all duration-300 z-50 sticky top-0 h-screen ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div>
          {/* Brand Header */}
          <div className="p-4 flex items-center justify-between border-b border-sage-200/80">
            <Link to="/technician/dashboard" className="flex items-center space-x-3 group overflow-hidden">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-green-600 text-white shadow-md group-hover:scale-105 transition-transform flex-shrink-0">
                <Wrench className="w-5 h-5" />
              </div>
              {sidebarOpen && (
                <div className="flex flex-col">
                  <span className="font-display font-extrabold text-lg tracking-wider text-sage-900 flex items-center space-x-1">
                    <span>FieldFix</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 font-mono">TECH</span>
                  </span>
                  <span className="text-[10px] text-sage-600 font-medium tracking-tight">Technician Portal</span>
                </div>
              )}
            </Link>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg bg-sage-100/80 hover:bg-sage-200 text-sage-600 hover:text-sage-900 transition"
              title={sidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>

          {/* Duty Toggle */}
          {sidebarOpen && (
            <div className="px-4 mt-4">
              <button
                onClick={() => setIsOnline(!isOnline)}
                className={`w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs font-bold shadow-md transition active:scale-95 ${
                  isOnline
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                    : 'bg-sage-200 text-sage-600 hover:bg-sage-300'
                }`}
              >
                <Power className={`w-4 h-4 ${isOnline ? 'animate-pulse' : ''}`} />
                <span>{isOnline ? '● Duty Active (Online)' : '○ Go Online'}</span>
              </button>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5 mt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md font-bold'
                      : 'text-sage-600 hover:text-sage-900 hover:bg-sage-100/60'
                  }`}
                  title={item.label}
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-sage-500 group-hover:text-sage-700'}`} />
                    {sidebarOpen && <span className="truncate">{item.label}</span>}
                  </div>
                  {sidebarOpen && item.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${isActive ? 'bg-white/20 text-white border-white/30' : item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Info */}
        <div className="p-4 border-t border-sage-200/80 bg-sage-50/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs shadow-md flex-shrink-0">
                {user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'T'}
              </div>
              {sidebarOpen && (
                <div className="flex flex-col text-left overflow-hidden">
                  <span className="text-xs font-bold text-sage-800 truncate">{user?.name || 'Technician'}</span>
                  <span className="text-[10px] text-sage-600 font-medium truncate flex items-center">
                    <BadgeCheck className="w-3 h-3 mr-0.5 text-emerald-500 inline" />
                    ID Verified
                  </span>
                </div>
              )}
            </div>
            {sidebarOpen && (
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl bg-sage-100/80 hover:bg-rose-500/20 border border-sage-200 text-sage-600 hover:text-rose-500 transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ================= MAIN CONTAINER ================= */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* TOP NAVBAR */}
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-sage-200/80 px-4 md:px-8 py-3.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-sage-100 text-sage-700 hover:text-sage-900"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-sage-500 hidden sm:inline">Technician Portal</span>
              <span className="text-sage-400 hidden sm:inline">/</span>
              <span className="text-sage-900 font-bold capitalize">
                {navItems.find(n => n.id === activeTab)?.label || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Online Status Pill */}
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
              isOnline
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-sage-100 border-sage-200 text-sage-500'
            }`}>
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOnline ? 'bg-emerald-400' : 'bg-gray-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
              </span>
              <span className="hidden sm:inline">{isOnline ? 'On Duty' : 'Offline'}</span>
            </div>

            {/* Verified Badge */}
            <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ID Verified</span>
            </div>
          </div>
        </header>

        {/* MOBILE MENU */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-sage-200 p-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold ${
                  activeTab === item.id ? 'bg-emerald-600 text-white font-bold' : 'text-sage-700 hover:bg-sage-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${activeTab === item.id ? 'bg-white/20 text-white border-white/30' : item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
            <div className="pt-2 border-t border-sage-200 flex items-center justify-between">
              <span className="text-xs text-sage-600">{user?.name}</span>
              <button onClick={handleLogout} className="px-3 py-1.5 bg-rose-50 text-rose-500 rounded-lg text-xs font-semibold border border-rose-200">Sign Out</button>
            </div>
          </div>
        )}

        {/* MAIN PAGE CONTENT */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">

          {/* Success Toast */}
          {successMsg && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2 shadow-md">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ============== TAB: DISPATCH JOBS ============== */}
          {activeTab === 'jobs' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-sage-900">Assigned Field Requests</h2>
                  <p className="text-xs text-sage-600">Accept, navigate to customer address, and update service status</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-amber-50 text-amber-600 border border-amber-200 text-xs px-3 py-1.5 rounded-full font-semibold">{inProgressCount} Active</span>
                  <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs px-3 py-1.5 rounded-full font-semibold">{jobs.filter(j => j.status === 'COMPLETED').length} Done</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.map(job => (
                  <div
                    key={job.id}
                    className="bg-white border border-sage-200 rounded-2xl p-5 space-y-4 transition-all hover:border-sage-300 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-mono text-sage-500 font-bold">{job.id}</span>
                        <h3 className="font-bold text-sage-900 text-base mt-0.5">{job.serviceType}</h3>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        job.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                        job.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                        job.status === 'PENDING' ? 'bg-orange-50 text-orange-600 border border-orange-200' :
                        'bg-blue-50 text-blue-600 border border-blue-200'
                      }`}>
                        {job.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs text-sage-700 bg-sage-50/60 p-3 rounded-xl border border-sage-200">
                      <div className="flex items-center gap-2 text-sage-800">
                        <User className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="font-semibold">{job.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sage-600">
                        <Phone className="w-3.5 h-3.5 text-sage-400" />
                        <span>{job.customerPhone}</span>
                      </div>
                      <div className="flex items-start gap-2 text-sage-600">
                        <MapPin className="w-3.5 h-3.5 text-sage-400 mt-0.5 flex-shrink-0" />
                        <span>{job.customerAddress}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sage-600">
                        <Clock className="w-3.5 h-3.5 text-sage-400" />
                        <span>{job.scheduledTime}</span>
                      </div>
                    </div>

                    {job.notes && (
                      <p className="text-xs text-sage-600 italic bg-white p-2.5 rounded-lg border border-sage-100">
                        "{job.notes}"
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-sage-200">
                      <div>
                        <span className="text-xs text-sage-500">Payout</span>
                        <p className="text-lg font-bold text-emerald-600">₹{job.amount}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {job.status === 'PENDING' && (
                          <button onClick={() => updateJobStatus(job.id, 'ACCEPTED')} disabled={statusUpdating}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors">
                            <Check className="w-3.5 h-3.5" /> Accept
                          </button>
                        )}
                        {job.status === 'ACCEPTED' && (
                          <button onClick={() => updateJobStatus(job.id, 'IN_PROGRESS')} disabled={statusUpdating}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors">
                            <Navigation className="w-3.5 h-3.5" /> Start Job
                          </button>
                        )}
                        {job.status === 'IN_PROGRESS' && (
                          <button onClick={() => updateJobStatus(job.id, 'COMPLETED')} disabled={statusUpdating}
                            className="bg-teal-500 hover:bg-teal-600 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                          </button>
                        )}
                        {job.status === 'COMPLETED' && (
                          <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Done
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============== TAB: SERVICE REPORT FORM ============== */}
          {activeTab === 'form' && (
            <div className="max-w-2xl mx-auto">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-sage-900">Service Completion Report</h2>
                <p className="text-xs text-sage-600">Fill in details after completing a service visit</p>
              </div>

              <form onSubmit={handleFormSubmit} className="bg-white border border-sage-200 rounded-2xl p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-sage-700 mb-1.5 uppercase tracking-wider">Service Type</label>
                    <select value={formData.serviceType} onChange={e => setFormData({...formData, serviceType: e.target.value})}
                      className="w-full bg-sage-50 border border-sage-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl px-4 py-3 text-sm text-sage-900 focus:outline-none transition-all">
                      <option value="">Select service...</option>
                      <option>AC Deep Cleaning</option>
                      <option>AC Gas Refill</option>
                      <option>Refrigerator Repair</option>
                      <option>Washing Machine Repair</option>
                      <option>Electrical Wiring</option>
                      <option>Plumbing</option>
                      <option>Water Heater</option>
                      <option>Smart Home Setup</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-sage-700 mb-1.5 uppercase tracking-wider">Priority</label>
                    <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}
                      className="w-full bg-sage-50 border border-sage-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl px-4 py-3 text-sm text-sage-900 focus:outline-none transition-all">
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-sage-700 mb-1.5 uppercase tracking-wider">Customer Name</label>
                  <input type="text" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})}
                    placeholder="Full name of the customer"
                    className="w-full bg-sage-50 border border-sage-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl px-4 py-3 text-sm text-sage-900 placeholder-sage-400 focus:outline-none transition-all" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-sage-700 mb-1.5 uppercase tracking-wider">Customer Phone</label>
                  <input type="tel" value={formData.customerPhone} onChange={e => setFormData({...formData, customerPhone: e.target.value})}
                    placeholder="+91 98765 XXXXX"
                    className="w-full bg-sage-50 border border-sage-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl px-4 py-3 text-sm text-sage-900 placeholder-sage-400 focus:outline-none transition-all" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-sage-700 mb-1.5 uppercase tracking-wider">Service Address</label>
                  <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
                    placeholder="Full address of service location"
                    className="w-full bg-sage-50 border border-sage-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl px-4 py-3 text-sm text-sage-900 placeholder-sage-400 focus:outline-none transition-all" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-sage-700 mb-1.5 uppercase tracking-wider">Work Description</label>
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                    rows={3} placeholder="Describe the work performed..."
                    className="w-full bg-sage-50 border border-sage-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl px-4 py-3 text-sm text-sage-900 placeholder-sage-400 focus:outline-none transition-all resize-none" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-sage-700 mb-1.5 uppercase tracking-wider">Additional Notes</label>
                  <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}
                    rows={2} placeholder="Any spare parts used, follow-up needed, etc."
                    className="w-full bg-sage-50 border border-sage-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl px-4 py-3 text-sm text-sage-900 placeholder-sage-400 focus:outline-none transition-all resize-none" />
                </div>

                <button type="submit"
                  className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98]">
                  <FileText className="w-4 h-4" />
                  <span>Submit Service Report</span>
                </button>
              </form>
            </div>
          )}

          {/* ============== TAB: EARNINGS & PAYOUTS ============== */}
          {activeTab === 'earnings' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-sage-900">Earnings & Weekly Payouts</h2>
                <p className="text-xs text-sage-600">Track your income, completed jobs, and bank payout status</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-sage-200 p-5 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-emerald-50"><DollarSign className="w-4 h-4 text-emerald-600" /></div>
                    <span className="text-xs text-sage-500 font-semibold">Today</span>
                  </div>
                  <p className="text-2xl font-bold text-sage-900">₹{todayEarnings}</p>
                  <p className="text-[10px] text-emerald-600 font-medium mt-1">+12% from yesterday</p>
                </div>
                <div className="bg-white border border-sage-200 p-5 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-blue-50"><TrendingUp className="w-4 h-4 text-blue-600" /></div>
                    <span className="text-xs text-sage-500 font-semibold">This Week</span>
                  </div>
                  <p className="text-2xl font-bold text-sage-900">₹8,490</p>
                  <p className="text-[10px] text-sage-500 font-medium mt-1">14 jobs completed</p>
                </div>
                <div className="bg-white border border-sage-200 p-5 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-purple-50"><Calendar className="w-4 h-4 text-purple-600" /></div>
                    <span className="text-xs text-sage-500 font-semibold">This Month</span>
                  </div>
                  <p className="text-2xl font-bold text-sage-900">₹32,750</p>
                  <p className="text-[10px] text-sage-500 font-medium mt-1">52 jobs completed</p>
                </div>
                <div className="bg-white border border-sage-200 p-5 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-emerald-50"><CreditCard className="w-4 h-4 text-emerald-600" /></div>
                    <span className="text-xs text-sage-500 font-semibold">Bank Payout</span>
                  </div>
                  <p className="text-sm font-semibold text-emerald-600 mt-2 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Auto-Transfer Active
                  </p>
                  <p className="text-[10px] text-sage-500 font-medium mt-1">Next: Friday 6 PM</p>
                </div>
              </div>

              {/* Payout History */}
              <div className="bg-white border border-sage-200 rounded-2xl p-6">
                <h3 className="font-bold text-sm text-sage-800 mb-4">Recent Payout History</h3>
                <div className="space-y-3">
                  {[
                    { id: 'PAY-101', date: 'Yesterday', job: 'AC Gas Charging — Ananya D.', amount: 1200, status: 'Credited' },
                    { id: 'PAY-100', date: '29 Sep 2026', job: 'Geyser Heating Coil — Karan M.', amount: 950, status: 'Credited' },
                    { id: 'PAY-099', date: '28 Sep 2026', job: 'Washing Machine Motor — Siddharth P.', amount: 1800, status: 'Credited' },
                    { id: 'PAY-098', date: '27 Sep 2026', job: 'AC Installation — Deepika S.', amount: 2500, status: 'Credited' },
                    { id: 'PAY-097', date: '26 Sep 2026', job: 'Electrical Panel Repair — Amit K.', amount: 1600, status: 'Credited' },
                  ].map(p => (
                    <div key={p.id} className="flex items-center justify-between bg-sage-50/60 p-4 rounded-xl border border-sage-200 text-xs hover:bg-sage-50 transition">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-50">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-sage-900">{p.job}</p>
                          <p className="text-sage-500">{p.date} • <span className="font-mono">{p.id}</span></p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600 text-sm">+₹{p.amount}</p>
                        <span className="text-emerald-500 text-[10px]">{p.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============== TAB: CUSTOMER REVIEWS ============== */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-sage-900">Customer Feedback & Ratings</h2>
                  <p className="text-xs text-sage-600">See what your customers say about your service</p>
                </div>
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-amber-700 text-lg">4.9</span>
                  <span className="text-xs text-amber-600">(48 reviews)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { reviewer: 'Aarav Mehta', rating: 5, comment: 'Fixed AC in under an hour. Very professional and tidy work! Will definitely book again.', date: '2 days ago', service: 'AC Deep Cleaning' },
                  { reviewer: 'Sneha Reddy', rating: 5, comment: 'Thorough gas recharge service. Explained everything before doing the repair. Very polite.', date: '1 week ago', service: 'AC Gas Refill' },
                  { reviewer: 'Venkatesh K.', rating: 4, comment: 'On time and polite technician. Fixed the issue quickly. Recommended.', date: '2 weeks ago', service: 'Refrigerator Repair' },
                  { reviewer: 'Priya Sharma', rating: 5, comment: 'Excellent service! Replaced the drain pump and also cleaned the filter. Very happy.', date: '3 weeks ago', service: 'Washing Machine Repair' },
                  { reviewer: 'Ravi Kumar', rating: 5, comment: 'Smart home setup was seamless. Very knowledgeable about the products.', date: '1 month ago', service: 'Smart Home Setup' },
                  { reviewer: 'Neha Joshi', rating: 4, comment: 'Good work on the electrical panel. Arrived on time and finished within estimate.', date: '1 month ago', service: 'Electrical Wiring' },
                ].map((rev, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-2xl border border-sage-200 space-y-3 hover:shadow-md transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-sage-100 flex items-center justify-center text-sage-600 font-bold text-sm">
                          {rev.reviewer.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <span className="font-semibold text-sage-900 text-sm">{rev.reviewer}</span>
                          <p className="text-[10px] text-sage-500">{rev.service}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-sage-700 italic leading-relaxed">"{rev.comment}"</p>
                    <p className="text-[10px] text-sage-400 text-right">{rev.date}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============== TAB: RECENTLY CONTACTED CUSTOMERS ============== */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-sage-900">Recently Contacted Customers</h2>
                <p className="text-xs text-sage-600">Customers you've recently serviced or been in contact with</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'Priya Sharma', phone: '+91 98765 12345', email: 'priya@mail.com', address: '42 Indiranagar, Bangalore', lastService: 'AC Deep Cleaning', lastDate: 'Today', jobs: 3 },
                  { name: 'Rahul Verma', phone: '+91 98765 67890', email: 'rahul@mail.com', address: '15 Koramangala, Bangalore', lastService: 'Refrigerator Repair', lastDate: 'Today', jobs: 1 },
                  { name: 'Ananya Deshmukh', phone: '+91 98765 44332', email: 'ananya@mail.com', address: '88 HSR Layout, Bangalore', lastService: 'Washing Machine', lastDate: 'Yesterday', jobs: 2 },
                  { name: 'Karan Malhotra', phone: '+91 98765 77788', email: 'karan@mail.com', address: '56 JP Nagar, Bangalore', lastService: 'Geyser Repair', lastDate: '29 Sep', jobs: 1 },
                  { name: 'Siddharth Patel', phone: '+91 98765 99001', email: 'sid@mail.com', address: '23 BTM Layout, Bangalore', lastService: 'Motor Replacement', lastDate: '28 Sep', jobs: 2 },
                  { name: 'Deepika Singh', phone: '+91 98765 22233', email: 'deepika@mail.com', address: '10 Marathahalli, Bangalore', lastService: 'AC Installation', lastDate: '27 Sep', jobs: 1 },
                ].map((c, idx) => (
                  <div key={idx} className="bg-white border border-sage-200 rounded-2xl p-5 space-y-3 hover:shadow-lg transition-all hover:border-sage-300">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-sage-200 to-sage-300 flex items-center justify-center text-sage-700 font-bold text-sm shadow">
                        {c.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h3 className="font-bold text-sage-900 text-sm">{c.name}</h3>
                        <p className="text-[10px] text-sage-500">{c.jobs} service{c.jobs > 1 ? 's' : ''} completed</p>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-sage-600">
                      <div className="flex items-center gap-2"><Phone className="w-3 h-3 text-sage-400" />{c.phone}</div>
                      <div className="flex items-center gap-2"><Mail className="w-3 h-3 text-sage-400" />{c.email}</div>
                      <div className="flex items-start gap-2"><MapPin className="w-3 h-3 text-sage-400 mt-0.5" />{c.address}</div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-sage-100 text-xs">
                      <span className="text-sage-500">Last: <span className="font-medium text-sage-700">{c.lastService}</span></span>
                      <span className="text-sage-400">{c.lastDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============== TAB: VERIFIED ID & SKILLS ============== */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-sage-900">Verified Technician Credentials</h2>
                <p className="text-xs text-sage-600">Your ID verification, skills, and platform authorization status</p>
              </div>

              {/* Full Info Card */}
              <div className="bg-white border border-sage-200 rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center font-bold text-2xl text-white shadow-lg">
                    {user?.name?.slice(0, 2).toUpperCase() || 'T'}
                  </div>
                  <div>
                    <h3 className="font-bold text-sage-900 text-lg">{user?.name || 'Technician'}</h3>
                    <p className="text-xs text-sage-600">{user?.email}</p>
                    <div className="flex items-center gap-1 mt-1 text-amber-500 text-xs font-semibold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>4.9 Rating (48 reviews)</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-sage-50 p-3 rounded-xl border border-sage-200">
                    <span className="text-sage-500">City</span>
                    <p className="font-semibold text-sage-800 mt-0.5">{techProfile.city || 'Bangalore'}</p>
                  </div>
                  <div className="bg-sage-50 p-3 rounded-xl border border-sage-200">
                    <span className="text-sage-500">Experience</span>
                    <p className="font-semibold text-sage-800 mt-0.5">{techProfile.experienceYears || 5} Years</p>
                  </div>
                  <div className="bg-sage-50 p-3 rounded-xl border border-sage-200">
                    <span className="text-sage-500">Total Jobs</span>
                    <p className="font-semibold text-sage-800 mt-0.5">248</p>
                  </div>
                  <div className="bg-sage-50 p-3 rounded-xl border border-sage-200">
                    <span className="text-sage-500">Member Since</span>
                    <p className="font-semibold text-sage-800 mt-0.5">Jan 2025</p>
                  </div>
                </div>
              </div>

              {/* Verified ID Badge */}
              <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-200 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-100 border border-emerald-200 rounded-xl text-emerald-600">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sage-900 text-base">Government Verified ID</h3>
                    <p className="text-xs text-sage-600">Mandatory verification for dispatch platform authorization</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-white p-4 rounded-xl border border-sage-200">
                    <span className="text-sage-500">Verified ID Registration Number</span>
                    <p className="font-mono font-bold text-emerald-600 text-sm mt-1">{verifiedId}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-sage-200">
                    <span className="text-sage-500">Verification Status</span>
                    <p className="font-semibold text-emerald-600 text-sm mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Authenticated & Live
                    </p>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="bg-white border border-sage-200 rounded-2xl p-6">
                <h3 className="font-bold text-sm text-sage-800 mb-4 flex items-center gap-2">
                  <Award className="w-4 h-4 text-sage-500" />
                  Registered Skills & Specializations
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skillsList.map((skill: string, i: number) => (
                    <span key={i} className="bg-sage-100 border border-sage-200 text-sage-800 text-xs px-4 py-2 rounded-xl font-medium hover:bg-sage-200 transition cursor-default">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============== TAB: SETTINGS ============== */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-bold text-sage-900">Account Settings</h2>
                <p className="text-xs text-sage-600">Manage your profile, notifications, and preferences</p>
              </div>

              <div className="bg-white border border-sage-200 rounded-2xl divide-y divide-sage-100">
                {/* Profile */}
                <div className="p-5 space-y-4">
                  <h3 className="font-bold text-sm text-sage-800 flex items-center gap-2"><User className="w-4 h-4 text-sage-500" /> Personal Info</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-sage-600 mb-1">Full Name</label>
                      <input type="text" defaultValue={user?.name || ''} className="w-full bg-sage-50 border border-sage-200 rounded-xl px-4 py-2.5 text-sm text-sage-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-sage-600 mb-1">Email</label>
                      <input type="email" defaultValue={user?.email || ''} className="w-full bg-sage-50 border border-sage-200 rounded-xl px-4 py-2.5 text-sm text-sage-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-sage-600 mb-1">Phone</label>
                      <input type="tel" defaultValue="+91 98765 XXXXX" className="w-full bg-sage-50 border border-sage-200 rounded-xl px-4 py-2.5 text-sm text-sage-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-sage-600 mb-1">City</label>
                      <input type="text" defaultValue={techProfile.city || 'Bangalore'} className="w-full bg-sage-50 border border-sage-200 rounded-xl px-4 py-2.5 text-sm text-sage-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all" />
                    </div>
                  </div>
                </div>

                {/* Notifications */}
                <div className="p-5 space-y-3">
                  <h3 className="font-bold text-sm text-sage-800 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-sage-500" /> Notifications</h3>
                  {[
                    { label: 'New job alerts', desc: 'Get notified when a new job is assigned', on: true },
                    { label: 'Payout updates', desc: 'Receive alerts when payment is processed', on: true },
                    { label: 'Customer messages', desc: 'Get notified about customer inquiries', on: false },
                    { label: 'Weekly summary', desc: 'Receive a weekly earnings & job summary', on: true },
                  ].map((n, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium text-sage-800">{n.label}</p>
                        <p className="text-[10px] text-sage-500">{n.desc}</p>
                      </div>
                      <button className={`relative w-11 h-6 rounded-full transition-colors ${n.on ? 'bg-emerald-500' : 'bg-sage-300'}`}>
                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${n.on ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Bank Details */}
                <div className="p-5 space-y-3">
                  <h3 className="font-bold text-sm text-sage-800 flex items-center gap-2"><Building className="w-4 h-4 text-sage-500" /> Bank & Payout Settings</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-sage-600 mb-1">Bank Name</label>
                      <input type="text" defaultValue="State Bank of India" className="w-full bg-sage-50 border border-sage-200 rounded-xl px-4 py-2.5 text-sm text-sage-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-sage-600 mb-1">Account Number</label>
                      <input type="text" defaultValue="XXXX XXXX 4532" className="w-full bg-sage-50 border border-sage-200 rounded-xl px-4 py-2.5 text-sm text-sage-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all" />
                    </div>
                  </div>
                </div>
              </div>

              <button className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98]">
                <Settings className="w-4 h-4" />
                <span>Save Settings</span>
              </button>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
