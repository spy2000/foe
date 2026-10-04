"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, CardSettings } from "@/lib/api";

interface SettingsContextValue {
  settings: CardSettings | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  updateLocalSettings: (newSettings: CardSettings) => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: null,
  loading: true,
  refreshSettings: async () => {},
  updateLocalSettings: () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<CardSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.getSettings();
      if (res.success && res.data) {
        setSettings(res.data);
      }
    } catch (err) {
      console.error("Failed to load settings in SettingsProvider:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateLocalSettings = useCallback((newSettings: CardSettings) => {
    setSettings(newSettings);
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        refreshSettings: fetchSettings,
        updateLocalSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useCardSettings() {
  return useContext(SettingsContext);
}
