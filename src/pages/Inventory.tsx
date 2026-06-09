import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Receipt, Trash2, Search } from 'lucide-react';
import { Phone, PhoneFilters, PtaStatus } from '../types';
import { money, formatDate } from '../utils';
import { PtaBadge, StatusBadge, Confirm } from '../components/ui/Toast';
import { useApp } from '../context/AppContext';

const STATUS_TABS = [
  { label:'All', value:'all' }, { label:'Available', value:'available' },
  { label:'Sold', value:'sold' }, { label:'PTA ✓', value:'pta', field:'pta' },
  { label:'Non PTA', value:'non_pta', field:'pta' }, { label:'JV', value:'jv', field:'pta' },
  { label:'CPID', value:'cpid', field:'pta' }, { label:'Android', value:'Android', field:'brand' },
];

const Inventory: React.FC = () => {
  const nav = useNavigate();
  const { toast } = useApp();
  const [phones, setPhones]   = useState<Phone[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<PhoneFilters>({ status: 'all' });
  const [search, setSearch]   = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [deleteId, setDeleteId]   = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const f: PhoneFilters = { ...filters, search };
    const data = await window.api.phones.getAll(f);
    setPhones(data);
    setLoading(false);
  }, [filters, search]);

  useEffect(() => { load(); }, [load]);

  const handleTab = (t: typeof STATUS_TABS[0]) => {
    setActiveTab(t.value);
    if (!t.field) setFilters({ status: t.value as any });
    else if (t.field === 'pta') setFilters({ pta_status: t.value as PtaStatus });
    else if (t.field === 'brand') setFilters({ brand: t.value });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await window.api.phones.delete(deleteId);
    setDeleteId(null);
    toast('Phone deleted from inventory');
    load();
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p style={{ fontSize:13, color:'var(--text2)', marginTop:2 }}>{phones.length} phones found</p>
        </div>
        <button className="btn btn-primary" onClick={() => nav('/inventory/add')}>
          <Plus size={15}/>Add Phone
        </button>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', flex:1 }}>
          {STATUS_TABS.map(t => (
            <button key={t.value}
              onClick={() => handleTab(t)}
              style={{
                padding:'5px 14px', borderRadius:20, fontSize:12, fontWeight:600,
                border:'none', cursor:'pointer', transition:'all .15s',
                background: activeTab === t.value ? 'var(--accent)' : 'var(--surface2)',
                color:       activeTab === t.value ? '#fff' : 'var(--text2)',
              }}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', gap:8, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:'0 12px', height:34, alignItems:'center', width:230 }}>
          <Search size={13} color="var(--text3)" />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="IMEI, model, invoice…"
            style={{ background:'none', border:'none', outline:'none', fontSize:12, color:'var(--text)', fontFamily:'inherit', width:'100%' }} />
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Model</th><th>IMEI</th><th>Storage</th>
                <th>PTA</th><th>Status</th><th>Cost</th>
                <th>Sale Price</th><th>Battery</th><th>Source</th><th>Added</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={11} style={{ textAlign:'center', padding:40, color:'var(--text3)' }}>Loading…</td></tr>
              )}
              {!loading && phones.length === 0 && (
                <tr><td colSpan={11} style={{ textAlign:'center', padding:40, color:'var(--text3)' }}>
                  No phones found. <button className="btn btn-ghost btn-sm" onClick={()=>nav('/inventory/add')}>Add one</button>
                </td></tr>
              )}
              {phones.map(p => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.brand} {p.model}</strong>
                    <div className="sub">{p.color}</div>
                  </td>
                  <td style={{ fontFamily:'monospace', fontSize:11 }}>{p.imei1}</td>
                  <td>{p.storage}</td>
                  <td><PtaBadge status={p.pta_status}/></td>
                  <td><StatusBadge status={p.status}/></td>
                  <td style={{ fontWeight:600 }}>{money(p.cost_price)}</td>
                  <td style={{ color:'var(--green)' }}>{p.sale_price ? money(p.sale_price) : '—'}</td>
                  <td>{p.battery_health || '—'}</td>
                  <td><span style={{ fontSize:11, color:'var(--text2)' }}>{p.source_name || '—'}</span></td>
                  <td><span style={{ fontSize:11, color:'var(--text3)' }}>{formatDate(p.created_at)}</span></td>
                  <td>
                    <div style={{ display:'flex', gap:5 }}>
                      <button className="icon-btn" title="View" onClick={()=>nav(`/inventory/${p.id}/edit`)}><Eye size={13}/></button>
                      {p.status === 'available' && (
                        <button className="icon-btn" title="Sell" onClick={()=>nav(`/sales?phone_id=${p.id}`)}><Receipt size={13}/></button>
                      )}
                      <button className="icon-btn danger" title="Delete" onClick={()=>setDeleteId(p.id)}><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Confirm
        open={deleteId !== null}
        title="Delete Phone"
        message="Are you sure you want to delete this phone from inventory? This action cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

export default Inventory;
