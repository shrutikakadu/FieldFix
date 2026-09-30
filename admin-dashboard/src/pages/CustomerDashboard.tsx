import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench, MapPin, Clock, Star, Plus, ChevronRight, CheckCircle2,
  Calendar, Search, LogOut, User, ArrowUpRight, Phone, MessageCircle,
  Bell, Shield, CreditCard, Send, Bot, Sparkles, Navigation, AlertCircle,
  Check, RefreshCw, X, FileText, Download, ThumbsUp, Heart, Filter,
  Sliders, ShieldCheck, Mail, MapPinned, Radio, CheckCircle, Info
} from 'lucide-react';
import { logoutAdmin, getStoredUser } from '../services/auth';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface ServiceCategory {
  id: string;
  icon: string;
  title: string;
  category: string;
  desc: string;
  price: number;
  duration: string;
  popular?: boolean;
}

interface BookingItem {
  id: string;
  service: string;
  category: string;
  status: 'PENDING' | 'ACCEPTED' | 'DISPATCHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  technicianName: string;
  techPhone: string;
  date: string;
  amount: number;
  paymentStatus: 'PAID' | 'PENDING';
  address: string;
  eta?: string;
  rating?: number;
  reviewComment?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'tech' | 'bot';
  text: string;
  time: string;
}

interface Review {
  id: string;
  userName: string;
  rating: number;
  date: string;
  service: string;
  comment: string;
  helpfulCount: number;
}

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const user = getStoredUser();

  // Active Tab: overview | book | tracker | bookings | chat | assistant | reviews | settings
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Location Selector
  const [selectedCity, setSelectedCity] = useState<string>('Bangalore, KA');
  const [searchProblem, setSearchProblem] = useState<string>('');

  // Email Verification State
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState<boolean>(false);
  const [otpInput, setOtpInput] = useState<string>('');
  const [otpTimer, setOtpTimer] = useState<number>(60);
  const [otpSuccessMsg, setOtpSuccessMsg] = useState<string>('');

  // Booking Form State
  const [selectedService, setSelectedService] = useState<ServiceCategory | null>(null);
  const [bookingDate, setBookingDate] = useState<string>('2026-10-02');
  const [bookingTime, setBookingTime] = useState<string>('14:00');
  const [bookingAddress, setBookingAddress] = useState<string>('Flat 402, Prestige Palms, 100ft Rd, Indiranagar, Bangalore');
  const [bookingNotes, setBookingNotes] = useState<string>('');
  const [promoCode, setPromoCode] = useState<string>('');
  const [discountApplied, setDiscountApplied] = useState<number>(0);
  const [isBookingSubmitting, setIsBookingSubmitting] = useState<boolean>(false);
  const [bookingSuccessModal, setBookingSuccessModal] = useState<BookingItem | null>(null);

  // Selected Booking for Invoice / Tracker Modal
  const [selectedInvoice, setSelectedInvoice] = useState<BookingItem | null>(null);
  const [reviewModalBooking, setReviewModalBooking] = useState<BookingItem | null>(null);
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState<string>('');

  // Active Bookings List
  const [bookingsList, setBookingsList] = useState<BookingItem[]>([
    {
      id: 'BK-9101',
      service: 'HVAC Air Conditioning Overhaul & Gas Refill',
      category: 'HVAC',
      status: 'IN_PROGRESS',
      technicianName: 'David Miller',
      techPhone: '+91 98765 43210',
      date: 'Today, 2:30 PM',
      amount: 1500,
      paymentStatus: 'PAID',
      address: 'Flat 402, Prestige Palms, 100ft Rd, Indiranagar, Bangalore',
      eta: 'Arrived at Site • Diagnostic in Progress'
    },
    {
      id: 'BK-9098',
      service: 'Commercial Electrical Subpanel Check & MCB Setup',
      category: 'Electrical',
      status: 'COMPLETED',
      technicianName: 'Elena Rostova',
      techPhone: '+91 98765 43211',
      date: 'Sep 26, 11:00 AM',
      amount: 1200,
      paymentStatus: 'PAID',
      address: '105 Market St, Sector 2, Bangalore',
      rating: 5,
      reviewComment: 'Outstanding professionalism. Fixed the tripping MCB in 20 minutes!'
    },
    {
      id: 'BK-9095',
      service: 'Kitchen High-Pressure Pipe & Drainage Leak Repair',
      category: 'Plumbing',
      status: 'COMPLETED',
      technicianName: 'Marcus Vance',
      techPhone: '+91 98765 43212',
      date: 'Sep 22, 4:00 PM',
      amount: 1000,
      paymentStatus: 'PAID',
      address: '742 Evergreen Terrace, Koramangala, Bangalore',
      rating: 4.8,
      reviewComment: 'Punctual and very clean work. Highly recommended.'
    }
  ]);

  // Live Technician GPS tracking simulator state
  const [techGpsProgress, setTechGpsProgress] = useState<number>(68);

  // Chat with Technician State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'tech', text: 'Hello! I am David, your assigned technician for the AC Overhaul.', time: '2:15 PM' },
    { id: '2', sender: 'user', text: 'Hi David! The outdoor unit is on the 2nd floor balcony.', time: '2:16 PM' },
    { id: '3', sender: 'tech', text: 'Got it. I have the necessary ladder and manifold gauges ready.', time: '2:17 PM' }
  ]);
  const [chatInput, setChatInput] = useState<string>('');

  // AI Assistant Chat State
  const [botMessages, setBotMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'bot', text: '👋 Hi! I am FieldFix AI Assistant. How can I help you today? You can ask about our service rates, warranty, or tell me your issue to get instant diagnosis!', time: 'Just now' }
  ]);
  const [botInput, setBotInput] = useState<string>('');
  const [isBotTyping, setIsBotTyping] = useState<boolean>(false);

  // Customer Reviews Feed
  const [reviewsFeed, setReviewsFeed] = useState<Review[]>([
    { id: 'rev-1', userName: 'Aarav Mehta', rating: 5, date: '2 days ago', service: 'HVAC Air Conditioning Overhaul', comment: 'Fast response, reasonable pricing, and the technician was certified and courteous.', helpfulCount: 14 },
    { id: 'rev-2', userName: 'Sneha Roy', rating: 5, date: 'Sep 27, 2026', service: 'Smart Home Security Cam Installation', comment: 'Configured 4 smart cameras in under 2 hours. App integration works flawlessly!', helpfulCount: 9 },
    { id: 'rev-3', userName: 'Vikram Joshi', rating: 4.8, date: 'Sep 24, 2026', service: 'Plumbing Drainage & Leak Fix', comment: 'Resolved severe clogging in our main bathroom pipeline without damaging tiles.', helpfulCount: 6 }
  ]);

  // Services Catalog
  const serviceCatalog: ServiceCategory[] = [
    { id: 's1', icon: '❄️', title: 'HVAC & Air Conditioning', category: 'HVAC', desc: 'Deep jet coil cleaning, gas charging & compressor repair', price: 1500, duration: '60-90 min', popular: true },
    { id: 's2', icon: '⚡', title: 'Electrical Wiring & Smart Panels', category: 'Electrical', desc: 'Short-circuit fixes, MCB tripping, chandelier & smart switches', price: 1200, duration: '45-60 min', popular: true },
    { id: 's3', icon: '🔧', title: 'Plumbing & Pipe Line Repairs', category: 'Plumbing', desc: 'Water leak detection, flush tank repair, taps & drainage', price: 1000, duration: '30-60 min' },
    { id: 's4', icon: '🏠', title: 'Smart Home & Security Automation', category: 'Smart Home', desc: 'Video doorbells, smart locks, Wi-Fi mesh & CCTV setup', price: 2000, duration: '90-120 min', popular: true },
    { id: 's5', icon: '🔩', title: 'Major Home Appliance Servicing', category: 'Appliances', desc: 'Washing machine drum repair, refrigerator cooling & microwave', price: 800, duration: '45-90 min' },
    { id: 's6', icon: '🛡️', title: 'Annual Home Care (AMC Shield)', category: 'Maintenance', desc: '4 quarterly comprehensive inspections with free priority dispatch', price: 4999, duration: 'Full Year' }
  ];

  // Quick Problem suggestions
  const problemSuggestions = [
    { label: 'AC Not Cooling / Low Airflow', catId: 's1' },
    { label: 'Power Tripping / Sparking Switch', catId: 's2' },
    { label: 'Water Leak in Sink / Bathroom', catId: 's3' },
    { label: 'Smart Lock Setup / WiFi Cam', catId: 's4' },
    { label: 'Washing Machine Not Spinning', catId: 's5' }
  ];

  // Location based weather/seasonal suggestions
  const citySuggestions: Record<string, string[]> = {
    'Bangalore, KA': ['Monsoon Drainage & Water Heater Checks', 'HVAC Filter Sanitization', 'UPS & Inverter Wiring'],
    'Mumbai, MH': ['High-Humidity Anti-Rust AC Coating', 'Heavy Rain Waterproofing', 'Pump Motor Diagnostics'],
    'Delhi NCR': ['Air Purifier & HVAC Duct Servicing', 'High-Load Subpanel Inspection', 'Solar Inverter Setup'],
    'Pune, MH': ['Water Filtration & RO Pipeline Servicing', 'Smart Lighting Automations', 'Appliance Overhaul']
  };

  // Filtered Services
  const filteredServices = serviceCatalog.filter(s =>
    s.title.toLowerCase().includes(searchProblem.toLowerCase()) ||
    s.desc.toLowerCase().includes(searchProblem.toLowerCase()) ||
    s.category.toLowerCase().includes(searchProblem.toLowerCase())
  );

  // Check auth
  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  // Handle GPS radar tick
  useEffect(() => {
    const timer = setInterval(() => {
      setTechGpsProgress(prev => (prev >= 95 ? 40 : prev + 2));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Razorpay Checkout Execution
  const triggerRazorpayPayment = (amountInINR: number, bookingDetails: any) => {
    const options = {
      key: 'rzp_test_Seq6pkI96ruWHa', // Key ID provided by user
      amount: amountInINR * 100, // Amount in paise
      currency: 'INR',
      name: 'FieldFix Field Services',
      description: `Payment for ${bookingDetails.service}`,
      image: 'https://cdn-icons-png.flaticon.com/512/3067/3067451.png',
      handler: function (response: any) {
        // Payment success callback
        const newBooking: BookingItem = {
          id: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
          service: bookingDetails.service,
          category: bookingDetails.category,
          status: 'ACCEPTED',
          technicianName: 'David Miller',
          techPhone: '+91 98765 43210',
          date: `${bookingDate}, ${bookingTime}`,
          amount: amountInINR,
          paymentStatus: 'PAID',
          address: bookingAddress,
          eta: '18 mins away • Technician En Route'
        };

        setBookingsList(prev => [newBooking, ...prev]);
        setBookingSuccessModal(newBooking);
        setIsBookingSubmitting(false);
      },
      prefill: {
        name: user?.name || 'Valued Customer',
        email: user?.email || 'customer@fieldfix.io',
        contact: '9876543210'
      },
      theme: {
        color: '#0d9488' // Teal
      }
    };

    if (window.Razorpay) {
      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response: any) {
        alert(`Payment failed: ${response.error.description}`);
        setIsBookingSubmitting(false);
      });
      rzp1.open();
    } else {
      // Fallback mock payment success if script blocked
      setTimeout(() => {
        const newBooking: BookingItem = {
          id: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
          service: bookingDetails.service,
          category: bookingDetails.category,
          status: 'ACCEPTED',
          technicianName: 'David Miller',
          techPhone: '+91 98765 43210',
          date: `${bookingDate}, ${bookingTime}`,
          amount: amountInINR,
          paymentStatus: 'PAID',
          address: bookingAddress,
          eta: '18 mins away • Technician En Route'
        };
        setBookingsList(prev => [newBooking, ...prev]);
        setBookingSuccessModal(newBooking);
        setIsBookingSubmitting(false);
      }, 1000);
    }
  };

  // Handle Booking Submit
  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    setIsBookingSubmitting(true);
    const finalAmount = Math.max(0, selectedService.price - discountApplied);

    // Launch Razorpay
    triggerRazorpayPayment(finalAmount, {
      service: selectedService.title,
      category: selectedService.category
    });
  };

  // Send message to technician
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');

    // Simulate Technician Reply
    setTimeout(() => {
      const replies = [
        'Understood! I will check that as soon as I complete the preliminary voltage check.',
        'Noted! I am carrying the authentic OEM parts for this model.',
        'Thanks for letting me know. I will call you from the lobby.'
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      setChatMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'tech',
          text: randomReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 1500);
  };

  // Send message to AI Bot
  const handleSendBot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!botInput.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: botInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setBotMessages(prev => [...prev, userMsg]);
    const query = botInput.toLowerCase();
    setBotInput('');
    setIsBotTyping(true);

    setTimeout(() => {
      let botResponse = "I can definitely help you with that! All FieldFix technicians are background-verified and carry a 30-day service warranty.";

      if (query.includes('ac') || query.includes('cooling') || query.includes('gas')) {
        botResponse = "For AC cooling issues, our HVAC specialists perform deep coil jet cleaning, gas pressure testing, and compressor diagnostics starting at ₹1,500. Would you like to schedule an inspection?";
      } else if (query.includes('price') || query.includes('rate') || query.includes('cost')) {
        botResponse = "Our transparent pricing includes: Plumbing from ₹1,000, Electrical from ₹1,200, HVAC from ₹1,500, and Appliances from ₹800. No hidden charges!";
      } else if (query.includes('leak') || query.includes('water') || query.includes('pipe')) {
        botResponse = "For water leaks, we use acoustic and thermal leak locators to avoid chipping walls needlessly. Emergency dispatch arrives in under 30 mins.";
      } else if (query.includes('book') || query.includes('schedule')) {
        botResponse = "You can select your preferred time slot under the 'Book Service' tab or let me know which service you need!";
      }

      setBotMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: botResponse,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsBotTyping(false);
    }, 1200);
  };

  // Handle Review Submission
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalBooking) return;

    setBookingsList(prev =>
      prev.map(b =>
        b.id === reviewModalBooking.id
          ? { ...b, rating: newRating, reviewComment: newComment }
          : b
      )
    );

    setReviewsFeed(prev => [
      {
        id: `rev-${Date.now()}`,
        userName: user?.name || 'Customer',
        rating: newRating,
        date: 'Just now',
        service: reviewModalBooking.service,
        comment: newComment || 'Great service experience!',
        helpfulCount: 0
      },
      ...prev
    ]);

    setReviewModalBooking(null);
    setNewComment('');
  };

  // Handle OTP Verification Simulation
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput.length === 6) {
      setIsEmailVerified(true);
      setOtpSuccessMsg('Email verified successfully! Your account is now secured.');
      setTimeout(() => {
        setIsOtpModalOpen(false);
        setOtpSuccessMsg('');
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* ================= TOP APPLICATION HEADER ================= */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-4">
          <div
            onClick={() => setActiveTab('overview')}
            className="flex items-center space-x-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-3.5 py-2 rounded-xl shadow-md cursor-pointer hover:opacity-95 transition"
          >
            <Wrench className="w-5 h-5 animate-pulse" />
            <span className="font-display font-black text-lg tracking-wider">FieldFix</span>
          </div>

          {/* Location Selector */}
          <div className="hidden sm:flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
            <MapPin className="w-3.5 h-3.5 text-teal-400" />
            <select
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="Bangalore, KA" className="bg-slate-900">Bangalore, KA</option>
              <option value="Mumbai, MH" className="bg-slate-900">Mumbai, MH</option>
              <option value="Delhi NCR" className="bg-slate-900">Delhi NCR</option>
              <option value="Pune, MH" className="bg-slate-900">Pune, MH</option>
            </select>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="hidden lg:flex items-center w-80 bg-slate-950 border border-slate-800 focus-within:border-teal-500 rounded-xl px-3.5 py-1.5 transition">
          <Search className="w-4 h-4 text-slate-400 mr-2" />
          <input
            type="text"
            placeholder="Search problem (e.g. AC cooling, leak)..."
            value={searchProblem}
            onChange={e => {
              setSearchProblem(e.target.value);
              if (activeTab !== 'book' && activeTab !== 'overview') setActiveTab('book');
            }}
            className="bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none w-full"
          />
        </div>

        {/* Action Controls & Profile */}
        <div className="flex items-center space-x-3">
          {/* Email Verification Status Badge */}
          {isEmailVerified ? (
            <span className="hidden md:flex items-center space-x-1 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold rounded-lg">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Customer</span>
            </span>
          ) : (
            <button
              onClick={() => setIsOtpModalOpen(true)}
              className="hidden md:flex items-center space-x-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-[11px] font-bold rounded-lg transition"
            >
              <Mail className="w-3.5 h-3.5 animate-bounce" />
              <span>Verify Email (OTP)</span>
            </button>
          )}

          {/* User Profile & Sign Out */}
          <div className="flex items-center space-x-3 border-l border-slate-800 pl-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xs shadow">
              {user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'CU'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-white leading-tight">{user?.name || 'Customer'}</p>
              <p className="text-[10px] text-teal-400 font-medium">Customer Portal</p>
            </div>
            <button
              onClick={() => { logoutAdmin(); navigate('/login', { replace: true }); }}
              title="Sign Out"
              className="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ================= DASHBOARD MAIN LAYOUT ================= */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 md:p-6 gap-6">
        {/* SIDEBAR NAVIGATION (DESKTOP & TABLET) */}
        <aside className="w-full md:w-64 flex-shrink-0 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-3 px-2">Navigation Menu</p>
            
            <nav className="space-y-1">
              {[
                { id: 'overview', label: 'Overview & Home', icon: Sparkles },
                { id: 'book', label: 'Book a Service', icon: Plus, badge: 'Instant' },
                { id: 'tracker', label: 'Live GPS Radar', icon: Navigation, badge: 'Active' },
                { id: 'bookings', label: 'My Bookings', icon: Calendar },
                { id: 'chat', label: 'Technician Chat', icon: MessageCircle },
                { id: 'assistant', label: 'AI Help & Quotes', icon: Bot, highlight: true },
                { id: 'reviews', label: 'Reviews & Feedback', icon: Star },
                { id: 'settings', label: 'Settings & Security', icon: Sliders }
              ].map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-teal-600 text-white shadow-md'
                        : item.highlight
                        ? 'text-teal-300 hover:bg-teal-500/10 hover:text-teal-200'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-teal-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        item.badge === 'Active'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-teal-500/20 text-teal-300'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick Help Card */}
          <div className="bg-gradient-to-br from-slate-900 to-teal-950/40 border border-teal-500/20 rounded-2xl p-4 text-xs space-y-2.5 shadow-lg">
            <div className="flex items-center space-x-2 text-teal-400 font-bold">
              <Phone className="w-4 h-4" />
              <span>24/7 Emergency Dispatch</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Need urgent electrical or gas leak repair? Our emergency hotline connects within 15 seconds.
            </p>
            <a
              href="tel:+918001234567"
              className="block text-center py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold rounded-xl border border-teal-500/30 transition"
            >
              Call 1800-FIELDFIX
            </a>
          </div>
        </aside>

        {/* MAIN DISPLAY CONTENT AREA */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* ================= TAB 1: OVERVIEW & HOME ================= */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* HERO BANNER */}
              <div className="bg-gradient-to-r from-teal-900/60 via-slate-900 to-slate-900 border border-teal-500/30 rounded-2xl p-6 relative overflow-hidden shadow-xl">
                <div className="max-w-xl space-y-2">
                  <span className="px-2.5 py-1 bg-teal-500/20 border border-teal-500/30 text-teal-300 text-[11px] font-bold rounded-lg uppercase tracking-wider">
                    {selectedCity} • Verified Hub
                  </span>
                  <h1 className="text-2xl font-display font-extrabold text-white">
                    Welcome back, {user?.name || 'Customer'}!
                  </h1>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Book certified field technicians in under 2 minutes. Transparent rates, real-time live GPS tracking, and Razorpay-protected checkout.
                  </p>
                  
                  <div className="pt-2 flex flex-wrap gap-2.5">
                    <button
                      onClick={() => setActiveTab('book')}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center space-x-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Book Service Now</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('tracker')}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center space-x-1.5"
                    >
                      <Navigation className="w-4 h-4 text-teal-400" />
                      <span>Track Active Technician</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* ACTIVE ONGOING SERVICE BANNER */}
              {bookingsList.some(b => b.status === 'IN_PROGRESS' || b.status === 'DISPATCHED') && (
                <div className="bg-slate-900 border border-teal-500/40 rounded-2xl p-5 shadow-lg relative">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></div>
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Active Service In Progress</span>
                    </div>
                    <span className="text-xs font-mono font-semibold text-slate-400">ID: BK-9101</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs">
                    <div>
                      <p className="text-slate-400">Assigned Technician</p>
                      <p className="text-sm font-bold text-white mt-0.5">David Miller</p>
                      <p className="text-[11px] text-teal-400">★ 4.9 (142 completed jobs)</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Live Status</p>
                      <p className="text-sm font-bold text-teal-300 mt-0.5">On-Site • Diagnostic Active</p>
                      <p className="text-[11px] text-slate-400">Started 25 mins ago</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setActiveTab('tracker')}
                        className="flex-1 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-center transition"
                      >
                        Open Live Radar
                      </button>
                      <button
                        onClick={() => setActiveTab('chat')}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-teal-400 rounded-xl border border-slate-700 transition"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* LOCATION SEASONAL RECOMMENDATIONS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                    <MapPinned className="w-4 h-4 text-teal-400" />
                    <span>Popular Services in {selectedCity}</span>
                  </h2>
                  <span className="text-xs text-slate-400">Based on recent local bookings</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(citySuggestions[selectedCity] || citySuggestions['Bangalore, KA']).map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedService(serviceCatalog[idx % serviceCatalog.length]);
                        setActiveTab('book');
                      }}
                      className="bg-slate-900 border border-slate-800 hover:border-teal-500/60 p-3.5 rounded-xl cursor-pointer group transition shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg">✨</span>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 group-hover:translate-x-0.5 transition" />
                      </div>
                      <p className="text-xs font-bold text-white mt-2 group-hover:text-teal-300 transition">{item}</p>
                      <p className="text-[11px] text-slate-400 mt-1">Starting from ₹1,000</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* SERVICE CATALOG GRID */}
              <div className="space-y-3 pt-2">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Explore All Field Services</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {serviceCatalog.map(service => (
                    <div
                      key={service.id}
                      className="bg-slate-900 border border-slate-800 hover:border-teal-500/60 rounded-2xl p-5 flex flex-col justify-between group transition shadow-md"
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <span className="text-3xl">{service.icon}</span>
                          {service.popular && (
                            <span className="px-2 py-0.5 bg-teal-500/20 border border-teal-500/30 text-teal-300 text-[10px] font-bold rounded-md">
                              Popular
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-white mt-3 group-hover:text-teal-300 transition">{service.title}</h3>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{service.desc}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-slate-400">Fixed Base Fee</p>
                          <p className="text-base font-bold text-emerald-400">₹{service.price}</p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedService(service);
                            setActiveTab('book');
                          }}
                          className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow transition"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: BOOK A SERVICE (RAZORPAY INTEGRATION) ================= */}
          {activeTab === 'book' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-lg font-display font-bold text-white flex items-center space-x-2">
                  <Plus className="w-5 h-5 text-teal-400" />
                  <span>Instant Service Booking & Razorpay Checkout</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select your problem, schedule appointment, and confirm with safe online payment.
                </p>
              </div>

              {/* Problem suggestions pills */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Common Issues (1-Click Fill)</p>
                <div className="flex flex-wrap gap-2">
                  {problemSuggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        const target = serviceCatalog.find(s => s.id === item.catId);
                        if (target) setSelectedService(target);
                        setBookingNotes(`Issue: ${item.label}`);
                      }}
                      className="px-3 py-1.5 bg-slate-950 hover:bg-teal-500/10 border border-slate-800 hover:border-teal-500/50 text-slate-300 text-xs rounded-xl transition"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleCreateBooking} className="space-y-5">
                {/* 1. Service Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-2">1. Choose Service Category</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredServices.map(service => (
                      <div
                        key={service.id}
                        onClick={() => setSelectedService(service)}
                        className={`p-4 rounded-xl border cursor-pointer transition flex items-center space-x-3 ${
                          selectedService?.id === service.id
                            ? 'bg-teal-950/60 border-teal-500 ring-2 ring-teal-500/30'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-2xl">{service.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{service.title}</p>
                          <p className="text-xs font-bold text-emerald-400">₹{service.price}</p>
                        </div>
                        {selectedService?.id === service.id && (
                          <CheckCircle2 className="w-5 h-5 text-teal-400 flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Date & Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">2. Preferred Date</label>
                    <input
                      type="date"
                      value={bookingDate}
                      onChange={e => setBookingDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Preferred Time Slot</label>
                    <select
                      value={bookingTime}
                      onChange={e => setBookingTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                    >
                      <option value="10:00 AM">Morning: 10:00 AM - 12:00 PM</option>
                      <option value="14:00 PM">Afternoon: 02:00 PM - 04:00 PM</option>
                      <option value="17:00 PM">Evening: 05:00 PM - 07:00 PM</option>
                      <option value="20:00 PM">Night Emergency: 08:00 PM - 10:00 PM</option>
                    </select>
                  </div>
                </div>

                {/* 3. Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">3. Service Location Address</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-teal-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={bookingAddress}
                      onChange={e => setBookingAddress(e.target.value)}
                      placeholder="Enter flat/house no, street, landmark..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                      required
                    />
                  </div>
                </div>

                {/* 4. Problem Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">4. Problem Details & Specifics</label>
                  <textarea
                    rows={2}
                    value={bookingNotes}
                    onChange={e => setBookingNotes(e.target.value)}
                    placeholder="Describe symptoms (e.g., error codes, water drip location, unusual noise)..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-teal-500"
                  ></textarea>
                </div>

                {/* 5. Promo Code & Price Summary */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter Promo Code (e.g. FIELDFIX100)"
                      value={promoCode}
                      onChange={e => setPromoCode(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white uppercase focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (promoCode.toUpperCase() === 'FIELDFIX100' || promoCode.toUpperCase() === 'WELCOME') {
                          setDiscountApplied(100);
                          alert('Promo applied: ₹100 Discount!');
                        } else {
                          alert('Invalid promo code. Try "FIELDFIX100"');
                        }
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-400 font-bold rounded-lg border border-slate-700"
                    >
                      Apply
                    </button>
                  </div>

                  <div className="border-t border-slate-800 pt-2 space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span>Base Service Cost:</span>
                      <span>₹{selectedService ? selectedService.price : 0}</span>
                    </div>
                    {discountApplied > 0 && (
                      <div className="flex justify-between text-emerald-400">
                        <span>Discount:</span>
                        <span>-₹{discountApplied}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-white font-bold text-sm pt-1 border-t border-slate-800">
                      <span>Total Payable:</span>
                      <span className="text-emerald-400">
                        ₹{selectedService ? Math.max(0, selectedService.price - discountApplied) : 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submit / Pay Button */}
                <button
                  type="submit"
                  disabled={!selectedService || isBookingSubmitting}
                  className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>
                    {isBookingSubmitting
                      ? 'Launching Razorpay Secure Gateway...'
                      : `Pay ₹${selectedService ? Math.max(0, selectedService.price - discountApplied) : 0} & Confirm Booking`}
                  </span>
                </button>
              </form>
            </div>
          )}

          {/* ================= TAB 3: LIVE GPS TRACKER & RADAR ================= */}
          {activeTab === 'tracker' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-display font-bold text-white flex items-center space-x-2">
                    <Navigation className="w-5 h-5 text-teal-400" />
                    <span>Live Technician Radar & Map Tracking</span>
                  </h2>
                  <p className="text-xs text-slate-400">Real-time WebSocket telemetry from assigned field technician</p>
                </div>

                <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="text-slate-300 font-semibold">GPS Active (10Hz)</span>
                </div>
              </div>

              {/* SIMULATED LIVE MAP CONTAINER */}
              <div className="w-full h-80 bg-slate-950 rounded-2xl border border-slate-800 relative overflow-hidden flex items-center justify-center shadow-inner">
                {/* Radar Grid Pattern */}
                <div
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(#14b8a6 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                  }}
                ></div>

                {/* Concentric radar rings */}
                <div className="absolute w-[400px] h-[400px] rounded-full border border-teal-500/10 pointer-events-none"></div>
                <div className="absolute w-[240px] h-[240px] rounded-full border border-teal-500/20 pointer-events-none animate-pulse"></div>

                {/* Customer Pin */}
                <div className="absolute top-1/2 left-1/4 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="px-2.5 py-1 bg-slate-900 border border-slate-700 text-[10px] text-white font-bold rounded-lg shadow-lg mb-1">
                    Your Location (Prestige Palms)
                  </div>
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-glow-emerald">
                    <MapPin className="w-4 h-4" />
                  </div>
                </div>

                {/* Technician Moving Pin */}
                <div
                  className="absolute top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-1000"
                  style={{ left: `${techGpsProgress}%` }}
                >
                  <div className="px-2.5 py-1 bg-slate-900 border border-teal-500 text-[10px] text-teal-300 font-bold rounded-lg shadow-lg mb-1 whitespace-nowrap flex items-center space-x-1">
                    <Radio className="w-3 h-3 text-teal-400 animate-pulse" />
                    <span>David M. (En Route • 32 km/h)</span>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-teal-500/30 border-2 border-teal-400 flex items-center justify-center text-teal-400 shadow-glow-sky animate-bounce">
                    <Navigation className="w-4 h-4 rotate-45" />
                  </div>
                </div>

                {/* Status Overlay Footer */}
                <div className="absolute bottom-3 left-3 right-3 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                      alt="Tech"
                      className="w-8 h-8 rounded-full object-cover border border-teal-500"
                    />
                    <div>
                      <p className="font-bold text-white">David Miller (Senior HVAC Tech)</p>
                      <p className="text-slate-400 text-[11px]">Vehicle: TVS Jupiter (KA-01-EQ-9082)</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setActiveTab('chat')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-lg font-bold border border-slate-700"
                    >
                      Chat
                    </button>
                    <a
                      href="tel:+919876543210"
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-bold"
                    >
                      Call Technician
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 4: MY BOOKINGS & INVOICES ================= */}
          {activeTab === 'bookings' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-display font-bold text-white flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-teal-400" />
                    <span>My Bookings & Digital Invoices</span>
                  </h2>
                  <p className="text-xs text-slate-400">View ticket status, billing receipts, and service guarantees</p>
                </div>
                <button
                  onClick={() => setActiveTab('book')}
                  className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow transition"
                >
                  + New Booking
                </button>
              </div>

              <div className="space-y-4">
                {bookingsList.map(booking => (
                  <div
                    key={booking.id}
                    className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-5 space-y-3 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-teal-400">{booking.id}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-xs font-semibold text-slate-400">{booking.date}</span>
                        </div>
                        <h3 className="text-sm font-bold text-white mt-1">{booking.service}</h3>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase w-max ${
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

                    <p className="text-xs text-slate-400 flex items-center">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 mr-1 flex-shrink-0" />
                      <span className="truncate">{booking.address}</span>
                    </p>

                    <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="text-slate-400">Total Billed: </span>
                        <strong className="text-white font-bold">₹{booking.amount}</strong>
                        <span className="ml-2 text-emerald-400 font-semibold font-mono">({booking.paymentStatus})</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedInvoice(booking)}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition flex items-center space-x-1"
                        >
                          <FileText className="w-3.5 h-3.5 text-teal-400" />
                          <span>View Invoice</span>
                        </button>

                        {booking.status === 'COMPLETED' && (
                          <button
                            onClick={() => setReviewModalBooking(booking)}
                            className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg transition flex items-center space-x-1"
                          >
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            <span>{booking.rating ? `Rated ★${booking.rating}` : 'Rate Service'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= TAB 5: TECHNICIAN CHAT ================= */}
          {activeTab === 'chat' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col h-[520px] animate-in fade-in duration-200">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                    alt="Tech"
                    className="w-10 h-10 rounded-full object-cover border border-teal-500"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-white">David Miller</h3>
                    <p className="text-xs text-emerald-400 flex items-center">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1 animate-pulse"></span>
                      Assigned Technician (BK-9101)
                    </p>
                  </div>
                </div>

                <a
                  href="tel:+919876543210"
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-teal-400 rounded-xl border border-slate-700 transition"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-xs md:max-w-md p-3 rounded-2xl text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-teal-600 text-white rounded-br-none'
                          : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.time}</span>
                  </div>
                ))}
              </div>

              {/* Quick Prompt Chips */}
              <div className="flex gap-2 overflow-x-auto pb-2 pt-1 border-t border-slate-800 text-[11px]">
                {['Where are you?', 'Please ring the doorbell', 'The gate passcode is 4022', 'Do you have the spare capacitor?'].map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => setChatInput(chip)}
                    className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-teal-300 rounded-lg whitespace-nowrap transition"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendChat} className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Type a message to David..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* ================= TAB 6: AI ASSISTANT & CHATBOT ================= */}
          {activeTab === 'assistant' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col h-[520px] animate-in fade-in duration-200">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-teal-500/10 border border-teal-500/30 rounded-xl text-teal-400">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center space-x-1.5">
                      <span>FieldFix AI Assistant</span>
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    </h3>
                    <p className="text-xs text-slate-400">Instant trouble diagnosis, estimates & booking guidance</p>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-md">
                  Active
                </span>
              </div>

              {/* Bot Message Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {botMessages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-xs md:max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-teal-600 text-white rounded-br-none'
                          : 'bg-slate-950 border border-teal-500/20 text-slate-200 rounded-bl-none shadow-md'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.time}</span>
                  </div>
                ))}
                {isBotTyping && (
                  <div className="flex items-center space-x-1.5 bg-slate-950 p-3 rounded-2xl border border-slate-800 w-max text-xs text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce"></span>
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce delay-100"></span>
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce delay-200"></span>
                    <span className="ml-1 text-[11px]">FieldFix AI is typing...</span>
                  </div>
                )}
              </div>

              {/* Quick AI Prompts */}
              <div className="flex gap-2 overflow-x-auto pb-2 pt-1 border-t border-slate-800 text-[11px]">
                {['How much does AC repair cost?', 'Why is my MCB tripping?', 'What is covered under warranty?'].map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => setBotInput(chip)}
                    className="px-2.5 py-1 bg-slate-950 hover:bg-teal-500/10 border border-slate-800 text-slate-400 hover:text-teal-300 rounded-lg whitespace-nowrap transition"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendBot} className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Ask anything (e.g. diagnostic advice, rate card)..."
                  value={botInput}
                  onChange={e => setBotInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* ================= TAB 7: REVIEWS & FEEDBACK ================= */}
          {activeTab === 'reviews' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-display font-bold text-white flex items-center space-x-2">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    <span>Customer Feedback & Ratings</span>
                  </h2>
                  <p className="text-xs text-slate-400">Verified service reviews across all technician dispatches</p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-extrabold text-white">4.9★</span>
                  <span className="text-xs text-slate-400">Overall Rating (500+ jobs)</span>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                {reviewsFeed.map(review => (
                  <div key={review.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">{review.userName}</p>
                        <p className="text-[11px] text-teal-400">{review.service}</p>
                      </div>
                      <div className="flex items-center space-x-1 text-amber-400 font-bold text-xs">
                        <span>★</span>
                        <span>{review.rating}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{review.comment}</p>

                    <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{review.date}</span>
                      <button
                        onClick={() => {
                          setReviewsFeed(prev =>
                            prev.map(r =>
                              r.id === review.id ? { ...r, helpfulCount: r.helpfulCount + 1 } : r
                            )
                          );
                        }}
                        className="flex items-center space-x-1 text-slate-400 hover:text-teal-300 transition"
                      >
                        <ThumbsUp className="w-3 h-3" />
                        <span>Helpful ({review.helpfulCount})</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= TAB 8: SETTINGS & PROFILE ================= */}
          {activeTab === 'settings' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-lg font-display font-bold text-white flex items-center space-x-2">
                  <Sliders className="w-5 h-5 text-teal-400" />
                  <span>Account Settings & Security</span>
                </h2>
                <p className="text-xs text-slate-400">Manage profile data, address book, and security verifications</p>
              </div>

              <div className="space-y-5 text-xs">
                {/* Profile Card */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <h3 className="font-bold text-white uppercase tracking-wider text-[11px]">Personal Profile</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">Full Name</label>
                      <input
                        type="text"
                        defaultValue={user?.name || 'Sarah Jenkins'}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Phone Number</label>
                      <input
                        type="text"
                        defaultValue="+91 98451 22334"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Email Verification Section */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white">{user?.email || 'customer@fieldfix.io'}</p>
                    <p className="text-[11px] text-slate-400">
                      {isEmailVerified ? 'Email is verified and active' : 'Email verification pending'}
                    </p>
                  </div>

                  {isEmailVerified ? (
                    <span className="flex items-center space-x-1 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verified</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => setIsOtpModalOpen(true)}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition"
                    >
                      Verify with OTP
                    </button>
                  )}
                </div>

                {/* Notifications Preferences */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
                  <h3 className="font-bold text-white uppercase tracking-wider text-[11px]">Communication & Alerts</h3>
                  
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-300">SMS & WhatsApp Real-Time Dispatch Alerts</span>
                    <input type="checkbox" defaultChecked className="accent-teal-500 w-4 h-4" />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-300">Email Invoices & Digital Receipts</span>
                    <input type="checkbox" defaultChecked className="accent-teal-500 w-4 h-4" />
                  </label>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ================= OTP VERIFICATION MODAL ================= */}
      {isOtpModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsOtpModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center mx-auto">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Verify Your Email</h3>
              <p className="text-xs text-slate-400">
                We sent a 6-digit verification code to <strong className="text-white">{user?.email || 'customer@fieldfix.io'}</strong>
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="mt-5 space-y-4">
              <input
                type="text"
                maxLength={6}
                placeholder="1 2 3 4 5 6"
                value={otpInput}
                onChange={e => setOtpInput(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center tracking-[0.5em] text-lg font-mono font-bold bg-slate-950 border border-slate-800 rounded-xl py-3 text-white focus:outline-none focus:border-teal-500"
                required
              />

              {otpSuccessMsg && (
                <p className="text-xs text-emerald-400 text-center font-semibold">{otpSuccessMsg}</p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow transition"
              >
                Confirm Verification
              </button>

              <p className="text-[11px] text-center text-slate-400">
                Test OTP code: <span className="font-mono font-bold text-teal-400">123456</span>
              </p>
            </form>
          </div>
        </div>
      )}

      {/* ================= BOOKING SUCCESS MODAL ================= */}
      {bookingSuccessModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 mx-auto shadow-glow-emerald">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">Payment & Booking Confirmed!</h3>
              <p className="text-xs text-slate-400 mt-1">
                Razorpay payment was successful. Technician allocated in real-time.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Booking ID:</span>
                <span className="font-mono font-bold text-teal-400">{bookingSuccessModal.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Service:</span>
                <span className="font-bold text-white">{bookingSuccessModal.service}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Tech:</span>
                <span className="font-bold text-teal-300">{bookingSuccessModal.technicianName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Paid:</span>
                <span className="font-bold text-emerald-400">₹{bookingSuccessModal.amount}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setBookingSuccessModal(null);
                  setActiveTab('tracker');
                }}
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow transition"
              >
                Track on Live Radar →
              </button>
              <button
                onClick={() => setBookingSuccessModal(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= INVOICE MODAL ================= */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedInvoice(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-slate-800 pb-4 mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Tax Invoice / Receipt</h3>
                <p className="text-xs text-slate-400 font-mono">INV-{selectedInvoice.id}</p>
              </div>
              <div className="text-right text-xs">
                <p className="text-slate-400">FieldFix Tech Pvt Ltd</p>
                <p className="text-emerald-400 font-bold">PAID (Razorpay)</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Billed To:</span>
                <span className="font-bold text-white">{user?.name || 'Customer'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Service Description:</span>
                <span className="font-bold text-slate-200">{selectedInvoice.service}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Scheduled Date:</span>
                <span className="text-slate-300">{selectedInvoice.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Technician:</span>
                <span className="text-slate-300">{selectedInvoice.technicianName}</span>
              </div>
              <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-sm text-white">
                <span>Total Amount:</span>
                <span className="text-emerald-400">₹{selectedInvoice.amount}</span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end space-x-2">
              <button
                onClick={() => {
                  alert('Downloading tax invoice PDF...');
                  setSelectedInvoice(null);
                }}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center space-x-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= REVIEW RATING MODAL ================= */}
      {reviewModalBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setReviewModalBooking(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-1">Rate Service Experience</h3>
            <p className="text-xs text-slate-400 mb-4">{reviewModalBooking.service}</p>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div className="flex justify-center space-x-2 py-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewRating(star)}
                    className={`text-2xl transition ${
                      star <= newRating ? 'text-amber-400 scale-110' : 'text-slate-600'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Your Feedback & Remarks</label>
                <textarea
                  rows={3}
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Share details regarding timeliness, technician demeanor, and repair quality..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-teal-500"
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow transition"
              >
                Submit Review
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
