"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  User,
  Shield,
  Trash2,
  Edit,
  Eye,
  RefreshCw,
  CheckCircle,
  XCircle,
  Users,
  Key,
  X,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { get, post, del } from "@/lib/api";

export default function UserManagementList() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Load users
  const loadUsers = async (pageNum = null) => {
    try {
      setLoading(true);
      const currentPage = pageNum !== null ? pageNum : pagination.page;
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
      });
      if (search) params.append("search", search);
      if (roleFilter !== "ALL") params.append("role", roleFilter);
      if (statusFilter !== "ALL") params.append("status", statusFilter);

      const response = await get(`/users?${params.toString()}`);

      if (response.success) {
        setUsers(response.data.users);
        setPagination({ ...response.data.pagination, page: currentPage });
      }
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error(error.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(1);
  }, [search, roleFilter, statusFilter]);

  // Delete user
  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      await del(`/users/${selectedUser.publicId}`);
      toast.success("User deleted successfully");
      setShowDeleteModal(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to delete user";
      
      const warningMessages = [
        "Cannot delete your own account",
        "Cannot remove your own account",
        "Super Admin cannot be deleted",
      ];
      
      if (warningMessages.some(msg => errorMessage.toLowerCase().includes(msg.toLowerCase()))) {
        toast.warning(errorMessage, {
          description: "This action cannot be performed.",
        });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle user status
  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      setActionLoading(true);
      await post(`/users/${userId}/status`, {
        isActive: !currentStatus,
      });
      toast.success(`User ${!currentStatus ? "activated" : "deactivated"} successfully`);
      loadUsers();
    } catch (error) {
      console.error("Error updating status:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to update user status";
      
      const warningMessages = [
        "Cannot deactivate your own account",
        "Cannot activate your own account",
        "Super Admin status cannot be changed",
        "Super Admin cannot be modified",
      ];
      
      if (warningMessages.some(msg => errorMessage.toLowerCase().includes(msg.toLowerCase()))) {
        toast.warning(errorMessage, {
          description: "This action is not allowed.",
        });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Reset password
  const handleResetPassword = (user) => {
    setSelectedUser(user);
    setNewPassword("");
    setConfirmPassword("");
    setShowResetPasswordModal(true);
  };

  const confirmResetPassword = async () => {
    if (!selectedUser) return;

    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setActionLoading(true);
      await post(`/users/${selectedUser.publicId}/password`, {
        password: newPassword,
      });
      toast.success("Password reset successfully");
      setShowResetPasswordModal(false);
      setSelectedUser(null);
      setNewPassword("");
      setConfirmPassword("");
      loadUsers();
    } catch (error) {
      console.error("Error resetting password:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to reset password";
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  // View user details
  const handleViewUser = async (userId) => {
    try {
      const user = await get(`/users/${userId}`);
      if (user.success) {
        setSelectedUser(user.data);
        setShowViewModal(true);
      }
    } catch (error) {
      toast.error("Failed to load user details");
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-700 border-red-300";
      case "EMPLOYEE":
        return "bg-emerald-100 text-emerald-700 border-emerald-300";
      case "NEW_JOINNER":
        return "bg-slate-100 text-slate-600 border-slate-300";
      default:
        return "bg-slate-100 text-slate-600 border-slate-300";
    }
  };

  // Get avatar color based on role and isSuper
  const getAvatarColor = (role, isSuper) => {
    if (isSuper) {
      return "bg-slate-900 text-white";
    }
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-700";
      case "EMPLOYEE":
        return "bg-emerald-100 text-emerald-700";
      case "NEW_JOINNER":
        return "bg-slate-100 text-slate-600";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  // Get status badge
  const getStatusBadge = (isActive) => (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
        isActive
          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
          : "bg-red-100 text-red-700 border-red-200"
      }`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/dashboard/users")}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-6 h-6 text-blue-600" />
                  User List
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  View and manage all system users
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push("/dashboard/users/create")}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add New User
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase mb-1">Total Users</div>
                <div className="text-2xl font-bold text-slate-900">{pagination.total}</div>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase mb-1">Active</div>
                <div className="text-2xl font-bold text-slate-900">
                  {users.filter((u) => u.isActive).length}
                </div>
              </div>
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase mb-1">Admins</div>
                <div className="text-2xl font-bold text-slate-900">
                  {users.filter((u) => u.role === "ADMIN").length}
                </div>
              </div>
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase mb-1">New Joiners</div>
                <div className="text-2xl font-bold text-slate-900">
                  {users.filter((u) => u.role === "NEW_JOINNER").length}
                </div>
              </div>
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or username..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Administrator</option>
              <option value="EMPLOYEE">Employee</option>
              <option value="NEW_JOINNER">New Joiner</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
            >
              <option value="ALL">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* User Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">USER</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">ROLE</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">STATUS</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">PERMISSIONS</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">JOINED</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                        <span>Loading users...</span>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-900 font-medium">No users found</p>
                      <p className="text-slate-500 text-sm mt-1">
                        {search || roleFilter !== "ALL" || statusFilter !== "ALL"
                          ? "Try adjusting your filters"
                          : "Add your first user to get started"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.publicId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${getAvatarColor(user.role, user.isSuper)}`}>
                            {(user.name || "Bennet User").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{user.name}</div>
                            <div className="text-xs text-slate-400 mt-0.5">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(user.role)}`}>
                            {user.role.replace("_", " ")}
                          </span>
                          {user.isSuper && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-300">
                              <Shield className="w-3 h-3 mr-1" />
                              SUPER
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">{getStatusBadge(user.isActive)}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {user.permissions?.slice(0, 2).map((perm) => (
                            <span key={perm} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-50 text-slate-600 border border-slate-200">
                              {perm.split("_").map((word) => word.charAt(0) + word.slice(1).toLowerCase()).join(" ")}
                            </span>
                          ))}
                          {user.permissions?.length > 2 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-50 text-slate-600 border border-slate-200">
                              +{user.permissions.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-500">{formatDate(user.createdAt)}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleViewUser(user.publicId)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="View">
                            <Eye className="w-4 h-4" />
                          </button>
                          {!user.isSuper && (
                            <>
                              <button onClick={() => router.push(`/dashboard/users/${user.publicId}/edit`)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" title="Edit">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => toggleUserStatus(user.publicId, user.isActive)} disabled={actionLoading} className={`p-2 rounded-lg transition-all ${user.isActive ? "text-slate-400 hover:text-red-600 hover:bg-red-50" : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"}`} title={user.isActive ? "Deactivate" : "Activate"}>
                                {user.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                              </button>
                              <button onClick={() => handleResetPassword(user)} className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all" title="Reset Password">
                                <Key className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteUser(user)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {user.isSuper && <span className="text-xs text-slate-400 italic px-2">Protected</span>}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && users.length > 0 && (
            <div className="px-4 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="text-sm text-slate-600">
                Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => loadUsers(pagination.page - 1)} disabled={pagination.page === 1} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  Previous
                </button>
                <button onClick={() => loadUsers(pagination.page + 1)} disabled={pagination.page >= pagination.pages} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* View User Modal */}
        {showViewModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">User Details</h2>
                <button onClick={() => { setShowViewModal(false); setSelectedUser(null); }} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4 pb-4 border-b border-slate-200">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl ${getAvatarColor(selectedUser.role, selectedUser.isSuper)}`}>
                    {(selectedUser.name || "Bennet User").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{selectedUser.name}</h3>
                    <p className="text-sm text-slate-500">@{selectedUser.username}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Role</label>
                    <p className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(selectedUser.role)}`}>
                        {selectedUser.role.replace("_", " ")}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Status</label>
                    <p className="mt-1">{getStatusBadge(selectedUser.isActive)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Joined</label>
                    <p className="mt-1 text-sm text-slate-900">{formatDate(selectedUser.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Last Updated</label>
                    <p className="mt-1 text-sm text-slate-900">{formatDate(selectedUser.updatedAt)}</p>
                  </div>
                </div>
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button onClick={() => { setShowViewModal(false); router.push(`/dashboard/users/${selectedUser.publicId}/edit`); }} className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                    Edit User
                  </button>
                  <button onClick={() => { setShowViewModal(false); setSelectedUser(null); }} className="px-4 py-2.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors">
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reset Password Modal */}
        {showResetPasswordModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full">
              <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Reset Password</h2>
                <button onClick={() => { setShowResetPasswordModal(false); setSelectedUser(null); setNewPassword(""); setConfirmPassword(""); }} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-slate-600 mb-4">
                  Reset password for <span className="font-semibold">{selectedUser.name}</span>
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">New Password</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password (min 6 characters)" className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Confirm Password</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                  </div>
                </div>
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button onClick={confirmResetPassword} disabled={actionLoading || !newPassword || newPassword !== confirmPassword} className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {actionLoading ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Resetting...</span> : "Reset Password"}
                  </button>
                  <button onClick={() => { setShowResetPasswordModal(false); setSelectedUser(null); setNewPassword(""); setConfirmPassword(""); }} disabled={actionLoading} className="px-4 py-2.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors disabled:opacity-50">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full">
              <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-red-600">Delete User</h2>
                <button onClick={() => { setShowDeleteModal(false); setSelectedUser(null); }} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-slate-700">
                  Are you sure you want to delete <span className="font-semibold">{selectedUser.name}</span>? This action cannot be undone.
                </p>
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button onClick={confirmDeleteUser} disabled={actionLoading} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {actionLoading ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Deleting...</span> : "Delete User"}
                  </button>
                  <button onClick={() => { setShowDeleteModal(false); setSelectedUser(null); }} disabled={actionLoading} className="px-4 py-2.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors disabled:opacity-50">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
