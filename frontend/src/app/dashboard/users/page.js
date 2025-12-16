"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  User, 
  Shield, 
  Mail, 
  Lock,
  Trash2,
  Edit
} from "lucide-react";
import { Toaster, toast } from "sonner";

export default function UserManagement() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    const saved = localStorage.getItem("igpl_users");
    if (saved) {
      setUsers(JSON.parse(saved));
    } else {
      // Seed Admin
      const seed = [
        {
          id: "u1",
          name: "Ayush Solanki",
          username: "admin_ayush",
          email: "ayush@igpl.com",
          role: "admin",
          status: "Active",
          lastLogin: "2024-12-16"
        },
        {
          id: "u2",
          name: "Rahul Verma",
          username: "rahul_acc",
          email: "rahul@igpl.com",
          role: "accounts",
          status: "Active",
          lastLogin: "2024-12-15"
        }
      ];
      setUsers(seed);
      localStorage.setItem("igpl_users", JSON.stringify(seed));
    }
  };

  const deleteUser = (id) => {
    if (confirm("Are you sure you want to delete this user? This cannot be undone.")) {
      const updated = users.filter(u => u.id !== id);
      setUsers(updated);
      localStorage.setItem("igpl_users", JSON.stringify(updated));
      toast.success("User removed successfully");
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                          u.username.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role) => {
    const styles = {
      admin: "bg-purple-100 text-purple-700 border-purple-200",
      accounts: "bg-blue-100 text-blue-700 border-blue-200",
      employee: "bg-emerald-100 text-emerald-700 border-emerald-200",
      mod: "bg-amber-100 text-amber-700 border-amber-200"
    };
    return styles[role] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <Toaster position="top-center" />
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
            <p className="text-slate-500 text-sm">Manage system access and roles.</p>
          </div>
          <button 
            onClick={() => router.push('/dashboard/users/new')}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 shadow-md transition-all"
          >
            <Plus className="w-4 h-4" /> Add New User
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none text-sm"
              placeholder="Search by name or username..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
            {['ALL', 'admin', 'accounts', 'employee', 'mod'].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border capitalize whitespace-nowrap transition-colors ${
                  roleFilter === role 
                    ? "bg-slate-100 border-slate-300 text-slate-900" 
                    : "bg-white border-transparent text-slate-500 hover:bg-slate-50"
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* User List */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Username</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 group transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{user.name}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${getRoleBadge(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-600">
                    @{user.username}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-green-500' : 'bg-slate-300'}`} />
                      <span className="text-slate-700">{user.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteUser(user.id)}
                        className="p-2 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredUsers.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              No users found matching your criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}