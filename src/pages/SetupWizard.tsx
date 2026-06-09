import React, { useState } from 'react';
import { Smartphone, Upload, FileText, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fileToBase64 } from '../utils';

const STEPS = [
  { label: 'Shop Info',    Icon: Smartphone },
  { label: 'Logo',         Icon: Upload },
  { label: 'Terms',        Icon: FileText },
  { label: 'Complete',     Icon: CheckCircle },
];

const SetupWizard: React.FC = () => {
  const { completeSetup } = useApp();
  const [step, setStep]   = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoB64, setLogoB64] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '', ownerName: '', mobile: '', whatsapp: '',
    email: '', address: '', city: '',
    invoiceTerms: 'موبائل صرف 24 گھنٹے چیک وارنٹی کے ساتھ فروخت کیا گیا ہے۔ پانی لگنے، گرنے، یا سافٹ ویئر خرابی کی صورت میں وارنٹی ختم تصور ہوگی۔',
    password: '', confirmPassword: '',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await fileToBase64(file);
    setLogoB64(b64);
    setLogoPreview(`data:${file.type};base64,${b64}`);
  };

  const next = () => {
    setError('');
    if (step === 0) {
      if (!form.name || !form.ownerName || !form.mobile) { setError('Please fill Shop Name, Owner Name and Mobile.'); return; }
      if (!form.password || form.password.length < 4)    { setError('Password must be at least 4 characters.'); return; }
      if (form.password !== form.confirmPassword)         { setError('Passwords do not match.'); return; }
    }
    setStep(s => Math.min(s+1, 3));
  };

  const finish = async () => {
    setLoading(true);
    try {
      if (logoB64) await window.api.logo.save(logoB64);
      await completeSetup({
        shop: { name: form.name, ownerName: form.ownerName, mobile: form.mobile, whatsapp: form.whatsapp, email: form.email, address: form.address, city: form.city, invoiceTerms: form.invoiceTerms },
        password: form.password,
      });
    } catch(e: any) {
      setError(e.message || 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ width:'100%', maxWidth:560, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, overflow:'hidden', boxShadow:'var(--shadow)' }}>
        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#6c63ff,#a78bfa)', padding:'28px 32px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
            <div style={{ width:42, height:42, borderRadius:10, background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Smartphone size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize:18, fontWeight:800, color:'#fff' }}>MobileTrack Pro</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.7)' }}>First Time Setup</div>
            </div>
          </div>
          {/* Steps indicator */}
          <div style={{ display:'flex', gap:8 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                <div style={{ width:'100%', height:3, borderRadius:2, background: i <= step ? '#fff' : 'rgba(255,255,255,0.3)', transition:'background 0.3s' }} />
                <div style={{ fontSize:10, color: i <= step ? '#fff' : 'rgba(255,255,255,0.5)', fontWeight:600, textAlign:'center' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding:'28px 32px' }}>
          {error && <div style={{ background:'var(--red-bg)', border:'1px solid var(--red)', color:'var(--red)', borderRadius:8, padding:'10px 14px', fontSize:12, marginBottom:16 }}>{error}</div>}

          {/* Step 0: Shop Info */}
          {step === 0 && (
            <div className="fade-in">
              <h3 style={{ fontSize:16, fontWeight:700, marginBottom:18 }}>Shop Information</h3>
              <div className="form-grid cols-2" style={{ gap:12 }}>
                <div className="field"><label>Shop Name *</label><input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="ABC Mobile Shop" /></div>
                <div className="field"><label>Owner Name *</label><input value={form.ownerName} onChange={e=>set('ownerName',e.target.value)} placeholder="Your full name" /></div>
                <div className="field"><label>Mobile *</label><input value={form.mobile} onChange={e=>set('mobile',e.target.value)} placeholder="0300-1234567" /></div>
                <div className="field"><label>WhatsApp</label><input value={form.whatsapp} onChange={e=>set('whatsapp',e.target.value)} placeholder="0312-1234567" /></div>
                <div className="field"><label>Email</label><input value={form.email} onChange={e=>set('email',e.target.value)} placeholder="shop@email.com" /></div>
                <div className="field"><label>City</label><input value={form.city} onChange={e=>set('city',e.target.value)} placeholder="Karachi" /></div>
                <div className="field" style={{ gridColumn:'span 2' }}><label>Address</label><input value={form.address} onChange={e=>set('address',e.target.value)} placeholder="Full shop address" /></div>
                <div className="divider" style={{ gridColumn:'span 2', margin:'6px 0' }} />
                <div className="field"><label>Password *</label><input type="password" value={form.password} onChange={e=>set('password',e.target.value)} placeholder="Min 4 characters" /></div>
                <div className="field"><label>Confirm Password *</label><input type="password" value={form.confirmPassword} onChange={e=>set('confirmPassword',e.target.value)} placeholder="Repeat password" /></div>
              </div>
            </div>
          )}

          {/* Step 1: Logo */}
          {step === 1 && (
            <div className="fade-in">
              <h3 style={{ fontSize:16, fontWeight:700, marginBottom:6 }}>Shop Logo</h3>
              <p style={{ fontSize:13, color:'var(--text2)', marginBottom:18 }}>Upload your logo. It will appear on invoices, reports and the dashboard.</p>
              <label style={{ display:'block', cursor:'pointer' }}>
                <input type="file" accept="image/png,image/jpeg" style={{ display:'none' }} onChange={handleLogoUpload} />
                <div className="upload-zone">
                  {logoPreview
                    ? <img src={logoPreview} alt="logo" style={{ maxHeight:120, maxWidth:'100%', borderRadius:8, objectFit:'contain' }} />
                    : <>
                        <Upload size={32} color="var(--text3)" style={{ margin:'0 auto 10px', display:'block' }} />
                        <div style={{ fontSize:13, color:'var(--text2)' }}>Click to upload PNG or JPG</div>
                        <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>Recommended: 200×200px or larger</div>
                      </>
                  }
                </div>
              </label>
              {logoPreview && (
                <button className="btn btn-ghost btn-sm" style={{ marginTop:10 }} onClick={() => { setLogoPreview(null); setLogoB64(null); }}>Remove logo</button>
              )}
              <p style={{ fontSize:12, color:'var(--text3)', marginTop:12 }}>You can skip this step and add a logo later from Settings.</p>
            </div>
          )}

          {/* Step 2: Terms */}
          {step === 2 && (
            <div className="fade-in">
              <h3 style={{ fontSize:16, fontWeight:700, marginBottom:6 }}>Invoice Terms & Conditions</h3>
              <p style={{ fontSize:13, color:'var(--text2)', marginBottom:16 }}>This Urdu text will appear on every invoice. You can edit it anytime from Settings.</p>
              <div className="field">
                <label>Warranty Text (Urdu)</label>
                <textarea
                  value={form.invoiceTerms}
                  onChange={e => set('invoiceTerms', e.target.value)}
                  rows={6}
                  style={{ direction:'rtl', textAlign:'right', fontSize:14, lineHeight:1.8 }}
                />
              </div>
            </div>
          )}

          {/* Step 3: Complete */}
          {step === 3 && (
            <div className="fade-in" style={{ textAlign:'center', padding:'10px 0' }}>
              <div style={{ width:70, height:70, borderRadius:'50%', background:'var(--green-bg)', border:'2px solid var(--green)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px' }}>
                <CheckCircle size={36} color="var(--green)" />
              </div>
              <h3 style={{ fontSize:18, fontWeight:800, marginBottom:8 }}>Ready to Launch!</h3>
              <p style={{ fontSize:13, color:'var(--text2)', marginBottom:24 }}>Your shop <strong>{form.name}</strong> is configured. Click below to start using MobileTrack Pro.</p>
              <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, padding:'14px 18px', textAlign:'left', marginBottom:20 }}>
                {[['Shop Name', form.name],['Owner', form.ownerName],['Mobile', form.mobile],['City', form.city]].map(([l, v]) => (
                  <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', fontSize:13, borderBottom:'1px solid var(--border)' }}>
                    <span style={{ color:'var(--text2)' }}>{l}</span><strong>{v}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:24 }}>
            {step > 0
              ? <button className="btn btn-ghost" onClick={() => setStep(s=>s-1)}><ArrowLeft size={15}/>Back</button>
              : <div/>
            }
            {step < 3
              ? <button className="btn btn-primary" onClick={next}>Next<ArrowRight size={15}/></button>
              : <button className="btn btn-success" onClick={finish} disabled={loading} style={{ minWidth:160, justifyContent:'center' }}>
                  {loading ? 'Saving…' : <><CheckCircle size={15}/>Launch Software</>}
                </button>
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupWizard;
