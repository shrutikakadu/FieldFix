import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench,
  Users,
  MapPin,
  Activity,
  Plus,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Navigation,
  Zap,
  X,
  ChevronRight,
  Layers
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import TechnicianRegisterForm from '../components/TechnicianRegisterForm';
import { fetchDashboardStats, fetchBookings, fetchHealthStatus } from '../services/api';
import { socket } from '../services/socket';

interface Stats {
  activeJobs: number;
  availableTechs: number;
  pendingRequests: number;
  todayCompleted: number;
}

interface Booking {
  id: string;
  customerName: string;
  service: string;
  status: 'PENDING' | 'ACCEPTED' | 'DISPATCHED' | 'IN_PROGRESS' | 'COMPLETED';
  technicianName: string;
  address?: string;
  priority?: 'URGENT' | 'HIGH' | 'MEDIUM' | 'NORMAL';
  eta?: string;
  location: { lat: number; lng: number };
}

interface LiveLocation {
  technicianId: string;
  lat: number;
  lng: number;
  bookingId: string;
  timestamp: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ activeJobs: 24, availableTechs: 12, pendingRequests: 5, todayCompleted: 48 });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [searchQuery] = useState<string>('');
  const [liveLocations, setLiveLocations] = useState<LiveLocation[]>([
    { technicianId: 'Tech #501 (David M.)', lat: 37.7749, lng: -122.4194, bookingId: 'BK-101', timestamp: 'Just now' },
    { technicianId: 'Tech #504 (Elena R.)', lat: 37.7833, lng: -122.4167, bookingId: 'BK-102', timestamp: '2m ago' }
  ]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState<boolean>(false);
  const [isRegisterTechModalOpen, setIsRegisterTechModalOpen] = useState<boolean>(false);
  const [isSimulatingGps, setIsSimulatingGps] = useState<boolean>(false);

  // Load API Data
  const loadData = async () => {
    try {
      await fetchHealthStatus();
      const statsData = await fetchDashboardStats();
      setStats(statsData);
      const bookingsData = await fetchBookings();
      setBookings(bookingsData);
    } catch (err) {
      // Fallback mock data if server is booting
      setBookings([
        {
          id: 'BK-9021',
          customerName: 'Marcus Sterling',
          service: 'HVAC Air Conditioning Overhaul',
          status: 'IN_PROGRESS',
          technicianName: 'David Miller',
          address: '742 Evergreen Terrace, Sector 4',
          priority: 'URGENT',
          eta: '12 mins away',
          location: { lat: 37.7749, lng: -122.4194 }
        },
        {
          id: 'BK-9022',
          customerName: 'Sarah Jenkins',
          service: 'Commercial Electrical Subpanel Check',
          status: 'DISPATCHED',
          technicianName: 'Elena Rostova',
          address: '105 Market St, Suite 400',
          priority: 'HIGH',
          eta: '18 mins away',
          location: { lat: 37.7833, lng: -122.4167 }
        },
        {
          id: 'BK-9023',
          customerName: 'Dr. Robert Vance',
          service: 'Main Line Hydraulic Leak Service',
          status: 'PENDING',
          technicianName: 'Unassigned',
          address: '890 Bayview Boulevard',
          priority: 'URGENT',
          eta: 'Pending Dispatch',
          location: { lat: 37.7650, lng: -122.4300 }
        },
        {
          id: 'BK-9024',
          customerName: 'Amanda Clarke',
          service: 'Smart Thermostat & Sensor Calibration',
          status: 'COMPLETED',
          technicianName: 'Marcus Vance',
          address: '450 Pine Street, Apt 12B',
          priority: 'NORMAL',
          eta: 'Completed at 2:15 PM',
          location: { lat: 37.7900, lng: -122.4000 }
        }
      ]);
    }
  };

  useEffect(() => {
    loadData();

    function onLiveLocation(data: any) {
      const newLoc: LiveLocation = {
        technicianId: `Tech #${data.technicianId || '501'}`,
        lat: data.lat,
        lng: data.lng,
        bookingId: data.bookingId || 'BK-101',
        timestamp: new Date().toLocaleTimeString()
      };
      setLiveLocations((prev) => [newLoc, ...prev.slice(0, 4)]);
    }

    socket.on('location:live', onLiveLocation);
    return () => {
      socket.off('location:live', onLiveLocation);
    };
  }, []);

  const simulateLiveGpsPing = () => {
    setIsSimulatingGps(true);
    const newLat = 37.7749 + (Math.random() - 0.5) * 0.02;
    const newLng = -122.4194 + (Math.random() - 0.5) * 0.02;

    socket.emit('location:update', {
      technicianId: '501 (Live Test)',
      bookingId: 'BK-9021',
      lat: newLat,
      lng: newLng
    });

    setTimeout(() => setIsSimulatingGps(false), 600);
  };

  const filteredBookings = bookings.filter((b) => {
    const matchesFilter = selectedFilter === 'ALL' || b.status === selectedFilter;
    const matchesSearch =
      b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <AdminLayout activeTab="dashboard" onOpenRegisterModal={() => setIsRegisterTechModalOpen(true)}>
      <div className="space-y-8">
        {/* HERO TITLE & DISPATCH SUMMARY BANNER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-sage-50 via-white to-sage-100/40 p-6 rounded-2xl border border-sage-200 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-sage-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div>
            <div className="flex items-center space-x-2 text-sage-700 text-xs font-semibold uppercase tracking-wider mb-1">
              <Zap className="w-3.5 h-3.5" />
              <span>Real-Time Service Telemetry Radar</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-extrabold text-sage-900 tracking-tight">
              Field Operations Command Center
            </h1>
            <p className="text-sage-600 text-xs mt-1">
              Monitoring active field technicians, live GPS tracking, and automated dispatch operations.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={simulateLiveGpsPing}
              disabled={isSimulatingGps}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-sage-100 hover:bg-sage-200 text-sage-800 border border-sage-300 font-semibold text-xs shadow-lg transition active:scale-95"
            >
              <Radio className={`w-4 h-4 text-emerald-400 ${isSimulatingGps ? 'animate-spin' : ''}`} />
              <span>{isSimulatingGps ? 'Sending Ping...' : 'Simulate GPS Ping'}</span>
            </button>

            <button
              onClick={() => setIsDispatchModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-sage-900 font-bold text-xs shadow-md transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Dispatch Technician</span>
            </button>
          </div>
        </div>

        {/* METRICS & KPIS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Active Jobs */}
          <div className="p-5 bg-white/90 rounded-2xl border border-sage-200 hover:border-sage-300 transition shadow-lg relative group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sage-600 text-xs font-semibold uppercase tracking-wider">Active Jobs</p>
                <h3 className="text-3xl font-display font-extrabold text-sage-900 mt-1">{stats.activeJobs}</h3>
              </div>
              <div className="p-3 rounded-xl bg-sage-500/10 text-sage-700 group-hover:scale-110 transition">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-emerald-400 font-semibold flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +14% vs yesterday
              </span>
              <span className="text-sage-500">2 In Transit</span>
            </div>
            <div className="w-full bg-sage-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-sky-400 h-full rounded-full w-[68%]"></div>
            </div>
          </div>

          {/* On-Duty Technicians */}
          <div className="p-5 bg-white/90 rounded-2xl border border-sage-200 hover:border-sage-300 transition shadow-lg relative group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sage-600 text-xs font-semibold uppercase tracking-wider">Available Staff</p>
                <h3 className="text-3xl font-display font-extrabold text-emerald-400 mt-1">{stats.availableTechs}</h3>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-sage-700 font-medium">12 Online</span>
              <span className="text-emerald-400 font-semibold flex items-center">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block mr-1"></span> 100% Ready
              </span>
            </div>
            <div className="w-full bg-sage-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-emerald-400 h-full rounded-full w-[85%]"></div>
            </div>
          </div>

          {/* Pending Requests */}
          <div className="p-5 bg-white/90 rounded-2xl border border-sage-200 hover:border-sage-300 transition shadow-lg relative group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sage-600 text-xs font-semibold uppercase tracking-wider">Pending Requests</p>
                <h3 className="text-3xl font-display font-extrabold text-amber-400 mt-1">{stats.pendingRequests}</h3>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-amber-400 font-semibold flex items-center">
                <AlertTriangle className="w-3.5 h-3.5 mr-1" /> High Urgency
              </span>
              <span className="text-sage-500">Avg response: 4m</span>
            </div>
            <div className="w-full bg-sage-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-amber-400 h-full rounded-full w-[42%]"></div>
            </div>
          </div>

          {/* Today Completed */}
          <div className="p-5 bg-white/90 rounded-2xl border border-sage-200 hover:border-sage-300 transition shadow-lg relative group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sage-600 text-xs font-semibold uppercase tracking-wider">Completed Today</p>
                <h3 className="text-3xl font-display font-extrabold text-purple-400 mt-1">{stats.todayCompleted}</h3>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-purple-300 font-semibold">$4,850 Revenue</span>
              <span className="text-sage-500">98.5% SLA Pass</span>
            </div>
            <div className="w-full bg-sage-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-purple-400 h-full rounded-full w-[92%]"></div>
            </div>
          </div>
        </div>

        {/* SPLIT SECTION: LIVE RADAR + DISPATCH QUEUE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: LIVE DISPATCH RADAR MAP (7 COLS) */}
          <div className="lg:col-span-7 bg-white/90 rounded-2xl border border-sage-200 p-6 flex flex-col justify-between shadow-xl relative min-h-[460px]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-display font-bold text-sage-900 flex items-center">
                    <Navigation className="w-5 h-5 mr-2 text-sage-700" />
                    Technician Live Radar & GPS Map
                  </h2>
                  <p className="text-xs text-sage-600 mt-0.5">Real-time socket telemetry from field mobile devices</p>
                </div>
                <div className="flex items-center space-x-2 bg-sage-50 px-3 py-1.5 rounded-lg border border-sage-200 text-xs">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span className="text-sage-700 font-medium">3 Techs Live</span>
                </div>
              </div>

              {/* SIMULATED MAP UI CANVAS */}
              <div className="w-full h-64 bg-sage-50 rounded-xl border border-sage-200/80 relative overflow-hidden flex items-center justify-center group shadow-inner">
                {/* Background Radar Grid Pattern */}
                <div
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                  }}
                ></div>

                {/* Radar Scanning Line Effect */}
                <div className="absolute w-[350px] h-[350px] rounded-full border border-sky-500/20 pointer-events-none animate-ping"></div>

                {/* Marker 1: David Miller */}
                <div className="absolute top-1/3 left-1/4 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer">
                  <div className="px-2 py-1 rounded bg-white/90 border border-sage-500/80 text-[10px] text-sage-600 font-semibold shadow-lg mb-1 whitespace-nowrap">
                    David M. (En Route)
                  </div>
                  <div className="w-8 h-8 rounded-full bg-sage-500/20 border-2 border-sky-400 flex items-center justify-center text-sage-700 shadow-md animate-bounce">
                    <Navigation className="w-4 h-4 rotate-45" />
                  </div>
                </div>

                {/* Marker 2: Elena Rostova */}
                <div className="absolute top-2/3 right-1/3 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer">
                  <div className="px-2 py-1 rounded bg-white/90 border border-emerald-500/80 text-[10px] text-emerald-300 font-semibold shadow-lg mb-1 whitespace-nowrap">
                    Elena R. (On Site)
                  </div>
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-glow-emerald">
                    <Wrench className="w-4 h-4" />
                  </div>
                </div>

                {/* Marker 3: Customer Location Target */}
                <div className="absolute bottom-1/4 left-2/3 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="px-2 py-1 rounded bg-amber-950/90 border border-amber-500/80 text-[10px] text-amber-300 font-semibold shadow-lg mb-1 whitespace-nowrap">
                    Job #BK-9023 (Pending)
                  </div>
                  <div className="w-7 h-7 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-sage-200 text-[11px] text-sage-600 font-mono">
                  Coordinates: 37.7749° N, 122.4194° W
                </div>
              </div>
            </div>

            {/* LIVE WEBSOCKET TELEMETRY LOG STREAM */}
            <div className="mt-4 pt-4 border-t border-sage-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-sage-600 uppercase tracking-wider flex items-center">
                  <Activity className="w-3.5 h-3.5 mr-1.5 text-emerald-400 animate-pulse" />
                  Live Socket.IO Telemetry Stream
                </span>
                <span className="text-[10px] text-sage-500 font-mono">Auto-updating</span>
              </div>
              <div className="space-y-2">
                {liveLocations.map((loc, idx) => (
                  <div key={idx} className="px-3 py-2 bg-sage-50/80 rounded-xl border border-sage-200/80 text-xs flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span className="font-semibold text-sage-800">{loc.technicianId}</span>
                      <span className="text-sage-500">• {loc.bookingId}</span>
                    </div>
                    <div className="flex items-center space-x-3 font-mono text-sage-600 text-[11px]">
                      <span>[{loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}]</span>
                      <span className="text-sage-500 text-[10px]">{loc.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: JOB DISPATCH QUEUE TABLE (5 COLS) */}
          <div className="lg:col-span-5 bg-white/90 rounded-2xl border border-sage-200 p-6 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-display font-bold text-sage-900 flex items-center">
                  <Layers className="w-5 h-5 mr-2 text-sage-700" />
                  Dispatch Job Queue
                </h2>
                <span className="px-2.5 py-1 bg-sage-100 text-sage-700 rounded-full text-xs font-semibold">
                  {filteredBookings.length} Active
                </span>
              </div>

              {/* FILTER TABS */}
              <div className="flex items-center space-x-1.5 bg-sage-50 p-1 rounded-xl border border-sage-200/80 mb-4 overflow-x-auto">
                {['ALL', 'IN_PROGRESS', 'DISPATCHED', 'PENDING'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setSelectedFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                      selectedFilter === f
                        ? 'bg-sage-600 text-sage-900 shadow-md'
                        : 'text-sage-600 hover:text-sage-800 hover:bg-white'
                    }`}
                  >
                    {f === 'ALL' ? 'All Jobs' : f.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* JOB CARDS LIST */}
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {filteredBookings.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBooking(b)}
                    className="p-4 bg-sage-50/60 hover:bg-sage-100/60 rounded-xl border border-sage-200 hover:border-sky-500/50 transition cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-mono text-xs font-bold text-sage-700">{b.id}</span>
                          {b.priority === 'URGENT' && (
                            <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-[10px] font-bold uppercase">
                              Urgent
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold text-sage-800 text-sm group-hover:text-sage-900 transition">{b.service}</h4>
                        <p className="text-xs text-sage-600 mt-1 flex items-center">
                          <Users className="w-3.5 h-3.5 mr-1 text-sage-500" /> {b.customerName}
                        </p>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                          b.status === 'IN_PROGRESS'
                            ? 'bg-sage-100 text-sage-700 border-sage-300'
                            : b.status === 'DISPATCHED'
                            ? 'bg-indigo-950 text-indigo-400 border-indigo-800'
                            : b.status === 'PENDING'
                            ? 'bg-amber-950 text-amber-400 border-amber-800'
                            : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        }`}
                      >
                        {b.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-sage-200/80 flex items-center justify-between text-xs text-sage-600">
                      <span className="flex items-center">
                        <Wrench className="w-3.5 h-3.5 mr-1 text-sage-500" />
                        Tech: <strong className="text-sage-700 ml-1 font-medium">{b.technicianName}</strong>
                      </span>
                      <span className="text-sage-700 font-medium flex items-center group-hover:translate-x-0.5 transition">
                        Details <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DISPATCH TECHNICIAN MODAL */}
      {isDispatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-sage-50/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-sage-200 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsDispatchModalOpen(false)}
              className="absolute top-4 right-4 text-sage-600 hover:text-sage-900 p-1 rounded-lg hover:bg-sage-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5">
              <div className="p-3 rounded-xl bg-sage-500/10 text-sage-700">
                <Navigation className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-display font-bold text-sage-900">Dispatch New Technician</h3>
                <p className="text-xs text-sage-600">Assign on-duty technician to pending service booking</p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsDispatchModalOpen(false);
                setStats((prev) => ({ ...prev, activeJobs: prev.activeJobs + 1, pendingRequests: Math.max(0, prev.pendingRequests - 1) }));
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-sage-700 mb-1">Select Service Category</label>
                <select className="w-full bg-sage-50 border border-sage-200 rounded-xl px-3.5 py-2.5 text-sm text-sage-800 focus:outline-none focus:border-sky-500">
                  <option>HVAC Air Conditioning & Heating</option>
                  <option>Electrical Wiring & Inspection</option>
                  <option>Plumbing & Main Line Service</option>
                  <option>Smart Home Security Installation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-sage-700 mb-1">Customer Address</label>
                <input
                  type="text"
                  placeholder="e.g. 742 Evergreen Terrace, Sector 4"
                  defaultValue="105 Market St, Suite 400"
                  className="w-full bg-sage-50 border border-sage-200 rounded-xl px-3.5 py-2.5 text-sm text-sage-800 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-sage-700 mb-1">Assign On-Duty Technician</label>
                <select className="w-full bg-sage-50 border border-sage-200 rounded-xl px-3.5 py-2.5 text-sm text-sage-800 focus:outline-none focus:border-sky-500">
                  <option>David Miller (HVAC Specialist) - 1.2 km away</option>
                  <option>Elena Rostova (Electrical Master) - 3.4 km away</option>
                  <option>Marcus Vance (Hydraulics Expert) - Available</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsDispatchModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-sage-200 hover:bg-sage-100 text-sage-700 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-sage-900 text-xs font-bold shadow-md transition"
                >
                  Confirm & Dispatch Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGISTER TECHNICIAN MODAL */}
      {isRegisterTechModalOpen && (
        <div className="fixed inset-0 z-50 bg-sage-50/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto my-8">
            <button
              onClick={() => setIsRegisterTechModalOpen(false)}
              className="absolute top-4 right-4 z-50 text-sage-600 hover:text-sage-900 p-2 rounded-xl bg-sage-100/80 hover:bg-sage-200 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <TechnicianRegisterForm isModal={true} />
          </div>
        </div>
      )}

      {/* JOB DETAILS PREVIEW MODAL */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-sage-50/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-sage-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedBooking(null)}
              className="absolute top-4 right-4 text-sage-600 hover:text-sage-900 p-1 rounded-lg hover:bg-sage-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-sage-700 text-xs font-bold font-mono mb-1">
              <span>{selectedBooking.id}</span>
              <span>•</span>
              <span className="text-sage-600">{selectedBooking.priority} PRIORITY</span>
            </div>

            <h3 className="text-xl font-display font-bold text-sage-900 mb-2">{selectedBooking.service}</h3>
            <p className="text-xs text-sage-600 mb-6 flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1 text-sage-500" /> {selectedBooking.address || 'San Francisco, CA'}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6 bg-sage-50 p-4 rounded-xl border border-sage-200 text-xs">
              <div>
                <span className="text-sage-500 block mb-0.5">Customer Name</span>
                <span className="font-semibold text-sage-800">{selectedBooking.customerName}</span>
              </div>
              <div>
                <span className="text-sage-500 block mb-0.5">Assigned Technician</span>
                <span className="font-semibold text-sage-700">{selectedBooking.technicianName}</span>
              </div>
              <div>
                <span className="text-sage-500 block mb-0.5">Current ETA</span>
                <span className="font-semibold text-emerald-400">{selectedBooking.eta || '15 mins'}</span>
              </div>
              <div>
                <span className="text-sage-500 block mb-0.5">Job Status</span>
                <span className="font-semibold text-sage-800">{selectedBooking.status}</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2.5 rounded-xl bg-sage-100 hover:bg-sage-200 text-sage-800 text-xs font-semibold transition"
              >
                Close Preview
              </button>
              <button
                onClick={() => {
                  const bId = selectedBooking.id;
                  setSelectedBooking(null);
                  navigate(`/admin/bookings/${bId}`);
                }}
                className="px-5 py-2.5 rounded-xl bg-sage-600 hover:bg-sage-500 text-sage-900 text-xs font-bold shadow-md transition flex items-center space-x-1.5"
              >
                <span>View Full Ticket Page</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
