import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench, Search, MapPin, Star, Clock, Phone, MessageCircle,
  CheckCircle2, X, Send, Bot, CreditCard, Shield, RefreshCw,
  Check, Download, BadgeCheck, Navigation, Home,
  LayoutDashboard, CalendarDays, FileText, Wallet, Settings,
  LogOut, Bell, ChevronDown, ArrowRight, Plus, Wind,
  Zap, Droplets, Bug, Paintbrush, Hammer, Thermometer, ChevronUp, Radio, LifeBuoy
} from 'lucide-react';
import { logoutAdmin, getStoredUser, getTechnicians } from '../services/auth';
import { apiClient, createPaymentOrder, failPayment, fetchMessages, sendMessage, verifyPayment } from '../services/api';
import { socket } from '../services/socket';

declare global { interface Window { Razorpay: any; } }

/* ── Icon map for categories ── */
const CAT_ICONS: Record<string, React.ElementType> = {
  'AC & Cooling': Wind, 'Electrical': Zap, 'Plumbing': Droplets,
  'Appliances': Wrench, 'Cleaning': Star, 'Carpentry': Hammer,
  'Painting': Paintbrush, 'Pest Control': Bug,
  'Smart Home': Home, 'Geyser & Water': Thermometer,
};

const CATEGORIES = Object.keys(CAT_ICONS);

const STATUS_STYLE: Record<string, string> = {
  'Scheduled': 'bg-blue-100 text-blue-700',
  'Confirmed': 'bg-emerald-100 text-emerald-700',
  'Accepted': 'bg-emerald-100 text-emerald-700',
  'Pending': 'bg-amber-100 text-amber-700',
  'Dispatched': 'bg-blue-100 text-blue-700',
  'Completed': 'bg-gray-100 text-gray-600',
  'In Progress': 'bg-orange-100 text-orange-700',
  'Cancelled': 'bg-red-100 text-red-700',
};

interface Booking {
  id: string; techId: string; techName: string; techPhone: string;
  service: string; date: string; time: string;
  status: 'Scheduled' | 'Confirmed' | 'Pending' | 'Completed' | 'In Progress' | 'Cancelled';
  amount: number; address: string; eta?: string; rating?: number; paymentStatus?: string; updatedAt?: string;
}

interface ChatMsg { id: string; sender: 'user' | 'tech' | 'admin' | 'bot'; text: string; time: string; }

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const user = getStoredUser();
  useEffect(() => { if (!user) navigate('/login', { replace: true }); }, []);

  /* ── State ── */
  const [section, setSection] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [city, setCity] = useState('Bangalore');
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loadingTechs, setLoadingTechs] = useState(false);
  const [techError, setTechError] = useState('');

  /* ── Technician Profile Modal ── */
  const [profileTech, setProfileTech] = useState<any | null>(null);

  /* ── Booking form ── */
  const [bookingTech, setBookingTech] = useState<any | null>(null);
  const [bookingService, setBookingService] = useState('');
  const [bookingDate, setBookingDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toISOString().slice(0, 10);
  });
  const [bookingSlot, setBookingSlot] = useState('10:00 AM – 12:00 PM');
  const [bookingAddress, setBookingAddress] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [successBooking, setSuccessBooking] = useState<Booking | null>(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const notificationStorageKey = `fieldfix_notifications_seen_at:${user?.id || 'guest'}`;
  const [notificationsSeenAt, setNotificationsSeenAt] = useState(() => Number(localStorage.getItem(notificationStorageKey)) || 0);

  /* ── Bookings list ── (starts empty for new accounts) */
  const [bookings, setBookings] = useState<Booking[]>([]);
  const activeBooking = bookings.find(b => ['Pending', 'Accepted', 'Dispatched', 'In Progress'].includes(b.status));

  /* ── GPS tracking ── */
  const [technicianLocation, setTechnicianLocation] = useState<{ lat: number; lng: number; updatedAt: string } | null>(null);
  useEffect(() => {
    if (!activeBooking) {
      setTechnicianLocation(null);
      return;
    }
    socket.emit('booking:join', activeBooking.id);
    const onLocation = (location: { bookingId: string; lat: number; lng: number }) => {
      if (location.bookingId === activeBooking.id) {
        setTechnicianLocation({ lat: location.lat, lng: location.lng, updatedAt: new Date().toLocaleTimeString() });
      }
    };
    socket.on('location:live', onLocation);
    return () => { socket.off('location:live', onLocation); };
  }, [activeBooking?.id]);

  /* ── Chat (technician messages) ── */
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatError, setChatError] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMsgs]);

  /* ── AI Bot (floating) ── */
  const [botMsgs, setBotMsgs] = useState<ChatMsg[]>([
    { id: '1', sender: 'bot', text: '👋 Hi! I am the FieldFix AI. Search a service, ask about pricing, or describe your issue!', time: 'Now' },
  ]);
  const [botInput, setBotInput] = useState('');
  const [botTyping, setBotTyping] = useState(false);
  const [botOpen, setBotOpen] = useState(false);
  const botEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { botEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [botMsgs]);

  /* ── Review ── */
  const [reviewTarget, setReviewTarget] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  /* ── Invoice ── */
  const [invoiceTarget, setInvoiceTarget] = useState<Booking | null>(null);

  /* ── Fetch technicians from the API ── */
  const fetchTechs = async (skill = '', cityFilter = '', name = '') => {
    setLoadingTechs(true);
    setTechError('');
    try {
      const data = await getTechnicians({
        ...(skill ? { skill } : {}),
        ...(cityFilter ? { city: cityFilter } : {}),
        ...(name ? { name } : {}),
      });
      setTechnicians(Array.isArray(data) ? data : []);
    } catch (error: any) {
      setTechnicians([]);
      setTechError(error?.response?.data?.message || 'Could not load technicians. Check that the service is online.');
    } finally {
      setLoadingTechs(false);
    }
  };

  const loadBookings = async () => {
    try {
      const { data } = await apiClient.get('/bookings');
      setBookings(data.map((booking: any) => ({
        id: booking.id,
        techId: booking.technicianId || '',
        techName: booking.technicianName,
        techPhone: booking.technicianPhone,
        service: booking.service,
        date: new Date(booking.scheduledAt).toLocaleDateString(),
        time: new Date(booking.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: booking.status.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter: string) => letter.toUpperCase()),
        amount: booking.amount,
        address: booking.address,
        paymentStatus: booking.paymentStatus,
        updatedAt: booking.updatedAt,
        eta: undefined,
      })));
    } catch {
      setBookings([]);
    }
  };

  useEffect(() => {
    fetchTechs('', city === 'All Cities' ? '' : city);
    loadBookings();
    const interval = window.setInterval(loadBookings, 5000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const threadId = section === 'support' ? `support:${user?.id}` : activeBooking ? `booking:${activeBooking.id}` : '';
    if (!threadId || !['chat', 'support'].includes(section)) return;
    let cancelled = false;
    const loadMessages = async () => {
      try {
        const messages = await fetchMessages(threadId);
        if (!cancelled) setChatMsgs(messages.map((message: any) => ({
          id: message.id,
          sender: message.senderId === user?.id ? 'user' : message.sender?.role === 'ADMIN' ? 'admin' : 'tech',
          text: message.body,
          time: new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })));
      } catch {
        if (!cancelled) setChatMsgs([]);
      }
    };
    loadMessages();
    const poll = window.setInterval(loadMessages, 4000);
    return () => { cancelled = true; window.clearInterval(poll); };
  }, [section, activeBooking?.id, user?.id]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchTechs(selectedCategory, searchQuery ? '' : city === 'All Cities' ? '' : city, searchQuery);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [selectedCategory, city, searchQuery]);

  /* ── Filter technicians in view ── */
  const filteredTechs = technicians.filter(t => {
    const skills: string[] = typeof t.skills === 'string' ? JSON.parse(t.skills) : t.skills || [];
    const matchSkill = !selectedCategory || skills.some(s => s === selectedCategory);
    const matchSearch = !searchQuery || t.user.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.specialization?.toLowerCase().includes(searchQuery.toLowerCase()) || skills.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchCity = !city || t.city === city || city === 'All Cities' || Boolean(searchQuery);
    return matchSkill && matchSearch && matchCity;
  });

  /* ── Helpers ── */
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const getServicePrice = (skills: string[]) => {
    const base: Record<string, number> = { 'AC & Cooling': 599, 'Electrical': 449, 'Plumbing': 399, 'Appliances': 349, 'Cleaning': 499, 'Carpentry': 549, 'Painting': 1499, 'Pest Control': 899, 'Smart Home': 999, 'Geyser & Water': 449 };
    return base[skills[0]] || 499;
  };
  const completedValue = bookings.filter(b => b.status === 'Completed').reduce((a, b) => a + b.amount, 0);
  const chatPartnerName = section === 'support' ? 'FieldFix Support' : activeBooking?.techName || 'Technician';
  const notifications = bookings.slice(0, 5);
  const unreadNotifications = bookings.filter(booking => booking.updatedAt && new Date(booking.updatedAt).getTime() > notificationsSeenAt).length;
  const markNotificationsRead = () => {
    const seenAt = Date.now();
    localStorage.setItem(notificationStorageKey, String(seenAt));
    setNotificationsSeenAt(seenAt);
  };

  /* ── Request a technician ── */
  const requestTechnician = async () => {
    if (!bookingTech) return;
    if (!bookingAddress.trim()) {
      setBookingError('Enter the service address before sending this request.');
      return;
    }
    setIsBooking(true);
    setBookingError('');
    const skills: string[] = typeof bookingTech.skills === 'string' ? JSON.parse(bookingTech.skills) : bookingTech.skills || [];
    const service = bookingService || skills[0] || 'Home Service';
    const [time, period] = bookingSlot.split(' – ')[0].split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    const appointment = new Date(`${bookingDate}T00:00:00`);
    appointment.setHours((hours % 12) + (period === 'PM' ? 12 : 0), minutes);
    try {
      if (typeof window.Razorpay !== 'function') {
        throw new Error('Razorpay checkout did not load. Check your connection and try again.');
      }
      const order = await createPaymentOrder({
        technicianId: bookingTech.user.id,
        service,
        address: bookingAddress,
        scheduledAt: appointment.toISOString(),
        description: bookingNotes,
      });

      let checkoutHandled = false;
      const cancelUnpaidOrder = async (message: string) => {
        if (checkoutHandled) return;
        checkoutHandled = true;
        try { await failPayment(order.bookingId, order.orderId); } catch { /* The order expires unpaid if cancellation cannot be recorded. */ }
        setBookingError(message);
        setIsBooking(false);
      };

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'FieldFix',
        description: `${service} with ${bookingTech.user.name}`,
        order_id: order.orderId,
        prefill: { name: user?.name, email: user?.email, contact: user?.phone },
        theme: { color: '#2d5a27' },
        modal: { ondismiss: () => { void cancelUnpaidOrder('Payment cancelled. No booking request was sent to the technician.'); } },
        handler: async (response: any) => {
          if (checkoutHandled) return;
          checkoutHandled = true;
          try {
            const result = await verifyPayment({
              bookingId: order.bookingId,
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            const newBooking: Booking = {
              id: result.id,
              techId: result.technicianId,
              techName: result.technicianName,
              techPhone: result.technicianPhone,
              service: result.service,
              date: new Date(result.scheduledAt).toLocaleDateString(),
              time: new Date(result.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: 'Pending',
              amount: result.amount,
              address: result.address,
              paymentStatus: result.paymentStatus,
              updatedAt: new Date().toISOString(),
            };
            setBookings(previous => [newBooking, ...previous]);
            setSuccessBooking(newBooking);
            setBookingTech(null);
            setBookingNotes('');
            setSection('bookings');
          } catch (error: any) {
            setBookingError(error?.response?.data?.message || 'Payment was submitted but could not be confirmed. Refresh bookings before trying again.');
            await loadBookings();
          } finally {
            setIsBooking(false);
          }
        },
      });
      checkout.on('payment.failed', (event: any) => {
        void cancelUnpaidOrder(event?.error?.description || 'Payment failed. Please try again.');
      });
      checkout.open();
    } catch (error: any) {
      setBookingError(error?.response?.data?.message || error?.message || 'Could not start the payment.');
      setIsBooking(false);
    }
  };

  /* ── Send chat ── */
  const sendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = chatInput.trim();
    const threadId = section === 'support' ? `support:${user?.id}` : activeBooking ? `booking:${activeBooking.id}` : '';
    if (!body || !threadId || sendingChat) return;
    setSendingChat(true);
    setChatError('');
    try {
      const message = await sendMessage(threadId, body);
      setChatMsgs(previous => [...previous, {
        id: message.id,
        sender: 'user',
        text: message.body,
        time: new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
      setChatInput('');
    } catch (error: any) {
      setChatError(error?.response?.data?.message || 'Message could not be sent.');
    } finally {
      setSendingChat(false);
    }
  };

  /* ── Send bot ── */
  const sendBot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!botInput.trim()) return;
    const q = botInput.toLowerCase();
    setBotMsgs(p => [...p, { id: Date.now().toString(), sender: 'user', text: botInput, time: 'Now' }]);
    setBotInput(''); setBotTyping(true);
    setTimeout(() => {
      let r = 'All technicians are verified and carry a 30-day service warranty. Ask me anything!';
      if (q.includes('ac') || q.includes('cool')) r = 'AC service from ₹599. Includes coil clean, gas pressure test & compressor check. Book now!';
      else if (q.includes('price') || q.includes('cost')) r = 'AC ₹599 · Electrical ₹449 · Plumbing ₹399 · Appliances ₹349. No hidden charges!';
      else if (q.includes('leak') || q.includes('pipe')) r = 'Our plumbers use acoustic leak detection — no needless wall breaking. Emergency response in 30 min!';
      else if (q.includes('warrant')) r = '30-day service warranty on all repairs. Issue recurs? We send the tech back for free!';
      setBotMsgs(p => [...p, { id: Date.now() + 'b', sender: 'bot', text: r, time: 'Now' }]);
      setBotTyping(false);
    }, 1100);
  };

  /* ── Submit review ── */
  const submitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTarget) return;
    setBookings(prev => prev.map(b => b.id === reviewTarget.id ? { ...b, rating: reviewRating } : b));
    setReviewTarget(null); setReviewComment(''); setReviewRating(5);
  };

  /* ── NAV ── */
  const NAV = [
    { id: 'home',     icon: LayoutDashboard, label: 'Home' },
    { id: 'search',   icon: Search,          label: 'Find Technicians' },
    { id: 'bookings', icon: CalendarDays,    label: 'My Bookings' },
    { id: 'tracker',  icon: Navigation,      label: 'Live Tracking' },
    { id: 'chat',     icon: MessageCircle,   label: 'Chat' },
    { id: 'support',  icon: LifeBuoy,        label: 'Help & Support' },
    { id: 'invoices', icon: FileText,        label: 'Invoices' },
    { id: 'settings', icon: Settings,        label: 'Settings' },
  ];

  /* ═══════════════════════════════════════════════════════ */
  return (
    <div className="flex h-screen bg-[#f5f7f4] font-sans overflow-hidden">

      {/* ═══ SIDEBAR ═══ */}
      <aside className="w-56 flex-shrink-0 bg-[#2d5a27] flex flex-col shadow-xl">
        <div className="px-4 py-5 border-b border-[#3d6b3d] flex items-center space-x-2.5">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center"><Wrench className="w-4 h-4 text-white" /></div>
          <div><p className="text-white font-black text-sm">FieldFix</p><p className="text-white/50 text-[10px]">Customer Portal</p></div>
        </div>
        <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(item => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button key={item.id} onClick={() => setSection(item.id)}
                className={`w-full flex items-center px-4 py-2.5 text-xs font-semibold transition-all ${active ? 'bg-white/20 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="ml-3">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <button onClick={() => { logoutAdmin(); navigate('/login', { replace: true }); }}
          className="flex items-center px-4 py-3 text-white/50 hover:text-white hover:bg-white/10 text-xs font-semibold transition border-t border-[#3d6b3d]">
          <LogOut className="w-4 h-4" /><span className="ml-3">Log out</span>
        </button>
      </aside>

      {/* ═══ MAIN ═══ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-5 gap-3 flex-shrink-0 shadow-sm">
          <div className="flex-1 flex items-center bg-gray-100 rounded-xl px-3.5 py-2 max-w-lg">
            <Search className="w-4 h-4 text-gray-400" />
            <input placeholder="Search services or technician name…" value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); if (e.target.value) setSection('search'); }}
              className="ml-2.5 bg-transparent text-xs text-gray-700 placeholder-gray-400 focus:outline-none flex-1" />
          </div>
          <div className="flex items-center space-x-1.5 bg-gray-100 rounded-xl px-3 py-2">
            <MapPin className="w-3.5 h-3.5 text-[#3d6b3d]" />
            <select value={city} onChange={e => setCity(e.target.value)} className="bg-transparent text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer">
              {['Bangalore', 'Mumbai', 'Delhi NCR', 'Pune', 'All Cities'].map(c => <option key={c}>{c}</option>)}
            </select>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </div>
          <div className="relative">
            <button type="button" onClick={() => { setNotificationOpen(open => !open); markNotificationsRead(); }} aria-label="Notifications" aria-expanded={notificationOpen} className="relative p-2 rounded-xl hover:bg-gray-100 transition">
              <Bell style={{ width: 18, height: 18 }} className="text-gray-500" />
              {unreadNotifications > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{unreadNotifications > 9 ? '9+' : unreadNotifications}</span>}
            </button>
            {notificationOpen && <div role="dialog" aria-label="Notifications" className="absolute right-0 top-12 z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <p className="text-xs font-bold text-gray-800">Notifications</p>
                <button type="button" onClick={markNotificationsRead} className="text-[10px] font-semibold text-[#2d5a27] hover:underline">Mark all read</button>
              </div>
              {notifications.length ? <div className="max-h-80 overflow-y-auto">
                {notifications.map(booking => <button type="button" key={booking.id} onClick={() => { markNotificationsRead(); setNotificationOpen(false); setSection('bookings'); }} className="block w-full border-b border-gray-50 px-4 py-3 text-left hover:bg-[#f5f8f4]">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-bold text-gray-800">{booking.service}</span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLE[booking.status] || 'bg-gray-100 text-gray-600'}`}>{booking.status}</span>
                  </span>
                  <span className="mt-1 block text-[11px] text-gray-500">{booking.techName} · {booking.date}</span>
                  <span className="mt-1 block text-[10px] text-gray-400">{booking.paymentStatus === 'PAID' ? 'Payment received' : 'Booking update'} · {booking.id}</span>
                </button>)}
              </div> : <p className="px-4 py-8 text-center text-xs text-gray-400">No booking notifications yet.</p>}
            </div>}
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-[#2d5a27] flex items-center justify-center text-white text-xs font-black">{getInitials(user?.name || 'SC')}</div>
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-gray-800 leading-tight">{user?.name || 'Customer'}</p>
              <p className="text-[10px] text-gray-400">Customer</p>
            </div>
          </div>
        </header>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex gap-5 p-5">
            <div className="flex-1 min-w-0 space-y-5">

              {/* ══ HOME ══ */}
              {section === 'home' && (
                <>
                  {/* Hero */}
                  <div className="relative bg-[#2d5a27] rounded-2xl p-6 overflow-hidden">
                    <div className="relative z-10 max-w-sm">
                      <p className="text-white/70 text-sm">Good evening, {user?.name?.split(' ')[0] || 'there'}!</p>
                      <h1 className="text-white font-black text-2xl mt-1 leading-tight">Find & book a verified home expert in minutes</h1>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {['Verified IDs', 'Upfront prices', '30-day warranty'].map(t => <span key={t} className="px-3 py-1 bg-white/20 text-white text-xs font-semibold rounded-full">{t}</span>)}
                      </div>
                      <button onClick={() => setSection('search')} className="mt-4 flex items-center space-x-2 px-4 py-2.5 bg-white text-[#2d5a27] text-xs font-black rounded-xl shadow hover:shadow-md transition">
                        <Search className="w-4 h-4" /><span>Search Technicians</span>
                      </button>
                    </div>
                    <div className="absolute right-6 bottom-0 opacity-25 pointer-events-none">
                      <svg width="140" height="110" viewBox="0 0 140 110" fill="none">
                        <rect x="20" y="55" width="100" height="55" rx="4" fill="white"/>
                        <polygon points="70,5 10,55 130,55" fill="white"/>
                        <rect x="55" y="70" width="30" height="45" rx="2" fill="#2d5a27"/>
                        <rect x="25" y="63" width="20" height="18" rx="2" fill="#2d5a27"/>
                        <rect x="95" y="63" width="20" height="18" rx="2" fill="#2d5a27"/>
                      </svg>
                    </div>
                  </div>

                  {/* KPI strip */}
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Active bookings', value: bookings.filter(b => ['Scheduled','Confirmed','Pending','Accepted','Dispatched','In Progress'].includes(b.status)).length, icon: Radio, bg: '#dbeafe', ic: '#3b82f6' },
                      { label: 'Completed', value: bookings.filter(b => b.status === 'Completed').length, icon: CheckCircle2, bg: '#d1fae5', ic: '#10b981' },
                      { label: 'Completed service value', value: `₹${completedValue}`, icon: Wallet, bg: '#fef3c7', ic: '#f59e0b' },
                    ].map(kpi => {
                      const Icon = kpi.icon;
                      return (
                        <div key={kpi.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: kpi.bg }}>
                            <Icon className="w-5 h-5" style={{ color: kpi.ic }} />
                          </div>
                          <div><p className="text-[11px] text-gray-400 font-medium">{kpi.label}</p><p className="text-lg font-black text-gray-800">{kpi.value}</p></div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Service category grid */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm font-bold text-gray-800">Browse by Service</h2>
                      <button onClick={() => setSection('search')} className="text-[11px] font-bold text-[#3d6b3d] hover:underline">View all techs →</button>
                    </div>
                    <div className="grid grid-cols-5 gap-3">
                      {CATEGORIES.map(cat => {
                        const Icon = CAT_ICONS[cat] || Wrench;
                        return (
                          <button key={cat} onClick={() => { setSelectedCategory(cat); setSection('search'); fetchTechs(cat, city === 'All Cities' ? '' : city); }}
                            className="flex flex-col items-center space-y-1.5 p-3 rounded-xl hover:bg-[#f0f7ee] transition group text-center">
                            <div className="w-10 h-10 rounded-xl bg-[#f0f7ee] flex items-center justify-center group-hover:bg-[#c8dfc6] transition">
                              <Icon className="w-5 h-5 text-[#2d5a27]" />
                            </div>
                            <span className="text-[11px] font-semibold text-gray-600 group-hover:text-[#2d5a27] leading-tight">{cat}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active booking tracker mini card */}
                  {activeBooking && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                        <div>
                          <h2 className="text-sm font-bold text-gray-800">Live Technician Tracking</h2>
                          <span className="text-xs text-emerald-600 font-semibold flex items-center space-x-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
                            <span>{activeBooking.status === 'Pending' ? 'Request sent, waiting for acceptance' : activeBooking.techName + ' is on the way'}</span>
                          </span>
                        </div>
                        <button onClick={() => setSection('tracker')} className="text-[11px] font-bold text-[#3d6b3d] hover:underline flex items-center space-x-1">
                          <span>Full map</span><ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                      {/* mini map */}
                      <div className="mx-4 mb-3 h-28 bg-[#eef4ec] rounded-xl relative overflow-hidden border border-[#c8dfc6]">
                        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(#4d7f4d 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 112" preserveAspectRatio="none">
                          <path d="M 60 70 Q 150 30 200 56 Q 260 85 340 45" stroke="#2d5a27" strokeWidth="2.5" strokeDasharray="8 5" fill="none" opacity="0.6"/>
                        </svg>
                        <div className="absolute right-12 top-8 flex flex-col items-center">
                          <div className="w-7 h-7 rounded-full bg-[#2d5a27] border-2 border-white shadow-md flex items-center justify-center"><Home className="w-3.5 h-3.5 text-white" /></div>
                          <span className="text-[10px] font-bold text-[#2d5a27] mt-1 bg-white px-1.5 py-0.5 rounded-md shadow-sm">You</span>
                        </div>
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white px-3 py-2 text-center text-[10px] font-semibold text-gray-600 shadow">{technicianLocation ? `${technicianLocation.lat.toFixed(5)}, ${technicianLocation.lng.toFixed(5)}` : 'Waiting for live technician location'}</div>
                      </div>
                      <div className="px-4 pb-4 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-9 h-9 rounded-full bg-[#2d5a27] flex items-center justify-center text-white text-xs font-black">{getInitials(activeBooking.techName)}</div>
                          <div>
                            <p className="text-xs font-bold text-gray-800">{activeBooking.techName}</p>
                            <p className="text-[11px] text-gray-400">ETA {activeBooking.eta || '10 min'}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <a href={`tel:${activeBooking.techPhone}`} className="px-3 py-1.5 bg-[#2d5a27] text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 hover:bg-[#3d6b3d] transition"><Phone className="w-3.5 h-3.5" /><span>Call</span></a>
                          <button onClick={() => setSection('chat')} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl flex items-center space-x-1.5 hover:bg-gray-200 transition"><MessageCircle className="w-3.5 h-3.5" /><span>Chat</span></button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recent bookings */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                      <h2 className="text-sm font-bold text-gray-800">Recent Bookings</h2>
                      <button onClick={() => setSection('bookings')} className="text-[11px] font-bold text-[#3d6b3d] hover:underline">View All →</button>
                    </div>
                    {bookings.length === 0 ? (
                      <div className="px-5 py-10 text-center text-gray-400">
                        <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-bold text-gray-500">No bookings yet</p>
                        <p className="text-xs mt-1 mb-4">Your booking history will appear here</p>
                        <button onClick={() => setSection('search')} className="px-4 py-2 bg-[#2d5a27] hover:bg-[#3d6b3d] text-white text-xs font-bold rounded-xl transition">Book your first service</button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead><tr className="border-t border-gray-100">{['ID','Service','Technician','Date','Status','Actions'].map(h => <th key={h} className="px-5 py-2.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>)}</tr></thead>
                          <tbody className="divide-y divide-gray-50">
                            {bookings.slice(0, 3).map(b => (
                              <tr key={b.id} className="hover:bg-gray-50 transition">
                                <td className="px-5 py-3 text-xs font-mono font-bold text-[#3d6b3d]">{b.id}</td>
                                <td className="px-5 py-3 text-xs font-medium text-gray-700">{b.service}</td>
                                <td className="px-5 py-3 text-xs text-gray-600">{b.techName}</td>
                                <td className="px-5 py-3 text-xs text-gray-500">{b.date}</td>
                                <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${STATUS_STYLE[b.status]}`}>{b.status}</span></td>
                                <td className="px-5 py-3 flex items-center space-x-1.5">
                                  <button onClick={() => setInvoiceTarget(b)} className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-[11px] font-semibold rounded-lg transition">Invoice</button>
                                  {b.status === 'Completed' && !b.rating && <button onClick={() => setReviewTarget(b)} className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold rounded-lg hover:bg-amber-100 transition">Rate</button>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ══ SEARCH / FIND TECHNICIANS ══ */}
              {section === 'search' && (
                <div className="space-y-4">
                  {/* Search header */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                    <h2 className="text-sm font-bold text-gray-800 mb-1">Find a Verified Technician</h2>
                    <p className="text-xs text-gray-400 mb-4">All technicians carry government-verified IDs. Search by service or name.</p>

                    {/* Category filter */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <button onClick={() => { setSelectedCategory(''); fetchTechs('', city === 'All Cities' ? '' : city); }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition border ${!selectedCategory ? 'bg-[#2d5a27] text-white border-[#2d5a27]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>All</button>
                      {CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => { setSelectedCategory(cat); fetchTechs(cat, city === 'All Cities' ? '' : city); }}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition border ${selectedCategory === cat ? 'bg-[#2d5a27] text-white border-[#2d5a27]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>{cat}</button>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{loadingTechs ? 'Loading…' : `${filteredTechs.length} technician${filteredTechs.length !== 1 ? 's' : ''} found`}{selectedCategory ? ` for "${selectedCategory}"` : ''}</p>
                      <div className="flex items-center space-x-1 text-xs text-gray-400 font-medium">
                        <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Verified IDs only</span>
                      </div>
                    </div>
                  </div>

                  {/* Technician Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredTechs.map(tech => {
                      const skills: string[] = typeof tech.skills === 'string' ? JSON.parse(tech.skills) : tech.skills || [];
                      const price = getServicePrice(skills);
                      return (
                        <div key={tech.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:border-[#c8dfc6] hover:shadow-md transition group flex flex-col">
                          {/* Header */}
                          <div className="flex items-start space-x-3 mb-3">
                            <div className="relative flex-shrink-0">
                              <div className="w-14 h-14 rounded-2xl bg-[#2d5a27] flex items-center justify-center text-white font-black text-lg shadow-md">
                                {tech.photoUrl
                                  ? <img src={tech.photoUrl} alt={tech.user?.name} className="w-14 h-14 rounded-2xl object-cover" onError={e => { (e.target as any).style.display = 'none'; }} />
                                  : getInitials(tech.user?.name || 'T')}
                              </div>
                              {tech.isAvailable && (
                                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-1.5">
                                <h3 className="text-sm font-black text-gray-800 truncate">{tech.user?.name}</h3>
                                <BadgeCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                              </div>
                              <p className="text-[11px] font-semibold text-[#3d6b3d] mt-0.5 truncate">{tech.specialization}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-amber-500 font-bold text-xs">★ {Number(tech.rating).toFixed(1)}</span>
                                <span className="text-gray-300">·</span>
                                <span className="text-xs text-gray-400">{tech.totalJobs} jobs</span>
                                <span className="text-gray-300">·</span>
                                <span className="text-xs text-gray-400">{tech.experienceYears}yr exp</span>
                              </div>
                            </div>
                          </div>

                          {/* Skills */}
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {skills.map(s => {
                              const SI = CAT_ICONS[s] || Wrench;
                              return <span key={s} className="flex items-center space-x-1 px-2 py-0.5 bg-[#f0f7ee] text-[#2d5a27] text-[11px] font-semibold rounded-lg"><SI className="w-3 h-3" /><span>{s}</span></span>;
                            })}
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[11px] font-medium rounded-lg flex items-center space-x-1">
                              <MapPin className="w-3 h-3" /><span>{tech.city}</span>
                            </span>
                          </div>

                          {/* Bio */}
                          <p className="text-[11px] text-gray-500 leading-relaxed flex-1 mb-3 line-clamp-2">{tech.bio}</p>

                          {/* Verified ID badge */}
                          <div className="flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5 mb-3">
                            <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-[11px] font-bold text-emerald-700 font-mono">{tech.technicianVerifiedId}</span>
                          </div>

                          {/* Availability */}
                          <div className="flex items-center justify-between mb-4">
                            <span className={`flex items-center space-x-1.5 text-[11px] font-bold ${tech.isAvailable ? 'text-emerald-600' : 'text-gray-400'}`}>
                              <span className={`w-2 h-2 rounded-full ${tech.isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`}></span>
                              <span>{tech.isAvailable ? 'Available now' : 'Busy'}</span>
                            </span>
                            <span className="text-xs font-black text-[#2d5a27]">from ₹{price}</span>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <button onClick={() => setProfileTech(tech)}
                              className="flex-1 py-2 border border-gray-200 hover:border-[#2d5a27] text-gray-600 hover:text-[#2d5a27] text-xs font-bold rounded-xl transition">
                              View Profile
                            </button>
                            {tech.isAvailable && (
                              <button onClick={() => { setBookingTech(tech); setBookingService(skills[0] || ''); setProfileTech(null); }}
                                className="flex-1 py-2 bg-[#2d5a27] hover:bg-[#3d6b3d] text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5">
                                <Plus className="w-3.5 h-3.5" /><span>Book Now</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {filteredTechs.length === 0 && !loadingTechs && (
                      <div className="col-span-3 text-center py-16 text-gray-400">
                        <Wrench className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm font-bold">No technicians found</p>
                        <p className="text-xs mt-1">{techError || 'Try a different service, name, or city'}</p>
                        <button onClick={() => { setSelectedCategory(''); setSearchQuery(''); }} className="mt-3 px-4 py-2 bg-[#2d5a27] text-white text-xs font-bold rounded-xl">Clear filters</button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ══ MY BOOKINGS ══ */}
              {section === 'bookings' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <h2 className="text-sm font-bold text-gray-800">My Bookings</h2>
                    <button onClick={() => setSection('search')} className="px-4 py-1.5 bg-[#2d5a27] text-white text-xs font-bold rounded-xl hover:bg-[#3d6b3d] transition flex items-center space-x-1"><Plus className="w-3.5 h-3.5" /><span>Book a Service</span></button>
                  </div>
                  {bookings.map(b => (
                    <div key={b.id} className="border border-gray-100 rounded-2xl p-4 hover:border-[#c8dfc6] transition">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-mono text-xs font-bold text-[#3d6b3d]">{b.id}</span>
                          <h3 className="text-sm font-bold text-gray-800 mt-0.5">{b.service}</h3>
                          <p className="text-[11px] text-gray-500 mt-0.5">Technician: <strong>{b.techName}</strong></p>
                          <p className="text-[11px] text-gray-400 mt-0.5 flex items-center"><CalendarDays className="w-3 h-3 mr-1" />{b.date} · {b.time}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5 flex items-center"><MapPin className="w-3 h-3 mr-1" />{b.address}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${STATUS_STYLE[b.status]}`}>{b.status}</span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-800">₹{b.amount}</span>
                        <div className="flex space-x-2">
                          <button onClick={() => setInvoiceTarget(b)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold rounded-lg flex items-center space-x-1 transition"><FileText className="w-3 h-3" /><span>Invoice</span></button>
                          {b.status === 'Completed' && !b.rating && (
                            <button onClick={() => setReviewTarget(b)} className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold rounded-lg hover:bg-amber-100 flex items-center space-x-1 transition"><Star className="w-3 h-3" /><span>Rate</span></button>
                          )}
                          {b.rating && <span className="text-amber-500 text-xs font-bold flex items-center space-x-1"><Star className="w-3 h-3" /><span>Rated {b.rating}</span></span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ══ LIVE TRACKER ══ */}
              {section === 'tracker' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div><h2 className="text-sm font-bold text-gray-800">Live Technician Tracking</h2><p className="text-xs text-gray-400">Real-time GPS via Socket.IO</p></div>
                    <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold ${technicianLocation ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-gray-50 border border-gray-200 text-gray-500'}`}>
                      <span className={`w-2 h-2 rounded-full ${technicianLocation ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></span><span>{technicianLocation ? 'GPS Live' : 'Waiting for GPS'}</span>
                    </div>
                  </div>
                  <div className="h-80 bg-[#eef4ec] relative overflow-hidden border-b border-gray-100">
                    <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(#4d7f4d 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 320" preserveAspectRatio="none">
                      <line x1="0" y1="160" x2="800" y2="160" stroke="#c8dfc6" strokeWidth="2"/>
                      <line x1="0" y1="80"  x2="800" y2="80"  stroke="#c8dfc6" strokeWidth="1.5" strokeDasharray="6 4"/>
                      <line x1="0" y1="240" x2="800" y2="240" stroke="#c8dfc6" strokeWidth="1.5" strokeDasharray="6 4"/>
                      <line x1="200" y1="0"  x2="200" y2="320" stroke="#c8dfc6" strokeWidth="1.5" strokeDasharray="6 4"/>
                      <line x1="400" y1="0"  x2="400" y2="320" stroke="#c8dfc6" strokeWidth="1.5" strokeDasharray="6 4"/>
                      <line x1="600" y1="0"  x2="600" y2="320" stroke="#c8dfc6" strokeWidth="1.5" strokeDasharray="6 4"/>
                      <path d="M 80 220 Q 200 110 350 145 Q 480 175 620 90" stroke="#2d5a27" strokeWidth="3" strokeDasharray="10 6" fill="none" opacity="0.7"/>
                    </svg>
                    {['Indiranagar','Koramangala','HSR Layout','BTM Layout','Jayanagar'].map((lbl, i) => (
                      <span key={lbl} className="absolute text-[10px] font-semibold text-[#4d7f4d] opacity-50" style={{ left: `${12 + i * 18}%`, top: i % 2 === 0 ? '18%' : '62%' }}>{lbl}</span>
                    ))}
                    {/* Moving technician */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white px-4 py-3 text-center shadow">
                      <p className="text-xs font-bold text-gray-700">{activeBooking?.techName || 'No assigned technician'}</p>
                      <p className="mt-1 text-[10px] text-gray-500">{technicianLocation ? `${technicianLocation.lat.toFixed(5)}, ${technicianLocation.lng.toFixed(5)} · ${technicianLocation.updatedAt}` : 'Live location appears after the technician shares GPS'}</p>
                    </div>
                    {/* Your location */}
                    <div className="absolute top-1/3 right-16 flex flex-col items-center">
                      <div className="w-9 h-9 rounded-full bg-blue-500 border-2 border-white shadow-lg flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-white/80"></div>
                      </div>
                      <span className="text-[10px] font-bold text-blue-700 mt-1 bg-white px-1.5 py-0.5 rounded-md shadow-sm">You</span>
                    </div>
                    <div className="absolute bottom-3 right-3 flex flex-col space-y-1">
                      {['+','−','⌖'].map(sym => <button key={sym} className="w-8 h-8 bg-white shadow rounded-lg text-gray-600 font-bold text-sm hover:bg-gray-50">{sym}</button>)}
                    </div>
                  </div>
                  {activeBooking && (
                    <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-11 h-11 rounded-full bg-[#2d5a27] flex items-center justify-center text-white font-black">{getInitials(activeBooking.techName)}</div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">{activeBooking.techName}</p>
                          <div className="flex items-center space-x-3 mt-1 text-[11px] text-gray-500">
                            <span>🛵 On the way</span>
                            <span className="flex items-center space-x-1"><Clock className="w-3 h-3" /><span>ETA {activeBooking.eta || '8 min'}</span></span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <a href={`tel:${activeBooking.techPhone}`} className="px-4 py-2 bg-[#2d5a27] hover:bg-[#3d6b3d] text-white text-xs font-bold rounded-xl flex items-center space-x-2 transition"><Phone className="w-3.5 h-3.5" /><span>Call</span></a>
                        <button onClick={() => setSection('chat')} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl flex items-center space-x-2 transition"><MessageCircle className="w-3.5 h-3.5" /><span>Chat</span></button>
                      </div>
                    </div>
                  )}
                  {!activeBooking && <div className="p-6 text-center text-gray-400 text-xs">No active booking to track. <button onClick={() => setSection('search')} className="text-[#3d6b3d] font-bold underline">Book a technician</button></div>}
                </div>
              )}

              {/* ══ CHAT (Technician only) ══ */}
              {['chat', 'support'].includes(section) && (
                <div className="max-w-2xl">
                  {section === 'support' || activeBooking ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[520px]">
                      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-[#2d5a27] flex items-center justify-center text-white font-black text-sm">{getInitials(chatPartnerName)}</div>
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-800">{chatPartnerName}</p>
                            <p className="text-[11px] text-emerald-600 font-semibold flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span><span>{section === 'support' ? 'Admin support' : `Technician · ${activeBooking?.id}`}</span></p>
                          </div>
                        </div>
                        {section === 'chat' && activeBooking?.techPhone && <a href={`tel:${activeBooking.techPhone}`} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition"><Phone className="w-4 h-4 text-gray-600" /></a>}
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {chatMsgs.length === 0 && (
                          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-8">
                            <MessageCircle className="w-10 h-10 mb-3 opacity-25" />
                            <p className="text-sm font-bold">Start the conversation</p>
                            <p className="text-xs mt-1">Send a message to your assigned technician</p>
                          </div>
                        )}
                        {chatMsgs.map(m => (
                          <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                            {m.sender !== 'user' && <div className="w-7 h-7 rounded-full bg-[#2d5a27] flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">{getInitials(m.sender === 'admin' ? 'FieldFix Admin' : chatPartnerName)}</div>}
                            <div className="flex flex-col">
                              {m.sender !== 'user' && <span className="text-[10px] text-gray-400 mb-0.5 ml-1">{m.sender === 'admin' ? 'FieldFix Admin' : chatPartnerName}</span>}
                              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${m.sender === 'user' ? 'bg-[#2d5a27] text-white rounded-br-sm' : 'bg-gray-100 text-gray-700 rounded-bl-sm'}`}>{m.text}</div>
                              <span className={`text-[10px] text-gray-400 mt-0.5 ${m.sender === 'user' ? 'text-right' : 'text-left ml-1'}`}>{m.time}</span>
                            </div>
                            {m.sender === 'user' && <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-[10px] font-black flex-shrink-0">{getInitials(user?.name || 'Me')}</div>}
                          </div>
                        ))}
                        <div ref={chatEndRef} />
                      </div>
                      <div className="flex gap-2 overflow-x-auto px-4 py-2 border-t border-gray-100 text-[11px]">
                        {["I'm at the gate","Please call before coming","Gate code: 4022"].map((chip, i) => <button key={i} onClick={() => setChatInput(chip)} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full whitespace-nowrap transition">{chip}</button>)}
                      </div>
                      <form onSubmit={sendChat} className="flex gap-2 p-4 border-t border-gray-100">
                        <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Message your technician…" className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#2d5a27]" />
                        <button type="submit" disabled={sendingChat || !chatInput.trim()} className="px-4 py-2.5 bg-[#2d5a27] hover:bg-[#3d6b3d] text-white rounded-xl transition disabled:opacity-50"><Send className="w-4 h-4" /></button>
                      </form>
                      {chatError && <p className="px-4 pb-3 text-xs text-red-600">{chatError}</p>}
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                      <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-200" />
                      <h3 className="text-sm font-bold text-gray-700">No active booking</h3>
                      <p className="text-xs text-gray-400 mt-1 mb-4">A technician conversation opens when you submit a service request.</p>
                      <button onClick={() => setSection('search')} className="px-5 py-2.5 bg-[#2d5a27] hover:bg-[#3d6b3d] text-white text-xs font-bold rounded-xl transition">Find a Technician</button>
                    </div>
                  )}
                </div>
              )}

              {section === 'support' && !user?.id && <p className="text-xs text-red-600">Sign in again to contact support.</p>}

              {/* ══ INVOICES ══ */}
              {section === 'invoices' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
                  <h2 className="text-sm font-bold text-gray-800 pb-3 border-b border-gray-100">Invoices & Payment History</h2>
                  {bookings.map(b => (
                    <div key={b.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-[#c8dfc6] transition">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-[#f0f7ee] rounded-xl flex items-center justify-center"><FileText className="w-5 h-5 text-[#3d6b3d]" /></div>
                        <div>
                          <p className="text-xs font-bold text-gray-800">{b.service}</p>
                          <p className="text-[11px] text-gray-400">{b.date} · INV-{b.id} · {b.techName}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-black text-gray-800">₹{b.amount}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${STATUS_STYLE[b.status]}`}>{b.status}</span>
                        <button onClick={() => setInvoiceTarget(b)} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold rounded-lg flex items-center space-x-1 transition"><Download className="w-3 h-3" /><span>Download</span></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ══ SETTINGS ══ */}
              {section === 'settings' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-5">
                  <h2 className="text-sm font-bold text-gray-800 pb-3 border-b border-gray-100">Account Settings</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {[['Full Name', user?.name || ''], ['Email', user?.email || ''], ['Phone', user?.phone || ''], ['City', city]].map(([l, v]) => (
                      <div key={l}><label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">{l}</label><input defaultValue={v} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 focus:outline-none focus:border-[#2d5a27]" /></div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-gray-500 uppercase">Notifications</p>
                    {['SMS & WhatsApp alerts','Email invoices','Push notifications'].map(p => (
                      <label key={p} className="flex items-center justify-between py-2 cursor-pointer"><span className="text-xs text-gray-700">{p}</span><input type="checkbox" defaultChecked className="accent-[#2d5a27] w-4 h-4" /></label>
                    ))}
                  </div>
                  <button className="w-full py-2.5 bg-[#2d5a27] hover:bg-[#3d6b3d] text-white font-bold text-xs rounded-xl shadow transition">Save Changes</button>
                </div>
              )}
            </div>

            {/* ── RIGHT PANEL ── */}
            <aside className="hidden xl:flex w-72 flex-shrink-0 flex-col space-y-4">
              {/* Upcoming bookings */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-gray-800">Upcoming</p>
                  <button onClick={() => setSection('bookings')} className="text-[11px] font-bold text-[#3d6b3d] hover:underline">All →</button>
                </div>
                <div className="space-y-2.5">
                  {bookings.filter(b => ['Scheduled','Confirmed','Pending','Accepted','Dispatched','In Progress'].includes(b.status)).map(b => (
                    <div key={b.id} onClick={() => setInvoiceTarget(b)} className="flex items-center space-x-2.5 p-2.5 rounded-xl hover:bg-gray-50 transition cursor-pointer">
                      <div className="w-9 h-9 bg-[#f0f7ee] rounded-xl flex items-center justify-center flex-shrink-0"><Wrench className="w-4 h-4 text-[#3d6b3d]" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-gray-800 truncate">{b.service}</p>
                        <p className="text-[10px] text-gray-400 truncate">{b.date} · {b.techName}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${STATUS_STYLE[b.status]}`}>{b.status}</span>
                    </div>
                  ))}
                  {bookings.filter(b => ['Scheduled','Confirmed','Pending','Accepted','Dispatched','In Progress'].includes(b.status)).length === 0 && (
                    <div className="text-center py-6 text-gray-400">
                      <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs font-semibold">No upcoming bookings</p>
                      <button onClick={() => setSection('search')} className="mt-2 text-[11px] text-[#3d6b3d] font-bold underline">Book a service</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Trust card */}
              <div className="bg-[#2d5a27] rounded-2xl p-4 text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
                <div className="relative z-10">
                  <p className="text-white font-black text-sm">Fast. Verified. Trusted.</p>
                  <p className="text-white/60 text-[11px] mt-1">FieldFix home service platform</p>
                  <div className="grid grid-cols-2 gap-1.5 mt-3 text-[10px] text-white/70 font-medium">
                    {['✓ Verified IDs','₹ Clear pricing','🔁 30-day warranty','📞 24/7 support'].map(t => <span key={t} className="bg-white/10 rounded-lg py-1">{t}</span>)}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* ═══ FLOATING AI ASSISTANT BUTTON ═══ */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-3">
        {/* Floating chat popup */}
        {botOpen && (
          <div className="w-80 h-[440px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
            {/* Header */}
            <div className="bg-[#2d5a27] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white text-xs font-bold">FieldFix AI</p>
                  <p className="text-white/60 text-[10px]">Ask about services, pricing or your issue</p>
                </div>
              </div>
              <button onClick={() => setBotOpen(false)} className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition">
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-gray-50">
              {botMsgs.map(m => (
                <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.sender !== 'user' && (
                    <div className="w-6 h-6 rounded-full bg-[#2d5a27] flex items-center justify-center mr-1.5 flex-shrink-0 mt-0.5">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-[#2d5a27] text-white rounded-br-sm'
                      : 'bg-white text-gray-700 rounded-bl-sm border border-gray-100 shadow-sm'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {botTyping && (
                <div className="flex items-center space-x-1.5 pl-8">
                  {[0,1,2].map(i => <span key={i} className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: `${i * 100}ms` }}></span>)}
                </div>
              )}
              <div ref={botEndRef} />
            </div>
            {/* Quick chips */}
            <div className="flex gap-1.5 px-3 py-2 bg-white border-t border-gray-100 overflow-x-auto">
              {['AC pricing','Warranty','Emergency','Plumbing'].map(chip => (
                <button key={chip} onClick={() => setBotInput(chip)} className="px-2.5 py-1 bg-[#f0f7ee] text-[#3d6b3d] text-[10px] font-semibold rounded-lg hover:bg-[#c8dfc6] transition whitespace-nowrap flex-shrink-0">{chip}</button>
              ))}
            </div>
            {/* Input */}
            <form onSubmit={sendBot} className="flex gap-2 p-3 border-t border-gray-100 bg-white">
              <input
                value={botInput}
                onChange={e => setBotInput(e.target.value)}
                placeholder="Ask anything…"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#2d5a27]"
              />
              <button type="submit" className="px-3 py-2 bg-[#2d5a27] hover:bg-[#3d6b3d] text-white rounded-xl transition">
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
        {/* Floating button */}
        <button
          onClick={() => setBotOpen(o => !o)}
          className="w-14 h-14 bg-[#2d5a27] hover:bg-[#3d6b3d] text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all active:scale-95 group relative"
          title="FieldFix AI Assistant"
        >
          {botOpen ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
          {!botOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></span>
          )}
        </button>
      </div>

      {/* ═══ MODALS ═══ */}

      {/* — Technician Profile Modal — */}
      {profileTech && (() => {
        const skills: string[] = typeof profileTech.skills === 'string' ? JSON.parse(profileTech.skills) : profileTech.skills || [];
        const price = getServicePrice(skills);
        return (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="bg-[#2d5a27] p-6 relative">
                <button onClick={() => setProfileTech(null)} className="absolute top-4 right-4 p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg"><X className="w-4 h-4" /></button>
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white font-black text-xl flex-shrink-0">
                    {getInitials(profileTech.user?.name || 'T')}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h2 className="text-white font-black text-lg">{profileTech.user?.name}</h2>
                      <BadgeCheck className="w-5 h-5 text-emerald-300" />
                    </div>
                    <p className="text-white/80 text-xs font-semibold mt-0.5">{profileTech.specialization}</p>
                    <div className="flex items-center space-x-3 mt-2 text-xs text-white/70">
                      <span>★ {Number(profileTech.rating).toFixed(1)}</span>
                      <span>·</span>
                      <span>{profileTech.totalJobs} jobs</span>
                      <span>·</span>
                      <span>{profileTech.experienceYears}yr exp</span>
                    </div>
                    <div className={`mt-2 inline-flex items-center space-x-1.5 text-[11px] font-bold ${profileTech.isAvailable ? 'text-emerald-300' : 'text-gray-300'}`}>
                      <span className={`w-2 h-2 rounded-full ${profileTech.isAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'}`}></span>
                      <span>{profileTech.isAvailable ? 'Available Now' : 'Currently Busy'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Verified ID */}
                <div className="flex items-center space-x-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                  <BadgeCheck className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="text-[11px] font-bold text-emerald-800">Govt. Verified Technician ID</p>
                    <p className="text-xs font-mono font-bold text-emerald-700">{profileTech.technicianVerifiedId}</p>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase mb-1">About</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{profileTech.bio}</p>
                </div>

                {/* Skills */}
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase mb-2">Service Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {skills.map(s => {
                      const SI = CAT_ICONS[s] || Wrench;
                      return <span key={s} className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#f0f7ee] text-[#2d5a27] text-xs font-bold rounded-xl"><SI className="w-3.5 h-3.5" /><span>{s}</span></span>;
                    })}
                  </div>
                </div>

                {/* City & Contact */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-gray-50 rounded-xl p-3"><p className="text-gray-400 text-[10px] font-bold uppercase mb-1">City</p><p className="font-bold text-gray-800 flex items-center space-x-1"><MapPin className="w-3.5 h-3.5" /><span>{profileTech.city}</span></p></div>
                  <div className="bg-gray-50 rounded-xl p-3"><p className="text-gray-400 text-[10px] font-bold uppercase mb-1">Starting price</p><p className="font-black text-[#2d5a27] text-sm">₹{price}</p></div>
                </div>

                {/* Reviews */}
                {profileTech.reviews && profileTech.reviews.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-gray-500 uppercase mb-2">Customer Reviews</p>
                    <div className="space-y-2">
                      {profileTech.reviews.map((rv: any, i: number) => (
                        <div key={i} className="bg-gray-50 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-gray-700">{rv.reviewer}</span>
                            <span className="text-amber-500 text-xs font-bold">★ {rv.rating}</span>
                          </div>
                          <p className="text-[11px] text-gray-500 leading-relaxed">{rv.comment}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{rv.date}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 pt-2">
                  <a href={`tel:${profileTech.user?.phone}`} className="flex-1 py-2.5 border border-gray-200 hover:border-[#2d5a27] text-gray-600 hover:text-[#2d5a27] text-xs font-bold rounded-xl flex items-center justify-center space-x-2 transition">
                    <Phone className="w-4 h-4" /><span>Call</span>
                  </a>
                  {profileTech.isAvailable && (
                    <button onClick={() => { setBookingTech(profileTech); setBookingService(skills[0] || ''); setProfileTech(null); }}
                      className="flex-1 py-2.5 bg-[#2d5a27] hover:bg-[#3d6b3d] text-white text-xs font-black rounded-xl flex items-center justify-center space-x-2 transition shadow">
                      <Plus className="w-4 h-4" /><span>Book This Technician</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* — Booking Form Modal — */}
      {bookingTech && (() => {
        const skills: string[] = typeof bookingTech.skills === 'string' ? JSON.parse(bookingTech.skills) : bookingTech.skills || [];
        const price = getServicePrice(skills);
        return (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-y-auto max-h-[92vh]">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-black text-gray-800">Book Technician</h3>
                  <p className="text-[11px] text-gray-400">{bookingTech.user?.name} · {bookingTech.specialization}</p>
                </div>
                <button onClick={() => setBookingTech(null)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4 text-gray-400" /></button>
              </div>
              <div className="p-5 space-y-4">
                {/* Service selector */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Service Type</label>
                  <select value={bookingService} onChange={e => setBookingService(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#2d5a27]">
                    {skills.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Date</label><input type="date" min={new Date().toISOString().slice(0, 10)} value={bookingDate} onChange={e => setBookingDate(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#2d5a27]" /></div>
                  <div><label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Time Slot</label>
                    <select value={bookingSlot} onChange={e => setBookingSlot(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#2d5a27]">
                      {['10:00 AM – 12:00 PM','12:00 PM – 02:00 PM','02:00 PM – 04:00 PM','04:00 PM – 06:00 PM','06:00 PM – 08:00 PM'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div><label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Service Address</label>
                  <div className="relative"><MapPin className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" /><input required value={bookingAddress} onChange={e => setBookingAddress(e.target.value)} placeholder="Enter your service address" className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-[#2d5a27]" /></div>
                </div>
                <div><label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Problem Description</label>
                  <textarea rows={2} value={bookingNotes} onChange={e => setBookingNotes(e.target.value)} placeholder="Describe the issue…" className="w-full border border-gray-200 rounded-xl p-3 text-xs focus:outline-none focus:border-[#2d5a27] resize-none" />
                </div>
                <div className="bg-[#f0f7ee] rounded-xl p-3 text-xs space-y-1">
                  <div className="flex justify-between text-gray-500"><span>Estimated service price</span><span>₹{price}</span></div>
                  <div className="flex justify-between text-gray-800 font-black text-sm pt-1 border-t border-[#c8dfc6]"><span>Pay now</span><span className="text-[#2d5a27]">₹{price}</span></div>
                </div>
                <p className="text-center text-[11px] text-gray-500">Secure payment by UPI, card, net banking, or wallet through Razorpay.</p>
                {bookingError && <p className="text-xs text-red-600">{bookingError}</p>}
                <button onClick={requestTechnician} disabled={isBooking || !bookingAddress.trim()} className="w-full py-3 bg-[#2d5a27] hover:bg-[#3d6b3d] text-white font-black text-sm rounded-xl shadow flex items-center justify-center space-x-2 transition disabled:opacity-60">
                  <CreditCard className="w-4 h-4" /><span>{isBooking ? 'Opening secure checkout…' : `Pay ₹${price} with Razorpay`}</span>
                </button>
                <div className="flex items-center justify-center space-x-4 text-[11px] text-gray-400 font-semibold">
                  <span className="flex items-center space-x-1"><Shield className="w-3 h-3" /><span>Verified tech</span></span>
                  <span className="flex items-center space-x-1"><Check className="w-3 h-3" /><span>Upfront price</span></span>
                  <span className="flex items-center space-x-1"><RefreshCw className="w-3 h-3" /><span>30-day warranty</span></span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* — Success Modal — */}
      {successBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center text-emerald-600 mx-auto"><CheckCircle2 className="w-8 h-8" /></div>
            <div><h3 className="text-lg font-black text-gray-800">Payment received</h3><p className="text-xs text-gray-500 mt-1">Your paid request is now waiting for {successBooking.techName} to accept.</p></div>
            <div className="bg-[#f0f7ee] rounded-xl p-4 text-xs text-left space-y-2">
              {[['Booking ID', successBooking.id],['Service', successBooking.service],['Technician', successBooking.techName],['Payment', `₹${successBooking.amount} · Paid`]].map(([k, v]) => (
                <div key={k} className="flex justify-between"><span className="text-gray-500">{k}:</span><span className="font-bold text-gray-800">{v}</span></div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setSuccessBooking(null); setSection('bookings'); }} className="flex-1 py-2.5 bg-[#2d5a27] hover:bg-[#3d6b3d] text-white font-bold text-xs rounded-xl transition">View request</button>
              <button onClick={() => setSuccessBooking(null)} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs rounded-xl transition">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* — Invoice Modal — */}
      {invoiceTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
            <button onClick={() => setInvoiceTarget(null)} className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div><h3 className="text-base font-black text-gray-800">Tax Invoice</h3><p className="text-xs font-mono text-gray-400">INV-{invoiceTarget.id}</p></div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLE[invoiceTarget.status]}`}>{invoiceTarget.status}</span>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-xs mb-4">
              {[['Billed To', user?.name || 'Customer'],['Service', invoiceTarget.service],['Technician', invoiceTarget.techName],['Date', invoiceTarget.date],['Payment', invoiceTarget.paymentStatus || 'UNPAID']].map(([k, v]) => (
                <div key={k} className="flex justify-between"><span className="text-gray-500">{k}:</span><span className="font-semibold text-gray-800">{v}</span></div>
              ))}
              <div className="flex justify-between border-t border-gray-200 pt-2 text-sm font-black"><span>Total</span><span className="text-[#2d5a27]">₹{invoiceTarget.amount}</span></div>
            </div>
            <button onClick={() => { alert('Downloading PDF…'); setInvoiceTarget(null); }} className="w-full py-2.5 bg-[#2d5a27] hover:bg-[#3d6b3d] text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition">
              <Download className="w-4 h-4" /><span>Download PDF Receipt</span>
            </button>
          </div>
        </div>
      )}

      {/* — Review Modal — */}
      {reviewTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
            <button onClick={() => setReviewTarget(null)} className="absolute top-4 right-4 p-1 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
            <h3 className="text-sm font-black text-gray-800 mb-0.5">Rate Your Experience</h3>
            <p className="text-xs text-gray-400 mb-4">{reviewTarget.service} · {reviewTarget.techName}</p>
            <form onSubmit={submitReview} className="space-y-4">
              <div className="flex justify-center space-x-2 py-2">
                {[1,2,3,4,5].map(s => <button key={s} type="button" onClick={() => setReviewRating(s)} className={`text-3xl transition ${s <= reviewRating ? 'text-amber-400 scale-110' : 'text-gray-200'}`}>★</button>)}
              </div>
              <textarea rows={3} value={reviewComment} onChange={e => setReviewComment(e.target.value)} required placeholder="Share your experience…" className="w-full border border-gray-200 rounded-xl p-3 text-xs focus:outline-none focus:border-[#2d5a27] resize-none" />
              <button type="submit" className="w-full py-2.5 bg-[#2d5a27] hover:bg-[#3d6b3d] text-white font-bold text-xs rounded-xl transition">Submit Review</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
