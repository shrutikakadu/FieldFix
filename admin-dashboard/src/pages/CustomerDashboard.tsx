import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, MapPin, FileText, Star, Wallet,
  Headphones, Settings, LogOut, Search, Bell, Plus, ChevronRight,
  Navigation, Phone, MessageCircle, Send, Bot, CheckCircle2, Clock,
  X, Download, ThumbsUp, Wrench, CreditCard, Shield, Zap,
  Droplets, Home, Wind, Hammer, Paintbrush, Bug, Thermometer,
  MapPinned, Radio, AlertCircle, Check, RefreshCw, ChevronDown,
  ArrowRight
} from 'lucide-react';
import { logoutAdmin, getStoredUser } from '../services/auth';

declare global { interface Window { Razorpay: any; } }

/* ─────────── Types ─────────── */
interface Service {
  id: string; icon: React.ElementType; emoji: string;
  label: string; category: string;
  rating: number; from: number; accent: string;
}

interface Booking {
  id: string; service: string; category: string;
  date: string; time: string; status: 'Scheduled' | 'Confirmed' | 'Pending' | 'Completed' | 'In Progress' | 'Cancelled';
  amount: number; paymentStatus: 'PAID' | 'PENDING';
  techName: string; techPhone: string; address: string;
  eta?: string; rating?: number; reviewComment?: string;
}

interface ChatMsg { id: string; sender: 'user' | 'tech' | 'bot'; text: string; time: string; }

/* ─────────── Data ─────────── */
const SERVICES: Service[] = [
  { id: 's1', icon: Wind,        emoji: '❄️', label: 'AC & Cooling',       category: 'HVAC',       rating: 4.8, from: 499,  accent: '#d1fae5' },
  { id: 's2', icon: Zap,         emoji: '⚡', label: 'Electrical',         category: 'Electrical', rating: 4.7, from: 399,  accent: '#fef9c3' },
  { id: 's3', icon: Droplets,    emoji: '🔧', label: 'Plumbing',           category: 'Plumbing',   rating: 4.8, from: 349,  accent: '#dbeafe' },
  { id: 's4', icon: Home,        emoji: '🏠', label: 'Home Appliances',    category: 'Appliances', rating: 4.6, from: 299,  accent: '#ede9fe' },
  { id: 's5', icon: Sparkle,     emoji: '✨', label: 'Cleaning',           category: 'Cleaning',   rating: 4.8, from: 399,  accent: '#fce7f3' },
  { id: 's6', icon: Hammer,      emoji: '🔨', label: 'Carpentry',          category: 'Carpentry',  rating: 4.5, from: 449,  accent: '#ffedd5' },
  { id: 's7', icon: Paintbrush,  emoji: '🎨', label: 'Painting',           category: 'Painting',   rating: 4.5, from: 1499, accent: '#fce7f3' },
  { id: 's8', icon: Bug,         emoji: '🐛', label: 'Pest Control',       category: 'Pest',       rating: 4.7, from: 799,  accent: '#d1fae5' },
  { id: 's9', icon: Thermometer, emoji: '🚿', label: 'Refrigerator',       category: 'Appliances', rating: 4.7, from: 399,  accent: '#dbeafe' },
  { id: 's10',icon: Wrench,      emoji: '🔩', label: 'Washing Machine',    category: 'Appliances', rating: 4.6, from: 349,  accent: '#ede9fe' },
  { id: 's11',icon: Zap,         emoji: '⚡', label: 'Wiring & MCB',       category: 'Electrical', rating: 4.7, from: 449,  accent: '#fef9c3' },
  { id: 's12',icon: Wrench,      emoji: '🔨', label: 'Geyser Repair',      category: 'Appliances', rating: 4.6, from: 399,  accent: '#d1fae5' },
];

function Sparkle(props: any) { return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>; }

const CITY_SUGGESTIONS: Record<string, string[]> = {
  'Bangalore': ['Drainage Cleaning', 'Anti-rust AC Coating', 'High-load Wiring Check'],
  'Mumbai':    ['Waterproofing & Sealing', 'Anti-Humidity AC Service', 'Pump Motor Diagnostics'],
  'Delhi NCR': ['Air Purifier Duct Cleaning', 'Solar Inverter Setup', 'Pipeline Insulation'],
  'Pune':      ['RO Water Filter Service', 'Smart Lighting Install', 'Appliance Overhaul'],
};

const CITY_SEASON: Record<string, string> = {
  'Bangalore': 'Monsoon Special', 'Mumbai': 'Monsoon Special',
  'Delhi NCR': 'Summer Care', 'Pune': 'Post-Monsoon',
};

const STATUS_STYLES: Record<string, string> = {
  'Scheduled':  'bg-blue-100 text-blue-700',
  'Confirmed':  'bg-emerald-100 text-emerald-700',
  'Pending':    'bg-amber-100 text-amber-700',
  'Completed':  'bg-sage-100 text-sage-700',
  'In Progress':'bg-orange-100 text-orange-700',
  'Cancelled':  'bg-red-100 text-red-700',
};

/* ─────────── Component ─────────── */
export default function CustomerDashboard() {
  const navigate = useNavigate();
  const user = getStoredUser();

  useEffect(() => { if (!user) navigate('/login', { replace: true }); }, []);

  /* — UI State — */
  const [activeSection, setActiveSection] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [city, setCity] = useState('Bangalore');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  /* — Booking State — */
  const [bookings, setBookings] = useState<Booking[]>([
    { id: 'BK-9021', service: 'AC Repair & Service', category: 'HVAC',       date: 'Oct 2, 2026', time: '10:00 AM – 12:00 PM', status: 'Scheduled', amount: 1850, paymentStatus: 'PAID', techName: 'David Miller',  techPhone: '+91 98765 43210', address: 'Home – Bangalore', eta: '8 min (2.4 km)' },
    { id: 'BK-9017', service: 'Washing Machine Repair', category: 'Appliances', date: 'Oct 3, 2026', time: '04:00 PM – 05:00 PM', status: 'Confirmed', amount: 1200, paymentStatus: 'PAID', techName: 'Elena Rostova', techPhone: '+91 98765 43211', address: 'Home – Bangalore' },
    { id: 'BK-9004', service: 'Electrical Checkup',   category: 'Electrical',  date: 'Oct 6, 2026', time: '11:00 AM – 01:00 PM', status: 'Pending',   amount: 950,  paymentStatus: 'PENDING', techName: 'Marcus Vance',  techPhone: '+91 98765 43212', address: 'Home – Bangalore' },
    { id: 'BK-8998', service: 'Plumbing Service',     category: 'Plumbing',    date: 'Sep 26, 2026', time: '11:00 AM',           status: 'Completed', amount: 780,  paymentStatus: 'PAID', techName: 'David Miller',  techPhone: '+91 98765 43210', address: 'Home – Bangalore', rating: 5 },
  ]);

  /* — Booking Form State — */
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [bookingDate, setBookingDate] = useState('2026-10-05');
  const [bookingSlot, setBookingSlot] = useState('10:00 AM – 12:00 PM');
  const [bookingAddress, setBookingAddress] = useState('Flat 402, Prestige Palms, 100ft Rd, Indiranagar, Bangalore');
  const [bookingNotes, setBookingNotes] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [isBooking, setIsBooking] = useState(false);
  const [successBooking, setSuccessBooking] = useState<Booking | null>(null);

  /* — GPS Tracker — */
  const [gpsProgress, setGpsProgress] = useState(35);
  useEffect(() => {
    const t = setInterval(() => setGpsProgress(p => p >= 85 ? 20 : p + 3), 3000);
    return () => clearInterval(t);
  }, []);

  /* — Chat (Technician) — */
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([
    { id: '1', sender: 'tech', text: 'Hi! I am David, your assigned technician. I will be at your location in about 8 minutes.', time: '10:04 AM' },
    { id: '2', sender: 'user', text: 'Thanks David! The AC outdoor unit is on the 2nd floor balcony.', time: '10:05 AM' },
    { id: '3', sender: 'tech', text: 'Got it. I have the tools and spare capacitor. See you soon!', time: '10:06 AM' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMsgs]);

  /* — AI Bot — */
  const [botMsgs, setBotMsgs] = useState<ChatMsg[]>([
    { id: '1', sender: 'bot', text: '👋 Hi! I am the FieldFix AI Assistant. Ask me about services, pricing, or describe your issue for instant diagnosis!', time: 'Now' },
  ]);
  const [botInput, setBotInput] = useState('');
  const [botTyping, setBotTyping] = useState(false);
  const botEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { botEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [botMsgs]);

  /* — Reviews — */
  const [reviews, setReviews] = useState([
    { id: 'r1', name: 'Aarav Mehta',  rating: 5,   service: 'AC Repair & Service',   date: '2 days ago',    comment: 'Very professional. Fixed the issue in under an hour. Highly recommended!', helpful: 14 },
    { id: 'r2', name: 'Sneha Roy',    rating: 5,   service: 'Smart Home Installation', date: 'Sep 27, 2026',  comment: 'Configured 4 smart cameras in under 2 hours. App integration works flawlessly.', helpful: 9 },
    { id: 'r3', name: 'Vikram Joshi', rating: 4.8, service: 'Plumbing Service',       date: 'Sep 24, 2026',  comment: 'Resolved severe clogging without damaging tiles. Very clean work.', helpful: 6 },
  ]);
  const [reviewTarget, setReviewTarget] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  /* — Invoice Modal — */
  const [invoiceTarget, setInvoiceTarget] = useState<Booking | null>(null);

  /* — Email OTP — */
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpVal, setOtpVal] = useState('');

  /* ─── Filtered Services ─── */
  const filteredServices = SERVICES.filter(s =>
    s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* ─── Razorpay ─── */
  const launchPayment = () => {
    if (!selectedService) return;
    setIsBooking(true);
    const finalAmount = Math.max(0, selectedService.from - discount);

    const doSuccess = () => {
      const nb: Booking = {
        id: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
        service: selectedService.label, category: selectedService.category,
        date: bookingDate, time: bookingSlot,
        status: 'Confirmed', amount: finalAmount, paymentStatus: 'PAID',
        techName: 'David Miller', techPhone: '+91 98765 43210',
        address: bookingAddress, eta: '18 min away',
      };
      setBookings(prev => [nb, ...prev]);
      setSuccessBooking(nb);
      setIsBooking(false);
    };

    if (window.Razorpay) {
      const rzp = new window.Razorpay({
        key: 'rzp_test_Seq6pkI96ruWHa', amount: finalAmount * 100, currency: 'INR',
        name: 'FieldFix Field Services', description: selectedService.label,
        prefill: { name: user?.name, email: user?.email },
        theme: { color: '#3d6b3d' },
        handler: doSuccess,
      });
      rzp.on('payment.failed', () => setIsBooking(false));
      rzp.open();
    } else { setTimeout(doSuccess, 800); }
  };

  /* ─── Send chat ─── */
  const sendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const m: ChatMsg = { id: Date.now().toString(), sender: 'user', text: chatInput, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setChatMsgs(prev => [...prev, m]);
    setChatInput('');
    setTimeout(() => {
      const replies = ['Got it! Will take care of that.', 'Thanks for letting me know.', 'On my way — almost there!'];
      setChatMsgs(prev => [...prev, { id: Date.now() + 'r', sender: 'tech', text: replies[Math.floor(Math.random() * 3)], time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    }, 1200);
  };

  /* ─── Send bot ─── */
  const sendBot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!botInput.trim()) return;
    const q = botInput.toLowerCase();
    const m: ChatMsg = { id: Date.now().toString(), sender: 'user', text: botInput, time: 'Now' };
    setBotMsgs(prev => [...prev, m]);
    setBotInput('');
    setBotTyping(true);
    setTimeout(() => {
      let reply = 'All FieldFix technicians are background-verified and carry a 30-day service warranty. How else can I help?';
      if (q.includes('ac') || q.includes('cool')) reply = 'For AC cooling issues, we do deep coil jet cleaning, gas pressure testing & compressor diagnostics from ₹499. Shall I book a slot?';
      else if (q.includes('price') || q.includes('cost') || q.includes('rate')) reply = 'Plumbing from ₹349 · Electrical from ₹399 · AC from ₹499 · Appliances from ₹299. No hidden charges!';
      else if (q.includes('leak') || q.includes('water') || q.includes('pipe')) reply = 'We use acoustic & thermal leak locators to avoid needless wall damage. Emergency dispatch in under 30 min!';
      else if (q.includes('warrant')) reply = 'All our repairs come with a 30-day service warranty. If the issue recurs, we send a technician at no extra cost.';
      setBotMsgs(prev => [...prev, { id: Date.now() + 'b', sender: 'bot', text: reply, time: 'Now' }]);
      setBotTyping(false);
    }, 1100);
  };

  /* ─── Submit Review ─── */
  const submitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTarget) return;
    setBookings(prev => prev.map(b => b.id === reviewTarget.id ? { ...b, rating: reviewRating, reviewComment } : b));
    setReviews(prev => [{ id: `r${Date.now()}`, name: user?.name || 'Customer', rating: reviewRating, service: reviewTarget.service, date: 'Just now', comment: reviewComment || 'Great service!', helpful: 0 }, ...prev]);
    setReviewTarget(null); setReviewComment(''); setReviewRating(5);
  };

  /* ─── NAV ITEMS ─── */
  const NAV = [
    { id: 'dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'services',   icon: Wrench,          label: 'All Services' },
    { id: 'bookings',   icon: CalendarDays,    label: 'My Bookings' },
    { id: 'tracker',    icon: Navigation,      label: 'Live Tracking' },
    { id: 'chat',       icon: MessageCircle,   label: 'Chat' },
    { id: 'invoices',   icon: FileText,        label: 'Invoices' },
    { id: 'reviews',    icon: Star,            label: 'Reviews' },
    { id: 'settings',   icon: Settings,        label: 'Settings' },
  ];

  /* ─── Helpers ─── */
  const totalSpent = bookings.filter(b => b.paymentStatus === 'PAID').reduce((a, b) => a + b.amount, 0);
  const activeCount = bookings.filter(b => ['Scheduled', 'Confirmed', 'Pending', 'In Progress'].includes(b.status)).length;
  const completedCount = bookings.filter(b => b.status === 'Completed').length;
  const activeBooking = bookings.find(b => ['Scheduled', 'In Progress'].includes(b.status));

  /* ═══════════════════════════════════════════════════════════════ */
  /*  RENDER                                                        */
  /* ═══════════════════════════════════════════════════════════════ */
  return (
    <div className="flex h-screen bg-[#f5f7f4] font-sans overflow-hidden">

      {/* ══════════ SIDEBAR ══════════ */}
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-56'} flex-shrink-0 bg-[#2d5a27] flex flex-col transition-all duration-300 shadow-xl`}>
        {/* Brand */}
        <div className="px-4 py-5 flex items-center space-x-2.5 border-b border-[#3d6b3d]">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Wrench className="w-4 h-4 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div>
              <p className="text-white font-black text-sm tracking-wide leading-tight">FieldFix</p>
              <p className="text-white/50 text-[10px] font-medium">Fixing What Matters</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(item => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center px-4 py-2.5 text-xs font-semibold transition-all ${
                  active ? 'bg-white/20 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : ''}`} />
                {!sidebarCollapsed && <span className="ml-3">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Need help */}
        {!sidebarCollapsed && (
          <div className="mx-3 mb-3 p-3 bg-[#3d6b3d] rounded-xl">
            <p className="text-white text-xs font-bold">Need help?</p>
            <p className="text-white/60 text-[11px] mt-0.5">Chat with our AI assistant</p>
            <button
              onClick={() => setActiveSection('chat')}
              className="mt-2.5 w-full py-1.5 bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold rounded-lg flex items-center justify-center space-x-1.5 transition"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Chat with AI Assistant</span>
            </button>
          </div>
        )}

        {/* Sign out */}
        <button
          onClick={() => { logoutAdmin(); navigate('/login', { replace: true }); }}
          className="flex items-center px-4 py-3 text-white/50 hover:text-white hover:bg-white/10 text-xs font-semibold transition border-t border-[#3d6b3d]"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!sidebarCollapsed && <span className="ml-3">Log out</span>}
        </button>
      </aside>

      {/* ══════════ MAIN AREA ══════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── TOPBAR ── */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-5 gap-3 flex-shrink-0 shadow-sm">
          {/* Breadcrumb */}
          <span className="text-xs text-gray-400 font-medium hidden md:block">
            Customer portal / {NAV.find(n => n.id === activeSection)?.label || 'Dashboard'}
          </span>

          {/* Global Search */}
          <div className="flex-1 flex items-center bg-gray-100 rounded-xl px-3.5 py-2 max-w-lg mx-auto">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search services, issues or work type…"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); if (e.target.value) setActiveSection('services'); }}
              className="ml-2.5 bg-transparent text-xs text-gray-700 placeholder-gray-400 focus:outline-none flex-1"
            />
          </div>

          {/* City */}
          <div className="flex items-center space-x-1.5 bg-gray-100 rounded-xl px-3 py-2 cursor-pointer">
            <MapPin className="w-3.5 h-3.5 text-[#3d6b3d]" />
            <select
              value={city}
              onChange={e => setCity(e.target.value)}
              className="bg-transparent text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
            >
              {['Bangalore', 'Mumbai', 'Delhi NCR', 'Pune'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </div>

          {/* Bell */}
          <button className="relative p-2 rounded-xl hover:bg-gray-100 transition">
            <Bell className="w-4.5 h-4.5 text-gray-500" style={{ width: '18px', height: '18px' }} />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">3</span>
          </button>

          {/* Avatar */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-[#2d5a27] flex items-center justify-center text-white text-xs font-black">
              {(user?.name || 'SC').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            {!sidebarCollapsed && (
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-gray-800 leading-tight">{user?.name || 'Shrutika Kadu'}</p>
                <p className="text-[10px] text-gray-400">Customer</p>
              </div>
            )}
          </div>
        </header>

        {/* ══════════ SCROLLABLE BODY ══════════ */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex gap-5 p-5 min-h-full">

            {/* ─── LEFT / CENTER COLUMN ─── */}
            <div className="flex-1 min-w-0 space-y-5">

              {/* ═══ DASHBOARD HOME ═══ */}
              {activeSection === 'dashboard' && (
                <>
                  {/* Hero Banner */}
                  <div className="relative bg-[#2d5a27] rounded-2xl p-6 overflow-hidden">
                    <div className="relative z-10 max-w-sm">
                      <p className="text-white/70 text-sm font-medium">Good evening, {user?.name?.split(' ')[0] || 'Shrutika'}!</p>
                      <h1 className="text-white font-display font-black text-2xl mt-1 leading-tight">
                        Book trusted home experts in minutes
                      </h1>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {['Verified pros', 'Upfront price', '30-day warranty'].map(t => (
                          <span key={t} className="px-3 py-1 bg-white/20 text-white text-xs font-semibold rounded-full">{t}</span>
                        ))}
                      </div>
                      <button
                        onClick={() => setActiveSection('services')}
                        className="mt-4 flex items-center space-x-2 px-4 py-2 bg-white text-[#2d5a27] text-xs font-black rounded-xl shadow-md hover:shadow-lg transition"
                      >
                        <Plus className="w-4 h-4" />
                        <span>New Booking</span>
                      </button>
                    </div>

                    {/* Decorative home illustration (SVG) */}
                    <div className="absolute right-6 bottom-0 opacity-30 pointer-events-none">
                      <svg width="140" height="120" viewBox="0 0 140 120" fill="none">
                        <rect x="20" y="60" width="100" height="60" rx="4" fill="white"/>
                        <polygon points="70,10 10,60 130,60" fill="white"/>
                        <rect x="55" y="75" width="30" height="45" rx="2" fill="#2d5a27"/>
                        <rect x="25" y="68" width="20" height="20" rx="2" fill="#2d5a27"/>
                        <rect x="95" y="68" width="20" height="20" rx="2" fill="#2d5a27"/>
                        <circle cx="110" cy="30" r="12" fill="white" opacity="0.6"/>
                        <rect x="95" y="18" width="4" height="18" fill="white" opacity="0.6"/>
                        <rect x="95" y="28" width="15" height="4" fill="white" opacity="0.6"/>
                      </svg>
                    </div>

                    {emailVerified && (
                      <div className="absolute top-4 right-4 flex items-center space-x-1.5 bg-emerald-400/20 border border-emerald-400/40 text-emerald-200 text-[11px] font-bold px-3 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified Customer</span>
                      </div>
                    )}
                  </div>

                  {/* KPI Strip */}
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Active', value: activeCount, icon: Radio,       color: '#dbeafe', iconColor: '#3b82f6' },
                      { label: 'Completed', value: completedCount, icon: CheckCircle2, color: '#d1fae5', iconColor: '#10b981' },
                      { label: 'Total Spent', value: `₹${totalSpent.toLocaleString()}`, icon: Wallet, color: '#fef3c7', iconColor: '#f59e0b' },
                    ].map(kpi => {
                      const Icon = kpi.icon;
                      return (
                        <div key={kpi.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: kpi.color }}>
                            <Icon className="w-5 h-5" style={{ color: kpi.iconColor }} />
                          </div>
                          <div>
                            <p className="text-[11px] text-gray-400 font-medium">{kpi.label}</p>
                            <p className="text-lg font-black text-gray-800">{kpi.value}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Live Tracking Map Card (when active booking exists) */}
                  {activeBooking && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                        <div>
                          <h2 className="text-sm font-bold text-gray-800">Live Technician Tracking</h2>
                          <span className="inline-flex items-center space-x-1 text-xs text-emerald-600 font-semibold mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
                            <span>On the way</span>
                          </span>
                        </div>
                        <button
                          onClick={() => setActiveSection('tracker')}
                          className="text-[11px] font-bold text-[#3d6b3d] hover:underline flex items-center space-x-1"
                        >
                          <span>Full map view</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Mini map */}
                      <div className="mx-4 mb-3 h-36 bg-[#eef4ec] rounded-xl relative overflow-hidden border border-[#c8dfc6]">
                        {/* Grid dots */}
                        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(#4d7f4d 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                        {/* Route line SVG */}
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 144" preserveAspectRatio="none">
                          <path d="M 60 90 Q 150 40 200 72 Q 260 110 340 60" stroke="#2d5a27" strokeWidth="2.5" strokeDasharray="8 5" fill="none" opacity="0.6"/>
                        </svg>

                        {/* Customer home pin */}
                        <div className="absolute right-14 top-10 flex flex-col items-center">
                          <div className="w-7 h-7 rounded-full bg-[#2d5a27] border-2 border-white shadow-md flex items-center justify-center">
                            <Home className="w-3.5 h-3.5 text-white" />
                          </div>
                          <span className="text-[10px] font-bold text-[#2d5a27] mt-1 bg-white px-1.5 py-0.5 rounded-md shadow-sm">Your Home</span>
                        </div>

                        {/* Tech moving pin */}
                        <div
                          className="absolute top-14 flex flex-col items-center transition-all duration-3000"
                          style={{ left: `${gpsProgress}%` }}
                        >
                          <div className="w-8 h-8 rounded-full bg-amber-400 border-2 border-white shadow-md flex items-center justify-center text-[10px] font-black text-white">
                            DM
                          </div>
                        </div>
                      </div>

                      {/* Technician info bar */}
                      <div className="px-4 pb-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-[#2d5a27] flex items-center justify-center text-white text-xs font-black">DM</div>
                          <div>
                            <p className="text-xs font-bold text-gray-800">{activeBooking.techName}</p>
                            <p className="text-[11px] text-gray-400">Field Technician · ★ 4.8 (124 jobs)</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <a href={`tel:${activeBooking.techPhone}`} className="px-3 py-1.5 bg-[#2d5a27] text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 hover:bg-[#3d6b3d] transition">
                            <Phone className="w-3.5 h-3.5" />
                            <span>Call</span>
                          </a>
                          <button onClick={() => setActiveSection('chat')} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl flex items-center space-x-1.5 hover:bg-gray-200 transition">
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Chat</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recent Bookings Table */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                      <h2 className="text-sm font-bold text-gray-800">Recent Bookings</h2>
                      <button onClick={() => setActiveSection('bookings')} className="text-[11px] font-bold text-[#3d6b3d] hover:underline">View All →</button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-t border-gray-100">
                            {['ID', 'Service', 'Date & Time', 'Status', 'Amount', 'Actions'].map(h => (
                              <th key={h} className="px-5 py-2.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {bookings.slice(0, 4).map(b => (
                            <tr key={b.id} className="hover:bg-gray-50 transition">
                              <td className="px-5 py-3 text-xs font-mono font-bold text-[#3d6b3d]">{b.id}</td>
                              <td className="px-5 py-3 text-xs font-medium text-gray-700">{b.service}</td>
                              <td className="px-5 py-3 text-xs text-gray-500">{b.date} · {b.time}</td>
                              <td className="px-5 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${STATUS_STYLES[b.status]}`}>{b.status}</span>
                              </td>
                              <td className="px-5 py-3 text-xs font-bold text-gray-800">₹{b.amount.toLocaleString()}</td>
                              <td className="px-5 py-3">
                                <button onClick={() => setInvoiceTarget(b)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold rounded-lg transition">View</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Quick Service Grid */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm font-bold text-gray-800">Quick Service Categories</h2>
                      <button onClick={() => setActiveSection('services')} className="text-[11px] font-bold text-[#3d6b3d] hover:underline">View All</button>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {SERVICES.slice(0, 6).map(s => {
                        const Icon = s.icon;
                        return (
                          <button
                            key={s.id}
                            onClick={() => { setSelectedService(s); setActiveSection('services'); }}
                            className="flex flex-col items-center space-y-1.5 p-3 rounded-xl hover:bg-gray-50 transition group w-20 text-center"
                          >
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.accent }}>
                              <Icon className="w-5 h-5 text-gray-600" />
                            </div>
                            <span className="text-[11px] font-semibold text-gray-600 group-hover:text-[#2d5a27] leading-tight">{s.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* ═══ ALL SERVICES / BOOK ═══ */}
              {(activeSection === 'services') && (
                <div className="space-y-5">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                    <h2 className="text-sm font-bold text-gray-800 mb-1">What do you need fixed today?</h2>
                    <p className="text-xs text-gray-400 mb-4">Select a service, pick a time, and pay securely via Razorpay.</p>

                    {/* Filter Tabs */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {['All services', 'Appliances', 'Electrical', 'Plumbing', 'Home care'].map(f => (
                        <button
                          key={f}
                          onClick={() => setSearchQuery(f === 'All services' ? '' : f)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                            (f === 'All services' && !searchQuery) || searchQuery === f
                              ? 'bg-[#2d5a27] text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>

                    {/* Active Booking Banner */}
                    {activeBooking && (
                      <div className="mb-4 flex items-center justify-between bg-[#f0f7ee] border border-[#c8dfc6] rounded-xl px-4 py-3">
                        <div>
                          <p className="text-xs font-bold text-[#2d5a27]">{activeBooking.service} · {activeBooking.id}</p>
                          <p className="text-[11px] text-gray-500">David is on the way</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-xs font-bold text-[#2d5a27]">ETA 12 min</span>
                          <button onClick={() => setActiveSection('tracker')} className="px-3 py-1.5 bg-[#2d5a27] text-white text-xs font-bold rounded-xl">Track live</button>
                        </div>
                      </div>
                    )}

                    {/* Service Cards Grid */}
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Popular services · {filteredServices.length} services</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {filteredServices.map(s => {
                        const Icon = s.icon;
                        const isSelected = selectedService?.id === s.id;
                        return (
                          <div
                            key={s.id}
                            onClick={() => setSelectedService(isSelected ? null : s)}
                            className={`p-4 rounded-2xl border cursor-pointer transition ${isSelected ? 'border-[#2d5a27] ring-2 ring-[#2d5a27]/20 bg-[#f0f7ee]' : 'border-gray-200 hover:border-[#2d5a27]/40 bg-white'}`}
                          >
                            <div className="w-10 h-10 rounded-xl mb-2.5 flex items-center justify-center" style={{ background: s.accent }}>
                              <Icon className="w-5 h-5 text-gray-600" />
                            </div>
                            <p className="text-xs font-bold text-gray-800 leading-tight">{s.label}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">★ {s.rating} · from ₹{s.from}</p>
                            <button
                              onClick={e => { e.stopPropagation(); setSelectedService(s); }}
                              className="mt-2.5 w-full py-1.5 border border-gray-200 hover:border-[#2d5a27] hover:bg-[#f0f7ee] text-xs font-semibold text-gray-600 hover:text-[#2d5a27] rounded-lg transition"
                            >
                              Book now
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Booking Form (appears when a service is selected) */}
                  {selectedService && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-gray-800">Book: {selectedService.label}</h3>
                          <p className="text-[11px] text-gray-400">★ {selectedService.rating} · Verified professionals</p>
                        </div>
                        <span className="text-lg font-black text-[#2d5a27]">₹{selectedService.from}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Date</label>
                          <input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 focus:outline-none focus:border-[#2d5a27]" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Time Slot</label>
                          <select value={bookingSlot} onChange={e => setBookingSlot(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 focus:outline-none focus:border-[#2d5a27]">
                            <option>10:00 AM – 12:00 PM</option>
                            <option>12:00 PM – 02:00 PM</option>
                            <option>02:00 PM – 04:00 PM</option>
                            <option>04:00 PM – 06:00 PM</option>
                            <option>06:00 PM – 08:00 PM</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Service Address</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
                          <input value={bookingAddress} onChange={e => setBookingAddress(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-700 focus:outline-none focus:border-[#2d5a27]" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Describe Your Problem</label>
                        <textarea rows={2} value={bookingNotes} onChange={e => setBookingNotes(e.target.value)}
                          placeholder="E.g. AC not cooling, water dripping from ceiling corner..."
                          className="w-full border border-gray-200 rounded-xl p-3 text-xs text-gray-700 focus:outline-none focus:border-[#2d5a27] resize-none" />
                      </div>

                      <div className="flex gap-2">
                        <input value={promoCode} onChange={e => setPromoCode(e.target.value)}
                          placeholder='Promo code (try "FIELDFIX100")'
                          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 focus:outline-none uppercase" />
                        <button type="button"
                          onClick={() => {
                            if (['FIELDFIX100', 'WELCOME'].includes(promoCode.toUpperCase())) {
                              setDiscount(100); alert('₹100 off applied!');
                            } else alert('Invalid promo code.');
                          }}
                          className="px-4 py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-200 transition">
                          Apply
                        </button>
                      </div>

                      <div className="bg-[#f0f7ee] rounded-xl p-3 text-xs space-y-1">
                        <div className="flex justify-between text-gray-500"><span>Base price</span><span>₹{selectedService.from}</span></div>
                        {discount > 0 && <div className="flex justify-between text-emerald-600"><span>Promo discount</span><span>-₹{discount}</span></div>}
                        <div className="flex justify-between text-gray-800 font-black text-sm pt-1 border-t border-[#c8dfc6]">
                          <span>Total</span><span className="text-[#2d5a27]">₹{Math.max(0, selectedService.from - discount)}</span>
                        </div>
                      </div>

                      <button onClick={launchPayment} disabled={isBooking}
                        className="w-full py-3 bg-[#2d5a27] hover:bg-[#3d6b3d] text-white font-black text-sm rounded-xl shadow-md flex items-center justify-center space-x-2 transition disabled:opacity-60">
                        <CreditCard className="w-4 h-4" />
                        <span>{isBooking ? 'Launching Razorpay…' : `Pay ₹${Math.max(0, selectedService.from - discount)} & Confirm`}</span>
                      </button>

                      <div className="flex items-center justify-center space-x-4 text-[11px] text-gray-400 font-semibold pt-1">
                        <span className="flex items-center space-x-1"><Shield className="w-3 h-3" /><span>Verified technicians</span></span>
                        <span className="flex items-center space-x-1"><Check className="w-3 h-3" /><span>Upfront pricing</span></span>
                        <span className="flex items-center space-x-1"><RefreshCw className="w-3 h-3" /><span>30-day warranty</span></span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ═══ MY BOOKINGS ═══ */}
              {activeSection === 'bookings' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <h2 className="text-sm font-bold text-gray-800">My Bookings</h2>
                    <button onClick={() => setActiveSection('services')} className="px-4 py-1.5 bg-[#2d5a27] text-white text-xs font-bold rounded-xl hover:bg-[#3d6b3d] transition">+ New Booking</button>
                  </div>
                  <div className="space-y-3">
                    {bookings.map(b => (
                      <div key={b.id} className="border border-gray-100 rounded-2xl p-4 hover:border-[#c8dfc6] transition">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-mono text-xs font-bold text-[#3d6b3d]">{b.id}</span>
                            <h3 className="text-sm font-bold text-gray-800 mt-0.5">{b.service}</h3>
                            <p className="text-[11px] text-gray-400 mt-0.5 flex items-center">
                              <CalendarDays className="w-3 h-3 mr-1" />{b.date} · {b.time}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-0.5 flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />{b.address}
                            </p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${STATUS_STYLES[b.status]}`}>{b.status}</span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                          <div className="text-xs">
                            <span className="text-gray-400">Paid: </span>
                            <span className="font-bold text-gray-800">₹{b.amount}</span>
                            <span className={`ml-2 font-bold ${b.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>({b.paymentStatus})</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button onClick={() => setInvoiceTarget(b)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold rounded-lg transition flex items-center space-x-1">
                              <FileText className="w-3 h-3" /><span>Invoice</span>
                            </button>
                            {b.status === 'Completed' && (
                              <button onClick={() => setReviewTarget(b)} className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-semibold rounded-lg transition flex items-center space-x-1">
                                <Star className="w-3 h-3" />
                                <span>{b.rating ? `★ ${b.rating}` : 'Rate'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ═══ LIVE TRACKER FULL ═══ */}
              {activeSection === 'tracker' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-gray-800">Live Technician Tracking</h2>
                      <p className="text-xs text-gray-400">Real-time GPS via Socket.IO WebSocket telemetry</p>
                    </div>
                    <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Live GPS (10Hz)</span>
                    </div>
                  </div>

                  {/* Full map */}
                  <div className="h-72 bg-[#eef4ec] relative overflow-hidden border-b border-gray-100">
                    <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(#4d7f4d 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                    {/* Street lines */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 290" preserveAspectRatio="none">
                      <line x1="0" y1="145" x2="800" y2="145" stroke="#c8dfc6" strokeWidth="2"/>
                      <line x1="0" y1="70"  x2="800" y2="70"  stroke="#c8dfc6" strokeWidth="1.5" strokeDasharray="6 4"/>
                      <line x1="0" y1="220" x2="800" y2="220" stroke="#c8dfc6" strokeWidth="1.5" strokeDasharray="6 4"/>
                      <line x1="200" y1="0"  x2="200" y2="290" stroke="#c8dfc6" strokeWidth="1.5" strokeDasharray="6 4"/>
                      <line x1="400" y1="0"  x2="400" y2="290" stroke="#c8dfc6" strokeWidth="1.5" strokeDasharray="6 4"/>
                      <line x1="600" y1="0"  x2="600" y2="290" stroke="#c8dfc6" strokeWidth="1.5" strokeDasharray="6 4"/>
                      <path d="M 80 200 Q 200 100 350 130 Q 480 160 620 80" stroke="#2d5a27" strokeWidth="3" strokeDasharray="10 6" fill="none" opacity="0.7"/>
                    </svg>

                    {/* Location labels */}
                    {['Indiranagar','Koramangala','HSR Layout','BTM Layout','JP Nagar'].map((lbl, idx) => (
                      <span key={lbl} className="absolute text-[10px] font-semibold text-[#4d7f4d] opacity-60"
                        style={{ left: `${15 + idx * 18}%`, top: idx % 2 === 0 ? '20%' : '65%' }}>
                        {lbl}
                      </span>
                    ))}

                    {/* Technician markers */}
                    {[
                      { label: 'David M.', top: '42%', left: `${gpsProgress}%`, color: '#2d5a27', subLabel: 'En Route' },
                      { label: 'Elena R.', top: '60%', left: '65%', color: '#4a7c59', subLabel: 'On Site' },
                    ].map(m => (
                      <div key={m.label} className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-3000"
                        style={{ top: m.top, left: m.left }}>
                        <div className="px-2 py-0.5 rounded-lg text-[10px] font-bold text-white shadow-md mb-1 flex items-center space-x-1" style={{ background: m.color }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse"></span>
                          <span>{m.label} ({m.subLabel})</span>
                        </div>
                        <div className="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center" style={{ background: m.color }}>
                          <Navigation className="w-4 h-4 text-white rotate-45" />
                        </div>
                      </div>
                    ))}

                    {/* Your location */}
                    <div className="absolute top-1/3 right-16 flex flex-col items-center">
                      <div className="w-9 h-9 rounded-full bg-blue-500 border-2 border-white shadow-lg flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-white/50 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-blue-700 mt-1 bg-white px-1.5 py-0.5 rounded-md shadow-sm">You</span>
                    </div>

                    {/* Zoom controls */}
                    <div className="absolute bottom-3 right-3 flex flex-col space-y-1">
                      {['+', '−', '⌖'].map(sym => (
                        <button key={sym} className="w-8 h-8 bg-white shadow-md rounded-lg flex items-center justify-center text-gray-600 font-bold text-sm hover:bg-gray-50 transition">{sym}</button>
                      ))}
                    </div>
                  </div>

                  {/* Technician popup card */}
                  {activeBooking && (
                    <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-11 h-11 rounded-full bg-[#2d5a27] flex items-center justify-center text-white font-black">DM</div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">{activeBooking.techName}</p>
                          <p className="text-xs text-amber-600 font-semibold">★ 4.8 (124 jobs)</p>
                          <div className="flex items-center space-x-3 mt-1 text-[11px] text-gray-500 font-medium">
                            <span className="flex items-center space-x-1"><span>🛵</span><span>TVS Jupiter · KA-01-EQ-9082</span></span>
                            <span>32 km/h</span>
                            <span className="flex items-center space-x-1"><Clock className="w-3 h-3" /><span>ETA 8 min (2.4 km)</span></span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <a href={`tel:${activeBooking.techPhone}`} className="px-4 py-2 bg-[#2d5a27] hover:bg-[#3d6b3d] text-white text-xs font-bold rounded-xl flex items-center space-x-2 transition">
                          <Phone className="w-3.5 h-3.5" /><span>Call Technician</span>
                        </a>
                        <button onClick={() => setActiveSection('chat')} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl flex items-center space-x-2 transition">
                          <MessageCircle className="w-3.5 h-3.5" /><span>Chat</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ═══ CHAT ═══ */}
              {activeSection === 'chat' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[520px] overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-[#2d5a27] flex items-center justify-center text-white font-black text-sm">DM</div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">David Miller</p>
                        <p className="text-xs text-emerald-600 font-semibold flex items-center space-x-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>Assigned Technician · BK-9021</span>
                        </p>
                      </div>
                    </div>
                    <a href="tel:+919876543210" className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition">
                      <Phone className="w-4 h-4 text-gray-600" />
                    </a>
                  </div>
                  <div className="flex-1 overflow-y-auto p-5 space-y-3">
                    {chatMsgs.map(m => (
                      <div key={m.id} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${m.sender === 'user' ? 'bg-[#2d5a27] text-white rounded-br-none' : 'bg-gray-100 text-gray-700 rounded-bl-none'}`}>
                          {m.text}
                        </div>
                        <span className="text-[10px] text-gray-400 mt-1 px-1">{m.time}</span>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="flex gap-2 overflow-x-auto px-4 py-2 border-t border-gray-100 text-[11px]">
                    {["I'm at the lobby", 'The AC model is Samsung 1.5T', 'Gate code: 4022'].map((chip, i) => (
                      <button key={i} onClick={() => setChatInput(chip)} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full whitespace-nowrap transition font-medium">{chip}</button>
                    ))}
                  </div>
                  <form onSubmit={sendChat} className="flex gap-2 p-4 border-t border-gray-100">
                    <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type a message…"
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#2d5a27]" />
                    <button type="submit" className="px-4 py-2.5 bg-[#2d5a27] hover:bg-[#3d6b3d] text-white rounded-xl transition"><Send className="w-4 h-4" /></button>
                  </form>
                </div>
              )}

              {/* ═══ INVOICES ═══ */}
              {activeSection === 'invoices' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
                  <h2 className="text-sm font-bold text-gray-800 pb-3 border-b border-gray-100">Invoices & Payment History</h2>
                  {bookings.filter(b => b.paymentStatus === 'PAID').map(b => (
                    <div key={b.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-[#c8dfc6] transition">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-[#f0f7ee] rounded-xl flex items-center justify-center">
                          <FileText className="w-5 h-5 text-[#3d6b3d]" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-800">{b.service}</p>
                          <p className="text-[11px] text-gray-400">{b.date} · INV-{b.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-black text-gray-800">₹{b.amount}</span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[11px] font-bold rounded-full">Paid</span>
                        <button onClick={() => setInvoiceTarget(b)} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold rounded-lg flex items-center space-x-1 transition">
                          <Download className="w-3 h-3" /><span>Download</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ═══ REVIEWS ═══ */}
              {activeSection === 'reviews' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <h2 className="text-sm font-bold text-gray-800">Customer Reviews</h2>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-black text-gray-800">4.9</span>
                      <div>
                        <div className="text-amber-400 text-sm">★★★★★</div>
                        <p className="text-[10px] text-gray-400">500+ verified jobs</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {reviews.map(r => (
                      <div key={r.id} className="border border-gray-100 rounded-xl p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-[#2d5a27] flex items-center justify-center text-white text-xs font-black">{r.name[0]}</div>
                            <div>
                              <p className="text-xs font-bold text-gray-800">{r.name}</p>
                              <p className="text-[10px] text-[#3d6b3d] font-medium">{r.service}</p>
                            </div>
                          </div>
                          <div className="text-amber-500 font-bold text-xs">★ {r.rating}</div>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">{r.comment}</p>
                        <div className="flex items-center justify-between text-[10px] text-gray-400">
                          <span>{r.date}</span>
                          <button onClick={() => setReviews(prev => prev.map(rv => rv.id === r.id ? { ...rv, helpful: rv.helpful + 1 } : rv))} className="flex items-center space-x-1 hover:text-[#2d5a27] transition">
                            <ThumbsUp className="w-3 h-3" /><span>Helpful ({r.helpful})</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ═══ SETTINGS ═══ */}
              {activeSection === 'settings' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-5">
                  <h2 className="text-sm font-bold text-gray-800 pb-3 border-b border-gray-100">Account Settings & Security</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[['Full Name', user?.name || 'Sarah Jenkins', 'text'], ['Phone', '+91 98451 22334', 'tel']].map(([label, val, type]) => (
                      <div key={label}>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">{label}</label>
                        <input type={type} defaultValue={val} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 focus:outline-none focus:border-[#2d5a27]" />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                    <div>
                      <p className="text-xs font-bold text-gray-800">{user?.email || 'customer@fieldfix.io'}</p>
                      <p className="text-[11px] text-gray-400">{emailVerified ? 'Verified and active' : 'Verification pending'}</p>
                    </div>
                    {emailVerified
                      ? <span className="flex items-center space-x-1 text-emerald-600 text-xs font-bold"><CheckCircle2 className="w-4 h-4" /><span>Verified</span></span>
                      : <button onClick={() => setOtpOpen(true)} className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition">Verify Email (OTP)</button>
                    }
                  </div>

                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-gray-500 uppercase">Notification Preferences</p>
                    {['SMS & WhatsApp dispatch alerts', 'Email invoices & receipts', 'Push notifications'].map(pref => (
                      <label key={pref} className="flex items-center justify-between py-2 cursor-pointer">
                        <span className="text-xs text-gray-700">{pref}</span>
                        <input type="checkbox" defaultChecked className="accent-[#2d5a27] w-4 h-4" />
                      </label>
                    ))}
                  </div>

                  <button className="w-full py-2.5 bg-[#2d5a27] hover:bg-[#3d6b3d] text-white font-bold text-xs rounded-xl shadow transition">Save Changes</button>
                </div>
              )}
            </div>

            {/* ─── RIGHT PANEL ─── */}
            <aside className="hidden xl:flex w-72 flex-shrink-0 flex-col space-y-4">

              {/* AI Ask panel */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-8 h-8 bg-[#f0f7ee] rounded-xl flex items-center justify-center">
                    <Bot className="w-4 h-4 text-[#3d6b3d]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">Ask FieldFix AI Assistant</p>
                    <p className="text-[10px] text-gray-400">Instant answers about services & pricing</p>
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2 mb-2">
                  {botMsgs.map(m => (
                    <div key={m.id} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-full px-3 py-2 rounded-xl text-[11px] leading-relaxed ${m.sender === 'user' ? 'bg-[#2d5a27] text-white' : 'bg-gray-100 text-gray-700'}`}>{m.text}</div>
                    </div>
                  ))}
                  {botTyping && <div className="flex space-x-1 px-2"><span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></span><span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-100"></span><span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-200"></span></div>}
                  <div ref={botEndRef} />
                </div>
                <form onSubmit={sendBot} className="relative">
                  <input value={botInput} onChange={e => setBotInput(e.target.value)} placeholder="Ask a question..."
                    className="w-full border border-gray-200 rounded-xl pl-3 pr-10 py-2 text-[11px] focus:outline-none focus:border-[#2d5a27]" />
                  <button type="submit" className="absolute right-2 top-1.5 p-1 bg-[#2d5a27] text-white rounded-lg">
                    <Send className="w-3 h-3" />
                  </button>
                </form>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['AC not cooling', 'Price estimate', 'Warranty info', 'Book a service'].map(chip => (
                    <button key={chip} onClick={() => setBotInput(chip)} className="px-2 py-1 bg-[#f0f7ee] text-[#3d6b3d] text-[10px] font-semibold rounded-lg hover:bg-[#d1f5d3] transition">{chip}</button>
                  ))}
                </div>
              </div>

              {/* Upcoming Bookings */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-gray-800">Upcoming Bookings</p>
                  <button onClick={() => setActiveSection('bookings')} className="text-[11px] font-bold text-[#3d6b3d] hover:underline">View All →</button>
                </div>
                <div className="space-y-2.5">
                  {bookings.filter(b => ['Scheduled', 'Confirmed', 'Pending'].includes(b.status)).slice(0, 3).map(b => (
                    <div key={b.id} className="flex items-center space-x-2.5 p-2.5 rounded-xl hover:bg-gray-50 transition cursor-pointer" onClick={() => setInvoiceTarget(b)}>
                      <div className="w-9 h-9 bg-[#f0f7ee] rounded-xl flex items-center justify-center flex-shrink-0">
                        <Wrench className="w-4 h-4 text-[#3d6b3d]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-gray-800 truncate">{b.service}</p>
                        <p className="text-[10px] text-gray-400 flex items-center"><CalendarDays className="w-2.5 h-2.5 mr-1" />{b.date} · {b.time}</p>
                        <p className="text-[10px] text-gray-400 flex items-center"><MapPin className="w-2.5 h-2.5 mr-1" />{b.address}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${STATUS_STYLES[b.status]}`}>{b.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seasonal Recommendations */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-gray-800">Service Recommendations</p>
                  <button onClick={() => setCity(city)} className="text-[10px] font-bold text-[#3d6b3d] flex items-center space-x-1">
                    <MapPin className="w-3 h-3" /><span>Change City</span>
                  </button>
                </div>
                <div className="bg-[#f0f7ee] rounded-xl p-2.5 mb-3">
                  <p className="text-[10px] font-bold text-[#2d5a27]">
                    Based on seasonal needs ({CITY_SEASON[city] || 'Monsoon'})
                  </p>
                </div>
                <div className="space-y-2.5">
                  {(CITY_SUGGESTIONS[city] || CITY_SUGGESTIONS['Bangalore']).map((s, i) => (
                    <button key={i} onClick={() => { setSearchQuery(s); setActiveSection('services'); }} className="w-full flex items-center space-x-2.5 p-2.5 rounded-xl hover:bg-gray-50 transition text-left group">
                      <div className="w-9 h-9 bg-[#f0f7ee] rounded-xl flex items-center justify-center flex-shrink-0">
                        {i === 0 ? <Droplets className="w-4 h-4 text-blue-500" /> : i === 1 ? <Shield className="w-4 h-4 text-orange-500" /> : <Zap className="w-4 h-4 text-amber-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-gray-800 group-hover:text-[#2d5a27] transition">{s}</p>
                        <p className="text-[10px] text-gray-400">{i === 0 ? 'Prevent waterlogging and leaks' : i === 1 ? 'Protects from moisture & corrosion' : 'Ensures safety during heavy rains'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Trust Banner */}
              <div className="bg-[#2d5a27] rounded-2xl p-4 text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
                <div className="relative z-10">
                  <p className="text-white font-display font-black text-base">Fast. Reliable. Trusted.</p>
                  <p className="text-white/60 text-[11px] mt-1">FieldFix – Your home service partner</p>
                  <div className="grid grid-cols-2 gap-1.5 mt-3 text-[10px] text-white/70 font-medium">
                    <span className="bg-white/10 rounded-lg py-1">✓ Verified pros</span>
                    <span className="bg-white/10 rounded-lg py-1">₹ Upfront price</span>
                    <span className="bg-white/10 rounded-lg py-1">🔁 30-day warranty</span>
                    <span className="bg-white/10 rounded-lg py-1">📞 24/7 support</span>
                  </div>
                </div>
              </div>

            </aside>
          </div>
        </div>
      </div>

      {/* ══════════ MODALS ══════════ */}

      {/* — Booking Success — */}
      {successBooking && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center text-emerald-600 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-800">Booking Confirmed! 🎉</h3>
              <p className="text-xs text-gray-500 mt-1">Razorpay payment successful. Technician allocated.</p>
            </div>
            <div className="bg-[#f0f7ee] rounded-xl p-4 text-xs text-left space-y-2">
              {[['Booking ID', successBooking.id], ['Service', successBooking.service], ['Technician', successBooking.techName], ['Amount Paid', `₹${successBooking.amount}`]].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-gray-500">{k}:</span>
                  <span className="font-bold text-gray-800">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setSuccessBooking(null); setActiveSection('tracker'); }} className="flex-1 py-2.5 bg-[#2d5a27] hover:bg-[#3d6b3d] text-white font-bold text-xs rounded-xl shadow transition">Track Live →</button>
              <button onClick={() => setSuccessBooking(null)} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs rounded-xl transition">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* — Invoice Modal — */}
      {invoiceTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setInvoiceTarget(null)} className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"><X className="w-4 h-4" /></button>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div>
                <h3 className="text-base font-black text-gray-800">Tax Invoice</h3>
                <p className="text-xs text-gray-400 font-mono">INV-{invoiceTarget.id}</p>
              </div>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">PAID</span>
            </div>
            <div className="bg-[#f9fafb] rounded-xl p-4 space-y-2 text-xs mb-4">
              {[['Billed To', user?.name || 'Customer'], ['Service', invoiceTarget.service], ['Date', invoiceTarget.date], ['Technician', invoiceTarget.techName], ['Payment Method', 'Razorpay / UPI']].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-gray-500">{k}:</span>
                  <span className="font-semibold text-gray-800">{v}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-gray-200 pt-2 text-sm font-black">
                <span className="text-gray-800">Total</span>
                <span className="text-[#2d5a27]">₹{invoiceTarget.amount}</span>
              </div>
            </div>
            <button onClick={() => { alert('Downloading PDF invoice…'); setInvoiceTarget(null); }} className="w-full py-2.5 bg-[#2d5a27] hover:bg-[#3d6b3d] text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition">
              <Download className="w-4 h-4" /><span>Download PDF Receipt</span>
            </button>
          </div>
        </div>
      )}

      {/* — Review Modal — */}
      {reviewTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setReviewTarget(null)} className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"><X className="w-4 h-4" /></button>
            <h3 className="text-sm font-black text-gray-800 mb-0.5">Rate Your Experience</h3>
            <p className="text-xs text-gray-400 mb-4">{reviewTarget.service}</p>
            <form onSubmit={submitReview} className="space-y-4">
              <div className="flex justify-center space-x-2 py-2">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} type="button" onClick={() => setReviewRating(s)} className={`text-3xl transition ${s <= reviewRating ? 'text-amber-400 scale-110' : 'text-gray-200'}`}>★</button>
                ))}
              </div>
              <textarea rows={3} value={reviewComment} onChange={e => setReviewComment(e.target.value)} required placeholder="Share your experience with the technician and service quality..." className="w-full border border-gray-200 rounded-xl p-3 text-xs text-gray-700 focus:outline-none focus:border-[#2d5a27] resize-none" />
              <button type="submit" className="w-full py-2.5 bg-[#2d5a27] hover:bg-[#3d6b3d] text-white font-bold text-xs rounded-xl shadow transition">Submit Review</button>
            </form>
          </div>
        </div>
      )}

      {/* — Email OTP Modal — */}
      {otpOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-center space-y-4">
            <button onClick={() => setOtpOpen(false)} className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            <div className="w-12 h-12 rounded-2xl bg-[#f0f7ee] border border-[#c8dfc6] text-[#3d6b3d] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-800">Verify Your Email</h3>
              <p className="text-xs text-gray-500 mt-1">Enter the 6-digit code sent to <strong>{user?.email}</strong></p>
            </div>
            <form onSubmit={e => { e.preventDefault(); if (otpVal.length === 6) { setEmailVerified(true); setOtpOpen(false); } }} className="space-y-3">
              <input type="text" maxLength={6} value={otpVal} onChange={e => setOtpVal(e.target.value.replace(/\D/g, ''))} placeholder="1 2 3 4 5 6"
                className="w-full text-center tracking-[0.6em] text-xl font-mono font-black border border-gray-200 rounded-xl py-3 focus:outline-none focus:border-[#2d5a27]" required />
              <p className="text-[11px] text-gray-400">Demo OTP: <span className="font-mono font-bold text-[#3d6b3d]">123456</span></p>
              <button type="submit" className="w-full py-2.5 bg-[#2d5a27] hover:bg-[#3d6b3d] text-white font-bold text-xs rounded-xl transition">Verify Email</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
