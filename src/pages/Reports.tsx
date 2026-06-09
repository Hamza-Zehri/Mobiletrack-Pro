import React, { useState } from 'react';
import { Smartphone, Receipt, TrendingUp, ShoppingCart, Users, FileText, Table } from 'lucide-react';
import { money, formatDate, today, monthStart } from '../utils';
import { PtaBadge } from '../components/ui/Toast';
import { useApp } from '../context/AppContext';

type ReportType = 'sales' | 'profit' | 'inventory' | 'purchase' | 'customer';

const REPORTS = [
  { type: 'sales'     as ReportType, label:'Sales Report',     sub:'Daily · Weekly · Monthly · Yearly',  icon: Receipt,    color:'var(--blue)',   bg:'var(--blue-bg)' },
  { type: 'profit'    as ReportType, label:'Profit Report',    sub:'Profit breakdown by period',          icon: TrendingUp, color:'var(--green)',  bg:'var(--green-bg)' },
  { type: 'inventory' as ReportType, label:'Inventory Report', sub:'All currently available phones',      icon: Smartphone, color:'var(--accent2)',bg:'var(--accent-bg)' },
  { type: 'purchase'  as ReportType, label:'Purchase Report',  sub:'All purchases by period',             icon: ShoppingCart,color:'var(--amber)', bg:'var(--amber-bg)' },
];

const Reports: React.FC = () => {
  const { toast } = useApp();
  const [activeType, setActiveType] = useState<ReportType | null>(null);
  const [from, setFrom] = useState(monthStart());
  const [to,   setTo]   = useState(today());
  const [data,  setData]  = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  const loadReport = async (type: ReportType) => {
    setActiveType(type);
    setLoading(true);
    setData([]);
    setSummary(null);
    try {
      const range = { from, to };
      if (type === 'sales') {
        const rows = await window.api.reports.sales(range);
        setData(rows);
      } else if (type === 'profit') {
        const res = await window.api.reports.profit(range);
        setData(res.rows || []);
        setSummary(res.totals);
      } else if (type === 'inventory') {
        const rows = await window.api.reports.inventory();
        setData(rows);
      } else if (type === 'purchase') {
        const rows = await window.api.reports.purchase(range);
        setData(rows);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    if (!activeType) return;
    setExporting(format);
    try {
      const range = { from, to };
      const res = format === 'pdf'
        ? await window.api.reports.exportPdf(activeType, range)
        : await window.api.reports.exportExcel(activeType, range);
      if (res.ok) {
        await window.api.shell.openPath(res.path);
        toast(`${format.toUpperCase()} exported!`);
      }
    } catch(e: any) {
      toast(e.message || 'Export failed', 'error');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
        {activeType && (
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn btn-ghost btn-sm" onClick={()=>handleExport('pdf')} disabled={!!exporting}>
              <FileText size={13}/>{exporting==='pdf'?'Exporting…':'Export PDF'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={()=>handleExport('excel')} disabled={!!exporting}>
              <Table size={13}/>{exporting==='excel'?'Exporting…':'Export Excel'}
            </button>
          </div>
        )}
      </div>

      {/* Report Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {REPORTS.map(r => {
          const Icon = r.icon;
          const active = activeType === r.type;
          return (
            <div key={r.type}
              onClick={() => loadReport(r.type)}
              className="card"
              style={{ cursor:'pointer', borderColor: active ? r.color : 'var(--border)', background: active ? r.bg : 'var(--surface)', transition:'all .15s' }}
              onMouseEnter={e=>{ if(!active)(e.currentTarget as HTMLElement).style.borderColor=r.color; }}
              onMouseLeave={e=>{ if(!active)(e.currentTarget as HTMLElement).style.borderColor='var(--border)'; }}>
              <div style={{ width:44, height:44, borderRadius:10, background:r.bg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12 }}>
                <Icon size={22} color={r.color}/>
              </div>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:4 }}>{r.label}</div>
              <div style={{ fontSize:12, color:'var(--text3)' }}>{r.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Date Range */}
      {activeType && activeType !== 'inventory' && (
        <div className="card" style={{ marginBottom:16, display:'flex', alignItems:'center', gap:16, padding:'14px 18px' }}>
          <span style={{ fontSize:13, fontWeight:600, color:'var(--text2)', flexShrink:0 }}>Date Range:</span>
          <div className="field" style={{ flexDirection:'row', alignItems:'center', gap:8, flex:0 }}>
            <label style={{ margin:0 }}>From</label>
            <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{ width:140 }}/>
          </div>
          <div className="field" style={{ flexDirection:'row', alignItems:'center', gap:8, flex:0 }}>
            <label style={{ margin:0 }}>To</label>
            <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={{ width:140 }}/>
          </div>
          <button className="btn btn-primary btn-sm" onClick={()=>loadReport(activeType!)}>Apply</button>
          <div style={{ flex:1 }}/>
          {/* Quick Ranges */}
          {[['Today','today'],['This Month','month'],['This Year','year']].map(([l,v]) => (
            <button key={v} className="btn btn-ghost btn-sm" onClick={() => {
              const d = new Date();
              if (v==='today') { setFrom(today()); setTo(today()); }
              else if (v==='month') { setFrom(monthStart()); setTo(today()); }
              else { setFrom(`${d.getFullYear()}-01-01`); setTo(today()); }
              setTimeout(() => loadReport(activeType!), 50);
            }}>{l}</button>
          ))}
        </div>
      )}

      {/* Summary */}
      {summary && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16 }}>
          <div className="card" style={{ textAlign:'center' }}>
            <div style={{ fontSize:11, color:'var(--text3)', marginBottom:6 }}>Total Revenue</div>
            <div style={{ fontSize:20, fontWeight:800, color:'var(--blue)' }}>{money(summary.revenue)}</div>
          </div>
          <div className="card" style={{ textAlign:'center' }}>
            <div style={{ fontSize:11, color:'var(--text3)', marginBottom:6 }}>Total Profit</div>
            <div style={{ fontSize:20, fontWeight:800, color:'var(--green)' }}>{money(summary.profit)}</div>
          </div>
          <div className="card" style={{ textAlign:'center' }}>
            <div style={{ fontSize:11, color:'var(--text3)', marginBottom:6 }}>Total Sales</div>
            <div style={{ fontSize:20, fontWeight:800, color:'var(--accent2)' }}>{summary.qty || 0}</div>
          </div>
        </div>
      )}

      {/* Results Table */}
      {activeType && (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          {loading && <div style={{ textAlign:'center', padding:40, color:'var(--text3)' }}>Loading report…</div>}
          {!loading && data.length === 0 && <div style={{ textAlign:'center', padding:40, color:'var(--text3)' }}>No data for selected period</div>}
          {!loading && data.length > 0 && (
            <div className="table-wrap">
              {activeType === 'sales' && <SalesTable data={data}/>}
              {activeType === 'profit' && <ProfitTable data={data}/>}
              {activeType === 'inventory' && <InventoryTable data={data}/>}
              {activeType === 'purchase' && <PurchaseTable data={data}/>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SalesTable: React.FC<{data:any[]}> = ({data}) => (
  <table className="data-table">
    <thead><tr><th>Invoice</th><th>Date</th><th>Customer</th><th>Model</th><th>PTA</th><th>Sale Price</th><th>Discount</th><th>Amount</th><th>Profit</th></tr></thead>
    <tbody>{data.map(r=>(
      <tr key={r.id}>
        <td style={{fontFamily:'monospace',fontSize:11,color:'var(--accent2)'}}>{r.invoice_number}</td>
        <td>{formatDate(r.sale_date)}</td>
        <td><strong>{r.customer}</strong><div className="sub">{r.customer_mobile}</div></td>
        <td><strong>{r.brand} {r.model}</strong><div className="sub">{r.storage}</div></td>
        <td>{r.pta_status&&<PtaBadge status={r.pta_status}/>}</td>
        <td>{money(r.sale_price)}</td>
        <td style={{color:'var(--red)'}}>{r.discount>0?`-${money(r.discount)}`:'—'}</td>
        <td style={{fontWeight:700}}>{money(r.final_amount)}</td>
        <td style={{fontWeight:700,color:r.profit>=0?'var(--green)':'var(--red)'}}>{money(r.profit)}</td>
      </tr>
    ))}</tbody>
  </table>
);

const ProfitTable: React.FC<{data:any[]}> = ({data}) => (
  <table className="data-table">
    <thead><tr><th>Date</th><th>Revenue</th><th>Profit</th><th>Qty</th></tr></thead>
    <tbody>{data.map((r,i)=>(
      <tr key={i}>
        <td>{formatDate(r.d)}</td>
        <td style={{fontWeight:600}}>{money(r.revenue)}</td>
        <td style={{fontWeight:700,color:'var(--green)'}}>{money(r.profit)}</td>
        <td>{r.qty}</td>
      </tr>
    ))}</tbody>
  </table>
);

const InventoryTable: React.FC<{data:any[]}> = ({data}) => (
  <table className="data-table">
    <thead><tr><th>Model</th><th>IMEI</th><th>Storage</th><th>Color</th><th>PTA</th><th>Battery</th><th>Cost</th><th>Listed</th><th>Source</th></tr></thead>
    <tbody>{data.map(r=>(
      <tr key={r.id}>
        <td><strong>{r.brand} {r.model}</strong></td>
        <td style={{fontFamily:'monospace',fontSize:11}}>{r.imei1}</td>
        <td>{r.storage}</td><td>{r.color}</td>
        <td><PtaBadge status={r.pta_status}/></td>
        <td>{r.battery_health||'—'}</td>
        <td style={{fontWeight:600}}>{money(r.cost_price)}</td>
        <td style={{color:'var(--green)'}}>{r.sale_price?money(r.sale_price):'—'}</td>
        <td style={{fontSize:11,color:'var(--text2)'}}>{r.source||'—'}</td>
      </tr>
    ))}</tbody>
  </table>
);

const PurchaseTable: React.FC<{data:any[]}> = ({data}) => (
  <table className="data-table">
    <thead><tr><th>Date</th><th>Source</th><th>Market</th><th>Type</th><th>Phones</th><th>Total Cost</th></tr></thead>
    <tbody>{data.map(r=>(
      <tr key={r.id}>
        <td>{formatDate(r.purchase_date)}</td>
        <td><strong>{r.source_name||'—'}</strong></td>
        <td style={{fontSize:12,color:'var(--text2)'}}>{r.market_name||'—'}</td>
        <td><span className={`badge ${r.type==='bulk'?'badge-accent':'badge-green'}`}>{r.type==='bulk'?'Bulk':'Customer'}</span></td>
        <td>{r.phones||0}</td>
        <td style={{fontWeight:700}}>{money(r.total)}</td>
      </tr>
    ))}</tbody>
  </table>
);

export default Reports;
