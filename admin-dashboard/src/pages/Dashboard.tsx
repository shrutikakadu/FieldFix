import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench,
  Users,
  MapPin,
  Activity,
  RefreshCw,
  Search,
  Plus,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Navigation,
  ShieldCheck,
  Zap,
  X,
  ChevronRight,
  Layers,
  LogOut
} from 'lucide-react';
import { fetchDashboardStats, fetchBookings, fetchHealthStatus } from '../services/api';
import { socket } from '../services/socket';
import { logoutAdmin, getStoredUser } from '../services/auth';

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
  const adminUser = getStoredUser();
  const [isConnected, setIsConnected] = useState<boolean>(socket.connected);
  const [stats, setStats] = useState<Stats>({ activeJobs: 24, availableTechs: 12, pendingRequests: 5, todayCompleted: 48 });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [liveLocations, setLiveLocations] = useState<LiveLocation[]>([
    { technicianId: 'Tech #501 (David M.)', lat: 37.7749, lng: -122.4194, bookingId: 'BK-101', timestamp: 'Just now' },
    { technicianId: 'Tech #504 (Elena R.)', lat: 37.7833, lng: -122.4167, bookingId: 'BK-102', timestamp: '2m ago' }
  ]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Connected');
  const [isSimulatingGps, setIsSimulatingGps] = useState<boolean>(false);

  // Load API Data
  const loadData = async () => {
    try {
      const health = await fetchHealthStatus();
      setLastSyncTime(new Date(health.timestamp).toLocaleTimeString());
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

    function onConnect() {
      setIsConnected(true);
      socket.emit('booking:join', 'bk_101');
    }

    function onDisconnect() {
      setIsConnected(false);
    }

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

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('location:live', onLiveLocation);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('location:live', onLiveLocation);
    };
  }, []);

  // Simulate Socket.IO ping directly from dashboard
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

  // Filter bookings list
  const filteredBookings = bookings.filter((b) => {
    const matchesFilter = selectedFilter === 'ALL' || b.status === selectedFilter;
    const matchesSearch =
      b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* ================= TOP NAVIGATION BAR ================= */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/80 px-6 py-3.5 flex items-center justify-between shadow-2xl">
        {/* Brand */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3 bg-gradient-to-r from-sky-600 to-blue-700 text-white px-3.5 py-2 rounded-xl shadow-glow-sky">
            <Wrench className="w-5 h-5 animate-pulse" />
            <span className="font-display font-extrabold text-lg tracking-wider">FieldFix</span>
          </div>
          <div className="hidden md:flex items-center space-x-2 text-xs font-semibold text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Command Center v2.4</span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="hidden lg:flex items-center w-96 bg-slate-950/80 border border-slate-800 focus-within:border-sky-500/80 focus-within:ring-2 focus-within:ring-sky-500/20 rounded-xl px-3.5 py-2 transition-all">
          <Search className="w-4 h-4 text-slate-400 mr-2.5" />
          <input
            type="text"
            placeholder="Search booking ID, customer, technician..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none w-full"
          />
          <kbd className="hidden sm:inline-block text-[10px] font-mono text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
            ⌘K
          </kbd>
        </div>

        {/* Status Indicators & User Profile */}
        <div className="flex items-center space-x-3">
          {/* Quick Nav Links */}
          <div className="hidden xl:flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="px-3 py-1.5 bg-sky-600 text-white font-bold rounded-lg shadow-sm"
            >
              Dispatch Board
            </button>
            <button
              onClick={() => navigate('/admin/technicians')}
              className="px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition font-medium"
            >
              Technicians
            </button>
            <button
              onClick={() => navigate('/admin/analytics')}
              className="px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition font-medium"
            >
              Analytics
            </button>
          </div>

          {/* Socket.IO Connection Pill */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
            <span className={`relative flex h-2.5 w-2.5`}>
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isConnected ? 'bg-emerald-400 opacity-75' : 'bg-rose-400 opacity-75'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            </span>
            <span className="font-medium text-slate-300">
              {isConnected ? `Gateway Active (${lastSyncTime})` : 'Offline'}
            </span>
          </div>

          <button
            onClick={loadData}
            title="Refresh Server Data"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-white transition"
          >
            <RefreshCw className="w-4 h-4 text-sky-400" />
          </button>

          {/* User Avatar & Logout */}
          <div className="flex items-center space-x-3 border-l border-slate-800 pl-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {adminUser?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'AD'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-200 leading-tight">{adminUser?.name || 'Alex Danvers'}</p>
              <p className="text-[10px] text-sky-400 font-medium">{adminUser?.role || 'Head Dispatcher'}</p>
            </div>
            <button
              onClick={() => { logoutAdmin(); navigate('/login', { replace: true }); }}
              title="Sign Out"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 border border-slate-700/60 text-slate-400 hover:text-rose-400 transition"
              id="logout-button"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Sub-Header Mobile/Tablet Nav Bar */}
      <div className="xl:hidden bg-slate-900 border-b border-slate-800 px-6 py-2.5 flex items-center space-x-2 overflow-x-auto text-xs">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="px-3 py-1.5 bg-sky-600 text-white font-bold rounded-lg shadow-sm whitespace-nowrap"
        >
          Dispatch Board
        </button>
        <button
          onClick={() => navigate('/admin/technicians')}
          className="px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition font-medium whitespace-nowrap"
        >
          Technicians
        </button>
        <button
          onClick={() => navigate('/admin/analytics')}
          className="px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition font-medium whitespace-nowrap"
        >
          Analytics & Charts
        </button>
      </div>

      {/* ================= MAIN DASHBOARD BODY ================= */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8">
        {/* HERO TITLE & DISPATCH SUMMARY BANNER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950/40 p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div>
            <div className="flex items-center space-x-2 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Zap className="w-3.5 h-3.5" />
              <span>Real-Time Service Telemetry</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-extrabold text-white tracking-tight">
              Field Operations Control
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Monitoring active field technicians, live GPS tracking, and automated dispatch operations.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={simulateLiveGpsPing}
              disabled={isSimulatingGps}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs shadow-lg transition active:scale-95"
            >
              <Radio className={`w-4 h-4 text-emerald-400 ${isSimulatingGps ? 'animate-spin' : ''}`} />
              <span>{isSimulatingGps ? 'Sending Ping...' : 'Simulate GPS Ping'}</span>
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold text-xs shadow-glow-sky transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Dispatch Technician</span>
            </button>
          </div>
        </div>

        {/* ================= METRICS & KPIS GRID ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Active Jobs */}
          <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800 hover:border-slate-700 transition shadow-lg relative group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Active Jobs</p>
                <h3 className="text-3xl font-display font-extrabold text-white mt-1">{stats.activeJobs}</h3>
              </div>
              <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400 group-hover:scale-110 transition">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-emerald-400 font-semibold flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +14% vs yesterday
              </span>
              <span className="text-slate-500">2 In Transit</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-sky-400 h-full rounded-full w-[68%]"></div>
            </div>
          </div>

          {/* On-Duty Technicians */}
          <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800 hover:border-slate-700 transition shadow-lg relative group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Available Techs</p>
                <h3 className="text-3xl font-display font-extrabold text-emerald-400 mt-1">{stats.availableTechs}</h3>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">12 Online</span>
              <span className="text-emerald-400 font-semibold flex items-center">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block mr-1"></span> 100% Ready
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-emerald-400 h-full rounded-full w-[85%]"></div>
            </div>
          </div>

          {/* Pending Requests */}
          <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800 hover:border-slate-700 transition shadow-lg relative group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Pending Requests</p>
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
              <span className="text-slate-500">Avg response: 4m</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-amber-400 h-full rounded-full w-[42%]"></div>
            </div>
          </div>

          {/* Today Completed */}
          <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800 hover:border-slate-700 transition shadow-lg relative group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Completed Today</p>
                <h3 className="text-3xl font-display font-extrabold text-purple-400 mt-1">{stats.todayCompleted}</h3>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-purple-300 font-semibold">$4,850 Revenue</span>
              <span className="text-slate-500">98.5% SLA Pass</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-purple-400 h-full rounded-full w-[92%]"></div>
            </div>
          </div>
        </div>

        {/* ================= SPLIT SECTION: LIVE RADAR + DISPATCH QUEUE ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: LIVE DISPATCH RADAR MAP (7 COLS) */}
          <div className="lg:col-span-7 bg-slate-900/90 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between shadow-xl relative min-h-[460px]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-display font-bold text-white flex items-center">
                    <Navigation className="w-5 h-5 mr-2 text-sky-400" />
                    Technician Live Radar & GPS Map
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Real-time socket streams from technician mobile devices</p>
                </div>
                <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span className="text-slate-300 font-medium">3 Techs Live</span>
                </div>
              </div>

              {/* SIMULATED MAP UI CANVAS */}
              <div className="w-full h-64 bg-slate-950 rounded-xl border border-slate-800/80 relative overflow-hidden flex items-center justify-center group shadow-inner">
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
                  <div className="px-2 py-1 rounded bg-slate-900/90 border border-sky-500/80 text-[10px] text-sky-300 font-semibold shadow-lg mb-1 whitespace-nowrap">
                    David M. (En Route)
                  </div>
                  <div className="w-8 h-8 rounded-full bg-sky-500/20 border-2 border-sky-400 flex items-center justify-center text-sky-400 shadow-glow-sky animate-bounce">
                    <Navigation className="w-4 h-4 rotate-45" />
                  </div>
                </div>

                {/* Marker 2: Elena Rostova */}
                <div className="absolute top-2/3 right-1/3 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer">
                  <div className="px-2 py-1 rounded bg-slate-900/90 border border-emerald-500/80 text-[10px] text-emerald-300 font-semibold shadow-lg mb-1 whitespace-nowrap">
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

                <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-400 font-mono">
                  Coordinates: 37.7749° N, 122.4194° W
                </div>
              </div>
            </div>

            {/* LIVE WEBSOCKET TELEMETRY LOG STREAM */}
            <div className="mt-4 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                  <Activity className="w-3.5 h-3.5 mr-1.5 text-emerald-400 animate-pulse" />
                  Live Socket.IO Stream Log
                </span>
                <span className="text-[10px] text-slate-500">Auto-updating</span>
              </div>
              <div className="space-y-2">
                {liveLocations.map((loc, idx) => (
                  <div key={idx} className="px-3 py-2 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span className="font-semibold text-slate-200">{loc.technicianId}</span>
                      <span className="text-slate-500">• {loc.bookingId}</span>
                    </div>
                    <div className="flex items-center space-x-3 font-mono text-slate-400 text-[11px]">
                      <span>[{loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}]</span>
                      <span className="text-slate-500 text-[10px]">{loc.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: JOB DISPATCH QUEUE TABLE (5 COLS) */}
          <div className="lg:col-span-5 bg-slate-900/90 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-display font-bold text-white flex items-center">
                  <Layers className="w-5 h-5 mr-2 text-sky-400" />
                  Dispatch Job Queue
                </h2>
                <span className="px-2.5 py-1 bg-slate-800 text-sky-400 rounded-full text-xs font-semibold">
                  {filteredBookings.length} Active
                </span>
              </div>

              {/* FILTER TABS */}
              <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800/80 mb-4 overflow-x-auto">
                {['ALL', 'IN_PROGRESS', 'DISPATCHED', 'PENDING'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setSelectedFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                      selectedFilter === f
                        ? 'bg-sky-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
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
                    className="p-4 bg-slate-950/60 hover:bg-slate-800/60 rounded-xl border border-slate-800 hover:border-sky-500/50 transition cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-mono text-xs font-bold text-sky-400">{b.id}</span>
                          {b.priority === 'URGENT' && (
                            <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-[10px] font-bold uppercase">
                              Urgent
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold text-slate-200 text-sm group-hover:text-white transition">{b.service}</h4>
                        <p className="text-xs text-slate-400 mt-1 flex items-center">
                          <Users className="w-3.5 h-3.5 mr-1 text-slate-500" /> {b.customerName}
                        </p>
                      </div>

                      {/* Status Chip */}
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                          b.status === 'IN_PROGRESS'
                            ? 'bg-sky-950 text-sky-400 border-sky-800'
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

                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center">
                        <Wrench className="w-3.5 h-3.5 mr-1 text-slate-500" />
                        Tech: <strong className="text-slate-300 ml-1 font-medium">{b.technicianName}</strong>
                      </span>
                      <span className="text-sky-400 font-medium flex items-center group-hover:translate-x-0.5 transition">
                        Details <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ================= DISPATCH TECHNICIAN MODAL ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5">
              <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400">
                <Navigation className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-display font-bold text-white">Dispatch New Technician</h3>
                <p className="text-xs text-slate-400">Assign on-duty technician to pending service booking</p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsModalOpen(false);
                setStats((prev) => ({ ...prev, activeJobs: prev.activeJobs + 1, pendingRequests: Math.max(0, prev.pendingRequests - 1) }));
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Service Category</label>
                <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500">
                  <option>HVAC Air Conditioning & Heating</option>
                  <option>Electrical Wiring & Inspection</option>
                  <option>Plumbing & Main Line Service</option>
                  <option>Smart Home Security Installation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Customer Address</label>
                <input
                  type="text"
                  placeholder="e.g. 742 Evergreen Terrace, Sector 4"
                  defaultValue="105 Market St, Suite 400"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Assign On-Duty Technician</label>
                <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500">
                  <option>David Miller (HVAC Specialist) - 1.2 km away</option>
                  <option>Elena Rostova (Electrical Master) - 3.4 km away</option>
                  <option>Marcus Vance (Hydraulics Expert) - Available</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold shadow-glow-sky transition"
                >
                  Confirm & Dispatch Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= JOB DETAILS PREVIEW MODAL ================= */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedBooking(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-sky-400 text-xs font-bold font-mono mb-1">
              <span>{selectedBooking.id}</span>
              <span>•</span>
              <span className="text-slate-400">{selectedBooking.priority} PRIORITY</span>
            </div>

            <h3 className="text-xl font-display font-bold text-white mb-2">{selectedBooking.service}</h3>
            <p className="text-xs text-slate-400 mb-6 flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1 text-slate-500" /> {selectedBooking.address || 'San Francisco, CA'}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block mb-0.5">Customer Name</span>
                <span className="font-semibold text-slate-200">{selectedBooking.customerName}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Assigned Technician</span>
                <span className="font-semibold text-sky-400">{selectedBooking.technicianName}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Current ETA</span>
                <span className="font-semibold text-emerald-400">{selectedBooking.eta || '15 mins'}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Job Status</span>
                <span className="font-semibold text-slate-200">{selectedBooking.status}</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                Close Preview
              </button>
              <button
                onClick={() => {
                  const bId = selectedBooking.id;
                  setSelectedBooking(null);
                  navigate(`/admin/bookings/${bId}`);
                }}
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-glow-sky transition flex items-center space-x-1.5"
              >
                <span>View Full Ticket Page</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-slate-800/80 bg-slate-950 px-6 py-4 mt-auto text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
        <p>© 2026 FieldFix Inc. — Real-Time Service Management Architecture.</p>
        <div className="flex items-center space-x-4">
          <span className="hover:text-slate-300 transition cursor-pointer">API Docs</span>
          <span className="hover:text-slate-300 transition cursor-pointer">Socket Telemetry</span>
          <span className="hover:text-slate-300 transition cursor-pointer">System Logs</span>
        </div>
      </footer>
    </div>
  );
}
