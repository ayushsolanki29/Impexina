"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Save, 
  Wand2, 
  Copy, 
  RefreshCw,
  ShieldCheck,
  Eye,
  EyeOff
} from "lucide-react";
import { Toaster, toast } from "sonner";

export default function CreateUser() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "employee",
    username: "",
    password: "",
    status: "Active"
  });

  // --- Generators ---
  const generateUsername = () => {
    if(!formData.name) return toast.error("Please enter a name first");
    const base = formData.name.toLowerCase().replace(/\s+/g, '_');
    const random = Math.floor(Math.random() * 1000);
    setFormData(prev => ({ ...prev, username: `${base}${random}` }));
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
    let pass = "";
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password: pass }));
  };

  const copyToClipboard = (text, field) => {
    if(!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${field} copied to clipboard`);
  };

  // --- Submit ---
  const handleSubmit = (e) => {
    e.preventDefault();
    if(!formData.name || !formData.username || !formData.password) {
      return toast.error("Please fill all required fields");
    }

    const savedUsers = JSON.parse(localStorage.getItem("igpl_users") || "[]");
    
    // Check duplicate
    if(savedUsers.some(u => u.username === formData.username)) {
      return toast.error("Username already exists");
    }

    const newUser = {
      id: `u_${Date.now()}`,
      ...formData,
      createdAt: new Date().toISOString()
    };

    localStorage.setItem("igpl_users", JSON.stringify([...savedUsers, newUser]));
    toast.success("User created successfully");
    
    // Slight delay to allow reading the toast
    setTimeout(() => router.push('/dashboard/users'), 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex justify-center items-start pt-10">
      <Toaster position="top-center" />
      
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => router.back()} 
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Create New User</h1>
            <p className="text-slate-500 text-sm">Generate credentials for a new team member.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          
          <div className="p-8 space-y-6">
            
            {/* Personal Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                <input 
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                <input 
                  type="email"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                  placeholder="john@company.com"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            {/* Role & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Role</label>
                <select 
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                >
                  <option value="employee">Employee (Standard)</option>
                  <option value="accounts">Accounts Team</option>
                  <option value="mod">Moderator</option>
                  <option value="admin">Administrator</option>
                </select>
                <p className="text-xs text-slate-500 mt-2">
                  <ShieldCheck className="w-3 h-3 inline mr-1" />
                  {formData.role === 'admin' ? 'Full system access.' : 'Restricted access based on role.'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Account Status</label>
                <select 
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive / Suspended</option>
                </select>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Credentials Section */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-500" /> Security Credentials
              </h3>
              
              <div className="space-y-5">
                {/* Username */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Username</label>
                  <div className="flex gap-2">
                    <input 
                      readOnly
                      className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg bg-white font-mono text-slate-800"
                      placeholder="Click generate..."
                      value={formData.username}
                    />
                    <button 
                      type="button"
                      onClick={generateUsername}
                      className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-600 flex items-center gap-2 text-sm font-medium"
                    >
                      <Wand2 className="w-4 h-4" /> Generate
                    </button>
                    <button 
                      type="button"
                      onClick={() => copyToClipboard(formData.username, 'Username')}
                      className="p-2.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-500"
                      title="Copy"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Password</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input 
                        type={showPassword ? "text" : "password"}
                        readOnly
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white font-mono text-slate-800"
                        placeholder="Click generate..."
                        value={formData.password}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <button 
                      type="button"
                      onClick={generatePassword}
                      className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-600 flex items-center gap-2 text-sm font-medium"
                    >
                      <RefreshCw className="w-4 h-4" /> Generate
                    </button>
                    <button 
                      type="button"
                      onClick={() => copyToClipboard(formData.password, 'Password')}
                      className="p-2.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-500"
                      title="Copy"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="px-8 py-5 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
            <button 
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2.5 border border-slate-300 rounded-lg text-slate-600 font-medium hover:bg-white transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-8 py-2.5 bg-slate-900 text-white rounded-lg font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Create User
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}