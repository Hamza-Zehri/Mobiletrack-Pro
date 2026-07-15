import React from 'react';
import { Phone, Mail, User } from 'lucide-react';

export const SUPPORT = {
  name: 'Engr. Hamza Asad',
  phone: '03357981317',
  email: 'hamzazehri2472@gmail.com',
};

const SupportContact: React.FC<{ title?: string }> = ({ title = 'For assistance, contact the developer' }) => (
  <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
      {title}
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 13, fontWeight: 600 }}>
      <User size={14} color="var(--accent2)" />
      {SUPPORT.name}
    </div>
    <a href={`tel:${SUPPORT.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 13, color: 'var(--text2)', textDecoration: 'none' }}>
      <Phone size={14} color="var(--text3)" />
      {SUPPORT.phone}
    </a>
    <a href={`mailto:${SUPPORT.email}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text2)', textDecoration: 'none', wordBreak: 'break-all' }}>
      <Mail size={14} color="var(--text3)" />
      {SUPPORT.email}
    </a>
  </div>
);

export default SupportContact;
