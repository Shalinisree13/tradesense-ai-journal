"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Users,
  ShieldAlert,
  Search,
  Loader2,
  Activity,
  Shield,
  TrendingUp,
  Target,
  CreditCard,
  Eye,
  Clock,
  Laptop,
} from "lucide-react";

interface UserProfile {
  userId: string;
  email?: string;
  plan: string;
  role?: string;
  createdAt?: string;
}

interface TradeRecord {
  id: string;
  userId: string;
  userEmail?: string;
  symbol: string;
  action: string;
  price: number;
  quantity: number;
  pnl?: number;
  status: string;
  createdAt: string;
}

interface WatchlistItem {
  id: string;
  userId: string;
  userEmail?: string;
  symbol: string;
  target: number;
  alertPrice: number;
  status: string;
  notes: string;
}

interface GoalItem {
  id: string;
  userId: string;
  userEmail?: string;
  title: string;
  targetProfit: number;
  currentProfit: number;
  timeframe: string;
  status: string;
}

interface PaymentRecord {
  id: string;
  userId: string;
  userEmail?: string;
  amount: number;
  plan: string;
  billing: string;
  paymentId: string;
  paidAt: string;
}

interface ActivityRecord {
  id: string;
  userId: string;
  email: string;
  action: string;
  role: string;
  userAgent: string;
  timestamp: string;
}

export default function AdminDashboard() {
  const { user, userSettings } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [watchlists, setWatchlists] = useState<WatchlistItem[]>([]);
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"activities" | "users" | "trades" | "watchlists" | "goals" | "payments">("activities");

  // Search/Filters
  const [userSearch, setUserSearch] = useState<string>("");

  const isAdmin = userSettings?.role === "admin" || [
    "chippadadhanush10260@gmail.com",
    "shalinisree13@gmail.com",
    "admin@tradesense.com"
  ].includes(user?.email || "");

  const loadAdminData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      // 1. Fetch registered users profiles
      const settingsSnap = await getDocs(collection(db, "settings"));
      const userList: UserProfile[] = [];
      settingsSnap.forEach((doc) => {
        userList.push({ userId: doc.id, ...doc.data() } as UserProfile);
      });

      // Helper function to match emails
      const getEmail = (uid: string) => {
        const found = userList.find((u) => u.userId === uid);
        return found?.email || "unknown@trader.com";
      };

      // 2. Fetch login activities
      const activitiesSnap = await getDocs(collection(db, "user_activities"));
      const activityList: ActivityRecord[] = [];
      activitiesSnap.forEach((doc) => {
        activityList.push({ id: doc.id, ...doc.data() } as ActivityRecord);
      });
      activityList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // 3. Fetch trade records (Real)
      const tradesSnap = await getDocs(collection(db, "trades"));
      const tradeList: TradeRecord[] = [];
      tradesSnap.forEach((doc) => {
        const d = doc.data();
        tradeList.push({
          id: doc.id,
          ...d,
          userEmail: getEmail(d.userId),
        } as TradeRecord);
      });
      tradeList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // 4. Fetch watchlist records
      const watchlistsSnap = await getDocs(collection(db, "watchlists"));
      const watchlistList: WatchlistItem[] = [];
      watchlistsSnap.forEach((doc) => {
        const d = doc.data();
        watchlistList.push({
          id: doc.id,
          ...d,
          userEmail: getEmail(d.userId),
        } as WatchlistItem);
      });

      // 5. Fetch goals records
      const goalsSnap = await getDocs(collection(db, "goals"));
      const goalList: GoalItem[] = [];
      goalsSnap.forEach((doc) => {
        const d = doc.data();
        goalList.push({
          id: doc.id,
          ...d,
          userEmail: getEmail(d.userId),
        } as GoalItem);
      });

      // 6. Fetch payments records
      const paymentsSnap = await getDocs(collection(db, "payments"));
      const paymentList: PaymentRecord[] = [];
      paymentsSnap.forEach((doc) => {
        const d = doc.data();
        paymentList.push({
          id: doc.id,
          ...d,
          userEmail: getEmail(d.userId),
        } as PaymentRecord);
      });
      paymentList.sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());

      setUsers(userList);
      setActivities(activityList);
      setTrades(tradeList);
      setWatchlists(watchlistList);
      setGoals(goalList);
      setPayments(paymentList);
    } catch (error) {
      console.error("Error loading admin audit data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [user]);

  const toggleUserAdminRole = async (userId: string, currentRole?: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    try {
      const userRef = doc(db, "settings", userId);
      await updateDoc(userRef, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.userId === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      console.error("Failed to update user role:", err);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <ShieldAlert className="h-14 w-14 text-red-500 mb-4 animate-bounce" />
        <h1 className="text-xl font-bold text-gray-200">Access Denied</h1>
        <p className="text-sm text-gray-500 mt-2 max-w-sm">
          You do not have administrative permissions to access platform telemetry.
        </p>
      </div>
    );
  }

  // Filter helpers
  const matchesSearch = (val?: string) =>
    val?.toLowerCase().includes(userSearch.toLowerCase()) ?? false;

  const filteredUsers = users.filter((u) => matchesSearch(u.email) || matchesSearch(u.userId) || matchesSearch(u.role));
  const filteredActivities = activities.filter((act) => matchesSearch(act.email) || matchesSearch(act.action) || matchesSearch(act.userAgent));
  const filteredTrades = trades.filter((t) => matchesSearch(t.userEmail) || matchesSearch(t.symbol) || matchesSearch(t.action));
  const filteredWatchlists = watchlists.filter((w) => matchesSearch(w.userEmail) || matchesSearch(w.symbol));
  const filteredGoals = goals.filter((g) => matchesSearch(g.userEmail) || matchesSearch(g.title) || matchesSearch(g.status));
  const filteredPayments = payments.filter((p) => matchesSearch(p.userEmail) || matchesSearch(p.paymentId) || matchesSearch(p.plan));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
          Platform Administration
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Monitor login sessions, track user activities, audit journals, and manage platform permissions.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh]">
          <Loader2 className="h-10 w-10 animate-spin text-purple-500 mb-2" />
          <p className="text-xs text-gray-500">Retrieving platform telemetry...</p>
        </div>
      ) : (
        <>
          {/* Summary metrics header row */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="bg-[#0b0f19] border border-gray-800 p-3 rounded-xl">
              <span className="text-[9px] text-gray-500 uppercase font-semibold">Registered</span>
              <p className="text-xl font-bold text-gray-200 mt-1">{users.length}</p>
            </div>
            <div className="bg-[#0b0f19] border border-gray-800 p-3 rounded-xl">
              <span className="text-[9px] text-gray-500 uppercase font-semibold">Logins</span>
              <p className="text-xl font-bold text-blue-400 mt-1">{activities.length}</p>
            </div>
            <div className="bg-[#0b0f19] border border-gray-800 p-3 rounded-xl">
              <span className="text-[9px] text-gray-500 uppercase font-semibold">Trade Logs</span>
              <p className="text-xl font-bold text-emerald-400 mt-1">{trades.length}</p>
            </div>
            <div className="bg-[#0b0f19] border border-gray-800 p-3 rounded-xl">
              <span className="text-[9px] text-gray-500 uppercase font-semibold">Watchlists</span>
              <p className="text-xl font-bold text-yellow-500 mt-1">{watchlists.length}</p>
            </div>
            <div className="bg-[#0b0f19] border border-gray-800 p-3 rounded-xl">
              <span className="text-[9px] text-gray-500 uppercase font-semibold">Goals Set</span>
              <p className="text-xl font-bold text-purple-400 mt-1">{goals.length}</p>
            </div>
            <div className="bg-[#0b0f19] border border-gray-800 p-3 rounded-xl">
              <span className="text-[9px] text-gray-500 uppercase font-semibold">Payments</span>
              <p className="text-xl font-bold text-pink-400 mt-1">{payments.length}</p>
            </div>
          </div>

          {/* Telemetry tabs */}
          <div className="flex items-center gap-1 flex-wrap border-b border-gray-800">
            {[
              { id: "activities", label: "🛡️ Login Audits", icon: Clock },
              { id: "users", label: "👥 User Registry", icon: Users },
              { id: "trades", label: "💼 Trade Logs", icon: TrendingUp },
              { id: "watchlists", label: "🔔 Watchlists", icon: Eye },
              { id: "goals", label: "🎯 Goals Status", icon: Target },
              { id: "payments", label: "💰 Payments", icon: CreditCard },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 cursor-pointer transition-all ${
                    activeTab === t.id
                      ? "border-purple-500 text-purple-400 bg-purple-500/5"
                      : "border-transparent text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-2 max-w-sm bg-[#090e1f] border border-gray-800 rounded-lg px-3 py-1.5">
            <Search className="h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by user email, symbol, device or details..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="bg-transparent text-xs outline-none border-none text-gray-300 w-full"
            />
          </div>

          {/* Tab Views */}
          {activeTab === "activities" && (
            <div className="overflow-x-auto border border-gray-800/80 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-900/40 border-b border-gray-800 text-gray-500 font-bold">
                    <th className="p-3.5">User Email / UID</th>
                    <th className="p-3.5">Action</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Browser Client Device</th>
                    <th className="p-3.5">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 bg-gray-950/20">
                  {filteredActivities.map((act) => (
                    <tr key={act.id} className="hover:bg-gray-900/20 text-gray-300">
                      <td className="p-3.5">
                        <div className="font-semibold">{act.email || "Google Authenticated"}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5 font-mono">{act.userId}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded font-mono text-[9px] uppercase font-bold">
                          {act.action}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          act.role === "admin" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "text-gray-500"
                        }`}>
                          {act.role}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <Laptop className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate max-w-[220px]" title={act.userAgent}>
                            {act.userAgent}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          <span>{new Date(act.timestamp).toLocaleString()}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "users" && (
            <div className="overflow-x-auto border border-gray-800/80 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-900/40 border-b border-gray-800 text-gray-500 font-bold">
                    <th className="p-3.5">User Email / UID</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Billing Subscription Plan</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 bg-gray-950/20">
                  {filteredUsers.map((u) => (
                    <tr key={u.userId} className="hover:bg-gray-900/20 text-gray-300">
                      <td className="p-3.5">
                        <div className="font-semibold">{u.email || "Trader Account"}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5 font-mono">{u.userId}</div>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.role === "admin" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "text-gray-500"
                        }`}>
                          {u.role || "user"}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded text-[10px] font-black uppercase">
                          {u.plan}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => toggleUserAdminRole(u.userId, u.role)}
                          className={`text-[10px] border px-2 py-1 rounded transition-colors cursor-pointer ${
                            u.role === "admin"
                              ? "bg-red-500/15 border-red-500/20 text-red-400 hover:bg-red-500/30"
                              : "bg-purple-600/15 border-purple-500/20 text-purple-400 hover:bg-purple-600/30"
                          }`}
                        >
                          {u.role === "admin" ? "Revoke Admin Privilege" : "Elevate to Admin"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "trades" && (
            <div className="overflow-x-auto border border-gray-800/80 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-900/40 border-b border-gray-800 text-gray-500 font-bold">
                    <th className="p-3.5">Trader</th>
                    <th className="p-3.5">Symbol</th>
                    <th className="p-3.5">Action</th>
                    <th className="p-3.5">Price</th>
                    <th className="p-3.5">Quantity</th>
                    <th className="p-3.5">Profit/Loss (PNL)</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 bg-gray-950/20">
                  {filteredTrades.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-900/20 text-gray-300">
                      <td className="p-3.5">
                        <div className="font-semibold">{t.userEmail}</div>
                        <div className="text-[9px] text-gray-500 font-mono">{t.userId}</div>
                      </td>
                      <td className="p-3.5 font-bold">{t.symbol}</td>
                      <td className="p-3.5">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                          t.action === "BUY" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                        }`}>
                          {t.action}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono">${t.price.toLocaleString()}</td>
                      <td className="p-3.5 font-mono">{t.quantity}</td>
                      <td className={`p-3.5 font-mono font-bold ${
                        t.pnl && t.pnl >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}>
                        {t.pnl ? `${t.pnl >= 0 ? "+" : ""}$${t.pnl.toLocaleString()}` : "-"}
                      </td>
                      <td className="p-3.5">
                        <span className="px-1.5 py-0.5 bg-gray-900 text-gray-400 rounded text-[9px] uppercase">
                          {t.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-gray-500 font-mono">{new Date(t.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "watchlists" && (
            <div className="overflow-x-auto border border-gray-800/80 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-900/40 border-b border-gray-800 text-gray-500 font-bold">
                    <th className="p-3.5">Trader</th>
                    <th className="p-3.5">Symbol</th>
                    <th className="p-3.5">Alert Level</th>
                    <th className="p-3.5">Target</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 bg-gray-950/20">
                  {filteredWatchlists.map((w) => (
                    <tr key={w.id} className="hover:bg-gray-900/20 text-gray-300">
                      <td className="p-3.5">
                        <div className="font-semibold">{w.userEmail}</div>
                      </td>
                      <td className="p-3.5 font-bold text-yellow-500">{w.symbol}</td>
                      <td className="p-3.5 font-mono">${w.alertPrice.toLocaleString()}</td>
                      <td className="p-3.5 font-mono">${w.target.toLocaleString()}</td>
                      <td className="p-3.5">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          w.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-gray-800 text-gray-500"
                        }`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-gray-400 truncate max-w-[200px]" title={w.notes}>
                        {w.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "goals" && (
            <div className="overflow-x-auto border border-gray-800/80 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-900/40 border-b border-gray-800 text-gray-500 font-bold">
                    <th className="p-3.5">Trader</th>
                    <th className="p-3.5">Goal Title</th>
                    <th className="p-3.5">Target Profit</th>
                    <th className="p-3.5">Current Progress</th>
                    <th className="p-3.5">Timeframe</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 bg-gray-950/20">
                  {filteredGoals.map((g) => (
                    <tr key={g.id} className="hover:bg-gray-900/20 text-gray-300">
                      <td className="p-3.5">
                        <div className="font-semibold">{g.userEmail}</div>
                      </td>
                      <td className="p-3.5 font-bold text-gray-200">{g.title}</td>
                      <td className="p-3.5 font-mono">${g.targetProfit.toLocaleString()}</td>
                      <td className="p-3.5 font-mono">${g.currentProfit.toLocaleString()}</td>
                      <td className="p-3.5 text-gray-500">{g.timeframe}</td>
                      <td className="p-3.5">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                          g.status === "completed" ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"
                        }`}>
                          {g.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "payments" && (
            <div className="overflow-x-auto border border-gray-800/80 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-900/40 border-b border-gray-800 text-gray-500 font-bold">
                    <th className="p-3.5">Subscriber</th>
                    <th className="p-3.5">Payment ID</th>
                    <th className="p-3.5">Plan Purchased</th>
                    <th className="p-3.5">Amount</th>
                    <th className="p-3.5">Billing</th>
                    <th className="p-3.5">Date Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 bg-gray-950/20">
                  {filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-900/20 text-gray-300">
                      <td className="p-3.5">
                        <div className="font-semibold">{p.userEmail}</div>
                      </td>
                      <td className="p-3.5 font-mono text-purple-400 font-bold">{p.paymentId}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded text-[9px] font-black uppercase">
                          {p.plan}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-gray-200">
                        ₹{(p.amount / 100).toLocaleString()}
                      </td>
                      <td className="p-3.5 uppercase font-semibold text-gray-500">{p.billing}</td>
                      <td className="p-3.5 font-mono text-gray-500">{new Date(p.paidAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
