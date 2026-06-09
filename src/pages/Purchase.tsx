import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Building2, Eye } from 'lucide-react';
import { Purchase as PurchaseType } from '../types';
import { money, formatDate } from '../utils';

const Purchase: React.FC = () => {
  const nav = useNavigate();
  const [purchases, setPurchases] = useState<PurchaseType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.api.purchases.getAll().then(data => { setPurchases(data); setLoading(false); });
  }, []);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Purchase Management</h1>
      </div>

      {/* Action Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
        <div className="card" style={{ cursor:'pointer', borderColor:'var(--green)', background:'var(--green-bg)', transition:'all .15s' }}
          onClick={() => nav('/inventory/add')}
          onMouseEnter={e=>(e.currentTarget as HTMLElement).style.transform='translateY(-2px)'}
          onMouseLeave={e=>(e.currentTarget as HTMLElement).style.transform='none'}>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ width:52, height:52, borderRadius:12, background:'var(--green)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <User size={26} color="#fff"/>
            </div>
            <div>
              <div style={{ fontSize:16, fontWeight:700 }}>Buy From Customer</div>
              <div style={{ fontSize:12, color:'var(--text2)', marginTop:4 }}>Single phone purchase from a walk-in customer</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ cursor:'pointer', borderColor:'var(--accent)', transition:'all .15s' }}
          onClick={() => nav('/purchase/bulk')}
          onMouseEnter={e=>(e.currentTarget as HTMLElement).style.transform='translateY(-2px)'}
          onMouseLeave={e=>(e.currentTarget as HTMLElement).style.transform='none'}>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ width:52, height:52, borderRadius:12, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Building2 size={26} color="#fff"/>
            </div>
            <div>
              <div style={{ fontSize:16, fontWeight:700 }}>Bulk from Wholesaler</div>
              <div style={{ fontSize:12, color:'var(--text2)', marginTop:4 }}>Add 50+ phones from market supplier at once</div>
            </div>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', fontWeight:700, fontSize:14 }}>Purchase History</div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Date</th><th>Source</th><th>Market</th><th>Type</th><th>Phones</th><th>Total Cost</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} style={{ textAlign:'center', padding:40, color:'var(--text3)' }}>Loading…</td></tr>}
              {!loading && purchases.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign:'center', padding:40, color:'var(--text3)' }}>No purchases yet.</td></tr>
              )}
              {purchases.map(p => (
                <tr key={p.id}>
                  <td>{formatDate(p.purchase_date)}</td>
                  <td><strong>{p.source_name || '—'}</strong></td>
                  <td><span style={{ fontSize:12, color:'var(--text2)' }}>{p.market_name || '—'}</span></td>
                  <td><span className={`badge ${p.type==='bulk'?'badge-accent':'badge-green'}`}>{p.type==='bulk'?'Bulk':'Customer'}</span></td>
                  <td>{p.phone_count ?? 0} phone{(p.phone_count||0)!==1?'s':''}</td>
                  <td style={{ fontWeight:700 }}>{money(p.total_cost)}</td>
                  <td><button className="icon-btn"><Eye size={13}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Purchase;
