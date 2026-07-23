import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Eye, Trash2, Search, Users } from 'lucide-react';
import { Customer } from '../types';
import { formatDate } from '../utils';
import { Confirm, Modal } from '../components/ui/Toast';
import { useApp } from '../context/AppContext';

const Customers: React.FC = () => {
  const nav = useNavigate();
  const { toast } = useApp();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [deleteId, setDeleteId]   = useState<number | null>(null);
  const [addModal, setAddModal]   = useState(false);
  const [form, setForm] = useState({ name:'', mobile:'', cnic:'', address:'', notes:'' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await window.api.customers.getAll(search);
    setCustomers(data);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await window.api.customers.delete(deleteId);
    setDeleteId(null);
    if (res.ok) {
      toast('Customer deleted');
      load();
    } else {
      toast(res.error || 'Cannot delete customer', 'error');
    }
  };

  const handleAdd = async () => {
    if (!form.name) { toast('Name is required', 'error'); return; }
    setSaving(true);
    await window.api.customers.add(form);
    setSaving(false);
    setAddModal(false);
    setForm({ name:'', mobile:'', cnic:'', address:'', notes:'' });
    toast('Customer added');
    load();
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p style={{ fontSize:13, color:'var(--text2)', marginTop:2 }}>{customers.length} customers</p>
        </div>
        <button className="btn btn-primary" onClick={()=>setAddModal(true)}>
          <UserPlus size={15}/>Add Customer
        </button>
      </div>

      {/* Search */}
      <div style={{ display:'flex', gap:8, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:'0 12px', height:38, alignItems:'center', maxWidth:320, marginBottom:16 }}>
        <Search size={14} color="var(--text3)"/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, mobile, CNIC…"
          style={{ background:'none', border:'none', outline:'none', fontSize:13, color:'var(--text)', fontFamily:'inherit', flex:1 }}/>
      </div>

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Customer</th><th>Mobile</th><th>CNIC</th><th>Sold To</th><th>Bought From</th><th>Since</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} style={{ textAlign:'center', padding:40, color:'var(--text3)' }}>Loading…</td></tr>}
              {!loading && customers.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign:'center', padding:40 }}>
                  <Users size={40} style={{ display:'block', margin:'0 auto 10px', opacity:.3 }}/>
                  <p style={{ color:'var(--text3)' }}>No customers yet</p>
                </td></tr>
              )}
              {customers.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#6c63ff,#a78bfa)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff', flexShrink:0 }}>
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <strong>{c.name}</strong>
                        {c.address && <div className="sub">{c.address}</div>}
                      </div>
                    </div>
                  </td>
                  <td>{c.mobile || '—'}</td>
                  <td><span style={{ fontFamily:'monospace', fontSize:11 }}>{c.cnic || '—'}</span></td>
                  <td>
                    <span style={{ fontSize:13, fontWeight:600, color:'var(--blue)' }}>{c.sold_to || 0} phone{c.sold_to!==1?'s':''}</span>
                  </td>
                  <td>
                    <span style={{ fontSize:13, fontWeight:600, color:'var(--green)' }}>{c.bought_from || 0} phone{c.bought_from!==1?'s':''}</span>
                  </td>
                  <td><span style={{ fontSize:11, color:'var(--text3)' }}>{formatDate(c.created_at)}</span></td>
                  <td>
                    <div style={{ display:'flex', gap:5 }}>
                      <button className="icon-btn" onClick={()=>nav(`/customers/${c.id}`)}><Eye size={13}/></button>
                      <button className="icon-btn danger" onClick={()=>setDeleteId(c.id)}><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      <Modal open={addModal} onClose={()=>setAddModal(false)} title="Add New Customer">
        <div className="form-grid cols-2" style={{ gap:12, marginBottom:16 }}>
          <div className="field" style={{ gridColumn:'span 2' }}><label>Full Name *</label><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Customer full name" autoFocus/></div>
          <div className="field"><label>Mobile</label><input value={form.mobile} onChange={e=>setForm(f=>({...f,mobile:e.target.value}))} placeholder="03XX XXXXXXX"/></div>
          <div className="field"><label>CNIC</label><input value={form.cnic} onChange={e=>setForm(f=>({...f,cnic:e.target.value}))} placeholder="XXXXX-XXXXXXX-X"/></div>
          <div className="field" style={{ gridColumn:'span 2' }}><label>Address</label><input value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} placeholder="City / Area"/></div>
          <div className="field" style={{ gridColumn:'span 2' }}><label>Notes</label><textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={2} placeholder="Optional notes"/></div>
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button className="btn btn-ghost" onClick={()=>setAddModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>
            {saving ? 'Saving…' : 'Add Customer'}
          </button>
        </div>
      </Modal>

      <Confirm
        open={deleteId !== null}
        title="Delete Customer"
        message="Delete this customer? Their transaction history will be preserved."
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={()=>setDeleteId(null)}
      />
    </div>
  );
};

export default Customers;
