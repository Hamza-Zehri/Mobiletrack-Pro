import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Receipt, User, DollarSign, Smartphone, ArrowLeft } from 'lucide-react';
import { Phone, Sale } from '../types';
import { money, formatDate } from '../utils';
import { PtaBadge, StatusBadge } from '../components/ui/Toast';
import { useApp } from '../context/AppContext';

const Sales: React.FC = () => {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { toast } = useApp();

  const [tab, setTab] = useState<'new' | 'history'>('new');
  const [sales, setSales]   = useState<Sale[]>([]);
  const [phones, setPhones] = useState<Phone[]>([]);
  const [phonesLoading, setPhonesLoading] = useState(false);
  const [phoneSearch, setPhoneSearch] = useState('');
  const [selectedPhone, setSelectedPhone] = useState<Phone | null>(null);
  const [saving, setSaving] = useState(false);

  const [customer, setCustomer] = useState({ name:'', mobile:'', cnic:'', address:'' });
  const [salePrice, setSalePrice] = useState('');
  const [discount, setDiscount]  = useState('0');

  const finalAmount = (parseFloat(salePrice)||0) - (parseFloat(discount)||0);
  const profit = selectedPhone ? finalAmount - selectedPhone.cost_price : 0;

  // Pre-select phone from query param
  useEffect(() => {
    const pid = params.get('phone_id');
    if (pid) {
      window.api.phones.getById(Number(pid)).then(p => {
        if (p) {
          setSelectedPhone(p);
          setSalePrice(String(p.sale_price || p.cost_price || ''));
        }
      });
    }
  }, [params]);

  // Load sales history
  useEffect(() => {
    if (tab === 'history') {
      window.api.sales.getAll().then(setSales);
    }
  }, [tab]);

  // Phone search
  useEffect(() => {
    const t = setTimeout(async () => {
      if (phoneSearch.length < 1) { setPhones([]); return; }
      setPhonesLoading(true);
      const data = await window.api.phones.getAll({ status: 'available', search: phoneSearch });
      setPhones(data);
      setPhonesLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [phoneSearch]);

  const handleSelectPhone = (p: Phone) => {
    setSelectedPhone(p);
    setSalePrice(String(p.sale_price || p.cost_price || ''));
    setPhones([]);
    setPhoneSearch('');
  };

  const handleSell = async () => {
    if (!selectedPhone) { toast('Please select a phone', 'error'); return; }
    if (!customer.name)  { toast('Customer name is required', 'error'); return; }
    if (!salePrice)      { toast('Sale price is required', 'error'); return; }
    if (finalAmount <= 0){ toast('Final amount must be greater than zero', 'error'); return; }

    setSaving(true);
    try {
      const res = await window.api.sales.create({
        phone_id: selectedPhone.id,
        customer_name: customer.name,
        customer_mobile: customer.mobile,
        customer_cnic: customer.cnic,
        customer_address: customer.address,
        sale_price: parseFloat(salePrice),
        discount: parseFloat(discount) || 0,
      });
      if (res.ok) {
        toast('Sale complete! Generating invoice…');
        const inv = await window.api.invoice.generate(res.id);
        nav(`/sales/invoice/${res.id}`);
      }
    } catch(e: any) {
      toast(e.message || 'Sale failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Sales</h1>
        <div style={{ display:'flex', gap:8 }}>
          <button className={`btn ${tab==='new'?'btn-primary':'btn-ghost'}`} onClick={()=>setTab('new')}>New Sale</button>
          <button className={`btn ${tab==='history'?'btn-primary':'btn-ghost'}`} onClick={()=>setTab('history')}>Sales History</button>
        </div>
      </div>

      {/* ── New Sale ──────────────────────────────────────────────────────── */}
      {tab === 'new' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:16, alignItems:'start' }}>
          {/* Left */}
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {/* Phone Selection */}
            <div className="card">
              <div style={{ fontSize:14, fontWeight:700, marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
                <Smartphone size={16} color="var(--accent2)"/>Select Phone
              </div>

              {selectedPhone ? (
                <div>
                  <div style={{ background:'var(--accent-bg)', border:'1px solid var(--accent)', borderRadius:'var(--r2)', padding:'14px 16px', marginBottom:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <div>
                        <div style={{ fontSize:16, fontWeight:700 }}>{selectedPhone.brand} {selectedPhone.model}</div>
                        <div style={{ fontSize:12, color:'var(--text2)', marginTop:4 }}>
                          {selectedPhone.storage} · {selectedPhone.color} · Battery: {selectedPhone.battery_health||'N/A'}
                        </div>
                        <div style={{ fontSize:11, color:'var(--text3)', marginTop:4, fontFamily:'monospace' }}>
                          IMEI: {selectedPhone.imei1}
                        </div>
                        <div style={{ marginTop:8 }}><PtaBadge status={selectedPhone.pta_status}/></div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontSize:12, color:'var(--text3)' }}>Cost Price</div>
                        <div style={{ fontSize:14, fontWeight:700, color:'var(--text2)' }}>{money(selectedPhone.cost_price)}</div>
                      </div>
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={()=>setSelectedPhone(null)}>
                    <Search size={13}/>Choose Different Phone
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ position:'relative', marginBottom:10 }}>
                    <div style={{ display:'flex', gap:8, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:'0 12px', height:38, alignItems:'center' }}>
                      <Search size={14} color="var(--text3)"/>
                      <input
                        value={phoneSearch}
                        onChange={e => setPhoneSearch(e.target.value)}
                        placeholder="Search by model, IMEI…"
                        style={{ background:'none', border:'none', outline:'none', fontSize:13, color:'var(--text)', fontFamily:'inherit', flex:1 }}
                        autoFocus
                      />
                    </div>
                    {(phones.length > 0 || phonesLoading) && (
                      <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r2)', zIndex:100, boxShadow:'var(--shadow)', maxHeight:280, overflowY:'auto' }}>
                        {phonesLoading && <div style={{ padding:'14px', textAlign:'center', fontSize:12, color:'var(--text3)' }}>Searching…</div>}
                        {phones.map(p => (
                          <div key={p.id} onClick={() => handleSelectPhone(p)}
                            style={{ padding:'12px 14px', cursor:'pointer', borderBottom:'1px solid var(--border)', transition:'background .1s' }}
                            onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='var(--surface2)'}
                            onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                              <div>
                                <div style={{ fontSize:13, fontWeight:600 }}>{p.brand} {p.model}</div>
                                <div style={{ fontSize:11, color:'var(--text2)', marginTop:2 }}>{p.storage} · {p.color} · <span style={{ fontFamily:'monospace' }}>{p.imei1}</span></div>
                              </div>
                              <div style={{ textAlign:'right' }}>
                                <PtaBadge status={p.pta_status}/>
                                <div style={{ fontSize:12, fontWeight:600, color:'var(--green)', marginTop:4 }}>{money(p.cost_price)}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {!phonesLoading && phones.length === 0 && phoneSearch && (
                          <div style={{ padding:'14px', textAlign:'center', fontSize:12, color:'var(--text3)' }}>No available phones found</div>
                        )}
                      </div>
                    )}
                  </div>
                  <p style={{ fontSize:12, color:'var(--text3)' }}>Type a model name or IMEI to search available phones</p>
                </div>
              )}
            </div>

            {/* Customer Details */}
            <div className="card">
              <div style={{ fontSize:14, fontWeight:700, marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
                <User size={16} color="var(--accent2)"/>Customer Details
              </div>
              <div className="form-grid cols-2">
                <div className="field">
                  <label>Customer Name *</label>
                  <input value={customer.name} onChange={e=>setCustomer(c=>({...c,name:e.target.value}))} placeholder="Full name"/>
                </div>
                <div className="field">
                  <label>Mobile Number *</label>
                  <input value={customer.mobile} onChange={e=>setCustomer(c=>({...c,mobile:e.target.value}))} placeholder="03XX XXXXXXX"/>
                </div>
                <div className="field">
                  <label>CNIC (Optional)</label>
                  <input value={customer.cnic} onChange={e=>setCustomer(c=>({...c,cnic:e.target.value}))} placeholder="XXXXX-XXXXXXX-X"/>
                </div>
                <div className="field">
                  <label>Address</label>
                  <input value={customer.address} onChange={e=>setCustomer(c=>({...c,address:e.target.value}))} placeholder="City / Area"/>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Sale Summary */}
          <div className="card">
            <div style={{ fontSize:14, fontWeight:700, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
              <Receipt size={16} color="var(--accent2)"/>Sale Details
            </div>

            <div style={{ borderBottom:'1px solid var(--border)', paddingBottom:12, marginBottom:12 }}>
              <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4 }}>Cost Price</div>
              <div style={{ fontSize:14, fontWeight:600, color:'var(--text2)' }}>{selectedPhone ? money(selectedPhone.cost_price) : '—'}</div>
            </div>

            <div className="field" style={{ marginBottom:14 }}>
              <label>Sale Price (₨) *</label>
              <input
                type="number"
                value={salePrice}
                onChange={e => setSalePrice(e.target.value)}
                placeholder="0"
                style={{ fontSize:18, fontWeight:700, color:'var(--green)' }}
              />
            </div>

            <div className="field" style={{ marginBottom:16 }}>
              <label>Discount (₨)</label>
              <input
                type="number"
                value={discount}
                onChange={e => setDiscount(e.target.value)}
                placeholder="0"
              />
            </div>

            <div style={{ borderTop:'2px solid var(--border2)', paddingTop:14, marginBottom:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:14, fontWeight:600 }}>Final Amount</span>
                <span style={{ fontSize:22, fontWeight:800, color:'var(--green)' }}>{money(finalAmount)}</span>
              </div>
            </div>

            {selectedPhone && salePrice && (
              <div style={{
                padding:'10px 14px', borderRadius:'var(--r2)', marginBottom:16,
                background: profit >= 0 ? 'var(--green-bg)' : 'var(--red-bg)',
                border: `1px solid ${profit >= 0 ? 'rgba(34,201,122,.2)' : 'rgba(255,94,94,.2)'}`,
                fontSize:13,
              }}>
                <span style={{ color:'var(--text2)' }}>Profit: </span>
                <strong style={{ color: profit >= 0 ? 'var(--green)' : 'var(--red)' }}>{money(profit)}</strong>
              </div>
            )}

            <button
              className="btn btn-primary btn-lg"
              onClick={handleSell}
              disabled={saving || !selectedPhone}
              style={{ width:'100%', justifyContent:'center', background:'linear-gradient(135deg,#6c63ff,#a78bfa)' }}
            >
              <Receipt size={16}/>
              {saving ? 'Processing…' : 'Generate Invoice & Complete Sale'}
            </button>
          </div>
        </div>
      )}

      {/* ── Sales History ─────────────────────────────────────────────────── */}
      {tab === 'history' && (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Invoice</th><th>Date</th><th>Customer</th><th>Model</th><th>PTA</th><th>Sale Price</th><th>Discount</th><th>Final</th><th>Profit</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {sales.length === 0 && (
                  <tr><td colSpan={10} style={{ textAlign:'center', padding:40, color:'var(--text3)' }}>No sales yet</td></tr>
                )}
                {sales.map(s => (
                  <tr key={s.id}>
                    <td><span style={{ fontFamily:'monospace', fontSize:12, color:'var(--accent2)' }}>{s.invoice_number}</span></td>
                    <td>{formatDate(s.sale_date)}</td>
                    <td>
                      <strong>{s.customer}</strong>
                      <div className="sub">{s.customer_mobile}</div>
                    </td>
                    <td>
                      <strong>{s.brand} {s.model}</strong>
                      <div className="sub">{s.storage}</div>
                    </td>
                    <td>{s.pta_status && <PtaBadge status={s.pta_status}/>}</td>
                    <td>{money(s.sale_price)}</td>
                    <td style={{ color:'var(--red)' }}>{s.discount > 0 ? `- ${money(s.discount)}` : '—'}</td>
                    <td style={{ fontWeight:700 }}>{money(s.final_amount)}</td>
                    <td style={{ fontWeight:700, color: s.profit >= 0 ? 'var(--green)' : 'var(--red)' }}>{money(s.profit)}</td>
                    <td>
                      <div style={{ display:'flex', gap:5 }}>
                        <button className="icon-btn" title="View Invoice" onClick={()=>nav(`/sales/invoice/${s.id}`)}><Receipt size={13}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
