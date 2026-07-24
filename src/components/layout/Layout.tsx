import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard, Smartphone, ShoppingCart, Receipt,
  Users, History, BarChart2, UploadCloud, Settings,
  Info, Moon, Sun, Minus, Square, X, Bell, LogOut, Search,
  DollarSign
} from 'lucide-react';

const NAV = [
  { section: 'Main' },
  { label: 'Dashboard',     path: '/dashboard',    Icon: LayoutDashboard },
  { label: 'Inventory',     path: '/inventory',    Icon: Smartphone,   badge: 'stock' },
  { label: 'Purchase',      path: '/purchase',     Icon: ShoppingCart },
  { label: 'Sales',         path: '/sales',        Icon: Receipt },
  { section: 'Management' },
  { label: 'Customers',     path: '/customers',    Icon: Users },
  { label: 'Cash Register',  path: '/cash-register', Icon: DollarSign },
  { label: 'Phone History', path: '/history',      Icon: History },
  { label: 'Reports',       path: '/reports',      Icon: BarChart2 },
  { section: 'System' },
  { label: 'Backup',        path: '/backup',       Icon: UploadCloud },
  { label: 'Settings',      path: '/settings',     Icon: Settings },
  { label: 'About',         path: '/about',        Icon: Info },
];

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const nav  = useNavigate();
  const loc  = useLocation();
  const { settings, logoBase64, theme, toggleTheme, logout } = useApp();
  const [search, setSearch] = useState('');
  const [dayActive, setDayActive] = useState(false);

  useEffect(() => {
    window.api.register.getCurrent().then(s => setDayActive(!!s)).catch(() => {});
  }, [loc.pathname]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && search.trim()) {
      nav(`/history?q=${encodeURIComponent(search)}`);
      setSearch('');
    }
  };

  const shopName = settings?.shop?.name || 'MobileTrack Pro';
  const owner    = settings?.shop?.ownerName || 'Owner';

  return (
    <div className="app-shell">
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="sidebar">
        <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {logoBase64
              ? <img src={logoBase64} alt="logo" style={{ width:36, height:36, borderRadius:8, objectFit:'cover' }} />
              : <div style={{ width:36, height:36, borderRadius:8, background:'linear-gradient(135deg,#6c63ff,#a78bfa)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Smartphone size={20} color="#fff" />
                </div>
            }
            <div>
              <div style={{ fontSize:13, fontWeight:700, lineHeight:1.2 }}>{shopName}</div>
              <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>v1.0 · MobileTrack Pro</div>
            </div>
          </div>
        </div>

        <nav style={{ padding: '10px 8px', flex:1 }}>
          {NAV.map((item, i) => {
            if ('section' in item) {
              return (
                <div key={i} style={{ fontSize:10, fontWeight:600, color:'var(--text3)', letterSpacing:'0.08em', textTransform:'uppercase', padding:'10px 8px 4px' }}>
                  {item.section}
                </div>
              );
            }
            const active = loc.pathname.startsWith(item.path!);
            return (
              <div key={item.path}
                onClick={() => nav(item.path!)}
                style={{
                  display:'flex', alignItems:'center', gap:10,
                  padding:'9px 10px', borderRadius:'var(--r2)',
                  cursor:'pointer', fontSize:13, fontWeight:500,
                  marginBottom:1, transition:'all .15s',
                  color: active ? 'var(--accent2)' : 'var(--text2)',
                  background: active ? 'var(--accent-bg)' : 'transparent',
                }}
                onMouseEnter={e => { if (!active)(e.currentTarget as HTMLElement).style.background='var(--surface2)'; }}
                onMouseLeave={e => { if (!active)(e.currentTarget as HTMLElement).style.background='transparent'; }}
              >
                <item.Icon size={17} />
                <span style={{ flex:1 }}>{item.label}</span>
                {item.path === '/cash-register' && dayActive && (
                  <span style={{ width:7, height:7, borderRadius:'50%', background:'var(--green)', flexShrink:0 }} />
                )}
              </div>
            );
          })}
        </nav>

        <div style={{ padding:'12px', borderTop:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#6c63ff,#a78bfa)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff', flexShrink:0 }}>
              {owner.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{owner}</div>
              <div style={{ fontSize:10, color:'var(--text3)' }}>Shop Owner</div>
            </div>
            <button className="icon-btn" onClick={logout} title="Logout" style={{ flexShrink:0 }}><LogOut size={14} /></button>
          </div>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <div className="main-area">
        {/* Topbar */}
        <div className="topbar window-drag">
          <div style={{ flex:1, fontSize:15, fontWeight:700 }} className="no-drag">
            {/* breadcrumb title via location */}
            {getTitleFromPath(loc.pathname)}
          </div>

          <div className="topbar-actions no-drag" style={{ display:'flex', gap:8, alignItems:'center' }}>
            {/* Search */}
            <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--r2)', display:'flex', alignItems:'center', gap:8, padding:'0 10px', height:32, width:220 }}>
              <Search size={14} color="var(--text3)" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={handleSearch}
                placeholder="Search IMEI, model…"
                style={{ background:'none', border:'none', outline:'none', color:'var(--text)', fontSize:12, width:'100%', fontFamily:'inherit' }}
              />
            </div>

            <button className="icon-btn" onClick={toggleTheme} title="Toggle theme">
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Window controls */}
            <div style={{ display:'flex', gap:4, marginLeft:8 }}>
              <button className="icon-btn" onClick={() => window.api?.window.minimize()} title="Minimize"><Minus size={13} /></button>
              <button className="icon-btn" onClick={() => window.api?.window.maximize()} title="Maximize"><Square size={12} /></button>
              <button className="icon-btn danger" onClick={() => window.api?.window.close()} title="Close"><X size={13} /></button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="page-content fade-in" key={loc.pathname}>
          {children}
        </div>
      </div>
    </div>
  );
};

function getTitleFromPath(p: string): string {
  const map: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/inventory': 'Inventory',
    '/purchase':  'Purchase',
    '/sales':     'Sales',
    '/customers': 'Customers',
    '/cash-register': 'Cash Register',
    '/history':   'Phone History',
    '/reports':   'Reports',
    '/backup':    'Backup & Restore',
    '/settings':  'Settings',
    '/about':     'About',
  };
  for (const [k, v] of Object.entries(map)) if (p.startsWith(k)) return v;
  return 'MobileTrack Pro';
}

export default Layout;
