import { useState, useEffect } from 'react';
import {
  Search,
  Star,
  Phone,
  Mail,
  MapPin,
  Clock,
  UserPlus,
  BadgeCheck,
  X,
  RefreshCw
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import TechnicianRegisterForm from '../components/TechnicianRegisterForm';
import { getTechnicians } from '../services/auth';

interface Technician {
  id: string;
  name: string;
  email: string;
  phone: string;
  skills: string[];
  isAvailable: boolean;
  rating: number;
  totalJobs: number;
  currentLocation: string;
  avatar: string;
  verifiedId: string;
  currentTask?: string;
}

export default function TechniciansPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [skillFilter, setSkillFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [technicians, setTechnicians] = useState<Technician[]>([
    {
      id: 'TECH-101',
      name: 'David Miller',
      email: 'david@fieldfix.io',
      phone: '+91 98765 43210',
      skills: ['HVAC & Air Conditioning', 'Appliance Repair'],
      isAvailable: true,
      rating: 4.9,
      totalJobs: 142,
      currentLocation: 'Koramangala, Sector 4',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      verifiedId: 'TECH-KA-2024-0012',
      currentTask: 'Active on BK-9021 (HVAC Overhaul)'
    },
    {
      id: 'TECH-102',
      name: 'Elena Rostova',
      email: 'elena@fieldfix.io',
      phone: '+91 98765 43211',
      skills: ['Electrical Wiring', 'Smart Home Installation'],
      isAvailable: true,
      rating: 4.8,
      totalJobs: 98,
      currentLocation: 'Indiranagar 100ft Rd',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      verifiedId: 'TECH-KA-2024-0044',
      currentTask: 'Dispatched to BK-9022'
    },
    {
      id: 'TECH-103',
      name: 'Marcus Vance',
      email: 'mvance@fieldfix.io',
      phone: '+91 98765 43212',
      skills: ['Plumbing Services', 'Appliance Repair'],
      isAvailable: false,
      rating: 4.7,
      totalJobs: 115,
      currentLocation: 'HSR Layout Sector 1',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      verifiedId: 'TECH-KA-2023-0109'
    },
    {
      id: 'TECH-104',
      name: 'Priya Sharma',
      email: 'priya@fieldfix.io',
      phone: '+91 98765 43213',
      skills: ['Smart Home Installation', 'Electrical Wiring'],
      isAvailable: true,
      rating: 4.95,
      totalJobs: 78,
      currentLocation: 'Whitefield Main Rd',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      verifiedId: 'TECH-KA-2025-0081'
    },
    {
      id: 'TECH-105',
      name: 'Rajesh Kumar',
      email: 'rajesh@fieldfix.io',
      phone: '+91 98765 43214',
      skills: ['Plumbing Services', 'HVAC & Air Conditioning'],
      isAvailable: true,
      rating: 4.6,
      totalJobs: 89,
      currentLocation: 'JP Nagar Phase 2',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      verifiedId: 'TECH-KA-2024-0099'
    }
  ]);

  const loadBackendTechnicians = async () => {
    setIsLoading(true);
    try {
      const data = await getTechnicians();
      if (Array.isArray(data) && data.length > 0) {
        const formatted: Technician[] = data.map((t: any) => {
          let parsedSkills = [];
          try {
            parsedSkills = typeof t.skills === 'string' ? JSON.parse(t.skills) : t.skills;
          } catch {
            parsedSkills = [t.specialization || 'General Technician'];
          }

          return {
            id: t.id ? `TECH-${t.id.slice(0, 4).toUpperCase()}` : 'TECH-PRO',
            name: t.user?.name || 'Registered Tech',
            email: t.user?.email || 'tech@fieldfix.io',
            phone: t.user?.phone || '+91 98765 00000',
            skills: parsedSkills && parsedSkills.length > 0 ? parsedSkills : ['HVAC & Electrical'],
            isAvailable: t.isAvailable ?? true,
            rating: t.rating || 5.0,
            totalJobs: t.totalJobs || 1,
            currentLocation: t.city || 'Bangalore',
            avatar: t.user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            verifiedId: t.technicianVerifiedId || 'TECH-VERIFIED-2026'
          };
        });

        // Merge with mock defaults so list is comprehensive
        setTechnicians((prev) => {
          const existingIds = new Set(prev.map((p) => p.verifiedId));
          const uniqueNew = formatted.filter((f) => !existingIds.has(f.verifiedId));
          return [...uniqueNew, ...prev];
        });
      }
    } catch (err) {
      console.warn('Backend API connection offline, displaying active technicians mock state');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBackendTechnicians();
  }, []);

  const toggleAvailability = (id: string) => {
    setTechnicians((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isAvailable: !t.isAvailable } : t))
    );
  };

  const filteredTechs = technicians.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.verifiedId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSkill = skillFilter === 'ALL' || t.skills.includes(skillFilter);
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'AVAILABLE' && t.isAvailable) ||
      (statusFilter === 'BUSY' && !t.isAvailable);

    return matchesSearch && matchesSkill && matchesStatus;
  });

  return (
    <AdminLayout activeTab="technicians" onOpenRegisterModal={() => setIsRegisterModalOpen(true)}>
      <div className="space-y-6">
        {/* HERO HEADER STRIP */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-sage-50 via-white to-sage-100/40 p-6 rounded-2xl border border-sage-200 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div>
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <BadgeCheck className="w-3.5 h-3.5" />
              <span>Verified Field Personnel Directory</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-extrabold text-sage-900 tracking-tight">
              Technician Staff & Availability
            </h1>
            <p className="text-sage-600 text-xs mt-1">
              Monitor active trade-certified technicians, availability status, and onboard new personnel.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={loadBackendTechnicians}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-sage-100 hover:bg-sage-200 text-sage-700 hover:text-sage-900 border border-sage-300 transition"
              title="Refresh Staff List"
            >
              <RefreshCw className={`w-4 h-4 text-sage-700 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-sage-900 font-bold text-xs shadow-glow-emerald transition active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Register New Technician</span>
            </button>
          </div>
        </div>

        {/* KPI METRICS STRIP */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/90 border border-sage-200 p-4 rounded-xl shadow-lg">
            <p className="text-xs text-sage-600 uppercase font-semibold">Total Registered Staff</p>
            <p className="text-3xl font-display font-extrabold text-sage-900 mt-1">{technicians.length}</p>
          </div>
          <div className="bg-white/90 border border-sage-200 p-4 rounded-xl shadow-lg">
            <p className="text-xs text-emerald-400 uppercase font-semibold">On-Duty / Available</p>
            <p className="text-3xl font-display font-extrabold text-emerald-400 mt-1">
              {technicians.filter((t) => t.isAvailable).length}
            </p>
          </div>
          <div className="bg-white/90 border border-sage-200 p-4 rounded-xl shadow-lg">
            <p className="text-xs text-amber-400 uppercase font-semibold">On Active Job</p>
            <p className="text-3xl font-display font-extrabold text-amber-400 mt-1">
              {technicians.filter((t) => !t.isAvailable || t.currentTask).length}
            </p>
          </div>
          <div className="bg-white/90 border border-sage-200 p-4 rounded-xl shadow-lg">
            <p className="text-xs text-sage-700 uppercase font-semibold">Avg CSAT Rating</p>
            <p className="text-3xl font-display font-extrabold text-sage-700 mt-1">4.88★</p>
          </div>
        </div>

        {/* FILTER & SEARCH CONTROL BAR */}
        <div className="bg-white/90 border border-sage-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-sage-600 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search technician, verified ID, skill, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-sage-50 border border-sage-200 rounded-xl pl-10 pr-3 py-2 text-xs text-sage-800 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <select
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="bg-sage-50 border border-sage-200 text-xs text-sage-700 rounded-xl px-3.5 py-2 focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">All Service Skills</option>
              <option value="HVAC & Air Conditioning">HVAC & Air Conditioning</option>
              <option value="Electrical Wiring">Electrical Wiring</option>
              <option value="Plumbing Services">Plumbing Services</option>
              <option value="Smart Home Installation">Smart Home Installation</option>
              <option value="Appliance Repair">Appliance Repair</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-sage-50 border border-sage-200 text-xs text-sage-700 rounded-xl px-3.5 py-2 focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="BUSY">On Duty / Busy</option>
            </select>
          </div>
        </div>

        {/* TECHNICIANS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTechs.map((tech) => (
            <div
              key={tech.id}
              className="bg-white border border-sage-200 hover:border-sage-300 transition-all duration-200 rounded-2xl p-5 flex flex-col justify-between shadow-lg relative group"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={tech.avatar}
                      alt={tech.name}
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-sage-300 shadow-md group-hover:scale-105 transition-transform"
                    />
                    <div>
                      <h2 className="font-bold text-sage-900 text-base leading-tight">{tech.name}</h2>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                          {tech.verifiedId}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-xs font-semibold text-amber-400 flex items-center">
                          <Star className="w-3 h-3 fill-amber-400 mr-0.5" />
                          {tech.rating}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full border ${
                      tech.isAvailable
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {tech.isAvailable ? 'Available' : 'On Duty'}
                  </span>
                </div>

                {/* Contact & Location */}
                <div className="mt-4 space-y-1.5 text-xs text-sage-700">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-sage-500" />
                    <span>{tech.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-sage-500" />
                    <span>{tech.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-sage-500" />
                    <span className="truncate">{tech.currentLocation}</span>
                  </div>
                </div>

                {/* Skills tags */}
                <div className="mt-4">
                  <p className="text-[10px] font-bold text-sage-600 uppercase tracking-wider mb-1.5">Service Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tech.skills.map((skill, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-sage-50 text-sage-700 text-[11px] rounded-md border border-sage-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {tech.currentTask && (
                  <div className="mt-3 p-2.5 bg-sage-500/10 border border-sky-500/20 rounded-xl text-xs text-sage-600 flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-sage-700 flex-shrink-0" />
                    <span className="truncate">{tech.currentTask}</span>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="mt-5 pt-4 border-t border-sage-200 flex items-center justify-between text-xs">
                <span className="text-sage-600">
                  Completed Jobs: <strong className="text-sage-900">{tech.totalJobs}</strong>
                </span>

                <button
                  onClick={() => toggleAvailability(tech.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    tech.isAvailable
                      ? 'bg-sage-100 hover:bg-sage-200 text-sage-700'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-sage-900 shadow-glow-emerald'
                  }`}
                >
                  {tech.isAvailable ? 'Set On Duty' : 'Set Available'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= REGISTER TECHNICIAN MODAL ================= */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-sage-50/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto my-8">
            <button
              onClick={() => setIsRegisterModalOpen(false)}
              className="absolute top-4 right-4 z-50 text-sage-600 hover:text-sage-900 p-2 rounded-xl bg-sage-100/80 hover:bg-sage-200 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <TechnicianRegisterForm
              isModal={true}
              onSuccess={() => {
                loadBackendTechnicians();
              }}
            />
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
