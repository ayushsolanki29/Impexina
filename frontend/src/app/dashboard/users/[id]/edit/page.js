"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  RefreshCw,
  User as UserIcon,
  Shield,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { get, put } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export default function EditUser() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modules, setModules] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [originalUser, setOriginalUser] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    role: "EMPLOYEE",
    isActive: true,
  });

  // Load user data and modules on mount
  useEffect(() => {
    if (userId) {
      loadUserData();
      loadModules();
    }
  }, [userId]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const response = await get(`/users/${userId}`);

      if (response.success) {
        const user = response.data;
        setOriginalUser(user);
        setFormData({
          name: user.name || "",
          username: user.username || "",
          role: user.role || "EMPLOYEE",
          isActive: user.isActive ?? true,
        });
        setSelectedPermissions(user.permissions || []);
      } else {
        toast.error("Failed to load user data");
        router.push("/dashboard/users/management");
      }
    } catch (error) {
      console.error("Error loading user:", error);
      toast.error(error.response?.data?.message || "Failed to load user");
      router.push("/dashboard/users/management");
    } finally {
      setLoading(false);
    }
  };

  const loadModules = async () => {
    try {
      const response = await get("/users/roles/modules");
      if (response.success) {
        setModules(response.data);
      }
    } catch (error) {
      console.error("Error loading modules:", error);
      toast.error("Failed to load permission modules");
    }
  };

  // Toggle permission selection
  const togglePermission = (moduleKey) => {
    setSelectedPermissions((prev) =>
      prev.includes(moduleKey)
        ? prev.filter((key) => key !== moduleKey)
        : [...prev, moduleKey]
    );
  };

  // Select all permissions
  const selectAllPermissions = () => {
    setSelectedPermissions(modules.map((m) => m.key));
  };

  // Clear all permissions
  const clearAllPermissions = () => {
    setSelectedPermissions([]);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    // Basic validation
    if (!formData.name || !formData.username) {
      toast.error("Please fill all required fields");
      setSaving(false);
      return;
    }

    try {
      const userData = {
        name: formData.name,
        username: formData.username,
        role: formData.role,
        isActive: formData.isActive,
        permissions: selectedPermissions,
      };

      const response = await put(`/users/${userId}`, userData);

      if (response.success) {
        toast.success(response.message || "User updated successfully");
        setTimeout(() => {
          router.push("/dashboard/users/management");
        }, 1000);
      } else {
        toast.error(response.message || "Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Failed to update user";

      // Check for specific warning messages
      const warningMessages = [
        "Cannot modify Super Admin",
        "Super Admin cannot be modified",
        "Protected user",
      ];

      if (warningMessages.some((msg) => errorMessage.toLowerCase().includes(msg.toLowerCase()))) {
        toast.warning(errorMessage, {
          description: "This action is not allowed.",
        });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setSaving(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <p className="text-slate-600 font-medium">Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/users/management")}
            className="hover:bg-slate-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">Edit User</h1>
            <p className="text-slate-600 mt-1">
              Update user information and permissions
            </p>
          </div>
          {originalUser && (
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-slate-200">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${getAvatarColor(originalUser.role, originalUser.isSuper)}`}
              >
                {(originalUser.name || "B").charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-slate-900">{originalUser.name || "Bennet User"}</p>
                <p className="text-xs text-slate-500">@{originalUser.username}</p>
              </div>
              {originalUser.isSuper && (
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                  <Shield className="w-3 h-3 mr-1" />
                  SUPER
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Super User Warning */}
        {originalUser?.isSuper && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">Protected User</p>
              <p className="text-sm text-yellow-700 mt-1">
                This is a Super Admin account. Editing is restricted for security reasons.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Basic Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-blue-600" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      disabled={originalUser?.isSuper}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">
                        Username <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="username"
                        placeholder="john.doe"
                        value={formData.username}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            username: e.target.value,
                          })
                        }
                        disabled={originalUser?.isSuper}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">
                        Role <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value) =>
                          setFormData({ ...formData, role: value })
                        }
                        disabled={originalUser?.isSuper}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">Administrator</SelectItem>
                          <SelectItem value="EMPLOYEE">Employee</SelectItem>
                          <SelectItem value="NEW_JOINNER">New Joiner</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <div className="space-y-0.5">
                      <Label htmlFor="status">Account Status</Label>
                      <p className="text-sm text-slate-500">
                        Active users can login, inactive users cannot
                      </p>
                    </div>
                    <Switch
                      id="status"
                      checked={formData.isActive}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isActive: checked })
                      }
                      disabled={originalUser?.isSuper}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Current Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    Current Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <p className="text-xs font-medium text-slate-500 uppercase">Current Role</p>
                      <p className="mt-1">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(originalUser?.role)}`}>
                          {originalUser?.role?.replace("_", " ")}
                        </span>
                      </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <p className="text-xs font-medium text-slate-500 uppercase">Status</p>
                      <p className="mt-1">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${originalUser?.isActive ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-red-100 text-red-700 border-red-200"}`}>
                          {originalUser?.isActive ? "Active" : "Inactive"}
                        </span>
                      </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <p className="text-xs font-medium text-slate-500 uppercase">Joined</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {originalUser?.createdAt
                          ? new Date(originalUser.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "-"}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <p className="text-xs font-medium text-slate-500 uppercase">Permissions</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {originalUser?.permissions?.length || 0} modules
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Permissions */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      Permissions
                    </CardTitle>
                    {!originalUser?.isSuper && (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={selectAllPermissions}
                        >
                          All
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={clearAllPermissions}
                        >
                          Clear
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    {modules.map((module) => (
                      <div
                        key={module.id}
                        className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                          originalUser?.isSuper
                            ? "bg-slate-50 cursor-not-allowed opacity-60"
                            : "hover:bg-slate-50 cursor-pointer"
                        } ${selectedPermissions.includes(module.key) ? "border-blue-300 bg-blue-50" : "border-slate-200"}`}
                        onClick={() => !originalUser?.isSuper && togglePermission(module.key)}
                      >
                        <div>
                          <p className="font-medium text-sm">{module.name}</p>
                          <p className="text-xs text-slate-500">{module.key}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {selectedPermissions.includes(module.key) ? (
                            <CheckCircle className="w-5 h-5 text-blue-600" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedPermissions.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-medium text-blue-800">
                        Selected ({selectedPermissions.length})
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedPermissions.slice(0, 5).map((perm) => (
                          <Badge
                            key={perm}
                            variant="secondary"
                            className="bg-blue-100 text-blue-800 text-xs"
                          >
                            {perm}
                          </Badge>
                        ))}
                        {selectedPermissions.length > 5 && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                            +{selectedPermissions.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      size="lg"
                      disabled={saving || originalUser?.isSuper}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving Changes...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push("/dashboard/users/management")}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
