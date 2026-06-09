import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { BulkPhoneRow, PtaStatus } from '../types';
import { useApp } from '../context/AppContext';

const EMPTY_ROW = (): BulkPhoneRow => ({
  brand:'Apple', model:'iPhone 15', storage:'128GB', color:'', pta_status:'pta',
  imei1:'', imei2:'', battery_health:'', cost_price:0, sale_price:0, face_id:'Working', true_tone:'Working', box:false, charger:false,
});

const BulkPurchase: React.FC = () => {
  const nav = useNavigate();
  const { toast } = useApp();
  const [loading, setLoading] = useState(false);
  const [header, setHeader] = useState({
    supplier_name:'', supplier_mobile:'', market_name:'Saddar Mobile Market',
    purchase_date: new Date().toISOString().slice(0,10), notes:'',
  });
  const [rows, setRows] = useState<BulkPhoneRow[]>([EMPTY_ROW(), EMPTY_ROW()]);

  const setH = (k: string, v: string) => setHeader(h => ({ ...h, [k]: v }));
  const setRow = (i: number, k: keyof BulkPhoneRow, v: any) =>
    setRows(rs => rs.map((r, j) => j === i ? { ...r, [k]: v } : r));
  const addRow = () => setRows(rs => [...rs, EMPTY_ROW()]);
  const removeRow = (i: number) => setRows(rs => rs.filter((_, j) => j !== i));

  const total = rows.reduce((s, r) => s + (Number(r.cost_price) || 0), 0);

  const handleSave = async () => {
    if (!header.supplier_name) { toast('Please enter supplier name', 'error'); return; }
    const invalid = rows.find(r => !r.imei1 || r.imei1.length < 15);
    if (invalid) { toast('All phones need a valid 15-digit IMEI', 'error'); return; }
    setLoading(true);
    try {
      await window.api.purchases.addBulk({ ...header, phones: rows.map(r => ({ ...r, cost_price: Number(r.cost_price)||0, sale_price: Number(r.sale_price)||0 })) });
      toast(`${rows.length} phones saved successfully!`);
      nav('/inventory');
    } catch(e: any) {
      toast(e.message || 'Failed to save', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button className="btn btn-ghost btn-sm" onClick={()=>nav('/purchase')}><ArrowLeft size={14}/></button>
          <h1 className="page-title">Bulk Purchase Entry</h1>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
          <Save size={15}/>{loading ? 'Saving…' : `Save ${rows.length} Phone${rows.length>1?'s':''}`}
        </button>
      </div>

      {/* Supplier Info */}
      <div className="card" style={{ marginBottom:14 }}>
        <div className="form-grid cols-3" style={{ gap:12 }}>
          <div className="field"><label>Supplier Name *</label><input value={header.supplier_name} onChange={e=>setH('supplier_name',e.target.value)} placeholder="e.g. Ali Mobile Karachi"/></div>
          <div className="field"><label>Mobile</label><input value={header.supplier_mobile} onChange={e=>setH('supplier_mobile',e.target.value)} placeholder="03XX XXXXXXX"/></div>
          <div className="field"><label>Market</label>
            <select value={header.market_name} onChange={e=>setH('market_name',e.target.value)}>
              <option>Saddar Mobile Market</option><option>Star City Mall</option><option>Karachi Wholesale Market</option><option>Other</option>
            </select>
          </div>
          <div className="field"><label>Purchase Date</label><input type="date" value={header.purchase_date} onChange={e=>setH('purchase_date',e.target.value)}/></div>
          <div className="field" style={{ gridColumn:'span 2' }}><label>Notes</label><input value={header.notes} onChange={e=>setH('notes',e.target.value)} placeholder="Optional notes"/></div>
        </div>
      </div>

      {/* Phone Table */}
      <div className="card" style={{ padding:0, overflow:'hidden', marginBottom:14 }}>
        <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontWeight:700, fontSize:14 }}>Phone List ({rows.length} phones)</span>
          <button className="btn btn-primary btn-sm" onClick={addRow}><Plus size={13}/>Add Row</button>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ borderBottom:'1px solid var(--border)' }}>
                {['#','Brand','Model','Storage','Color','PTA','IMEI 1','IMEI 2','Battery','Face ID','Box','Cost ₨','Sale ₨',''].map(h=>(
                  <th key={h} style={{ padding:'8px 10px', fontWeight:600, color:'var(--text3)', fontSize:11, textTransform:'uppercase', letterSpacing:'.05em', textAlign:'left', background:'var(--surface)', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} style={{ borderBottom:'1px solid var(--border)' }}>
                  <td style={{ padding:'8px 10px', color:'var(--text3)', fontWeight:600 }}>{i+1}</td>
                  <Cell>
                    <select value={row.brand} onChange={e=>setRow(i,'brand',e.target.value)} style={cellInput}>
                      <option>Apple</option><option>Samsung</option><option>Other</option>
                    </select>
                  </Cell>
                  <Cell>
                    <input value={row.model} onChange={e=>setRow(i,'model',e.target.value)} style={{ ...cellInput, width:130 }} placeholder="Model"/>
                  </Cell>
                  <Cell>
                    <select value={row.storage} onChange={e=>setRow(i,'storage',e.target.value)} style={cellInput}>
                      <option>64GB</option><option>128GB</option><option>256GB</option><option>512GB</option><option>1TB</option>
                    </select>
                  </Cell>
                  <Cell><input value={row.color} onChange={e=>setRow(i,'color',e.target.value)} style={{ ...cellInput, width:80 }} placeholder="Color"/></Cell>
                  <Cell>
                    <select value={row.pta_status} onChange={e=>setRow(i,'pta_status',e.target.value as PtaStatus)} style={cellInput}>
                      <option value="pta">PTA</option><option value="non_pta">Non PTA</option><option value="jv">JV</option><option value="cpid">CPID</option><option value="unlocked">Unlocked</option>
                    </select>
                  </Cell>
                  <Cell>
                    <input value={row.imei1} maxLength={15} onChange={e=>setRow(i,'imei1',e.target.value)} style={{ ...cellInput, width:130, fontFamily:'monospace' }} placeholder="000000000000000"/>
                  </Cell>
                  <Cell>
                    <input value={row.imei2||''} maxLength={15} onChange={e=>setRow(i,'imei2',e.target.value)} style={{ ...cellInput, width:130, fontFamily:'monospace' }} placeholder="Optional"/>
                  </Cell>
                  <Cell><input value={row.battery_health} onChange={e=>setRow(i,'battery_health',e.target.value)} style={{ ...cellInput, width:60 }} placeholder="92%"/></Cell>
                  <Cell>
                    <select value={row.face_id||'Working'} onChange={e=>setRow(i,'face_id',e.target.value)} style={cellInput}>
                      <option>Working</option><option>Not Working</option><option>N/A</option>
                    </select>
                  </Cell>
                  <Cell>
                    <input type="checkbox" checked={!!row.box} onChange={e=>setRow(i,'box',e.target.checked)} style={{ accentColor:'var(--accent)', width:15, height:15 }}/>
                  </Cell>
                  <Cell>
                    <input type="number" value={row.cost_price||''} onChange={e=>setRow(i,'cost_price',e.target.value)} style={{ ...cellInput, width:90 }} placeholder="0"/>
                  </Cell>
                  <Cell>
                    <input type="number" value={row.sale_price||''} onChange={e=>setRow(i,'sale_price',e.target.value)} style={{ ...cellInput, width:90 }} placeholder="0"/>
                  </Cell>
                  <td style={{ padding:'6px 10px' }}>
                    <button className="icon-btn danger" onClick={()=>removeRow(i)} disabled={rows.length<=1}><Trash2 size={12}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding:'12px 16px', background:'var(--surface2)', display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:'1px solid var(--border)' }}>
          <span style={{ fontSize:13, color:'var(--text2)' }}>{rows.length} phones · Total cost:</span>
          <span style={{ fontSize:16, fontWeight:800, color:'var(--green)' }}>₨ {total.toLocaleString('en-PK')}</span>
        </div>
      </div>

      <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
        <button className="btn btn-ghost" onClick={()=>nav('/purchase')}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
          <Save size={15}/>{loading ? 'Saving…' : `Save All ${rows.length} Phones`}
        </button>
      </div>
    </div>
  );
};

const cellInput: React.CSSProperties = {
  background:'var(--surface2)', border:'1px solid var(--border)',
  borderRadius:4, padding:'5px 7px', color:'var(--text)',
  fontSize:12, fontFamily:'inherit', outline:'none',
};
const Cell: React.FC<{children:React.ReactNode}> = ({children}) => (
  <td style={{ padding:'6px 8px' }}>{children}</td>
);

export default BulkPurchase;
