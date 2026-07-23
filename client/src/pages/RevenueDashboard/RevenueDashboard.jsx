import React, { useState } from 'react';
import {
  IndianRupee,
  TrendingUp,
  CreditCard,
  ShieldCheck,
  RotateCcw,
  ArrowUpRight,
  Sparkles,
  Zap,
  Lock,
  Search,
  Filter,
  DollarSign
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

const RevenueDashboard = () => {
  // Mock Revenue segments
  const revenueStats = [
    { title: 'Featured Showcase Rev', value: '₹4,20,000', change: '+18.2%', trend: 'up', color: 'text-amber-600 bg-amber-50' },
    { title: 'Premium Subs Rev', value: '₹6,42,000', change: '+24.5%', trend: 'up', color: 'text-purple-600 bg-purple-50' },
    { title: 'Boost Listings Rev', value: '₹1,80,000', change: '+8.1%', trend: 'up', color: 'text-orange-600 bg-orange-50' },
    { title: 'Escrow Booking Rev', value: '₹2,50,000', change: '+32.4%', trend: 'up', color: 'text-blue-600 bg-blue-50' }
  ];

  // Revenue chart data
  const revenueTrend = [
    { month: 'Jan', featured: 50000, premium: 80000, boost: 20000, escrow: 30000 },
    { month: 'Feb', featured: 70000, premium: 120000, boost: 30000, escrow: 40000 },
    { month: 'Mar', featured: 60000, premium: 110000, boost: 25000, escrow: 35000 },
    { month: 'Apr', featured: 90000, premium: 150000, boost: 40000, escrow: 50000 },
    { month: 'May', featured: 110000, premium: 180000, boost: 45000, escrow: 70000 },
    { month: 'Jun', featured: 140000, premium: 202000, boost: 50000, escrow: 90000 },
  ];

  // Escrow Token Request Logs
  const initialTokens = [
    { id: 'TKN-8830', buyer: 'Alok Mishra', seller: 'Vikram Developers', property: 'Godrej Woods Sec 43', amount: '₹50,000', status: 'Pending', date: '16 Jun 2026' },
    { id: 'TKN-4921', buyer: 'Sanjay Aggarwal', seller: 'Tata Value Homes', property: 'Tata Primanti Villa', amount: '₹1,00,000', status: 'Approved', date: '15 Jun 2026' },
    { id: 'TKN-3120', buyer: 'Pooja Mehta', seller: 'Sandeep Sharma', property: '3 BHK Builder Floor', amount: '₹25,000', status: 'Refunded', date: '14 Jun 2026' }
  ];

  const [tokens, setTokens] = useState(initialTokens);
  const [tokenFilter, setTokenFilter] = useState('All');

  // Approve token (release escrow to seller)
  const approveToken = (id) => {
    setTokens(tokens.map(t => t.id === id ? { ...t, status: 'Approved' } : t));
    alert(`Token escrow ID ${id} released to builder/seller profile successfully.`);
  };

  // Refund token
  const refundToken = (id) => {
    setTokens(tokens.map(t => t.id === id ? { ...t, status: 'Refunded' } : t));
    alert(`Refund transaction triggered. Wallet ledger updated for Token ID ${id}.`);
  };

  const filteredTokens = tokenFilter === 'All'
    ? tokens
    : tokens.filter(t => t.status === tokenFilter);

  return (
    <div className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {revenueStats.map((stat, idx) => (
          <div key={idx} className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center justify-between hover:shadow-md transition-all">
            <div className="space-y-1">
              <span className="text-[9px] font-semibold text-slate-400 block uppercase">{stat.title}</span>
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">{stat.value}</h3>
              <div className="flex items-center gap-1 text-[9px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full w-max">
                <ArrowUpRight size={10} /> {stat.change}
              </div>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stat.color}`}>
              <IndianRupee size={20} />
            </div>
          </div>
        ))}
      </div>

      {/* Stacked Chart Panel */}
      <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-4">
        <div>
          <h3 className="text-xs font-bold text-slate-800">Billing Category Growth</h3>
          <p className="text-[10px] text-slate-400">Monthly breakdown of individual revenue sources</p>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueTrend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="colorFeaturedRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF5A3C" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#FF5A3C" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPremiumRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F8FAFC" />
              <XAxis dataKey="month" stroke="#94A3B8" fontSize={10} tickLine={false} />
              <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
              <Tooltip 
                cursor={false}
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)', padding: '8px 12px' }}
                itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                labelStyle={{ color: '#94a3b8', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px' }}
              />
              <Legend verticalAlign="top" height={36} />
              <Area type="monotone" dataKey="premium" stackId="1" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorPremiumRev)" name="Premium Subs" activeDot={{ r: 4, strokeWidth: 0 }} />
              <Area type="monotone" dataKey="featured" stackId="1" stroke="#FF5A3C" fillOpacity={1} fill="url(#colorFeaturedRev)" name="Featured Showcase" activeDot={{ r: 4, strokeWidth: 0 }} />
              <Area type="monotone" dataKey="escrow" stackId="1" stroke="#3B82F6" fillOpacity={0} name="Escrow Commissions" activeDot={{ r: 4, strokeWidth: 0 }} />
              <Area type="monotone" dataKey="boost" stackId="1" stroke="#F59E0B" fillOpacity={0} name="Listing Boosts" activeDot={{ r: 4, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Escrow Token Requests Table */}
      <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-xs font-bold text-slate-800">Token Escrow Transactions</h3>
            <p className="text-[10px] text-slate-400">Escrowed deposits to hold properties before final sale deeds</p>
          </div>

          {/* Filters */}
          <div className="flex gap-1.5 overflow-x-auto">
            {['All', 'Pending', 'Approved', 'Refunded'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setTokenFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  tokenFilter === status
                    ? 'bg-brand text-white shadow-md shadow-brand/10'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[9px] font-bold uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-6">Token ID</th>
                <th className="py-3 px-6">Buyer (Payer)</th>
                <th className="py-3 px-6">Seller (Escrow Target)</th>
                <th className="py-3 px-6">Property Listing</th>
                <th className="py-3 px-6 text-center">Escrow Sum</th>
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs">
              {filteredTokens.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-6 font-bold text-slate-500">{t.id}</td>
                  <td className="py-3.5 px-6 font-bold text-slate-800">{t.buyer}</td>
                  <td className="py-3.5 px-6 font-bold text-slate-700">{t.seller}</td>
                  <td className="py-3.5 px-6 text-slate-600 font-semibold">{t.property}</td>
                  <td className="py-3.5 px-6 text-center font-bold text-brand">{t.amount}</td>
                  <td className="py-3.5 px-6 text-slate-500">{t.date}</td>
                  <td className="py-3.5 px-6">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      t.status === 'Approved' ? 'bg-green-50 text-green-700' :
                      t.status === 'Pending' ? 'bg-yellow-50 text-yellow-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <div className="flex justify-end gap-1.5">
                      {t.status === 'Pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => approveToken(t.id)}
                            className="p-1 px-2.5 bg-brand hover:bg-brand-dark text-white rounded-lg font-bold text-[10px] shadow-lg shadow-brand/10 transition-all flex items-center gap-0.5 cursor-pointer"
                          >
                            <ShieldCheck size={12} /> Release
                          </button>
                          <button
                            type="button"
                            onClick={() => refundToken(t.id)}
                            className="p-1 px-2.5 border border-red-200 hover:bg-red-50 text-red-600 rounded-lg font-bold text-[10px] transition-colors flex items-center gap-0.5 cursor-pointer"
                          >
                            <RotateCcw size={12} /> Refund
                          </button>
                        </>
                      )}
                      {t.status === 'Approved' && (
                        <span className="text-[10px] text-green-600 font-bold">Escrow Settled</span>
                      )}
                      {t.status === 'Refunded' && (
                        <span className="text-[10px] text-blue-600 font-bold">Returned to Payer</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RevenueDashboard;
