import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench,
  Users,
  MapPin,
  Activity,
  Clock,
  CheckCircle2,
  Radio,
  Navigation,
  Zap,
  X,
  ChevronRight,
  Layers
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
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
  status: 'PENDING' | 'ACCEPTED' | 'DISPATCHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
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
  const [stats, setStats] = useState<Stats>({ activeJobs: 0, availableTechs: 0, pendingRequests: 0, todayCompleted: 0 });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [searchQuery] = useState<string>('');
  const [liveLocations, setLiveLocations] = useState<LiveLocation[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Load API Data
  const loadData = async () => {
    try {
      await fetchHealthStatus();
      const statsData = await fetchDashboardStats();
      setStats(statsData);
      const bookingsData = await fetchBookings();
      setBookings(bookingsData);
      bookingsData.filter((booking: Booking) => ['ACCEPTED', 'DISPATCHED', 'IN_PROGRESS'].includes(booking.status))
        .forEach((booking: Booking) => socket.emit('booking:join', booking.id));
    } catch {
      setStats({ activeJobs: 0, availableTechs: 0, pendingRequests: 0, todayCompleted: 0 });
      setBookings([]);
    }
  };

  useEffect(() => {
    loadData();
    const refreshInterval = window.setInterval(loadData, 5000);

    function onLiveLocation(data: any) {
      if (!data.technicianId || !data.bookingId || typeof data.lat !== 'number' || typeof data.lng !== 'number') return;
      const newLoc: LiveLocation = {
        technicianId: String(data.technicianId),
        lat: data.lat,
        lng: data.lng,
        bookingId: data.bookingId,
        timestamp: new Date().toLocaleTimeString()
      };
      setLiveLocations((prev) => [newLoc, ...prev.slice(0, 4)]);
    }

    socket.on('location:live', onLiveLocation);
    return () => {
      window.clearInterval(refreshInterval);
      socket.off('location:live', onLiveLocation);
    };
  }, []);

  const filteredBookings = bookings.filter((b) => {
    const matchesFilter = selectedFilter === 'ALL' || b.status === selectedFilter;
    const matchesSearch =
      b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <AdminLayout activeTab="dashboard">
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
            <p className="mt-4 text-xs text-sage-500">Current active requests</p>
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
            <p className="mt-4 text-xs text-sage-500">Technicians available for requests</p>
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
            <p className="mt-4 text-xs text-sage-500">Waiting for technician acceptance</p>
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
            <p className="mt-4 text-xs text-sage-500">Completed since midnight</p>
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
                  <span className="text-sage-700 font-medium">{liveLocations.length} live</span>
                </div>
              </div>

                {/* Live telemetry canvas */}
              <div className="w-full h-64 bg-sage-50 rounded-xl border border-sage-200/80 relative overflow-hidden flex items-center justify-center group shadow-inner">
                {/* Background Radar Grid Pattern */}
                <div
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                  }}
                ></div>

                <div className="relative z-10 px-4 text-center text-xs text-sage-600">
                  {liveLocations.length ? `${liveLocations.length} technician location update${liveLocations.length === 1 ? '' : 's'} received` : 'Waiting for a technician to share a live location.'}
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
                {filteredBookings.length === 0 && (
                  <div className="rounded-xl border border-dashed border-sage-200 px-5 py-10 text-center text-xs text-sage-500">
                    No booking requests match this filter.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

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
              <span className="text-sage-600">{selectedBooking.status.replace('_', ' ')}</span>
            </div>

            <h3 className="text-xl font-display font-bold text-sage-900 mb-2">{selectedBooking.service}</h3>
            <p className="text-xs text-sage-600 mb-6 flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1 text-sage-500" /> {selectedBooking.address || '—'}
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
                              <span className="font-semibold text-emerald-400">{selectedBooking.eta || '—'}</span>
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
