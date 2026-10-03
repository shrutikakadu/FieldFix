import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  CreditCard,
  Wrench,
  Navigation
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { fetchBookings } from '../services/api';

interface BookingDetail {
  id: string;
  service: string;
  category: string;
  status: 'PENDING' | 'ACCEPTED' | 'DISPATCHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
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
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchBookings().then((bookings: any[]) => {
      if (cancelled) return;
      const result = bookings.find(item => item.id === id);
      if (!result) {
        setError('Booking not found.');
        return;
      }
      setBooking({
        id: result.id,
        service: result.service,
        category: result.service,
        status: result.status,
        scheduledAt: new Date(result.scheduledAt).toLocaleString(),
        createdAt: new Date(result.createdAt).toLocaleString(),
        totalAmount: result.amount,
        paymentStatus: 'PENDING',
        paymentMethod: 'Not recorded',
        transactionId: '—',
        customer: {
          name: result.customerName,
          phone: result.customerPhone,
          email: result.customerEmail,
          address: result.address,
        },
        technician: result.technicianId ? {
          name: result.technicianName,
          phone: result.technicianPhone,
          email: result.technicianEmail,
          rating: result.technicianRating,
          eta: result.status,
        } : undefined,
        description: result.description || 'No problem description provided.',
      });
    }).catch(() => { if (!cancelled) setError('Could not load booking details.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (loading || !booking) {
    return <AdminLayout activeTab="dashboard"><div className="rounded-2xl border border-sage-200 bg-white p-10 text-center text-sm text-sage-600">{loading ? 'Loading booking…' : error || 'Booking not found.'}</div></AdminLayout>;
  }

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
                <span className="px-3 py-1 bg-sage-100 border border-sage-200 text-sage-700 text-xs font-bold rounded-lg">
                  {booking.status.replace('_', ' ')}
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

            {/* Payment & Invoice Breakdown */}
            <div className="bg-white border border-sage-200 rounded-xl p-5">
              <h3 className="text-sm font-bold text-sage-900 uppercase tracking-wider mb-4 flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-sage-700" />
                <span>Payment & Invoice</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <p className="text-sage-600">Service Estimate</p>
                  <p className="text-lg font-bold text-sage-900 mt-1">₹{booking.totalAmount}</p>
                </div>
                <div>
                  <p className="text-sage-600">Payment Status</p>
                  <p className="text-sm font-bold text-sage-700 mt-1">{booking.paymentStatus}</p>
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
                    <span>Job Status: {booking.technician.eta}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-sage-600 mb-3">No technician assigned yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
