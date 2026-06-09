import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone } from 'lucide-react';

const OWNER_CLICKS = 5;
const OWNER_WINDOW_MS = 2500;

const About: React.FC = () => {
  const nav = useNavigate();
  const clickCount = useRef(0);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.altKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        nav('/owner/license');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [nav]);

  const handleVersionClick = () => {
    clickCount.current += 1;
    if (clickTimer.current) clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(() => { clickCount.current = 0; }, OWNER_WINDOW_MS);
    if (clickCount.current >= OWNER_CLICKS) {
      clickCount.current = 0;
      nav('/owner/license');
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth:560, margin:'40px auto', textAlign:'center' }}>
      <div style={{ width:96, height:96, borderRadius:22, background:'linear-gradient(135deg,#6c63ff,#a78bfa)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px', boxShadow:'0 20px 60px rgba(108,99,255,.35)' }}>
        <Smartphone size={48} color="#fff"/>
      </div>

      <h1 style={{ fontSize:26, fontWeight:800, marginBottom:6 }}>MobileTrack Pro</h1>
      <p style={{ fontSize:14, color:'var(--text2)', marginBottom:4 }}>Mobile Shop Inventory & Sales Management System</p>
      <div
        onClick={handleVersionClick}
        title="Version"
        style={{ display:'inline-block', background:'var(--accent-bg)', color:'var(--accent2)', padding:'4px 14px', borderRadius:20, fontSize:12, fontWeight:700, marginBottom:28, cursor:'default', userSelect:'none' }}
      >
        Version 1.0.0
      </div>

      <div className="card" style={{ textAlign:'left', marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:56, height:56, borderRadius:'50%', background:'linear-gradient(135deg,#6c63ff,#a78bfa)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:800, color:'#fff', flexShrink:0 }}>H</div>
          <div>
            <div style={{ fontSize:18, fontWeight:700 }}>Engr. Hamza Asad</div>
            <div style={{ fontSize:13, color:'var(--text2)', marginTop:3 }}>Software Architect & Developer</div>
            <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>All Rights Reserved © 2026</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ textAlign:'left' }}>
        <div style={{ fontSize:13, fontWeight:700, marginBottom:12, color:'var(--text2)' }}>Features</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
          {['Inventory Management','Purchase Tracking','Bulk Purchase Entry','Sales & Invoicing','PDF Invoice Generation','WhatsApp Sharing','Customer Management','Phone History Search','Reports & Analytics','Encrypted Backup','Auto Backup','Device License Protection'].map(f => (
            <div key={f} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'var(--text2)', padding:'4px 0' }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--accent)', flexShrink:0 }}/>
              {f}
            </div>
          ))}
        </div>
      </div>

      <p style={{ fontSize:11, color:'var(--text3)', marginTop:24 }}>
        Designed for mobile phone shops across Pakistan
      </p>
    </div>
  );
};

export default About;
