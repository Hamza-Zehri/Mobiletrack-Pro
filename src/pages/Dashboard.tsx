import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, TrendingUp, Users, DollarSign, ShoppingCart, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { DashboardStats, ChartRow, RecentActivity } from '../types';
import { money, formatDateTime } from '../utils';
import { PtaBadge } from '../components/ui/Toast';

const Dashboard: React.FC = () => {
  const nav = useNavigate();
  const [stats, setStats]    = useState<DashboardStats | null>(null);
  const [charts, setCharts]  = useState<ChartRow[]>([]);
  const [activity, setAct]   = useState<RecentActivity>({ purchases: [], sales: [] });

  useEffect(() => {
    window.api.dashboard.stats().then(setStats);
    window.api.dashboard.charts().then(setCharts);
    window.api.dashboard.activity().then(setAct);
  }, []);

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const chartData = charts.map(r => ({ month: months[parseInt(r.mo||'1')-1], sales: r.sales||0, profit: r.profit||0 }));

  return (
    <div className="fade-in">
      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom:18 }}>
        <StatCard label="Phones In Stock" value={stats?.totalStock ?? '—'} sub={`₨ ${((stats?.totalStockValue||0)/100000).toFixed(1)}L total value`} icon={<Smartphone size={18}/>} color="purple" />
        <StatCard label="Monthly Sales"   value={money(stats?.monthlySales)} sub="This month revenue" icon={<DollarSign size={18}/>} color="green" />
        <StatCard label="Monthly Profit"  value={money(stats?.monthlyProfit)} sub="This month profit" icon={<TrendingUp size={18}/>} color="amber" />
        <StatCard label="Total Customers" value={stats?.totalCustomers ?? '—'} sub={`${stats?.totalSold ?? 0} phones sold total`} icon={<Users size={18}/>} color="blue" />
      </div>

      {/* PTA Breakdown */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:18 }}>
        {[
          { label:'PTA Approved', val: stats?.byPta.pta, color:'var(--green)' },
          { label:'Non PTA',      val: stats?.byPta.non_pta, color:'var(--red)' },
          { label:'JV',           val: stats?.byPta.jv, color:'var(--amber)' },
          { label:'CPID',         val: stats?.byPta.cpid, color:'var(--purple)' },
          { label:'Android',      val: stats?.byPta.android, color:'var(--blue)' },
        ].map(({ label, val, color }) => (
          <div key={label} className="card" style={{ textAlign:'center', padding:'14px' }}>
            <div style={{ fontSize:11, color:'var(--text3)', marginBottom:6 }}>{label}</div>
            <div style={{ fontSize:22, fontWeight:800, color }}>{val ?? 0}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display:'grid', gridTemplateColumns:'3fr 2fr', gap:14, marginBottom:18 }}>
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <span style={{ fontSize:14, fontWeight:700 }}>Monthly Sales Trend</span>
            <span style={{ fontSize:11, color:'var(--text3)' }}>Last 6 months</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6c63ff" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6c63ff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize:11, fill:'var(--text3)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:10, fill:'var(--text3)' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => money(v)} contentStyle={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }} />
              <Area type="monotone" dataKey="sales" stroke="#6c63ff" strokeWidth={2} fill="url(#salesGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div style={{ fontSize:14, fontWeight:700, marginBottom:16 }}>Monthly Profit</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize:11, fill:'var(--text3)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:10, fill:'var(--text3)' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => money(v)} contentStyle={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }} />
              <Bar dataKey="profit" fill="var(--amber)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <span style={{ fontSize:14, fontWeight:700 }}>Recent Purchases</span>
            <button className="btn btn-ghost btn-sm" onClick={()=>nav('/purchase')}>View all</button>
          </div>
          {activity.purchases.length === 0 && <div style={{ color:'var(--text3)', fontSize:13, textAlign:'center', padding:'20px 0' }}>No purchases yet</div>}
          {activity.purchases.map((p: any) => (
            <div key={p.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
              <div style={{ width:34, height:34, borderRadius:8, background:'var(--green-bg)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <ArrowDownLeft size={16} color="var(--green)" />
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.brand} {p.model}</div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>From: {p.source}</div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--green)' }}>{money(p.cost_price)}</div>
                <div style={{ fontSize:10, color:'var(--text3)' }}>{formatDateTime(p.created_at)}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <span style={{ fontSize:14, fontWeight:700 }}>Recent Sales</span>
            <button className="btn btn-ghost btn-sm" onClick={()=>nav('/sales')}>View all</button>
          </div>
          {activity.sales.length === 0 && <div style={{ color:'var(--text3)', fontSize:13, textAlign:'center', padding:'20px 0' }}>No sales yet</div>}
          {activity.sales.map((s: any) => (
            <div key={s.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
              <div style={{ width:34, height:34, borderRadius:8, background:'var(--blue-bg)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <ArrowUpRight size={16} color="var(--blue)" />
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.brand} {s.model}</div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>To: {s.customer} · {s.invoice_number}</div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--blue)' }}>{money(s.final_amount)}</div>
                <div style={{ fontSize:10, color:'var(--text3)' }}>{formatDateTime(s.sale_date)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
const colorMap: any = {
  purple: { val:'var(--accent2)', icon:'var(--accent-bg)', text:'var(--accent2)' },
  green:  { val:'var(--green)',   icon:'var(--green-bg)',  text:'var(--green)' },
  amber:  { val:'var(--amber)',   icon:'var(--amber-bg)',  text:'var(--amber)' },
  blue:   { val:'var(--blue)',    icon:'var(--blue-bg)',   text:'var(--blue)' },
};
const StatCard: React.FC<{ label:string; value:any; sub:string; icon:React.ReactNode; color:string }> = ({ label, value, sub, icon, color }) => {
  const c = colorMap[color] || colorMap.blue;
  return (
    <div className="stat-card stat-glow">
      <div className="stat-icon" style={{ background:c.icon, color:c.val }}>{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color:c.val }}>{value}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  );
};

export default Dashboard;
