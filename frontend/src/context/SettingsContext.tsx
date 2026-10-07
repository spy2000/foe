"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, CardSettings } from "@/lib/api";

export const DEFAULT_CARD_SETTINGS: CardSettings = {
  id: 1,
  trustName: "FRIENDS OF EDUCATION",
  trustSubtitle: "CHARITABLE TRUST",
  registrationNo: "Reg. E-0040751(GBR)",
  logoUrl: "/logo.png",
  signatureUrl: "",
  websiteUrl: "www.friendsofeducation.in",
  aboutUsText: "Friends Of Education Charitable Trust is committed to supporting education and empowering lives for a better tomorrow.",
  validityClause: "Official use only by authorised members of the trust.",
  returnNote: "If found, please return this card to the Friends Of Education Charitable Trust at the above address or contact number",
  defaultEmergencyContact: "+91 9136643813",
  defaultAuthorisedName: "Mr. Shailesh Pandey",
  defaultAuthorisedDesignation: "Founder and President",
  updatedAt: new Date().toISOString(),
};

interface SettingsContextValue {
  settings: CardSettings | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  updateLocalSettings: (newSettings: CardSettings) => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_CARD_SETTINGS,
  loading: true,
  refreshSettings: async () => {},
  updateLocalSettings: () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<CardSettings | null>(DEFAULT_CARD_SETTINGS);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.getSettings();
      if (res.success && res.data) {
        setSettings(res.data);
      }
    } catch (err) {
      console.warn("Failed to load settings from server, using default fallback:", err);
      setSettings((prev) => prev || DEFAULT_CARD_SETTINGS);
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
