import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { ptaLabel, ptaColor, statusColor } from '../../utils';
import { PtaStatus } from '../../types';

// ── Toast ─────────────────────────────────────────────────────────────────────
interface ToastProps { msg: string; type: string; visible: boolean; }
const Toast: React.FC<ToastProps> = ({ msg, type, visible }) => {
  const colors = { success: 'var(--green)', error: 'var(--red)', info: 'var(--blue)' };
  const icons  = { success: <CheckCircle size={16}/>, error: <XCircle size={16}/>, info: <Info size={16}/> };
  return (
    <div style={{
      position:'fixed', bottom:24, right:24, zIndex:9999,
      background: (colors as any)[type] || colors.success,
      color:'#fff', padding:'11px 18px', borderRadius:10,
      fontSize:13, fontWeight:600,
      display:'flex', alignItems:'center', gap:8,
      boxShadow:'0 8px 30px rgba(0,0,0,0.25)',
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      opacity: visible ? 1 : 0,
      transition: 'all 0.25s ease',
      pointerEvents: 'none',
    }}>
      {(icons as any)[type] || icons.success}
      {msg}
    </div>
  );
};
export default Toast;

// ── Badge ─────────────────────────────────────────────────────────────────────
export const PtaBadge: React.FC<{ status: PtaStatus | string }> = ({ status }) => (
  <span className={`badge badge-${ptaColor(status)}`}>{ptaLabel(status)}</span>
);

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`badge badge-${statusColor(status)}`}>{status.charAt(0).toUpperCase()+status.slice(1)}</span>
);

export const ColorBadge: React.FC<{ label: string; color?: string }> = ({ label, color = 'gray' }) => (
  <span className={`badge badge-${color}`}>{label}</span>
);

// ── Modal ─────────────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: number;
}
export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, width = 520 }) => {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', width:'100%', maxWidth:width, maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:'var(--shadow)' }}
        className="fade-in">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          <span style={{ fontSize:15, fontWeight:700 }}>{title}</span>
          <button className="icon-btn" onClick={onClose}><X size={15}/></button>
        </div>
        <div style={{ padding:'20px', overflowY:'auto', flex:1 }}>{children}</div>
      </div>
    </div>
  );
};

// ── Confirm Dialog ────────────────────────────────────────────────────────────
interface ConfirmProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
export const Confirm: React.FC<ConfirmProps> = ({ open, title, message, confirmLabel='Confirm', danger, onConfirm, onCancel }) => (
  <Modal open={open} onClose={onCancel} title={title} width={400}>
    <p style={{ fontSize:13, color:'var(--text2)', marginBottom:20 }}>{message}</p>
    <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
      <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
      <button className={`btn btn-sm ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>{confirmLabel}</button>
    </div>
  </Modal>
);

// ── Spinner ───────────────────────────────────────────────────────────────────
export const Spinner: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <div style={{ width:size, height:size, border:`2px solid var(--border2)`, borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin 0.7s linear infinite', flexShrink:0 }} />
);

// ── Empty State ───────────────────────────────────────────────────────────────
export const EmptyState: React.FC<{ icon?: React.ReactNode; message: string; action?: React.ReactNode }> = ({ icon, message, action }) => (
  <div className="empty-state">
    {icon}
    <p>{message}</p>
    {action && <div style={{ marginTop:14 }}>{action}</div>}
  </div>
);

// ── Section Header ────────────────────────────────────────────────────────────
export const SectionTitle: React.FC<{ icon?: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => (
  <div className="section-title">{icon}{children}</div>
);
