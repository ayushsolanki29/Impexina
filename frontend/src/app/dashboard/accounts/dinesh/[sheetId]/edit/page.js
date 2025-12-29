"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  X,
  Calendar,
  Tag,
  Lock,
  Unlock,
  Archive,
  AlertCircle,
  Trash2
} from "lucide-react";
import { dineshbhaiAPI } from "@/services/dineshbhai.service";


export default function EditSheetPage() {
  const params = useParams();
  const router = useRouter();
  const sheetId = params.sheetId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sheet, setSheet] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    month: "",
    year: "",
    tags: [],
    status: "ACTIVE",
    isLocked: false,
  });

  const [newTag, setNewTag] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load sheet data
  useEffect(() => {
    loadSheetData();
  }, [sheetId]);

  const loadSheetData = async () => {
    try {
      setLoading(true);
      const data = await dineshbhaiAPI.getSheet(sheetId);
      setSheet(data.data.data);
      setFormData({
        title: data.data.data.title,
        description: data.data.data.description || "",
        month: data.data.data.month || new Date().getMonth() + 1,
        year: data.data.data.year || new Date().getFullYear(),
        tags: data.data.data.tags || [],
        status: data.data.data.status,
        isLocked: data.data.data.isLocked || false,
      });
    } catch (error) {
      toast.error(error.message || "Failed to load sheet");
      router.push("/dashboard/dineshbhai");
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle tag management
  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Save sheet
  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      return toast.error("Sheet title is required");
    }

    try {
      setSaving(true);
      
      // Prepare update data
      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        tags: formData.tags,
        status: formData.status,
        isLocked: formData.isLocked,
      };

      // Add month/year only if changed
      if (formData.month) {
        updateData.month = parseInt(formData.month);
      }
      if (formData.year) {
        updateData.year = parseInt(formData.year);
      }

      await dineshbhaiAPI.updateSheet(sheetId, updateData);
      
      toast.success("Sheet updated successfully");
      
      // Navigate back to sheet view
      router.push(`/dashboard/accounts/dinesh/${sheetId}`);
    } catch (error) {
      toast.error(error.message || "Failed to update sheet");
    } finally {
      setSaving(false);
    }
  };

  // Delete sheet (archive)
  const handleDelete = async () => {
    try {
      await dineshbhaiAPI.deleteSheet(sheetId);
      toast.success("Sheet archived successfully");
      router.push("/dashboard/accounts/dinesh");
    } catch (error) {
      toast.error(error.message || "Failed to archive sheet");
    }
  };

  // Month options
  const months = [
    { value: "", label: "Select Month" },
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  // Generate year options (last 5 years to next 5 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading sheet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
     

      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push(`/dashboard/accounts/dinesh/${sheetId}`)}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sheet
            </button>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">
                Editing: <span className="font-medium">{sheet?.title}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Main Form Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Edit Sheet Details</h2>
            <p className="text-sm text-slate-600 mt-1">
              Update sheet information, tags, and settings
            </p>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Sheet Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                    placeholder="Enter sheet title"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="ARCHIVED">Archived</option>
                    <option value="LOCKED">Locked</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Month
                  </label>
                  <select
                    name="month"
                    value={formData.month}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  >
                    {months.map(month => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Year
                  </label>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  >
                    <option value="">Select Year</option>
                    {years.map(year => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                  placeholder="Add a description for this sheet..."
                />
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Tags
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Add Tags
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    placeholder="Enter tag and press Enter"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Tags Display */}
              {formData.tags.length > 0 && (
                <div className="mt-2">
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-emerald-500 hover:text-emerald-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sheet Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Sheet Settings
              </h3>
              
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      name="isLocked"
                      checked={formData.isLocked}
                      onChange={handleInputChange}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-300 rounded-full peer-checked:bg-emerald-600 transition-colors"></div>
                    <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">Lock Sheet</div>
                    <div className="text-sm text-slate-500">
                      Prevent further edits to this sheet
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-sm font-medium text-red-700 flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4" />
                Danger Zone
              </h3>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-red-800">Archive This Sheet</div>
                    <div className="text-sm text-red-600 mt-1">
                      Archived sheets cannot be edited but can still be viewed
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium flex items-center gap-2"
                  >
                    <Archive className="w-4 h-4" />
                    Archive Sheet
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => router.push(`/dashboard/dineshbhai/${sheetId}`)}
                className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
              >
                Cancel
              </button>
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Archive Sheet</h3>
                  <p className="text-sm text-slate-600">
                    Are you sure you want to archive this sheet?
                  </p>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="text-sm text-red-700">
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Sheet will be moved to archived section</li>
                    <li>Entries will be preserved but cannot be edited</li>
                    <li>You can restore it anytime by changing status</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center justify-center gap-2"
                >
                  <Archive className="w-4 h-4" />
                  Archive Sheet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}