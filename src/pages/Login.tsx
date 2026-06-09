import React, { useState } from 'react';
import { Smartphone, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../context/AppContext';

const Login: React.FC = () => {
  const { login, settings } = useApp();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [show, setShow]         = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const shopName = settings?.shop?.name || 'MobileTrack Pro';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const res = await login(username, password);
    if (!res.ok) setError(res.error || 'Invalid credentials');
    setLoading(false);
  };

  return (
    <div style={{ height:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:360, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, overflow:'hidden', boxShadow:'var(--shadow)' }}>
        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#6c63ff,#a78bfa)', padding:'32px 28px 28px', textAlign:'center' }}>
          <div style={{ width:60, height:60, borderRadius:14, background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
            <Smartphone size={30} color="#fff" />
          </div>
          <div style={{ fontSize:20, fontWeight:800, color:'#fff' }}>{shopName}</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.7)', marginTop:4 }}>MobileTrack Pro · v1.0</div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={{ padding:'28px' }}>
          <h2 style={{ fontSize:16, fontWeight:700, marginBottom:20 }}>Sign In to Continue</h2>

          {error && <div style={{ background:'var(--red-bg)', border:'1px solid var(--red)', color:'var(--red)', borderRadius:8, padding:'9px 12px', fontSize:12, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
            <Lock size={13}/>{error}
          </div>}

          <div className="field" style={{ marginBottom:14 }}>
            <label>Username</label>
            <div style={{ position:'relative' }}>
              <User size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text3)' }} />
              <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="admin" style={{ paddingLeft:32 }} />
            </div>
          </div>

          <div className="field" style={{ marginBottom:24 }}>
            <label>Password</label>
            <div style={{ position:'relative' }}>
              <Lock size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text3)' }} />
              <input type={show?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter password" style={{ paddingLeft:32, paddingRight:36 }} />
              <button type="button" onClick={()=>setShow(s=>!s)} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text3)' }}>
                {show ? <EyeOff size={14}/> : <Eye size={14}/>}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width:'100%', justifyContent:'center', height:42, fontSize:14 }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          <p style={{ fontSize:11, color:'var(--text3)', textAlign:'center', marginTop:16 }}>Developed by Engr. Hamza Asad · All Rights Reserved</p>
        </form>
      </div>
    </div>
  );
};

export default Login;
