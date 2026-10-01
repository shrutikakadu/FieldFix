import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Wrench,
  Users,
  UserPlus,
  BarChart3,
  Layers,
  LogOut,
  Search,
  RefreshCw,
  ShieldCheck,
  Zap,
  Menu,
  X
} from 'lucide-react';
import { logoutAdmin, getStoredUser } from '../services/auth';
import { socket } from '../services/socket';
import { fetchHealthStatus } from '../services/api';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab?: 'dashboard' | 'technicians' | 'register-tech' | 'analytics';
  onOpenRegisterModal?: () => void;
}

export default function AdminLayout({ children, activeTab = 'dashboard', onOpenRegisterModal }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const adminUser = getStoredUser();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean>(socket.connected);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Connected');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Check Socket & Gateway Health
    function updateGatewayHealth() {
      fetchHealthStatus()
        .then((data) => {
          if (data && data.timestamp) {
            setLastSyncTime(new Date(data.timestamp).toLocaleTimeString());
          }
        })
        .catch(() => {
          setLastSyncTime(new Date().toLocaleTimeString());
        });
    }

    updateGatewayHealth();
    const interval = setInterval(updateGatewayHealth, 30000);

    function onConnect() {
      setIsConnected(true);
    }
    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      clearInterval(interval);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  const handleLogout = () => {
    logoutAdmin();
    navigate('/login', { replace: true });
  };

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dispatch Board',
      path: '/admin/dashboard',
      icon: Layers,
      badge: 'Live',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      description: 'Real-time telemetry & active jobs'
    },
    {
      id: 'technicians',
      label: 'Technician Staff',
      path: '/admin/technicians',
      icon: Users,
      badge: '12 Active',
      badgeColor: 'bg-sage-500/20 text-sage-700 border-sky-500/30',
      description: 'Manage technicians & availability'
    },
    {
      id: 'register-tech',
      label: 'Register Technician',
      path: '/admin/technicians/register',
      icon: UserPlus,
      badge: 'Verified',
      badgeColor: 'bg-[#2d5a27]/30 text-emerald-300 border-emerald-500/30',
      description: 'Add ID-verified field staff'
    },
    {
      id: 'analytics',
      label: 'Analytics & Revenue',
      path: '/admin/analytics',
      icon: BarChart3,
      badge: 'MTD',
      badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      description: 'Growth charts & SLA metrics'
    }
  ];

  return (
    <div className="min-h-screen bg-sage-50 text-slate-100 flex flex-col md:flex-row font-sans selection:bg-sage-500 selection:text-sage-900 antialiased">
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside
        className={`hidden md:flex flex-col justify-between bg-white/95 backdrop-blur-2xl border-r border-sage-200/80 transition-all duration-300 z-50 sticky top-0 h-screen ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Top Header & Brand */}
        <div>
          <div className="p-4 flex items-center justify-between border-b border-sage-200/80">
            <Link to="/admin/dashboard" className="flex items-center space-x-3 group overflow-hidden">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 text-sage-900 shadow-md group-hover:scale-105 transition-transform flex-shrink-0">
                <Wrench className="w-5 h-5 animate-pulse" />
              </div>
              {sidebarOpen && (
                <div className="flex flex-col">
                  <span className="font-display font-extrabold text-lg tracking-wider text-sage-900 flex items-center space-x-1">
                    <span>FieldFix</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-sage-500/20 text-sage-700 font-mono">PRO</span>
                  </span>
                  <span className="text-[10px] text-sage-600 font-medium tracking-tight">Admin Command Center</span>
                </div>
              )}
            </Link>

            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg bg-sage-100/80 hover:bg-sage-200 text-sage-600 hover:text-sage-900 transition"
              title={sidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>

          {/* Real-time Status Badge */}
          {sidebarOpen && (
            <div className="mx-4 mt-4 p-3 rounded-xl bg-sage-50/80 border border-sage-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-sage-600 uppercase tracking-wider flex items-center space-x-1">
                  <Zap className="w-3 h-3 text-sage-700" />
                  <span>Gateway Telemetry</span>
                </span>
                <span className="flex h-2 w-2 relative">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isConnected ? 'bg-emerald-400 opacity-75' : 'bg-rose-400 opacity-75'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                </span>
              </div>
              <p className="text-[11px] text-sage-700 font-medium">
                {isConnected ? `Online (${lastSyncTime})` : 'Reconnecting...'}
              </p>
            </div>
          )}

          {/* Quick Technician Register Button CTA */}
          {sidebarOpen && (
            <div className="px-4 mt-4">
              <button
                onClick={() => {
                  if (onOpenRegisterModal) onOpenRegisterModal();
                  else navigate('/admin/technicians/register');
                }}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-sage-900 text-xs font-bold shadow-glow-emerald transition active:scale-95 group"
              >
                <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>+ Register Technician</span>
              </button>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5 mt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id || location.pathname === item.path;

              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-sage-900 shadow-md font-bold'
                      : 'text-sage-600 hover:text-slate-100 hover:bg-sage-100/60'
                  }`}
                  title={item.label}
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-sage-900' : 'text-sage-600 group-hover:text-sage-700'}`} />
                    {sidebarOpen && <span className="truncate">{item.label}</span>}
                  </div>

                  {sidebarOpen && item.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Info & Logout */}
        <div className="p-4 border-t border-sage-200/80 bg-sage-50/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-sage-900 font-bold text-xs shadow-md flex-shrink-0">
                {adminUser?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'AD'}
              </div>
              {sidebarOpen && (
                <div className="flex flex-col text-left overflow-hidden">
                  <span className="text-xs font-bold text-sage-800 truncate">{adminUser?.name || 'Alex Danvers'}</span>
                  <span className="text-[10px] text-sage-700 font-medium truncate flex items-center">
                    <ShieldCheck className="w-3 h-3 mr-0.5 text-emerald-400 inline" />
                    {adminUser?.role || 'Head Dispatcher'}
                  </span>
                </div>
              )}
            </div>

            {sidebarOpen && (
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl bg-sage-100/80 hover:bg-rose-500/20 border border-sage-300/60 text-sage-600 hover:text-rose-400 transition"
                title="Sign Out Admin"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ================= MAIN CONTAINER ================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP NAVBAR */}
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-sage-200/80 px-4 md:px-8 py-3.5 flex items-center justify-between shadow-2xl">
          {/* Mobile Menu Toggle & Breadcrumbs */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-sage-100 text-sage-700 hover:text-sage-900"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center space-x-2 text-xs">
              <span className="text-sage-600 hidden sm:inline">Admin Portal</span>
              <span className="text-slate-600 hidden sm:inline">/</span>
              <span className="text-sage-900 font-bold capitalize">
                {activeTab === 'dashboard'
                  ? 'Dispatch Operations Control'
                  : activeTab === 'technicians'
                  ? 'Technician Directory & Availability'
                  : activeTab === 'register-tech'
                  ? 'Technician Registration Form'
                  : 'Analytics & Financial Telemetry'}
              </span>
            </div>
          </div>

          {/* Global Search & Action Buttons */}
          <div className="flex items-center space-x-3">
            {/* Global Search Bar */}
            <div className="hidden lg:flex items-center w-80 bg-sage-50 border border-sage-200 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20 rounded-xl px-3.5 py-1.5 transition-all">
              <Search className="w-3.5 h-3.5 text-sage-600 mr-2" />
              <input
                type="text"
                placeholder="Search technician ID, booking, customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none w-full"
              />
            </div>

            {/* Quick Action button for registering technician */}
            <button
              onClick={() => {
                if (onOpenRegisterModal) onOpenRegisterModal();
                else navigate('/admin/technicians/register');
              }}
              className="hidden sm:flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-sage-900 font-bold text-xs shadow-glow-emerald transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Register Tech</span>
            </button>

            {/* Live Gateway Indicator Pill */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-sage-50 border border-sage-200 text-xs">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isConnected ? 'bg-emerald-400 opacity-75' : 'bg-rose-400 opacity-75'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              </span>
              <span className="hidden xl:inline text-sage-700 font-medium">
                {isConnected ? `Gateway Active (${lastSyncTime})` : 'Offline'}
              </span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => window.location.reload()}
              title="Refresh Telemetry"
              className="p-2 rounded-xl bg-sage-100 hover:bg-sage-200 border border-sage-300 text-sage-700 hover:text-sage-900 transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-sage-700" />
            </button>
          </div>
        </header>

        {/* MOBILE MENU DROPDOWN */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-sage-200 p-4 space-y-2 animate-in slide-in-from-top duration-200">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate(item.path);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold ${
                  activeTab === item.id ? 'bg-sage-600 text-sage-900 font-bold' : 'text-sage-700 hover:bg-sage-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}

            <div className="pt-2 border-t border-sage-200 flex items-center justify-between">
              <span className="text-xs text-sage-600">{adminUser?.name || 'Admin User'}</span>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-rose-500/20 text-rose-400 rounded-lg text-xs font-semibold border border-rose-500/30"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* MAIN PAGE BODY CONTENT */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
