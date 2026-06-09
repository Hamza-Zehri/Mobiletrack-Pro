import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Settings, LicenseStatus } from '../types';

interface AppContextType {
  isLoggedIn: boolean;
  isFirstRun: boolean;
  licenseLoading: boolean;
  licenseStatus: LicenseStatus | null;
  settings: Settings | null;
  theme: 'dark' | 'light';
  logoBase64: string | null;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  completeSetup: (data: any) => Promise<any>;
  refreshSettings: () => Promise<void>;
  refreshLicense: () => Promise<LicenseStatus>;
  activateLicense: (key: string) => Promise<{ ok: boolean; error?: string }>;
  toggleTheme: () => void;
  toast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  toastState: { msg: string; type: string; visible: boolean };
}

const AppContext = createContext<AppContextType>(null!);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn,     setLoggedIn]     = useState(false);
  const [isFirstRun,     setFirstRun]     = useState(false);
  const [licenseLoading, setLicenseLoading] = useState(true);
  const [licenseStatus,  setLicenseStatus]  = useState<LicenseStatus | null>(null);
  const [settings,       setSettings]     = useState<Settings | null>(null);
  const [logoBase64,     setLogo]         = useState<string | null>(null);
  const [theme,          setTheme]        = useState<'dark' | 'light'>('dark');
  const [toastState,     setToastState]   = useState({ msg: '', type: 'success', visible: false });

  const refreshSettings = useCallback(async () => {
    const s = await window.api.settings.get();
    setSettings(s);
    const logo = await window.api.logo.get();
    setLogo(logo ? `data:image/png;base64,${logo}` : null);
  }, []);

  const refreshLicense = useCallback(async () => {
    const status = await window.api.license.getStatus();
    setLicenseStatus(status);
    setLicenseLoading(false);
    return status;
  }, []);

  useEffect(() => {
    (async () => {
      const status = await refreshLicense();
      if (!status.activated) return;

      const firstRun = await window.api.setup.isFirstRun();
      setFirstRun(firstRun);
      if (!firstRun) await refreshSettings();
    })();
  }, [refreshLicense, refreshSettings]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const login = async (username: string, password: string) => {
    const res = await window.api.auth.login(username, password);
    if (res.ok) {
      setLoggedIn(true);
      await refreshSettings();
    }
    return res;
  };

  const logout = () => setLoggedIn(false);

  const completeSetup = async (data: any) => {
    const res = await window.api.setup.complete(data);
    if (res.ok) {
      setFirstRun(false);
      await refreshSettings();
    }
    return res;
  };

  const activateLicense = async (key: string) => {
    const res = await window.api.license.activate(key);
    if (res.ok) {
      const status = await refreshLicense();
      if (status.activated) {
        const firstRun = await window.api.setup.isFirstRun();
        setFirstRun(firstRun);
        if (!firstRun) await refreshSettings();
      }
    }
    return res;
  };

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const toast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastState({ msg, type, visible: true });
    setTimeout(() => setToastState(s => ({ ...s, visible: false })), 3000);
  }, []);

  return (
    <AppContext.Provider value={{
      isLoggedIn, isFirstRun, licenseLoading, licenseStatus,
      settings, theme, logoBase64,
      login, logout, completeSetup, refreshSettings, refreshLicense, activateLicense,
      toggleTheme, toast, toastState,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
