import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench, MapPin, Clock, Star, Plus, ChevronRight, CheckCircle2,
  Calendar, Search, LogOut, User, ArrowUpRight, Phone, MessageCircle, Bell
} from 'lucide-react';
import { logoutAdmin, getStoredUser } from '../services/auth';

interface ServiceCategory {
  icon: string;
  title: string;
  desc: string;
  price: string;
}

interface BookingItem {
  id: string;
  service: string;
  status: 'PENDING' | 'ACCEPTED' | 'DISPATCHED' | 'IN_PROGRESS' | 'COMPLETED';
  technicianName: string;
  date: string;
  amount: string;
  address: string;
}

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [activeTab, setActiveTab] = useState<'services' | 'bookings' | 'profile'>('services');
  const [searchQuery, setSearchQuery] = useState('');

  // Check auth
  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  const services: ServiceCategory[] = [
    { icon: '❄️', title: 'HVAC & Air Conditioning', desc: 'AC repair, installation & servicing', price: '₹1,500' },
    { icon: '⚡', title: 'Electrical Wiring', desc: 'Wiring, inspection & panel setup', price: '₹1,200' },
    { icon: '🔧', title: 'Plumbing Services', desc: 'Leak repair, pipe fitting & drainage', price: '₹1,000' },
    { icon: '🏠', title: 'Smart Home Setup', desc: 'Smart devices & home automation', price: '₹2,000' },
    { icon: '🔩', title: 'Appliance Repair', desc: 'Kitchen & laundry appliance servicing', price: '₹800' },
  ];

  const myBookings: BookingItem[] = [
    { id: 'BK-9101', service: 'AC Repair & Gas Refill', status: 'IN_PROGRESS', technicianName: 'David Miller', date: 'Today, 3:00 PM', amount: '₹1,800', address: '742 Evergreen Terrace' },
    { id: 'BK-9098', service: 'Electrical Panel Inspection', status: 'COMPLETED', technicianName: 'Elena Rostova', date: 'Sep 26, 11:00 AM', amount: '₹1,500', address: '105 Market St' },
    { id: 'BK-9095', service: 'Kitchen Sink Repair', status: 'COMPLETED', technicianName: 'Marcus Vance', date: 'Sep 24, 2:00 PM', amount: '₹950', address: '890 Bayview Blvd' },
  ];

  const filteredServices = services.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
    ACCEPTED: 'bg-blue-100 text-blue-700 border-blue-200',
    DISPATCHED: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    IN_PROGRESS: 'bg-sage-100 text-sage-700 border-sage-200',
    COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };

  return (
    <div className="min-h-screen bg-sage-50 font-sans">
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-sage-200 px-6 py-3.5 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-sage-500 text-white px-3 py-2 rounded-xl shadow-md">
              <Wrench className="w-4 h-4" />
              <span className="font-display font-extrabold text-sm tracking-wider">FieldFix</span>
            </div>
            <span className="hidden md:inline text-xs font-semibold text-sage-400 bg-sage-100 px-2.5 py-1 rounded-lg">Customer Dashboard</span>
          </div>

          <div className="flex items-center space-x-3">
            <button className="p-2 rounded-xl bg-sage-100 hover:bg-sage-200 text-sage-500 transition relative" title="Notifications">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">2</span>
            </button>

            <div className="flex items-center space-x-2 border-l border-sage-200 pl-3">
              <div className="w-8 h-8 rounded-xl bg-sage-500 flex items-center justify-center text-white font-bold text-xs">
                {user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-sage-800 leading-tight">{user?.name || 'Customer'}</p>
                <p className="text-[10px] text-sage-500">Customer</p>
              </div>
              <button
                onClick={() => { logoutAdmin(); navigate('/login', { replace: true }); }}
                title="Sign Out"
                className="p-1.5 rounded-lg hover:bg-red-50 text-sage-400 hover:text-red-500 transition"
                id="customer-logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-display font-extrabold text-sage-900">
            Hello, {user?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-sage-500 text-sm mt-1">What service do you need today?</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 bg-sage-100 p-1.5 rounded-xl mb-8 w-fit">
          {[
            { key: 'services' as const, label: 'Book Service', icon: <Plus className="w-4 h-4" /> },
            { key: 'bookings' as const, label: 'My Bookings', icon: <Calendar className="w-4 h-4" /> },
            { key: 'profile' as const, label: 'My Profile', icon: <User className="w-4 h-4" /> },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-sage-500 text-white shadow-md'
                  : 'text-sage-600 hover:bg-sage-200/60'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ===== SERVICES TAB ===== */}
        {activeTab === 'services' && (
          <div>
            {/* Search */}
            <div className="relative mb-6 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-400" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-sage-200 focus:border-sage-500 focus:ring-2 focus:ring-sage-200 rounded-xl pl-11 pr-4 py-3 text-sm text-sage-900 placeholder-sage-400 focus:outline-none transition-all"
              />
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredServices.map((service, idx) => (
                <div
                  key={idx}
                  className="group p-6 bg-white hover:bg-sage-50 rounded-2xl border border-sage-100 hover:border-sage-300 shadow-sm hover:shadow-lg transition-all cursor-pointer"
                >
                  <div className="text-3xl mb-3">{service.icon}</div>
                  <h3 className="text-base font-bold text-sage-800 mb-1">{service.title}</h3>
                  <p className="text-xs text-sage-500 mb-4">{service.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sage-600 font-bold text-sm">From {service.price}</span>
                    <button className="flex items-center space-x-1 text-xs font-semibold text-sage-500 group-hover:text-sage-600 transition">
                      <span>Book Now</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== BOOKINGS TAB ===== */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-sage-800 mb-4">Your Bookings</h2>
            {myBookings.map((booking) => (
              <div key={booking.id} className="p-5 bg-white rounded-2xl border border-sage-100 hover:border-sage-300 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-mono text-xs font-bold text-sage-500">{booking.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusColors[booking.status] || statusColors.PENDING}`}>
                        {booking.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h4 className="font-semibold text-sage-800">{booking.service}</h4>
                  </div>
                  <span className="text-sage-600 font-bold">{booking.amount}</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs text-sage-500 mb-3">
                  <div className="flex items-center space-x-1.5">
                    <Wrench className="w-3.5 h-3.5 text-sage-400" />
                    <span>{booking.technicianName}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-sage-400" />
                    <span>{booking.date}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-sage-400" />
                    <span>{booking.address}</span>
                  </div>
                </div>

                {booking.status === 'IN_PROGRESS' && (
                  <div className="flex items-center space-x-2 pt-3 border-t border-sage-100">
                    <button className="flex items-center space-x-1.5 px-3 py-2 bg-sage-100 hover:bg-sage-200 text-sage-600 text-xs font-semibold rounded-lg transition">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Track Technician</span>
                    </button>
                    <button className="flex items-center space-x-1.5 px-3 py-2 bg-sage-100 hover:bg-sage-200 text-sage-600 text-xs font-semibold rounded-lg transition">
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </button>
                    <button className="flex items-center space-x-1.5 px-3 py-2 bg-sage-100 hover:bg-sage-200 text-sage-600 text-xs font-semibold rounded-lg transition">
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Chat</span>
                    </button>
                  </div>
                )}

                {booking.status === 'COMPLETED' && (
                  <div className="flex items-center space-x-2 pt-3 border-t border-sage-100">
                    <button className="flex items-center space-x-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-600 text-xs font-semibold rounded-lg transition">
                      <Star className="w-3.5 h-3.5" />
                      <span>Rate & Review</span>
                    </button>
                    <button className="flex items-center space-x-1.5 px-3 py-2 bg-sage-100 hover:bg-sage-200 text-sage-600 text-xs font-semibold rounded-lg transition">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Book Again</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ===== PROFILE TAB ===== */}
        {activeTab === 'profile' && (
          <div className="max-w-lg">
            <div className="bg-white rounded-2xl border border-sage-100 p-8 shadow-sm">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-sage-500 flex items-center justify-center text-white font-bold text-xl">
                  {user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-sage-900">{user?.name || 'Customer'}</h3>
                  <p className="text-sm text-sage-500">{user?.email}</p>
                </div>
              </div>

              <div className="space-y-4 bg-sage-50 rounded-xl p-5 border border-sage-100">
                <div className="flex justify-between text-sm">
                  <span className="text-sage-500">Role</span>
                  <span className="font-semibold text-sage-700 bg-sage-200 px-2 py-0.5 rounded">{user?.role}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-sage-500">Email</span>
                  <span className="font-medium text-sage-700">{user?.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-sage-500">Member Since</span>
                  <span className="font-medium text-sage-700">September 2026</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-sage-500">Total Bookings</span>
                  <span className="font-semibold text-sage-700">3</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
