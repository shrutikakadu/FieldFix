import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  ArrowLeft,
  DollarSign,
  CheckCircle2,
  Clock,
  Users,
  LayoutDashboard,
  Calendar,
  Layers,
  ArrowUpRight,
  Shield
} from 'lucide-react';

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('MONTH');

  const monthlyRevenue = [
    { month: 'Apr', amount: 48000, jobs: 62 },
    { month: 'May', amount: 62000, jobs: 84 },
    { month: 'Jun', amount: 75000, jobs: 105 },
    { month: 'Jul', amount: 91000, jobs: 128 },
    { month: 'Aug', amount: 114000, jobs: 165 },
    { month: 'Sep', amount: 142500, jobs: 210 }
  ];

  const categoryShare = [
    { name: 'HVAC & Cooling', percent: 38, count: 80, color: 'bg-teal-500' },
    { name: 'Electrical Wiring', percent: 26, count: 55, color: 'bg-emerald-500' },
    { name: 'Plumbing Services', percent: 18, count: 38, color: 'bg-cyan-500' },
    { name: 'Smart Home Installation', percent: 12, count: 25, color: 'bg-indigo-500' },
    { name: 'Appliance Repair', percent: 6, count: 12, color: 'bg-amber-500' }
  ];

  const topTechs = [
    { name: 'David Miller', rating: 4.9, completed: 142, revenue: '₹1,98,000', onTimeRate: '98%' },
    { name: 'Elena Rostova', rating: 4.8, completed: 98, revenue: '₹1,34,500', onTimeRate: '96%' },
    { name: 'Priya Sharma', rating: 4.95, completed: 78, revenue: '₹1,12,000', onTimeRate: '99%' },
    { name: 'Marcus Vance', rating: 4.7, completed: 115, revenue: '₹1,26,000', onTimeRate: '94%' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-teal-500/10 border border-teal-500/30 rounded-xl text-teal-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-wide">Operations & Revenue Analytics</h1>
              <p className="text-xs text-slate-400">Field performance, service volume & technician analytics</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-teal-400" />
            <span>Dispatch Board</span>
          </button>
          <button
            onClick={() => navigate('/admin/technicians')}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition"
          >
            <Users className="w-3.5 h-3.5 text-teal-400" />
            <span>Technicians</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="uppercase font-semibold">Total Revenue (MTD)</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-2">₹1,42,500</p>
            <p className="text-xs text-emerald-400 font-medium mt-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> +24.8% vs last month
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="uppercase font-semibold">Completed Jobs</span>
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-2">210</p>
            <p className="text-xs text-teal-400 font-medium mt-1">98.2% fulfillment rate</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="uppercase font-semibold">Avg Dispatch-to-Site</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-2">22.4 mins</p>
            <p className="text-xs text-emerald-400 font-medium mt-1">↓ 4.1 mins faster</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="uppercase font-semibold">Customer CSAT</span>
              <Shield className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-2">4.88 / 5.0</p>
            <p className="text-xs text-indigo-400 font-medium mt-1">Based on 185 reviews</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Bar Chart */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Revenue Growth Trend</h3>
                <p className="text-xs text-slate-400">Monthly gross billing and volume</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-800 text-teal-400 rounded-md">
                Last 6 Months
              </span>
            </div>

            {/* Custom SVG Bar Chart */}
            <div className="h-56 flex items-end justify-between gap-4 pt-4 border-b border-slate-800 pb-2">
              {monthlyRevenue.map((item, idx) => {
                const heightPercent = Math.round((item.amount / 150000) * 100);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="text-[11px] font-semibold text-teal-400 opacity-0 group-hover:opacity-100 transition">
                      ₹{(item.amount / 1000).toFixed(0)}k
                    </div>
                    <div className="w-full bg-slate-800/80 rounded-t-lg h-44 flex items-end p-1">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full bg-gradient-to-t from-teal-600 to-teal-400 rounded-t-md transition-all duration-500 group-hover:brightness-110"
                      />
                    </div>
                    <span className="text-xs text-slate-400 font-medium">{item.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category Share */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Service Demand Breakdown</h3>
            <p className="text-xs text-slate-400 mb-6">Distribution by service category</p>

            <div className="space-y-4">
              {categoryShare.map((cat, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">{cat.name}</span>
                    <span className="text-white font-bold">{cat.percent}% ({cat.count} jobs)</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${cat.color}`}
                      style={{ width: `${cat.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Technician Performance Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Top Performing Technicians</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Technician</th>
                  <th className="p-3">Rating</th>
                  <th className="p-3">Completed Jobs</th>
                  <th className="p-3">Total Billed</th>
                  <th className="p-3">On-Time SLA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {topTechs.map((tech, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-semibold text-white">{tech.name}</td>
                    <td className="p-3 text-amber-400 font-bold">★ {tech.rating}</td>
                    <td className="p-3">{tech.completed}</td>
                    <td className="p-3 font-medium text-emerald-400">{tech.revenue}</td>
                    <td className="p-3 text-teal-400 font-semibold">{tech.onTimeRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
