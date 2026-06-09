import { PtaStatus } from '../types';

export const money = (v: number | undefined | null) =>
  `₨ ${Number(v || 0).toLocaleString('en-PK')}`;

export const ptaLabel = (s: PtaStatus | string) =>
  ({ pta: 'PTA Approved', non_pta: 'Non PTA', jv: 'JV', cpid: 'CPID', unlocked: 'Factory Unlocked' }[s] || s);

export const ptaColor = (s: PtaStatus | string): string =>
  ({ pta: 'green', non_pta: 'red', jv: 'amber', cpid: 'purple', unlocked: 'blue' }[s] || 'gray');

export const statusColor = (s: string) =>
  ({ available: 'green', sold: 'blue', reserved: 'amber' }[s] || 'gray');

export const formatDate = (d: string | undefined) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-PK', { day:'2-digit', month:'short', year:'numeric' }); }
  catch { return d; }
};

export const formatDateTime = (d: string | undefined) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleString('en-PK', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }); }
  catch { return d; }
};

export const dateToInput = (d?: Date) => (d || new Date()).toISOString().slice(0, 10);

export const monthStart = () => {
  const d = new Date(); d.setDate(1);
  return dateToInput(d);
};

export const today = () => dateToInput();

export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res((r.result as string).split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

export const clsx = (...classes: (string | undefined | false | null)[]) =>
  classes.filter(Boolean).join(' ');

export const isElectron = () => !!(window as any).api;

// Mock API for browser dev/testing
export const api = (): typeof window.api => {
  if (isElectron()) return window.api;
  throw new Error('Not in Electron environment');
};
