import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/layout/Layout';
import Welcome from './pages/Welcome';
import Activation from './pages/Activation';
import SetupWizard from './pages/SetupWizard';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import AddPhone from './pages/AddPhone';
import Purchase from './pages/Purchase';
import BulkPurchase from './pages/BulkPurchase';
import Sales from './pages/Sales';
import InvoicePage from './pages/InvoicePage';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import PhoneHistory from './pages/PhoneHistory';
import Reports from './pages/Reports';
import Backup from './pages/Backup';
import Settings from './pages/Settings';
import About from './pages/About';
import OwnerLicense from './pages/OwnerLicense';
import Toast from './components/ui/Toast';
import './styles/global.css';

const LoadingScreen: React.FC = () => (
  <div style={{ height: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg,#6c63ff,#a78bfa)', animation: 'pulse 1.2s ease infinite' }} />
    <div style={{ fontSize: 13, color: 'var(--text3)' }}>Loading MobileTrack Pro…</div>
    <style>{`@keyframes pulse { 0%,100%{opacity:.5;transform:scale(.95)} 50%{opacity:1;transform:scale(1)} }`}</style>
  </div>
);

const AppRoutes: React.FC = () => {
  const { isLoggedIn, isFirstRun, licenseLoading, licenseStatus } = useApp();

  if (licenseLoading) return <LoadingScreen />;

  // Fresh install — no activation file: show Welcome (Choose key or trial)
  if (licenseStatus?.status === 'not_activated') return <Welcome />;

  // Trial expired or other non-activated: show Activation (must enter key)
  if (!licenseStatus?.activated) return <Activation />;

  if (isFirstRun) return <SetupWizard />;
  if (!isLoggedIn) return <Login />;

  return (
    <Layout>
      <Routes>
        <Route path="/"               element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"      element={<Dashboard />} />
        <Route path="/inventory"      element={<Inventory />} />
        <Route path="/inventory/add"  element={<AddPhone />} />
        <Route path="/inventory/:id/edit" element={<AddPhone />} />
        <Route path="/purchase"       element={<Purchase />} />
        <Route path="/purchase/bulk"  element={<BulkPurchase />} />
        <Route path="/sales"          element={<Sales />} />
        <Route path="/sales/invoice/:id" element={<InvoicePage />} />
        <Route path="/customers"      element={<Customers />} />
        <Route path="/customers/:id"  element={<CustomerDetail />} />
        <Route path="/history"        element={<PhoneHistory />} />
        <Route path="/reports"        element={<Reports />} />
        <Route path="/backup"         element={<Backup />} />
        <Route path="/settings"       element={<Settings />} />
        <Route path="/about"          element={<About />} />
        <Route path="/owner/license"  element={<OwnerLicense />} />
        <Route path="*"               element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
};

const App: React.FC = () => (
  <AppProvider>
    <HashRouter>
      <AppRoutes />
      <ToastWrapper />
    </HashRouter>
  </AppProvider>
);

const ToastWrapper: React.FC = () => {
  const { toastState } = useApp();
  return <Toast {...toastState} />;
};

export default App;
