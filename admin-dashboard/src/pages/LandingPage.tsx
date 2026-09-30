import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, Shield, Clock, Star, ChevronRight, Zap, Users, CheckCircle2, ArrowRight, Sparkles, Phone, Headphones } from 'lucide-react';
import { isAuthenticated, getStoredUser } from '../services/auth';

export default function LandingPage() {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const loggedIn = isAuthenticated();
  const currentUser = getStoredUser();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const services = [
    { icon: '❄️', title: 'HVAC & Air Conditioning', desc: 'Expert heating, ventilation & cooling services for your home or office', price: '₹1,500' },
    { icon: '⚡', title: 'Electrical Wiring', desc: 'Professional wiring inspection, repair & smart panel installation', price: '₹1,200' },
    { icon: '🔧', title: 'Plumbing Services', desc: 'Pipe fitting, leak repair, drainage & water heater servicing', price: '₹1,000' },
    { icon: '🏠', title: 'Smart Home Setup', desc: 'Smart thermostat, security cameras & home automation installation', price: '₹2,000' },
    { icon: '🔩', title: 'Appliance Repair', desc: 'Washing machine, refrigerator & kitchen appliance servicing', price: '₹800' },
    { icon: '🛡️', title: 'Annual Maintenance', desc: 'Complete home maintenance contracts with priority scheduling', price: '₹5,000/yr' },
  ];

  const stats = [
    { number: '10,000+', label: 'Homes Serviced' },
    { number: '500+', label: 'Expert Technicians' },
    { number: '4.9★', label: 'Customer Rating' },
    { number: '<30 min', label: 'Avg Response' },
  ];

  return (
    <div className="min-h-screen bg-sage-50 text-sage-900 font-sans selection:bg-sage-300 selection:text-sage-900">
      {/* ===================== NAVIGATION BAR ===================== */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-xl shadow-md border-b border-sage-200' : 'bg-white/60 backdrop-blur-md border-b border-sage-200/50'}`}>
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="flex items-center space-x-2 bg-sage-500 text-white px-3.5 py-2 rounded-xl shadow-md">
              <Wrench className="w-5 h-5" />
              <span className="font-display font-extrabold text-lg tracking-wider">FieldFix</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <a href="#services" className="text-sm font-semibold text-sage-600 hover:text-sage-800 transition">Services</a>
            <a href="#how-it-works" className="text-sm font-semibold text-sage-600 hover:text-sage-800 transition">How It Works</a>
            <a href="#stats" className="text-sm font-semibold text-sage-600 hover:text-sage-800 transition">About</a>
          </nav>

          <div className="flex items-center space-x-2.5">
            {loggedIn && currentUser ? (
              <button
                onClick={() => navigate(currentUser.role === 'ADMIN' ? '/admin/dashboard' : '/customer/dashboard')}
                className="px-4 py-2 bg-sage-500 hover:bg-sage-600 text-white text-xs font-bold rounded-xl shadow-sm transition"
              >
                Go to {currentUser.role === 'ADMIN' ? 'Admin Dashboard' : 'My Account'} →
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login?role=customer')}
                  className="px-3.5 py-2 text-xs font-bold text-sage-700 hover:bg-sage-100/80 rounded-xl transition border border-sage-200"
                >
                  Customer Sign In
                </button>
                <button
                  onClick={() => navigate('/login?role=admin')}
                  className="px-3.5 py-2 bg-sage-700 hover:bg-sage-800 text-white text-xs font-bold rounded-xl shadow-sm transition"
                >
                  Admin Portal
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ===================== HERO SECTION ===================== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Background decorations */}
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-sage-200/50 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-sage-300/30 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-[30%] left-[50%] w-[200px] h-[200px] bg-sage-400/10 rounded-full blur-[60px] pointer-events-none animate-pulse" />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #4d7f4d 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-sage-100 border border-sage-200 text-sage-600 px-4 py-2 rounded-full text-xs font-semibold mb-8 animate-float">
            <Sparkles className="w-4 h-4 text-sage-500" />
            <span>Trusted by 10,000+ homeowners across India</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-display font-extrabold text-sage-900 tracking-tight leading-tight mb-6">
            Expert Home Services
            <br />
            <span className="text-sage-500">At Your Doorstep</span>
          </h1>

          <p className="text-lg md:text-xl text-sage-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            From AC repairs to smart home setup — book verified technicians in minutes. 
            Real-time tracking, transparent pricing, and 100% satisfaction guaranteed.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={() => navigate('/register')}
              className="group flex items-center space-x-2 px-8 py-4 bg-sage-500 hover:bg-sage-600 text-white text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all active:scale-95"
              id="hero-get-started"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="flex items-center space-x-2 px-8 py-4 bg-white hover:bg-sage-50 text-sage-700 text-lg font-semibold rounded-2xl border-2 border-sage-200 hover:border-sage-300 shadow-md transition-all active:scale-95"
              id="hero-sign-in"
            >
              <span>I Have an Account</span>
            </button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-sage-500">
            <div className="flex items-center space-x-1.5">
              <Shield className="w-4 h-4 text-sage-400" />
              <span>Verified Technicians</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-sage-400" />
              <span>30-Min Response</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Star className="w-4 h-4 text-sage-400" />
              <span>4.9★ Rated</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-sage-400" />
              <span>Money-Back Guarantee</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== STATS BAR ===================== */}
      <section id="stats" className="bg-sage-500 py-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center">
              <p className="text-3xl md:text-4xl font-display font-extrabold text-white mb-1">{stat.number}</p>
              <p className="text-sage-100 text-sm font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== SERVICES GRID ===================== */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center space-x-2 bg-sage-100 text-sage-600 px-4 py-2 rounded-full text-xs font-semibold mb-4">
              <Wrench className="w-3.5 h-3.5" />
              <span>OUR SERVICES</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-extrabold text-sage-900 mb-4">
              What We <span className="text-sage-500">Fix</span>
            </h2>
            <p className="text-sage-500 text-lg max-w-xl mx-auto">
              Professional service for every need — all backed by trained, verified experts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, idx) => (
              <div
                key={idx}
                className="group p-6 bg-sage-50/50 hover:bg-white rounded-2xl border border-sage-100 hover:border-sage-300 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
              >
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-lg font-bold text-sage-800 mb-2 group-hover:text-sage-600 transition">{service.title}</h3>
                <p className="text-sm text-sage-500 leading-relaxed mb-4">{service.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sage-600 font-bold text-sm">Starting at {service.price}</span>
                  <ChevronRight className="w-4 h-4 text-sage-400 group-hover:text-sage-600 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== HOW IT WORKS ===================== */}
      <section id="how-it-works" className="py-20 bg-sage-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center space-x-2 bg-sage-100 text-sage-600 px-4 py-2 rounded-full text-xs font-semibold mb-4">
              <Zap className="w-3.5 h-3.5" />
              <span>HOW IT WORKS</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-extrabold text-sage-900 mb-4">
              3 Simple <span className="text-sage-500">Steps</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: <Phone className="w-8 h-8" />, title: 'Book a Service', desc: 'Choose from our wide range of home services and book in under 2 minutes.' },
              { step: '02', icon: <Users className="w-8 h-8" />, title: 'Get Matched', desc: 'We assign the nearest verified technician with real-time GPS tracking.' },
              { step: '03', icon: <CheckCircle2 className="w-8 h-8" />, title: 'Job Done', desc: 'Your technician arrives, completes the work, and you pay securely online.' },
            ].map((item, idx) => (
              <div key={idx} className="relative text-center p-8 bg-white rounded-2xl border border-sage-100 shadow-sm hover:shadow-lg transition-all">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-sage-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Step {item.step}
                </div>
                <div className="w-16 h-16 bg-sage-100 text-sage-500 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-sage-800 mb-3">{item.title}</h3>
                <p className="text-sm text-sage-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== CTA SECTION ===================== */}
      <section className="py-20 bg-sage-500 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }} />

        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-display font-extrabold text-white mb-6">
            Ready to Get Your Home Fixed?
          </h2>
          <p className="text-sage-100 text-lg mb-10">
            Join thousands of happy homeowners. Book your first service today — it's free to sign up!
          </p>
          <button
            onClick={() => navigate('/register')}
            className="group inline-flex items-center space-x-2 px-10 py-4 bg-white text-sage-600 font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl hover:bg-sage-50 transition-all active:scale-95"
            id="cta-get-started"
          >
            <span>Get Started Now</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="bg-sage-900 text-sage-300 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 text-white mb-4">
                <Wrench className="w-5 h-5" />
                <span className="font-display font-extrabold text-lg">FieldFix</span>
              </div>
              <p className="text-sm text-sage-400 leading-relaxed">
                India's most trusted field service platform. Expert technicians, real-time tracking, guaranteed satisfaction.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-4">Services</h4>
              <ul className="space-y-2 text-sm text-sage-400">
                <li className="hover:text-sage-200 transition cursor-pointer">HVAC & AC Repair</li>
                <li className="hover:text-sage-200 transition cursor-pointer">Electrical Work</li>
                <li className="hover:text-sage-200 transition cursor-pointer">Plumbing</li>
                <li className="hover:text-sage-200 transition cursor-pointer">Smart Home</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-sage-400">
                <li className="hover:text-sage-200 transition cursor-pointer">About Us</li>
                <li className="hover:text-sage-200 transition cursor-pointer">Careers</li>
                <li className="hover:text-sage-200 transition cursor-pointer">Privacy Policy</li>
                <li className="hover:text-sage-200 transition cursor-pointer">Terms of Service</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-sage-400">
                <li className="flex items-center space-x-2 hover:text-sage-200 transition cursor-pointer">
                  <Headphones className="w-4 h-4" />
                  <span>Help Center</span>
                </li>
                <li className="flex items-center space-x-2 hover:text-sage-200 transition cursor-pointer">
                  <Phone className="w-4 h-4" />
                  <span>1800-FIELDFIX</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-sage-800 pt-6 text-center text-xs text-sage-500">
            © 2026 FieldFix Inc. All rights reserved. Built with ❤️ for Indian homes.
          </div>
        </div>
      </footer>
    </div>
  );
}
