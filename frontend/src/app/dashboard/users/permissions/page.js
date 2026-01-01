"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  Users,
  Shield,
  Check,
  X,
  Save,
  RefreshCw,
  Eye,
  Lock,
  Unlock,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Copy,
  AlertCircle,
  Key,
  UserCheck,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import API from "@/lib/api";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function PermissionsManagement() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [modules, setModules] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedUsers, setExpandedUsers] = useState({});
  const [bulkSelection, setBulkSelection] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);

  // Load data
  useEffect(() => {
    loadUsers();
    loadModules();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await API.get("/users");
      if (response.data.success) {
        setUsers(response.data.data.users);
      }
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const loadModules = async () => {
    try {
      const response = await API.get("/users/roles/modules");
      if (response.data.success) {
        setModules(response.data.data);
      }
    } catch (error) {
      console.error("Error loading modules:", error);
      toast.error("Failed to load modules");
    }
  };

  const loadUserPermissions = async (userId) => {
    try {
      const response = await API.get(
        `/users/roles/permissions?userId=${userId}`
      );
      if (response.data.data.success) {
        setUserPermissions(response.data.data);
      }
    } catch (error) {
      console.error("Error loading permissions:", error);
      toast.error("Failed to load permissions");
    }
  };

  // Toggle user expansion
  const toggleUserExpansion = async (userId) => {
    setExpandedUsers((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));

    if (!expandedUsers[userId]) {
      await loadUserPermissions(userId);
    }
  };

  // Toggle permission for a user
  const togglePermission = (moduleKey) => {
    if (!selectedUser) return;

    const newPermissions = userPermissions.includes(moduleKey)
      ? userPermissions.filter((p) => p !== moduleKey)
      : [...userPermissions, moduleKey];

    setUserPermissions(newPermissions);
  };

  // Save permissions for a user
  const savePermissions = async (userId) => {
    try {
      setDialogLoading(true);
      const response = await API.post("/users/roles/permissions", {
        userId,
        permissions: userPermissions,
      });

      if (response.success) {
        toast.success("Permissions updated successfully");
        setIsDialogOpen(false);
        loadUsers(); // Refresh users list
      }
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast.error(error.message || "Failed to save permissions");
    } finally {
      setDialogLoading(false);
    }
  };

  // Open edit dialog for a user
  const openEditDialog = async (user) => {
    setSelectedUser(user);
    await loadUserPermissions(user.id);
    setIsDialogOpen(true);
  };

  // Bulk actions
  const toggleBulkSelect = (userId) => {
    setBulkSelection((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllVisible = () => {
    const filteredUsers = getFilteredUsers();
    const visibleIds = filteredUsers.map((u) => u.publicId);
    setBulkSelection(visibleIds);
  };

  const clearBulkSelection = () => {
    setBulkSelection([]);
  };

  // Apply bulk permissions
  const applyBulkPermissions = async () => {
    if (bulkSelection.length === 0) {
      toast.error("Select users first");
      return;
    }

    if (
      !confirm(`Apply these permissions to ${bulkSelection.length} user(s)?`)
    ) {
      return;
    }

    try {
      setLoading(true);
      const promises = bulkSelection.map((userId) =>
        API.post("/users/roles/permissions", {
          userId: parseInt(userId),
          permissions: userPermissions, // Current selected permissions
        })
      );

      await Promise.all(promises);
      toast.success(`Permissions applied to ${bulkSelection.length} user(s)`);
      setBulkSelection([]);
      loadUsers();
    } catch (error) {
      console.error("Error applying bulk permissions:", error);
      toast.error("Failed to apply bulk permissions");
    } finally {
      setLoading(false);
    }
  };

  // Filter users
  const getFilteredUsers = () => {
    return users.filter((user) => {
      const matchesSearch = search
        ? user.name.toLowerCase().includes(search.toLowerCase()) ||
          user.username.toLowerCase().includes(search.toLowerCase())
        : true;

      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "active" && user.isActive) ||
        (statusFilter === "inactive" && !user.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  };

  // Get permission count for a user
  const getPermissionCount = (user) => {
    return user.permissions?.length || 0;
  };

  // Format role display
  const formatRole = (role) => {
    switch (role) {
      case "ADMIN":
        return "Administrator";
      case "EMPLOYEE":
        return "Employee";
      case "NEW_JOINNER":
        return "New Joiner";
      default:
        return role;
    }
  };

  // Get role color
  const getRoleColor = (role) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "EMPLOYEE":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "NEW_JOINNER":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Stats
  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.isActive).length,
    adminUsers: users.filter((u) => u.role === "ADMIN").length,
    usersWithPermissions: users.filter(
      (u) => u.permissions && u.permissions.length > 0
    ).length,
    totalModules: modules.length,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">


      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Permissions Management
              </h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">
                Manage user access to system modules and features
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/users")}
                className="flex items-center gap-2 text-sm"
              >
                <Users className="w-4 h-4" />
                User Management
              </Button>
              {bulkSelection.length > 0 && (
                <Button
                  onClick={applyBulkPermissions}
                  variant="default"
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-sm"
                >
                  <Save className="w-4 h-4" />
                  Apply to {bulkSelection.length} Selected
                </Button>
              )}
            </div>
          </div>

          {/* Stats Cards - Responsive */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-6">
            <Card className="border shadow-sm">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-gray-500">Total Users</p>
                    <p className="text-xl md:text-2xl font-bold">{stats.totalUsers}</p>
                  </div>
                  <Users className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border shadow-sm">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-gray-500">Active Users</p>
                    <p className="text-xl md:text-2xl font-bold">{stats.activeUsers}</p>
                  </div>
                  <UserCheck className="w-6 h-6 md:w-8 md:h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border shadow-sm">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-gray-500">Administrators</p>
                    <p className="text-xl md:text-2xl font-bold">{stats.adminUsers}</p>
                  </div>
                  <Shield className="w-6 h-6 md:w-8 md:h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border shadow-sm">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-gray-500">With Permissions</p>
                    <p className="text-xl md:text-2xl font-bold">
                      {stats.usersWithPermissions}
                    </p>
                  </div>
                  <Key className="w-6 h-6 md:w-8 md:h-8 text-amber-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-2 md:col-span-1 border shadow-sm">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-gray-500">Modules</p>
                    <p className="text-xl md:text-2xl font-bold">{stats.totalModules}</p>
                  </div>
                  <Lock className="w-6 h-6 md:w-8 md:h-8 text-gray-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Left Column - User List */}
          <div className="lg:col-span-2">
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg md:text-xl">Users & Permissions</CardTitle>
                    <CardDescription className="text-xs md:text-sm">
                      Click on a user to view and edit their permissions
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs md:text-sm text-gray-500">
                      {bulkSelection.length} selected
                    </span>
                    {bulkSelection.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearBulkSelection}
                        className="text-red-600 hover:text-red-700 h-8"
                      >
                        <X className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Filters - Improved for mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  <div className="sm:col-span-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 h-10 text-sm"
                      />
                    </div>
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="h-10 text-sm">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Roles</SelectItem>
                      <SelectItem value="ADMIN">Administrator</SelectItem>
                      <SelectItem value="EMPLOYEE">Employee</SelectItem>
                      <SelectItem value="NEW_JOINNER">New Joiner</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-10 text-sm">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Users List - Improved spacing and responsiveness */}
                <div className="border rounded-lg overflow-hidden">
                  <ScrollArea className="h-[500px] md:h-[600px]">
                    {loading ? (
                      <div className="flex items-center justify-center h-40">
                        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
                      </div>
                    ) : getFilteredUsers().length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <Shield className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm md:text-base">No users found</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {getFilteredUsers().map((user) => (
                          <div
                            key={user.publicId}
                            className="p-3 md:p-4 hover:bg-gray-50"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={bulkSelection.includes(
                                    user.publicId
                                  )}
                                  onChange={() =>
                                    toggleBulkSelect(user.publicId)
                                  }
                                  className="w-4 h-4 text-blue-600 rounded flex-shrink-0"
                                />
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                  {user.isActive ? (
                                    <UserCheck className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                                  ) : (
                                    <UserX className="w-4 h-4 md:w-5 md:h-5 text-red-600" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-1 md:gap-2">
                                    <p className="font-medium text-sm md:text-base truncate">
                                      {user.name}
                                    </p>
                                    <Badge
                                      variant="outline"
                                      className={`text-xs ${getRoleColor(user.role)}`}
                                    >
                                      {formatRole(user.role)}
                                    </Badge>
                                    {!user.isActive && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs bg-red-100 text-red-800"
                                      >
                                        Inactive
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 truncate">
                                    @{user.username}
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                <div className="flex items-center gap-1">
                                  <Shield className="w-3 h-3 md:w-4 md:h-4 text-gray-400" />
                                  <span className="font-medium text-sm">
                                    {getPermissionCount(user)}
                                  </span>
                                </div>
                                <div className="flex flex-wrap justify-end gap-1 max-w-[120px] md:max-w-xs">
                                  {user.permissions
                                    ?.slice(0, 2)
                                    .map((perm) => (
                                      <Badge
                                        key={perm}
                                        variant="outline"
                                        className="text-xs bg-gray-50 px-1 py-0"
                                      >
                                        {perm.length > 8 ? `${perm.substring(0, 8)}...` : perm}
                                      </Badge>
                                    ))}
                                  {user.permissions?.length > 2 && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs px-1 py-0"
                                    >
                                      +{user.permissions.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              <div className="flex gap-1 md:gap-2 ml-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    toggleUserExpansion(user.publicId)
                                  }
                                  className="h-8 w-8 md:h-9 md:w-auto"
                                >
                                  {expandedUsers[user.publicId] ? (
                                    <>
                                      <ChevronUp className="w-3 h-3 md:w-4 md:h-4 md:mr-1" />
                                      <span className="hidden md:inline">Hide</span>
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="w-3 h-3 md:w-4 md:h-4 md:mr-1" />
                                      <span className="hidden md:inline">View</span>
                                    </>
                                  )}
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => openEditDialog(user)}
                                  className="h-8 w-8 md:h-9 md:w-auto"
                                >
                                  <Save className="w-3 h-3 md:w-4 md:h-4 md:mr-1" />
                                  <span className="hidden md:inline">Edit</span>
                                </Button>
                              </div>
                            </div>

                            {/* Expanded Permissions View */}
                            {expandedUsers[user.publicId] && (
                              <div className="mt-3 pl-10 md:pl-12">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                                    <Shield className="w-3 h-3" />
                                    Assigned Permissions
                                  </h4>
                                  {user.permissions &&
                                  user.permissions.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-1 md:gap-2">
                                      {user.permissions.map((permission) => (
                                        <div
                                          key={permission}
                                          className="flex items-center gap-1 p-1 md:p-2 bg-white rounded border text-xs"
                                        >
                                          <Check className="w-2 h-2 md:w-3 md:h-3 text-green-500 flex-shrink-0" />
                                          <span className="truncate">{permission}</span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-gray-500 text-xs">
                                      No permissions assigned
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Module List & Quick Actions */}
          <div className="space-y-4 md:space-y-6">
            {/* Available Modules */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lock className="w-4 h-4 md:w-5 md:h-5" />
                  Available Modules
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  {modules.length} modules available in system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[250px] md:h-[300px]">
                  <div className="space-y-2">
                    {modules.map((module) => (
                      <div
                        key={module.id}
                        className="p-2 md:p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex justify-between items-center">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm md:text-base truncate">
                              {module.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {module.key}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs ml-2">Module</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start h-9 text-sm"
                  onClick={selectAllVisible}
                >
                  <Check className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                  Select All Visible
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start h-9 text-sm"
                  onClick={clearBulkSelection}
                >
                  <X className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                  Clear Selection
                </Button>
                <Separator />
                <Button
                  variant="outline"
                  className="w-full justify-start h-9 text-sm"
                  onClick={() => router.push("/dashboard/users")}
                >
                  <Users className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                  User Management
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start h-9 text-sm"
                  onClick={loadUsers}
                  disabled={loading}
                >
                  <RefreshCw className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                  Refresh Data
                </Button>
              </CardContent>
            </Card>

            {/* Permission Statistics */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Permission Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 md:space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Average per User:</span>
                    <span className="font-medium text-sm">
                      {stats.totalUsers > 0
                        ? Math.round(
                            users.reduce(
                              (sum, user) => sum + getPermissionCount(user),
                              0
                            ) / stats.totalUsers
                          )
                        : 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">
                      Users with Full Access:
                    </span>
                    <span className="font-medium text-sm">
                      {
                        users.filter(
                          (u) => u.permissions?.length === modules.length
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Users with No Access:</span>
                    <span className="font-medium text-sm">
                      {
                        users.filter(
                          (u) => !u.permissions || u.permissions.length === 0
                        ).length
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Permissions Dialog - Improved for better visibility */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[85vh] md:max-h-[90vh] overflow-hidden p-4 md:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl">Edit Permissions</DialogTitle>
            <DialogDescription className="text-sm md:text-base">
              Manage permissions for {selectedUser?.name} (@
              {selectedUser?.username})
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-row gap-4 md:gap-6 overflow-hidden">
            {/* User Info */}
            <Card className="border shadow-sm">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <UserCheck className="w-6 h-6 md:w-8 md:h-8 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg md:text-xl font-bold truncate">{selectedUser?.name}</h3>
                    <div className="flex flex-wrap gap-1 md:gap-2 mt-1">
                      <Badge className={`text-xs ${getRoleColor(selectedUser?.role)}`}>
                        {formatRole(selectedUser?.role)}
                      </Badge>
                      <Badge
                        variant={selectedUser?.isActive ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {selectedUser?.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-gray-500 text-sm truncate">
                      @{selectedUser?.username}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Current Permissions</p>
                    <p className="font-bold text-lg">{userPermissions.length}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Available Modules</p>
                    <p className="font-bold text-lg">{modules.length}</p>
                  </div>
                  <div className="col-span-2 md:col-span-1 bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Access Level</p>
                    <p className="font-bold text-lg truncate">
                      {userPermissions.length === modules.length
                        ? "Full Access"
                        : userPermissions.length === 0
                        ? "No Access"
                        : "Limited Access"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Permissions Selection */}
            <div className="flex flex-col gap-3 flex-1 overflow-scroll-hidden">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <h3 className="font-bold text-base md:text-lg">Select Permissions</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setUserPermissions(modules.map((m) => m.key))
                    }
                    className="h-8 text-xs md:text-sm"
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUserPermissions([])}
                    className="h-8 text-xs md:text-sm"
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1 min-h-[300px] max-h-[400px] pr-2 md:pr-4">
                <div className="space-y-2">
                  {modules.map((module) => (
                    <div
                      key={module.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        userPermissions.includes(module.key)
                          ? "bg-blue-50 border-blue-200"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => togglePermission(module.key)}
                    >
                      <div className="flex items-center gap-3">
                        {userPermissions.includes(module.key) ? (
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded border flex-shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm md:text-base truncate">
                            {module.name}
                          </p>
                          <p className="text-gray-500 text-xs truncate">
                            {module.key}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="bg-blue-50 p-3 md:p-4 rounded-lg border border-blue-100">
                <h4 className="font-medium text-blue-800 text-sm md:text-base mb-2">
                  Selected Permissions ({userPermissions.length})
                </h4>
                {userPermissions.length > 0 ? (
                  <div className="flex flex-wrap gap-1 md:gap-2 max-h-[100px] overflow-y-auto">
                    {userPermissions.map((perm) => (
                      <Badge
                        key={perm}
                        className="bg-blue-100 text-blue-800 border-blue-200 text-xs px-2 py-1"
                      >
                        {perm.length > 15 ? `${perm.substring(0, 15)}...` : perm}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-blue-600 text-sm">No permissions selected</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={dialogLoading}
              className="h-9 text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={() => savePermissions(selectedUser?.id)}
              disabled={dialogLoading}
              className="h-9 text-sm"
            >
              {dialogLoading ? (
                <>
                  <RefreshCw className="w-3 h-3 md:w-4 md:h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                  Save Permissions
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}