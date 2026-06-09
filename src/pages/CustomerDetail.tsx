import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Phone, CreditCard, MapPin, Receipt, ShoppingCart, Edit2, Save } from 'lucide-react';
import { Customer } from '../types';
import { money, formatDate } from '../utils';
import { PtaBadge } from '../components/ui/Toast';
import { useApp } from '../context/AppContext';

const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { toast } = useApp();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [history, setHistory]   = useState<{ sales: any[]; purchases: any[] }>({ sales: [], purchases: [] });
  const [editing, setEditing]   = useState(false);
  const [form, setForm]         = useState<any>({});
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    (async () => {
      const c = await window.api.customers.getById(Number(id));
      const h = await window.api.customers.history(Number(id));
      setCustomer(c);
      setHistory(h);
      setForm(c || {});
    })();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    await window.api.customers.update(Number(id), form);
    const c = await window.api.customers.getById(Number(id));
    setCustomer(c);
    setEditing(false);
    setSaving(false);
    toast('Customer updated');
  };

  if (!customer) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:400 }}>
      <div className="loading-spinner" style={{ width:28, height:28 }}/>
    </div>
  );

  const totalSpent   = history.sales.reduce((s, r) => s + (r.final_amount || 0), 0);
  const totalEarned  = history.purchases.reduce((s, r) => s + (r.cost_price || 0), 0);

  // Combined timeline
  const timeline = [
    ...history.sales.map(s => ({ ...s, _type: 'sale' as const, _date: s.sale_date })),
    ...history.purchases.map(p => ({ ...p, _type: 'purchase' as const, _date: p.purchase_date })),
  ].sort((a, b) => new Date(b._date).getTime() - new Date(a._date).getTime());

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button className="btn btn-ghost btn-sm" onClick={()=>nav('/customers')}><ArrowLeft size={14}/></button>
          <h1 className="page-title">Customer Profile</h1>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {editing
            ? <>
                <button className="btn btn-ghost" onClick={()=>setEditing(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}><Save size={14}/>{saving?'Saving…':'Save Changes'}</button>
              </>
            : <button className="btn btn-ghost" onClick={()=>setEditing(true)}><Edit2 size={14}/>Edit</button>
          }
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:16, alignItems:'start' }}>
        {/* Left – Profile */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="card">
            <div style={{ textAlign:'center', marginBottom:18 }}>
              <div style={{ width:64, height:64, borderRadius:'50%', background:'linear-gradient(135deg,#6c63ff,#a78bfa)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:800, color:'#fff', margin:'0 auto 12px' }}>
                {customer.name.charAt(0).toUpperCase()}
              </div>
              {editing
                ? <input value={form.name||''} onChange={e=>setForm((f:any)=>({...f,name:e.target.value}))} style={{ fontSize:16, fontWeight:700, textAlign:'center', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:'6px 10px', color:'var(--text)', fontFamily:'inherit', width:'100%' }}/>
                : <div style={{ fontSize:17, fontWeight:700 }}>{customer.name}</div>
              }
              <div style={{ fontSize:12, color:'var(--text3)', marginTop:4 }}>Customer since {formatDate(customer.created_at)}</div>
            </div>

            <div className="divider" style={{ margin:'0 0 14px' }}/>

            {editing ? (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <div className="field"><label>Mobile</label><input value={form.mobile||''} onChange={e=>setForm((f:any)=>({...f,mobile:e.target.value}))}/></div>
                <div className="field"><label>CNIC</label><input value={form.cnic||''} onChange={e=>setForm((f:any)=>({...f,cnic:e.target.value}))}/></div>
                <div className="field"><label>Address</label><input value={form.address||''} onChange={e=>setForm((f:any)=>({...f,address:e.target.value}))}/></div>
                <div className="field"><label>Notes</label><textarea value={form.notes||''} onChange={e=>setForm((f:any)=>({...f,notes:e.target.value}))} rows={2}/></div>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {customer.mobile && (
                  <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                    <Phone size={15} color="var(--text3)"/>
                    <span style={{ fontSize:13 }}>{customer.mobile}</span>
                  </div>
                )}
                {customer.cnic && (
                  <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                    <CreditCard size={15} color="var(--text3)"/>
                    <span style={{ fontSize:13, fontFamily:'monospace' }}>{customer.cnic}</span>
                  </div>
                )}
                {customer.address && (
                  <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                    <MapPin size={15} color="var(--text3)" style={{ marginTop:2, flexShrink:0 }}/>
                    <span style={{ fontSize:13 }}>{customer.address}</span>
                  </div>
                )}
                {customer.notes && (
                  <div style={{ background:'var(--surface2)', borderRadius:'var(--r2)', padding:'8px 10px', fontSize:12, color:'var(--text2)', marginTop:4 }}>{customer.notes}</div>
                )}
              </div>
            )}
          </div>

          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div className="card" style={{ textAlign:'center', padding:14 }}>
              <div style={{ fontSize:11, color:'var(--text3)', marginBottom:6 }}>Bought</div>
              <div style={{ fontSize:22, fontWeight:800, color:'var(--blue)' }}>{history.sales.length}</div>
              <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>{money(totalSpent)}</div>
            </div>
            <div className="card" style={{ textAlign:'center', padding:14 }}>
              <div style={{ fontSize:11, color:'var(--text3)', marginBottom:6 }}>Sold</div>
              <div style={{ fontSize:22, fontWeight:800, color:'var(--green)' }}>{history.purchases.length}</div>
              <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>{money(totalEarned)}</div>
            </div>
          </div>
        </div>

        {/* Right – Timeline */}
        <div className="card">
          <div style={{ fontSize:14, fontWeight:700, marginBottom:18 }}>Transaction History</div>

          {timeline.length === 0 && (
            <div style={{ textAlign:'center', padding:'32px 0', color:'var(--text3)' }}>No transactions yet</div>
          )}

          <div style={{ position:'relative', paddingLeft:28 }}>
            {/* Timeline line */}
            <div style={{ position:'absolute', left:8, top:8, bottom:8, width:2, background:'var(--border2)', borderRadius:2 }}/>

            {timeline.map((item, i) => (
              <div key={i} style={{ position:'relative', marginBottom:14 }}>
                {/* Dot */}
                <div style={{
                  position:'absolute', left:-24, top:10,
                  width:12, height:12, borderRadius:'50%',
                  background: item._type === 'sale' ? 'var(--blue)' : 'var(--green)',
                  border:'2px solid var(--bg)',
                }}/>

                <div style={{
                  background:'var(--surface2)', border:'1px solid var(--border)',
                  borderRadius:'var(--r2)', padding:'12px 14px',
                  borderLeft:`3px solid ${item._type==='sale'?'var(--blue)':'var(--green)'}`,
                }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      {item._type === 'sale'
                        ? <Receipt size={14} color="var(--blue)"/>
                        : <ShoppingCart size={14} color="var(--green)"/>
                      }
                      <strong style={{ fontSize:13 }}>
                        {item._type === 'sale' ? 'Sold: ' : 'Sold to Shop: '}
                        {item.brand} {item.model}
                      </strong>
                    </div>
                    <span className={`badge ${item._type==='sale'?'badge-blue':'badge-green'}`}>
                      {item._type === 'sale' ? 'Purchased' : 'Trade-In'}
                    </span>
                  </div>
                  <div style={{ display:'flex', gap:16, fontSize:12, color:'var(--text2)', flexWrap:'wrap' }}>
                    <span>📅 {formatDate(item._date)}</span>
                    {item._type === 'sale' && <>
                      <span>🏷 {item.storage}</span>
                      <span style={{ fontWeight:700, color:'var(--blue)' }}>{money(item.final_amount)}</span>
                      {item.invoice_number && <span style={{ fontFamily:'monospace', fontSize:11, color:'var(--accent2)' }}>{item.invoice_number}</span>}
                    </>}
                    {item._type === 'purchase' && <>
                      <span style={{ fontWeight:700, color:'var(--green)' }}>{money(item.cost_price)}</span>
                    </>}
                  </div>
                  {item._type === 'sale' && item.pta_status && (
                    <div style={{ marginTop:8 }}><PtaBadge status={item.pta_status}/></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;
