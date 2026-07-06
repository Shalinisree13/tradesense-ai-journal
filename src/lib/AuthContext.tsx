"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

type AccountMode = "real" | "demo";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  userSettings: any;
  refreshSettings: () => Promise<void>;
  accountMode: AccountMode;
  setAccountMode: (mode: AccountMode) => void;
  tradesCollection: string; // "trades" or "demo_trades"
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  userSettings: null,
  refreshSettings: async () => {},
  accountMode: "real",
  setAccountMode: () => {},
  tradesCollection: "trades",
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userSettings, setUserSettings] = useState<any>(null);
  const [accountMode, setAccountModeState] = useState<AccountMode>("real");

  const tradesCollection = accountMode === "demo" ? "demo_trades" : "trades";

  const setAccountMode = (mode: AccountMode) => {
    setAccountModeState(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("tradesense_account_mode", mode);
    }
  };

  const loadUserSettings = async (currentUser: User) => {
    try {
      const settingsRef = doc(db, "settings", currentUser.uid);
      const settingsSnap = await getDoc(settingsRef);
      if (settingsSnap.exists()) {
        setUserSettings(settingsSnap.data());
      } else {
        const defaultSettings = {
          userId: currentUser.uid,
          currency: "USD",
          theme: "dark",
          language: "en",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
          plan: "free",
          brokerSettings: {
            defaultLotSize: 0.1,
            defaultRiskPct: 1,
            defaultBroker: "MetaTrader 5",
            defaultEquity: 10000,
          },
          notifications: {
            dailyReminder: true,
            summaries: true,
            riskAlert: true,
            overtradingAlert: true,
            revengeTradingAlert: true,
          },
          createdAt: new Date().toISOString(),
        };
        await setDoc(settingsRef, defaultSettings);
        setUserSettings(defaultSettings);
      }
    } catch (error) {
      console.error("Error loading user settings:", error);
    }
  };

  const refreshSettings = async () => {
    if (!user) return;
    await loadUserSettings(user);
  };

  useEffect(() => {
    // Restore account mode from localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("tradesense_account_mode") as AccountMode | null;
      if (saved === "demo" || saved === "real") setAccountModeState(saved);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 3000);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      clearTimeout(timeout);
      try {
        setUser(currentUser);
        if (currentUser) {
          loadUserSettings(currentUser);
        } else {
          setUserSettings(null);
        }
      } catch (error) {
        console.error("Auth state change error:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserSettings(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, userSettings, refreshSettings, accountMode, setAccountMode, tradesCollection }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
