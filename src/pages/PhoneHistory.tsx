import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Smartphone, ArrowDownLeft, ArrowUpRight, CreditCard } from 'lucide-react';
import { money, formatDate, ptaLabel } from '../utils';
import { PtaBadge, StatusBadge } from '../components/ui/Toast';

const PhoneHistory: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [query, setQuery]   = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [phoneImages, setPhoneImages] = useState<Record<number, any[]>>({});

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) { setQuery(q); runSearch(q); }
  }, [searchParams]);

  const runSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    const data = await window.api.phones.history(q.trim());
    setResults(data);
    // Load images for each phone
    for (const phone of data) {
      const imgs = await window.api.phones.getImages(phone.id);
      setPhoneImages(prev => ({ ...prev, [phone.id]: imgs }));
    }
    setLoading(false);
  };

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') runSearch(query); };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Phone History</h1>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ marginBottom:20 }}>
        <div style={{ fontSize:14, fontWeight:600, marginBottom:12 }}>Search Complete Lifetime History</div>
        <div style={{ display:'flex', gap:10 }}>
          <div style={{ flex:1, display:'flex', gap:8, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:'0 14px', height:42, alignItems:'center' }}>
            <Search size={16} color="var(--text3)"/>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Enter IMEI, model name, or customer name…"
              style={{ background:'none', border:'none', outline:'none', fontSize:14, color:'var(--text)', fontFamily:'inherit', flex:1 }}
              autoFocus
            />
          </div>
          <button className="btn btn-primary" onClick={() => runSearch(query)} disabled={loading} style={{ height:42, padding:'0 20px' }}>
            <Search size={15}/>{loading ? 'Searching…' : 'Search'}
          </button>
        </div>
        <p style={{ fontSize:12, color:'var(--text3)', marginTop:10 }}>
          Search by IMEI number, phone model (e.g. "iPhone 15"), or customer name to view complete history.
        </p>
      </div>

      {/* Results */}
      {!searched && (
        <div style={{ textAlign:'center', padding:'48px 20px' }}>
          <Search size={56} color="var(--border2)" style={{ display:'block', margin:'0 auto 16px' }}/>
          <p style={{ fontSize:15, color:'var(--text2)', fontWeight:600 }}>Enter a search term above</p>
          <p style={{ fontSize:13, color:'var(--text3)', marginTop:6 }}>Search by IMEI, model name, or customer to trace any phone's complete journey</p>
        </div>
      )}

      {searched && !loading && results.length === 0 && (
        <div style={{ textAlign:'center', padding:'48px 20px' }}>
          <Smartphone size={48} color="var(--border2)" style={{ display:'block', margin:'0 auto 14px' }}/>
          <p style={{ fontSize:14, color:'var(--text2)' }}>No phones found for "{query}"</p>
        </div>
      )}

      {results.map(phone => {
        const imgs = phoneImages[phone.id] || [];
        const cnicImgs = imgs.filter((i: any) => i.image_type === 'cnic');
        const phoneImgs = imgs.filter((i: any) => i.image_type === 'phone');

        return (
          <div key={phone.id} className="card" style={{ marginBottom:14 }}>
            {/* Phone Header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, paddingBottom:14, borderBottom:'1px solid var(--border)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:48, height:48, borderRadius:12, background:'var(--accent-bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Smartphone size={24} color="var(--accent2)"/>
                </div>
                <div>
                  <div style={{ fontSize:17, fontWeight:800 }}>{phone.brand} {phone.model}</div>
                  <div style={{ fontSize:12, color:'var(--text2)', marginTop:3 }}>
                    {phone.storage} · {phone.color} · Battery: {phone.battery_health || 'N/A'}
                  </div>
                </div>
              </div>
              <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                <PtaBadge status={phone.pta_status}/>
                <StatusBadge status={phone.status}/>
              </div>
            </div>

            {/* IMEI */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
              <div style={{ background:'var(--surface2)', borderRadius:'var(--r2)', padding:'10px 14px' }}>
                <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4 }}>IMEI 1</div>
                <div style={{ fontFamily:'monospace', fontSize:13, fontWeight:600 }}>{phone.imei1}</div>
              </div>
              {phone.imei2 && (
                <div style={{ background:'var(--surface2)', borderRadius:'var(--r2)', padding:'10px 14px' }}>
                  <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4 }}>IMEI 2</div>
                  <div style={{ fontFamily:'monospace', fontSize:13, fontWeight:600 }}>{phone.imei2}</div>
                </div>
              )}
            </div>

            {/* Purchase → Sale Journey */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:14, alignItems:'center' }}>
              {/* Purchase side */}
              <div style={{ background:'var(--green-bg)', border:'1px solid rgba(34,201,122,.2)', borderRadius:'var(--r2)', padding:'14px 16px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                  <ArrowDownLeft size={16} color="var(--green)"/>
                  <span style={{ fontSize:11, fontWeight:700, letterSpacing:'.08em', color:'var(--green)', textTransform:'uppercase' }}>Purchased From</span>
                </div>
                <div style={{ fontSize:15, fontWeight:700 }}>{phone.purchase_source || 'Unknown'}</div>
                <div style={{ fontSize:12, color:'var(--text2)', marginTop:4 }}>
                  {phone.purchase_date ? formatDate(phone.purchase_date) : '—'}
                </div>
                <div style={{ fontSize:15, fontWeight:700, color:'var(--green)', marginTop:8 }}>
                  {money(phone.cost_price)}
                </div>
                {phone.purchase_type && (
                  <div style={{ marginTop:8 }}>
                    <span className={`badge ${phone.purchase_type==='bulk'?'badge-accent':'badge-green'}`} style={{ fontSize:10 }}>
                      {phone.purchase_type === 'bulk' ? 'Bulk Purchase' : 'Customer Trade-In'}
                    </span>
                  </div>
                )}
              </div>

              {/* Arrow */}
              <div style={{ textAlign:'center', padding:'0 8px' }}>
                <div style={{ width:2, height:40, background:'var(--border2)', margin:'0 auto 4px' }}/>
                <div style={{ fontSize:20 }}>→</div>
                <div style={{ width:2, height:40, background:'var(--border2)', margin:'4px auto 0' }}/>
              </div>

              {/* Sale side */}
              {phone.status === 'sold' && phone.invoice_number ? (
                <div style={{ background:'var(--blue-bg)', border:'1px solid rgba(59,158,255,.2)', borderRadius:'var(--r2)', padding:'14px 16px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                    <ArrowUpRight size={16} color="var(--blue)"/>
                    <span style={{ fontSize:11, fontWeight:700, letterSpacing:'.08em', color:'var(--blue)', textTransform:'uppercase' }}>Sold To</span>
                  </div>
                  <div style={{ fontSize:15, fontWeight:700 }}>{phone.sale_customer || '—'}</div>
                  {phone.sale_customer_mobile && (
                    <div style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>{phone.sale_customer_mobile}</div>
                  )}
                  <div style={{ fontSize:12, color:'var(--text2)', marginTop:4 }}>
                    {phone.sale_date ? formatDate(phone.sale_date) : '—'}
                  </div>
                  <div style={{ fontSize:15, fontWeight:700, color:'var(--blue)', marginTop:8 }}>
                    {money(phone.final_amount)}
                  </div>
                  <div style={{ marginTop:8 }}>
                    <span style={{ fontFamily:'monospace', fontSize:11, color:'var(--accent2)', background:'var(--accent-bg)', padding:'2px 8px', borderRadius:4 }}>
                      {phone.invoice_number}
                    </span>
                  </div>
                  {phone.profit !== undefined && (
                    <div style={{ marginTop:10, padding:'8px 10px', background: phone.profit >= 0 ? 'var(--green-bg)' : 'var(--red-bg)', borderRadius:'var(--r2)', fontSize:13, fontWeight:700, color: phone.profit >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      Profit: {money(phone.profit)}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ background:'var(--surface2)', border:'1px dashed var(--border2)', borderRadius:'var(--r2)', padding:'14px 16px', textAlign:'center' }}>
                  <div style={{ fontSize:13, color:'var(--text3)', fontWeight:600 }}>Still in Stock</div>
                  <div style={{ fontSize:12, color:'var(--text3)', marginTop:4 }}>Not yet sold</div>
                  {phone.sale_price && (
                    <div style={{ fontSize:14, fontWeight:700, color:'var(--green)', marginTop:8 }}>
                      Listed: {money(phone.sale_price)}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* CNIC Images */}
            {cnicImgs.length > 0 && (
              <div style={{ marginTop:16, paddingTop:14, borderTop:'1px solid var(--border)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                  <CreditCard size={16} color="var(--accent2)"/>
                  <span style={{ fontSize:13, fontWeight:700, color:'var(--text2)' }}>Seller CNIC</span>
                </div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {cnicImgs.map((img: any) => (
                    <CnicImage key={img.id} path={img.path} />
                  ))}
                </div>
              </div>
            )}

            {/* Phone Images */}
            {phoneImgs.length > 0 && (
              <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid var(--border)' }}>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--text2)', marginBottom:10 }}>Phone Photos</div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {phoneImgs.map((img: any) => (
                    <PhoneImageThumb key={img.id} path={img.path} />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const CnicImage: React.FC<{ path: string }> = ({ path }) => {
  const [src, setSrc] = useState('');
  useEffect(() => {
    window.api.images.get(path).then(b64 => {
      if (b64) {
        const ext = path.split('.').pop()?.toLowerCase();
        const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
        setSrc(`data:${mime};base64,${b64}`);
      }
    });
  }, [path]);

  if (!src) return <div style={{ width:120, height:80, background:'var(--surface2)', borderRadius:6 }}/>;

  return (
    <img
      src={src}
      alt="CNIC"
      style={{ width:120, height:80, objectFit:'cover', borderRadius:6, border:'2px solid var(--accent)', cursor:'pointer' }}
      onClick={() => { const w = window.open(); if (w) { w.document.write(`<img src="${src}" style="max-width:100%;max-height:100vh"/>`); }}}
    />
  );
};

const PhoneImageThumb: React.FC<{ path: string }> = ({ path }) => {
  const [src, setSrc] = useState('');
  useEffect(() => {
    window.api.images.get(path).then(b64 => {
      if (b64) {
        const ext = path.split('.').pop()?.toLowerCase();
        const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
        setSrc(`data:${mime};base64,${b64}`);
      }
    });
  }, [path]);

  if (!src) return <div style={{ width:80, height:80, background:'var(--surface2)', borderRadius:6 }}/>;

  return (
    <img
      src={src}
      alt="Phone"
      style={{ width:80, height:80, objectFit:'cover', borderRadius:6, border:'1px solid var(--border)', cursor:'pointer' }}
      onClick={() => { const w = window.open(); if (w) { w.document.write(`<img src="${src}" style="max-width:100%;max-height:100vh"/>`); }}}
    />
  );
};

export default PhoneHistory;
