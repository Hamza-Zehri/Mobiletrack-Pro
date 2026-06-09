import React, { useState, useEffect } from 'react';
import { Save, Upload, Lock, MessageCircle, FileText, Store } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fileToBase64 } from '../utils';

const TABS = [
  { id:'shop',     label:'Shop',     icon: Store },
  { id:'invoice',  label:'Invoice',  icon: FileText },
  { id:'whatsapp', label:'WhatsApp', icon: MessageCircle },
  { id:'security', label:'Security', icon: Lock },
];

const Settings: React.FC = () => {
  const { settings, refreshSettings, logoBase64, toast } = useApp();
  const [tab, setTab] = useState('shop');

  // Shop form
  const [shop, setShop] = useState<any>({});
  const [logoPreview, setLogoPreview] = useState<string|null>(null);
  const [newLogoB64, setNewLogoB64]   = useState<string|null>(null);

  // Invoice form
  const [invoiceTerms,  setTerms]  = useState('');
  const [invoiceFooter, setFooter] = useState('');

  // WhatsApp form
  const [waTemplate, setWaTemplate] = useState('');

  // Security
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confPass,setConfPass]= useState('');
  const [passErr, setPassErr] = useState('');

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setShop({ ...settings.shop });
      setTerms(settings.invoiceTerms || '');
      setFooter(settings.invoiceFooter || '');
      setWaTemplate(settings.whatsappTemplate || '');
    }
    if (logoBase64) setLogoPreview(logoBase64);
  }, [settings, logoBase64]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await fileToBase64(file);
    setNewLogoB64(b64);
    setLogoPreview(`data:${file.type};base64,${b64}`);
  };

  const saveShop = async () => {
    setSaving(true);
    if (newLogoB64) await window.api.logo.save(newLogoB64);
    await window.api.settings.save({ shop });
    await refreshSettings();
    setSaving(false);
    toast('Shop settings saved');
  };

  const saveInvoice = async () => {
    setSaving(true);
    await window.api.settings.save({ invoice_terms: invoiceTerms, invoice_footer: invoiceFooter });
    await refreshSettings();
    setSaving(false);
    toast('Invoice settings saved');
  };

  const saveWhatsApp = async () => {
    setSaving(true);
    await window.api.settings.save({ whatsapp_template: waTemplate });
    await refreshSettings();
    setSaving(false);
    toast('WhatsApp settings saved');
  };

  const changePassword = async () => {
    setPassErr('');
    if (!oldPass || !newPass) { setPassErr('All fields are required'); return; }
    if (newPass.length < 4)   { setPassErr('Password must be at least 4 characters'); return; }
    if (newPass !== confPass) { setPassErr('Passwords do not match'); return; }
    setSaving(true);
    const res = await window.api.auth.changePassword(oldPass, newPass);
    setSaving(false);
    if (!res.ok) { setPassErr(res.error || 'Wrong current password'); return; }
    setOldPass(''); setNewPass(''); setConfPass('');
    toast('Password changed successfully');
  };

  const s = (k: string) => (v: string) => setShop((f: any) => ({ ...f, [k]: v }));

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
      </div>

      {/* Tab Bar */}
      <div style={{ display:'flex', gap:0, borderBottom:'1px solid var(--border)', marginBottom:22 }}>
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 20px', fontSize:13, fontWeight:600, cursor:'pointer', background:'none', border:'none', fontFamily:'inherit',
                color: active ? 'var(--accent2)' : 'var(--text2)',
                borderBottom: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
                marginBottom:-1, transition:'all .15s',
              }}>
              <Icon size={14}/>{t.label}
            </button>
          );
        })}
      </div>

      {/* ── Shop Tab ────────────────────────────────────────────────────── */}
      {tab === 'shop' && (
        <div className="fade-in">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 260px', gap:16, alignItems:'start' }}>
            <div className="card">
              <div className="form-grid cols-2" style={{ gap:14, marginBottom:16 }}>
                <div className="field"><label>Shop Name</label><input value={shop.name||''} onChange={e=>s('name')(e.target.value)} placeholder="ABC Mobile Shop"/></div>
                <div className="field"><label>Owner Name</label><input value={shop.ownerName||''} onChange={e=>s('ownerName')(e.target.value)}/></div>
                <div className="field"><label>Mobile</label><input value={shop.mobile||''} onChange={e=>s('mobile')(e.target.value)} placeholder="0300-XXXXXXX"/></div>
                <div className="field"><label>WhatsApp</label><input value={shop.whatsapp||''} onChange={e=>s('whatsapp')(e.target.value)} placeholder="0312-XXXXXXX"/></div>
                <div className="field"><label>Email</label><input value={shop.email||''} onChange={e=>s('email')(e.target.value)}/></div>
                <div className="field"><label>City</label><input value={shop.city||''} onChange={e=>s('city')(e.target.value)}/></div>
                <div className="field" style={{ gridColumn:'span 2' }}><label>Address</label><input value={shop.address||''} onChange={e=>s('address')(e.target.value)}/></div>
              </div>
              <button className="btn btn-primary" onClick={saveShop} disabled={saving}><Save size={14}/>{saving?'Saving…':'Save Changes'}</button>
            </div>
            <div className="card">
              <div style={{ fontSize:13, fontWeight:700, marginBottom:14 }}>Shop Logo</div>
              <div style={{ textAlign:'center', marginBottom:14 }}>
                {logoPreview
                  ? <img src={logoPreview} alt="logo" style={{ width:100, height:100, borderRadius:14, objectFit:'cover', border:'2px solid var(--accent)' }}/>
                  : <div style={{ width:100, height:100, borderRadius:14, background:'linear-gradient(135deg,#6c63ff,#a78bfa)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto', fontSize:36, color:'#fff' }}>📱</div>
                }
              </div>
              <label style={{ display:'block', cursor:'pointer' }}>
                <input type="file" accept="image/*" style={{ display:'none' }} onChange={handleLogoUpload}/>
                <div className="upload-zone" style={{ textAlign:'center' }}>
                  <Upload size={18} color="var(--text3)" style={{ display:'block', margin:'0 auto 6px' }}/>
                  <div style={{ fontSize:12, color:'var(--text2)' }}>Upload New Logo</div>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>PNG or JPG</div>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ── Invoice Tab ─────────────────────────────────────────────────── */}
      {tab === 'invoice' && (
        <div className="fade-in card" style={{ maxWidth:680 }}>
          <div className="field" style={{ marginBottom:16 }}>
            <label>Warranty / Terms (Urdu – appears on every invoice)</label>
            <textarea
              value={invoiceTerms}
              onChange={e=>setTerms(e.target.value)}
              rows={6}
              style={{ direction:'rtl', textAlign:'right', fontSize:14, lineHeight:1.9 }}
              placeholder="وارنٹی کی شرائط یہاں لکھیں…"
            />
          </div>
          <div className="field" style={{ marginBottom:20 }}>
            <label>Invoice Footer Message (English)</label>
            <input value={invoiceFooter} onChange={e=>setFooter(e.target.value)} placeholder="Thank you for your purchase!"/>
          </div>
          <button className="btn btn-primary" onClick={saveInvoice} disabled={saving}><Save size={14}/>{saving?'Saving…':'Save Invoice Settings'}</button>
        </div>
      )}

      {/* ── WhatsApp Tab ────────────────────────────────────────────────── */}
      {tab === 'whatsapp' && (
        <div className="fade-in card" style={{ maxWidth:600 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, padding:'10px 14px', background:'var(--green-bg)', border:'1px solid rgba(34,201,122,.2)', borderRadius:'var(--r2)' }}>
            <MessageCircle size={16} color="var(--green)"/>
            <span style={{ fontSize:13, color:'var(--text2)' }}>This message will be pre-filled when you click "Share on WhatsApp" on any invoice.</span>
          </div>
          <div className="field" style={{ marginBottom:20 }}>
            <label>Default WhatsApp Message</label>
            <textarea value={waTemplate} onChange={e=>setWaTemplate(e.target.value)} rows={8} style={{ direction:'rtl', textAlign:'right', fontSize:14, lineHeight:1.9 }}/>
          </div>
          <button className="btn btn-success" onClick={saveWhatsApp} disabled={saving}><Save size={14}/>{saving?'Saving…':'Save WhatsApp Settings'}</button>
        </div>
      )}

      {/* ── Security Tab ────────────────────────────────────────────────── */}
      {tab === 'security' && (
        <div className="fade-in card" style={{ maxWidth:480 }}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:16 }}>Change Password</div>
          {passErr && (
            <div style={{ background:'var(--red-bg)', border:'1px solid var(--red)', color:'var(--red)', borderRadius:'var(--r2)', padding:'9px 12px', fontSize:12, marginBottom:14 }}>{passErr}</div>
          )}
          <div style={{ display:'flex', flexDirection:'column', gap:14, marginBottom:20 }}>
            <div className="field"><label>Current Password</label><input type="password" value={oldPass} onChange={e=>setOldPass(e.target.value)} placeholder="Enter current password"/></div>
            <div className="field"><label>New Password</label><input type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="Min 4 characters"/></div>
            <div className="field"><label>Confirm New Password</label><input type="password" value={confPass} onChange={e=>setConfPass(e.target.value)} placeholder="Repeat new password"/></div>
          </div>
          <button className="btn btn-primary" onClick={changePassword} disabled={saving}><Lock size={14}/>{saving?'Changing…':'Change Password'}</button>
        </div>
      )}
    </div>
  );
};

export default Settings;
