"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { collection, getDocs, doc, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Users,
  ShieldAlert,
  Search,
  CheckCircle,
  XCircle,
  Loader2,
  TrendingUp,
  CreditCard,
  Crown,
  Activity,
  ArrowRight,
} from "lucide-react";

interface UserProfile {
  userId: string;
  email?: string;
  plan: string;
  role?: string;
  createdAt?: string;
  planBilling?: string;
  planActivatedAt?: string;
  planExpiresAt?: string;
}

interface PaymentRecord {
  id?: string;
  amount: number;
  billing: string;
  paidAt: string;
  paymentId: string;
  plan: string;
  userEmail?: string;
  userId: string;
}

interface TradeRecord {
  id: string;
  userId: string;
  symbol: string;
  action: string;
  price: number;
  quantity: number;
  pnl?: number;
  status: string;
  createdAt: string;
  userEmail?: string;
}

export default function AdminDashboard() {
  const { user, userSettings } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"users" | "trades" | "payments">("users");

  // Filter/Search states
  const [userSearch, setUserSearch] = useState<string>("");
  const [selectedUserTrades, setSelectedUserTrades] = useState<string | null>(null);
  const [updatingPlanUserId, setUpdatingPlanUserId] = useState<string | null>(null);

  const isAdmin = userSettings?.role === "admin" || [
    "chippadadhanush10260@gmail.com",
    "shalinisree13@gmail.com",
    "admin@tradesense.com"
  ].includes(user?.email || "");

  const loadAdminData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      // 1. Fetch all user settings
      const settingsSnap = await getDocs(collection(db, "settings"));
      const userList: UserProfile[] = [];
      settingsSnap.forEach((doc) => {
        userList.push({ userId: doc.id, ...doc.data() } as UserProfile);
      });

      // 2. Fetch all payments logs
      const paymentsSnap = await getDocs(collection(db, "payments"));
      const paymentList: PaymentRecord[] = [];
      paymentsSnap.forEach((doc) => {
        paymentList.push({ id: doc.id, ...doc.data() } as PaymentRecord);
      });

      // 3. Fetch all trades logs (Real)
      const tradesSnap = await getDocs(collection(db, "trades"));
      const tradeList: TradeRecord[] = [];
      tradesSnap.forEach((doc) => {
        const data = doc.data();
        // Map user email from the user settings list
        const matchingUser = userList.find((u) => u.userId === data.userId);
        tradeList.push({
          id: doc.id,
          ...data,
          userEmail: matchingUser?.email || "unknown@user.com",
        } as TradeRecord);
      });

      setUsers(userList);
      setPayments(paymentList);
      setTrades(tradeList);
    } catch (error) {
      console.error("Error loading admin audit data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [user]);

  const updateUserPlan = async (userId: string, newPlan: string) => {
    setUpdatingPlanUserId(userId);
    try {
      const userRef = doc(db, "settings", userId);
      const updateData = {
        plan: newPlan,
        planActivatedAt: new Date().toISOString(),
        planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      };
      await updateDoc(userRef, updateData);
      
      // Update local state
      setUsers((prev) =>
        prev.map((u) => (u.userId === userId ? { ...u, ...updateData } : u))
      );
    } catch (err) {
      console.error("Failed to update user plan:", err);
    } finally {
      setUpdatingPlanUserId(null);
    }
  };

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

  // Filtered lists
  const filteredUsers = users.filter(
    (u) =>
      u.userId.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.plan.toLowerCase().includes(userSearch.toLowerCase())
  );

  const displayTrades = selectedUserTrades
    ? trades.filter((t) => t.userId === selectedUserTrades)
    : trades;

  // Calculate platform telemetry summaries
  const totalRevenuePaise = payments.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalRevenue = totalRevenuePaise / 100; // convert paise to INR
  const activePremiumCount = users.filter((u) => u.plan !== "free").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
          Platform Administration
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Monitor active user subscriptions, audit global trading journals, and manage platform payment logs.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh]">
          <Loader2 className="h-10 w-10 animate-spin text-purple-500 mb-2" />
          <p className="text-xs text-gray-500">Retrieving platform stats...</p>
        </div>
      ) : (
        <>
          {/* Telemetry Summary Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#0b0f19] border border-gray-800 p-4 rounded-xl">
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-gray-500 uppercase font-semibold">Total Traders</span>
                <Users className="h-4.5 w-4.5 text-purple-400" />
              </div>
              <p className="text-2xl font-black text-gray-200 mt-2">{users.length}</p>
              <span className="text-[10px] text-gray-500 block mt-1">Registered accounts</span>
            </div>

            <div className="bg-[#0b0f19] border border-gray-800 p-4 rounded-xl">
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-gray-500 uppercase font-semibold">Premium Accounts</span>
                <Crown className="h-4.5 w-4.5 text-yellow-500" />
              </div>
              <p className="text-2xl font-black text-yellow-500 mt-2">{activePremiumCount}</p>
              <span className="text-[10px] text-gray-500 block mt-1">Active paid tier upgrades</span>
            </div>

            <div className="bg-[#0b0f19] border border-gray-800 p-4 rounded-xl">
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-gray-500 uppercase font-semibold">Total Trades Logged</span>
                <Activity className="h-4.5 w-4.5 text-blue-400" />
              </div>
              <p className="text-2xl font-black text-gray-200 mt-2">{trades.length}</p>
              <span className="text-[10px] text-gray-500 block mt-1">Real database records</span>
            </div>

            <div className="bg-[#0b0f19] border border-gray-800 p-4 rounded-xl">
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-gray-500 uppercase font-semibold">Total Revenue Logs</span>
                <CreditCard className="h-4.5 w-4.5 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-emerald-400 mt-2">₹{totalRevenue.toLocaleString()}</p>
              <span className="text-[10px] text-gray-500 block mt-1">Secure Razorpay logs</span>
            </div>
          </div>

          {/* Navigation tabs */}
          <div className="flex items-center gap-1.5 border-b border-gray-800">
            {[
              { id: "users", label: "👥 Users Management" },
              { id: "trades", label: "💼 Audit Trade Logs" },
              { id: "payments", label: "💰 Subscription Revenue" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTab(t.id as any);
                  if (t.id !== "trades") setSelectedUserTrades(null);
                }}
                className={`px-4 py-2 text-xs font-semibold border-b-2 cursor-pointer transition-all ${
                  activeTab === t.id
                    ? "border-purple-500 text-purple-400 bg-purple-500/5"
                    : "border-transparent text-gray-500 hover:text-gray-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab contents */}
          {activeTab === "users" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 max-w-sm bg-[#090e1f] border border-gray-800 rounded-lg px-3 py-1.5">
                <Search className="h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search user, plan or role..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="bg-transparent text-xs outline-none border-none text-gray-300 w-full"
                />
              </div>

              <div className="overflow-x-auto border border-gray-800/80 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-900/40 border-b border-gray-800 text-gray-500 font-bold">
                      <th className="p-3.5">User Email / UID</th>
                      <th className="p-3.5">Active Plan</th>
                      <th className="p-3.5">Role</th>
                      <th className="p-3.5">Plan Expiry</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60 bg-gray-950/20">
                    {filteredUsers.map((u) => (
                      <tr key={u.userId} className="hover:bg-gray-900/20 text-gray-300">
                        <td className="p-3.5">
                          <div className="font-semibold">{u.email || "Trader Accounts"}</div>
                          <div className="text-[10px] text-gray-500 mt-0.5 font-mono">{u.userId}</div>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            u.plan === "free" ? "bg-gray-800 text-gray-400" : "bg-yellow-500/10 text-yellow-400"
                          }`}>
                            {u.plan}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            u.role === "admin" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "text-gray-500"
                          }`}>
                            {u.role || "user"}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-gray-500">
                          {u.planExpiresAt ? new Date(u.planExpiresAt).toLocaleDateString() : "Never"}
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            onClick={() => {
                              setSelectedUserTrades(u.userId);
                              setActiveTab("trades");
                            }}
                            className="text-[10px] bg-blue-600/15 text-blue-400 border border-blue-500/20 hover:bg-blue-600/30 px-2 py-1 rounded transition-colors cursor-pointer"
                          >
                            Trades Audit
                          </button>

                          <select
                            disabled={updatingPlanUserId === u.userId}
                            value={u.plan}
                            onChange={(e) => updateUserPlan(u.userId, e.target.value)}
                            className="text-[10px] bg-gray-900 border border-gray-800 rounded px-1.5 py-1 text-gray-300 focus:outline-none cursor-pointer"
                          >
                            <option value="free">Set Free</option>
                            <option value="basic">Set Basic</option>
                            <option value="pro">Set Pro</option>
                            <option value="premium">Set Premium</option>
                          </select>

                          <button
                            onClick={() => toggleUserAdminRole(u.userId, u.role)}
                            className={`text-[10px] border px-2 py-1 rounded transition-colors cursor-pointer ${
                              u.role === "admin"
                                ? "bg-red-500/15 border-red-500/20 text-red-400 hover:bg-red-500/30"
                                : "bg-purple-600/15 border-purple-500/20 text-purple-400 hover:bg-purple-600/30"
                            }`}
                          >
                            {u.role === "admin" ? "Revoke Admin" : "Make Admin"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "trades" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {selectedUserTrades ? (
                    <span>Showing trades for user UID: <strong className="text-purple-400 font-mono">{selectedUserTrades}</strong></span>
                  ) : (
                    "Auditing global real trade logs."
                  )}
                </span>
                {selectedUserTrades && (
                  <button
                    onClick={() => setSelectedUserTrades(null)}
                    className="text-xs text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Clear Filter <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>

              <div className="overflow-x-auto border border-gray-800/80 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-900/40 border-b border-gray-800 text-gray-500 font-bold">
                      <th className="p-3.5">User</th>
                      <th className="p-3.5">Symbol</th>
                      <th className="p-3.5">Type</th>
                      <th className="p-3.5">Price</th>
                      <th className="p-3.5">Quantity</th>
                      <th className="p-3.5">PNL</th>
                      <th className="p-3.5">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60 bg-gray-950/20">
                    {displayTrades.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-900/20 text-gray-300">
                        <td className="p-3.5">
                          <div className="font-semibold truncate max-w-[150px]">{t.userEmail}</div>
                          <div className="text-[10px] text-gray-500 font-mono">{t.userId}</div>
                        </td>
                        <td className="p-3.5 font-bold">{t.symbol}</td>
                        <td className="p-3.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${
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
                        <td className="p-3.5 text-gray-500 font-mono">{new Date(t.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "payments" && (
            <div className="overflow-x-auto border border-gray-800/80 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-900/40 border-b border-gray-800 text-gray-500 font-bold">
                    <th className="p-3.5">Payment ID</th>
                    <th className="p-3.5">User Email</th>
                    <th className="p-3.5">Purchased Plan</th>
                    <th className="p-3.5">Amount</th>
                    <th className="p-3.5">Billing</th>
                    <th className="p-3.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 bg-gray-950/20">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-900/20 text-gray-300">
                      <td className="p-3.5 font-mono text-purple-400 font-semibold">{p.paymentId}</td>
                      <td className="p-3.5">
                        <div className="font-semibold">{p.userEmail || "Paid Subscriber"}</div>
                        <div className="text-[10px] text-gray-500 font-mono">{p.userId}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded text-[10px] font-black uppercase">
                          {p.plan}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-gray-200">
                        ₹{(p.amount / 100).toLocaleString()}
                      </td>
                      <td className="p-3.5 uppercase font-semibold text-gray-400">{p.billing}</td>
                      <td className="p-3.5 text-gray-500 font-mono">{new Date(p.paidAt).toLocaleDateString()}</td>
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
