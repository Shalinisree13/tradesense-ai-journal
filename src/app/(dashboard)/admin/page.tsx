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
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"activities" | "users">("activities");

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
      // 1. Fetch all registered users settings
      const settingsSnap = await getDocs(collection(db, "settings"));
      const userList: UserProfile[] = [];
      settingsSnap.forEach((doc) => {
        userList.push({ userId: doc.id, ...doc.data() } as UserProfile);
      });

      // 2. Fetch login activities
      const activitiesSnap = await getDocs(collection(db, "user_activities"));
      const activityList: ActivityRecord[] = [];
      activitiesSnap.forEach((doc) => {
        activityList.push({ id: doc.id, ...doc.data() } as ActivityRecord);
      });

      // Sort activities newest first
      activityList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setUsers(userList);
      setActivities(activityList);
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

  // Filtered lists
  const filteredUsers = users.filter(
    (u) =>
      u.userId.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.role || "user").toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredActivities = activities.filter(
    (act) =>
      act.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      act.role?.toLowerCase().includes(userSearch.toLowerCase()) ||
      act.userAgent?.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
          Platform Administration
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Monitor user login sessions, track activity logs, and configure admin roles.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh]">
          <Loader2 className="h-10 w-10 animate-spin text-purple-500 mb-2" />
          <p className="text-xs text-gray-500">Retrieving activity telemetry...</p>
        </div>
      ) : (
        <>
          {/* Telemetry Summary Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#0b0f19] border border-gray-800 p-4 rounded-xl">
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-gray-500 uppercase font-semibold">Registered Accounts</span>
                <Users className="h-4.5 w-4.5 text-purple-400" />
              </div>
              <p className="text-2xl font-black text-gray-200 mt-2">{users.length}</p>
              <span className="text-[10px] text-gray-500 block mt-1">Total system accounts</span>
            </div>

            <div className="bg-[#0b0f19] border border-gray-800 p-4 rounded-xl">
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-gray-500 uppercase font-semibold">Total Login Activities</span>
                <Activity className="h-4.5 w-4.5 text-blue-400" />
              </div>
              <p className="text-2xl font-black text-gray-200 mt-2">{activities.length}</p>
              <span className="text-[10px] text-gray-500 block mt-1">Logged active sessions</span>
            </div>

            <div className="bg-[#0b0f19] border border-gray-800 p-4 rounded-xl">
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-gray-500 uppercase font-semibold">Admins Assigned</span>
                <Shield className="h-4.5 w-4.5 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-emerald-400 mt-2">
                {users.filter((u) => u.role === "admin").length}
              </p>
              <span className="text-[10px] text-gray-500 block mt-1">Active supervisors</span>
            </div>
          </div>

          {/* Navigation tabs */}
          <div className="flex items-center gap-1.5 border-b border-gray-800">
            {[
              { id: "activities", label: "🛡️ Login Session Audits" },
              { id: "users", label: "👥 Users Registry" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
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

          {/* Filter Bar */}
          <div className="flex items-center gap-2 max-w-sm bg-[#090e1f] border border-gray-800 rounded-lg px-3 py-1.5">
            <Search className="h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by email, role or device..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="bg-transparent text-xs outline-none border-none text-gray-300 w-full"
            />
          </div>

          {/* Tab contents */}
          {activeTab === "activities" && (
            <div className="space-y-4">
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
        </>
      )}
    </div>
  );
}
