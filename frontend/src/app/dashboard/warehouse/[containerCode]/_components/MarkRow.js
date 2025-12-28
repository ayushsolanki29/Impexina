import React, { useState } from 'react';
import { 
  Edit, 
  Save, 
  X, 
  Trash2, 
  Check, 
  Calendar, 
  FileText, 
  Package,
  Truck,
  Box,
  Scale,
  User
} from 'lucide-react';

export default function MarkRow({ 
  item, 
  onUpdate, 
  onDelete,
  canEdit 
}) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    deliveryDate: item.deliveryDate || '',
    invNo: item.invNo || '',
    gst: item.gst || '',
    transporter: item.transporter || '',
    status: item.status || 'PENDING'
  });

  const [confirmDelete, setConfirmDelete] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-GB');
    } catch {
      return dateString;
    }
  };

  const handleSave = () => {
    onUpdate(item._id || item.id, editForm);
    setShowEditModal(false);
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'DRAFT':
        return 'bg-blue-100 text-blue-800';
      case 'HOLD':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCompletionStatus = () => {
    let completed = 0;
    let total = 4; // deliveryDate, invNo, transporter, gst
    
    if (item.deliveryDate) completed++;
    if (item.invNo) completed++;
    if (item.transporter) completed++;
    if (item.gst) completed++;
    
    return { completed, total };
  };

  const status = getCompletionStatus();

  return (
    <>
      <tr className="hover:bg-gray-50 border-b">
        {/* Mark Info */}
        <td className="px-4 py-3">
          <div>
            <div className="font-medium text-gray-900">{item.mark}</div>
            <div className="text-xs text-gray-500 mt-1">{item.product || 'MIX ITEM'}</div>
          </div>
        </td>
        
        {/* Quantities */}
        <td className="px-4 py-3 text-center">
          <div className="flex flex-col items-center">
            <Package className="w-4 h-4 text-gray-400 mb-1" />
            <span className="font-semibold">{item.ctn}</span>
            <span className="text-xs text-gray-500">CTN</span>
          </div>
        </td>
        
        <td className="px-4 py-3 text-center">
          <div className="flex flex-col items-center">
            <Box className="w-4 h-4 text-gray-400 mb-1" />
            <span className="font-semibold">{item.totalCBM?.toFixed(3) || '0.000'}</span>
            <span className="text-xs text-gray-500">CBM</span>
          </div>
        </td>
        
        <td className="px-4 py-3 text-center">
          <div className="flex flex-col items-center">
            <Scale className="w-4 h-4 text-gray-400 mb-1" />
            <span className="font-semibold">{item.totalWeight || '0'}</span>
            <span className="text-xs text-gray-500">kg</span>
          </div>
        </td>
        
        {/* Loading Date */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm">{formatDate(item.loadingDate)}</span>
          </div>
        </td>
        
        {/* Delivery & Invoice Info */}
        <td className="px-4 py-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Truck className="w-3 h-3 text-gray-400" />
              <span className={`text-xs px-2 py-0.5 rounded ${
                item.deliveryDate ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {item.deliveryDate ? formatDate(item.deliveryDate) : 'No date'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-3 h-3 text-gray-400" />
              <span className={`text-xs px-2 py-0.5 rounded ${
                item.invNo ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {item.invNo || 'No invoice'}
              </span>
            </div>
          </div>
        </td>
        
        {/* Transporter */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            <span className={`text-xs px-2 py-0.5 rounded ${
              item.transporter ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-600'
            }`}>
              {item.transporter || 'No transporter'}
            </span>
          </div>
        </td>
        
        {/* Status */}
        <td className="px-4 py-3">
          <div className="flex items-center justify-center">
            <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
              {item.status}
            </span>
          </div>
        </td>
        
        {/* GST */}
        <td className="px-4 py-3">
          <div className={`px-3 py-1.5 rounded text-center ${
            item.gst ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-500'
          }`}>
            <span className="text-sm font-medium">{item.gst || '—'}</span>
          </div>
        </td>
        
        {/* Product */}
        <td className="px-4 py-3">
          <div className="text-sm text-gray-700 truncate max-w-[150px]">
            {item.product || 'MIX ITEM'}
          </div>
        </td>
        
        {/* Actions */}
        <td className="px-4 py-3">
          {canEdit ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span className="text-sm font-medium">Edit</span>
              </button>
              
              {confirmDelete ? (
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      onDelete(item._id || item.id);
                      setConfirmDelete(false);
                    }}
                    className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <span className="text-xs text-gray-400 px-3 py-1.5 bg-gray-100 rounded">View Only</span>
          )}
        </td>
      </tr>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[98vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Edit Mark Details</h3>
                  <p className="text-sm text-gray-600 mt-1">{item.mark} • {item.ctn} CTN</p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(100vh-200px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Priority Section */}
                <div className="md:col-span-2 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-3 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Priority Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Delivery Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Delivery Date
                      </label>
                      <input
                        type="date"
                        value={editForm.deliveryDate}
                        onChange={(e) => setEditForm({ ...editForm, deliveryDate: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Invoice Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Invoice No.
                      </label>
                      <input
                        type="text"
                        value={editForm.invNo}
                        onChange={(e) => setEditForm({ ...editForm, invNo: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter invoice number"
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="DRAFT">Draft</option>
                        <option value="HOLD">Hold</option>
                      </select>
                    </div>

                    {/* Transporter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Truck className="w-4 h-4" />
                        Transporter
                      </label>
                      <input
                        type="text"
                        value={editForm.transporter}
                        onChange={(e) => setEditForm({ ...editForm, transporter: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter transporter"
                      />
                    </div>
                  </div>
                </div>

                {/* Secondary Section */}
                <div className="md:col-span-2">
                  <h4 className="font-medium text-gray-700 mb-4">Additional Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* GST */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        GST Number
                      </label>
                      <input
                        type="text"
                        value={editForm.gst}
                        onChange={(e) => setEditForm({ ...editForm, gst: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="GST number"
                      />
                    </div>

                    {/* Product */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product
                      </label>
                      <input
                        type="text"
                        value={item.product}
                        disabled
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Product info from loading sheet</p>
                    </div>
                  </div>
                </div>

                {/* Read-only Info */}
                <div className="md:col-span-2 bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-3">Mark Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">CTN</p>
                      <p className="font-semibold">{item.ctn}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">CBM</p>
                      <p className="font-semibold">{item.totalCBM?.toFixed(3) || '0.000'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Weight</p>
                      <p className="font-semibold">{item.totalWeight} kg</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Loading Date</p>
                      <p className="font-semibold">{formatDate(item.loadingDate)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  <span className="font-medium text-gray-700">{item.mark}</span> • Last updated: {formatDate(item.updatedAt) || 'Never'}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}