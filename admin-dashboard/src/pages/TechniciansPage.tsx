import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Star,
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowLeft,
  LayoutDashboard,
  BarChart3
} from 'lucide-react';

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
  currentTask?: string;
}

export default function TechniciansPage() {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [skillFilter, setSkillFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

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
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
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
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
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
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
    }
  ]);

  const toggleAvailability = (id: string) => {
    setTechnicians(prev =>
      prev.map(t => (t.id === id ? { ...t, isAvailable: !t.isAvailable } : t))
    );
  };

  const filteredTechs = technicians.filter(t => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSkill = skillFilter === 'ALL' || t.skills.includes(skillFilter);
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'AVAILABLE' && t.isAvailable) ||
      (statusFilter === 'BUSY' && !t.isAvailable);

    return matchesSearch && matchesSkill && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-teal-500/10 border border-teal-500/30 rounded-xl text-teal-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-wide">Field Service Technicians</h1>
              <p className="text-xs text-slate-400">Manage field staff, availability & live dispatch eligibility</p>
            </div>
          </div>
        </div>

        {/* Quick navigation */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-teal-400" />
            <span>Dispatch Board</span>
          </button>
          <button
            onClick={() => navigate('/admin/analytics')}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition"
          >
            <BarChart3 className="w-3.5 h-3.5 text-teal-400" />
            <span>Analytics</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
            <p className="text-xs text-slate-400 uppercase font-semibold">Total Technicians</p>
            <p className="text-2xl font-bold text-white mt-1">{technicians.length}</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
            <p className="text-xs text-emerald-400 uppercase font-semibold">On-Duty / Available</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">
              {technicians.filter(t => t.isAvailable).length}
            </p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
            <p className="text-xs text-amber-400 uppercase font-semibold">On Active Job</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">
              {technicians.filter(t => !t.isAvailable || t.currentTask).length}
            </p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
            <p className="text-xs text-teal-400 uppercase font-semibold">Avg Team Rating</p>
            <p className="text-2xl font-bold text-teal-400 mt-1">4.8★</p>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search technician, skill, email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <select
              value={skillFilter}
              onChange={e => setSkillFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-2 focus:outline-none"
            >
              <option value="ALL">All Skills</option>
              <option value="HVAC & Air Conditioning">HVAC</option>
              <option value="Electrical Wiring">Electrical</option>
              <option value="Plumbing Services">Plumbing</option>
              <option value="Smart Home Installation">Smart Home</option>
              <option value="Appliance Repair">Appliances</option>
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-2 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="BUSY">Busy / Off</option>
            </select>
          </div>
        </div>

        {/* Technicians Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTechs.map(tech => (
            <div
              key={tech.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 transition rounded-xl p-5 flex flex-col justify-between shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={tech.avatar}
                      alt={tech.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-slate-700"
                    />
                    <div>
                      <h2 className="font-bold text-white text-base">{tech.name}</h2>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <span className="text-xs text-slate-400">{tech.id}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-xs font-semibold text-amber-400 flex items-center">
                          <Star className="w-3 h-3 fill-amber-400 mr-0.5" />
                          {tech.rating}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                      tech.isAvailable
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {tech.isAvailable ? 'Available' : 'Busy'}
                  </span>
                </div>

                {/* Contact & Location */}
                <div className="mt-4 space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{tech.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{tech.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{tech.currentLocation}</span>
                  </div>
                </div>

                {/* Skills tags */}
                <div className="mt-4">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tech.skills.map((skill, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[11px] rounded-md border border-slate-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {tech.currentTask && (
                  <div className="mt-3 p-2 bg-teal-500/10 border border-teal-500/20 rounded-lg text-xs text-teal-300 flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                    <span className="truncate">{tech.currentTask}</span>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  Total Jobs: <strong className="text-white">{tech.totalJobs}</strong>
                </span>

                <button
                  onClick={() => toggleAvailability(tech.id)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                    tech.isAvailable
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {tech.isAvailable ? 'Set Busy' : 'Set Available'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
