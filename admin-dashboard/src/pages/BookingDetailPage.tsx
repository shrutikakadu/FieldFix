import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  CreditCard,
  Wrench,
  Navigation,
  Activity
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';

interface BookingDetail {
  id: string;
  service: string;
  category: string;
  status: 'PENDING' | 'ACCEPTED' | 'DISPATCHED' | 'IN_PROGRESS' | 'COMPLETED';
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'NORMAL';
  scheduledAt: string;
  createdAt: string;
  totalAmount: number;
  paymentStatus: 'PAID' | 'PENDING' | 'REFUNDED';
  paymentMethod: string;
  transactionId: string;
  customer: {
    name: string;
    phone: string;
    email: string;
    address: string;
  };
  technician?: {
    name: string;
    phone: string;
    email: string;
    rating: number;
    eta: string;
  };
  description: string;
  timeline: { title: string; time: string; done: boolean }[];
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<BookingDetail>({
    id: id || 'BK-9021',
    service: 'HVAC Air Conditioning Overhaul',
    category: 'HVAC & Cooling',
    status: 'IN_PROGRESS',
    priority: 'URGENT',
    scheduledAt: 'Today, 2:30 PM',
    createdAt: 'Oct 01, 2026, 11:15 AM',
    totalAmount: 1850,
    paymentStatus: 'PAID',
    paymentMethod: 'UPI / Razorpay',
    transactionId: 'TXN_984392019',
    customer: {
      name: 'Marcus Sterling',
      phone: '+91 98451 22334',
      email: 'marcus@fieldfix.io',
      address: '742 Evergreen Terrace, Sector 4, Koramangala, Bengaluru'
    },
    technician: {
      name: 'David Miller',
      phone: '+91 98765 43210',
      email: 'david@fieldfix.io',
      rating: 4.9,
      eta: 'Arrived at Site'
    },
    description: 'Compressor unit vibrating loudly and low cooling output across master bedroom & living room split AC units.',
    timeline: [
      { title: 'Booking Created & Payment Confirmed', time: '11:15 AM', done: true },
      { title: 'Technician Assigned (David Miller)', time: '11:20 AM', done: true },
      { title: 'Technician Dispatched & Live Tracking On', time: '11:35 AM', done: true },
      { title: 'On-Site Diagnostic & Work In Progress', time: '12:00 PM', done: true },
      { title: 'Work Completion & Customer Sign-Off', time: 'Pending', done: false }
    ]
  });

  const updateStatus = (newStatus: BookingDetail['status']) => {
    setBooking(prev => ({ ...prev, status: newStatus }));
  };

  return (
    <AdminLayout activeTab="dashboard">
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="bg-white border border-sage-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-sage-900 tracking-wide">Ticket Details: {booking.id}</h1>
              <span
                className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                  booking.status === 'COMPLETED'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : booking.status === 'IN_PROGRESS'
                    ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}
              >
                {booking.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-sage-600 mt-1">Created {booking.createdAt}</p>
          </div>

          {/* Quick status transitions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => updateStatus('DISPATCHED')}
              className="px-3 py-1.5 bg-sage-100 hover:bg-sage-200 text-xs font-semibold text-sage-700 rounded-xl transition"
            >
              Mark Dispatched
            </button>
            <button
              onClick={() => updateStatus('IN_PROGRESS')}
              className="px-3 py-1.5 bg-sage-600 hover:bg-sage-500 text-xs font-semibold text-sage-900 rounded-xl transition"
            >
              Mark In-Progress
            </button>
            <button
              onClick={() => updateStatus('COMPLETED')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-sage-900 rounded-xl transition shadow-glow-emerald"
            >
              Mark Completed
            </button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Overview, Timeline, Description */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Overview */}
            <div className="bg-white border border-sage-200 rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-sage-700">
                    {booking.category}
                  </span>
                  <h2 className="text-xl font-bold text-sage-900 mt-1">{booking.service}</h2>
                </div>
                <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold rounded-lg">
                  {booking.priority} PRIORITY
                </span>
              </div>

              <p className="text-sm text-sage-700 bg-sage-50 p-4 rounded-xl border border-sage-200/80">
                {booking.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-sage-700 pt-2">
                <div className="flex items-center space-x-2.5">
                  <Calendar className="w-4 h-4 text-sage-700" />
                  <span>Scheduled for: <strong>{booking.scheduledAt}</strong></span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <MapPin className="w-4 h-4 text-sage-700" />
                  <span className="truncate">{booking.customer.address}</span>
                </div>
              </div>
            </div>

            {/* Job State Transition Timeline */}
            <div className="bg-white border border-sage-200 rounded-xl p-5">
              <h3 className="text-sm font-bold text-sage-900 uppercase tracking-wider mb-4 flex items-center space-x-2">
                <Activity className="w-4 h-4 text-sage-700" />
                <span>Service Lifecycle Timeline</span>
              </h3>

              <div className="space-y-4 relative pl-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-sage-100">
                {booking.timeline.map((step, idx) => (
                  <div key={idx} className="relative flex items-start space-x-3">
                    <div
                      className={`w-3.5 h-3.5 rounded-full mt-1 border-2 ${
                        step.done
                          ? 'bg-sage-500 border-sky-400'
                          : 'bg-white border-slate-600'
                      }`}
                    />
                    <div className="flex-1 flex items-center justify-between">
                      <p className={`text-sm ${step.done ? 'text-sage-900 font-medium' : 'text-sage-500'}`}>
                        {step.title}
                      </p>
                      <span className="text-xs text-sage-600">{step.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment & Invoice Breakdown */}
            <div className="bg-white border border-sage-200 rounded-xl p-5">
              <h3 className="text-sm font-bold text-sage-900 uppercase tracking-wider mb-4 flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-sage-700" />
                <span>Payment & Invoice</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <p className="text-sage-600">Total Billed</p>
                  <p className="text-lg font-bold text-sage-900 mt-1">₹{booking.totalAmount}</p>
                </div>
                <div>
                  <p className="text-sage-600">Payment Status</p>
                  <p className="text-sm font-bold text-emerald-400 mt-1">{booking.paymentStatus}</p>
                </div>
                <div>
                  <p className="text-sage-600">Method</p>
                  <p className="text-sm font-medium text-sage-800 mt-1">{booking.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sage-600">Transaction ID</p>
                  <p className="text-xs font-mono text-sage-700 mt-1">{booking.transactionId}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Customer & Assigned Tech Cards */}
          <div className="space-y-6">
            {/* Customer Card */}
            <div className="bg-white border border-sage-200 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-sage-900 uppercase tracking-wider flex items-center space-x-2">
                <User className="w-4 h-4 text-sage-700" />
                <span>Customer Information</span>
              </h3>

              <div className="space-y-2 text-xs text-sage-700">
                <p className="text-base font-bold text-sage-900">{booking.customer.name}</p>
                <div className="flex items-center space-x-2">
                  <Phone className="w-3.5 h-3.5 text-sage-600" />
                  <span>{booking.customer.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-3.5 h-3.5 text-sage-600" />
                  <span>{booking.customer.email}</span>
                </div>
                <div className="flex items-start space-x-2 pt-1">
                  <MapPin className="w-3.5 h-3.5 text-sage-600 mt-0.5 flex-shrink-0" />
                  <span>{booking.customer.address}</span>
                </div>
              </div>
            </div>

            {/* Assigned Technician Card */}
            <div className="bg-white border border-sage-200 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-sage-900 uppercase tracking-wider flex items-center space-x-2">
                <Wrench className="w-4 h-4 text-sage-700" />
                <span>Assigned Technician</span>
              </h3>

              {booking.technician ? (
                <div className="space-y-3 text-xs text-sage-700">
                  <div className="flex items-center justify-between">
                    <p className="text-base font-bold text-sage-900">{booking.technician.name}</p>
                    <span className="text-amber-400 font-bold">★ {booking.technician.rating}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-sage-600" />
                    <span>{booking.technician.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-sage-600" />
                    <span>{booking.technician.email}</span>
                  </div>
                  <div className="p-2.5 bg-sage-500/10 border border-sky-500/30 rounded-lg text-sage-600 font-semibold flex items-center space-x-2">
                    <Navigation className="w-4 h-4" />
                    <span>Live Status: {booking.technician.eta}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-sage-600 mb-3">No technician assigned yet</p>
                  <button
                    onClick={() => navigate('/admin/technicians')}
                    className="px-4 py-2 bg-sage-600 hover:bg-sage-500 text-sage-900 text-xs font-bold rounded-lg transition"
                  >
                    Assign Technician
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
