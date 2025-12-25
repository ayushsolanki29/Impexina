import React from 'react';
import { Plus, X } from 'lucide-react';

export default function AddClientForm({ 
  show, 
  onClose, 
  newItem, 
  setNewItem, 
  onSubmit 
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Add New Client</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Name *
              </label>
              <input
                type="text"
                value={newItem.clientName}
                onChange={(e) => setNewItem({ ...newItem, clientName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Enter client name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CTN *
              </label>
              <input
                type="number"
                value={newItem.ctn}
                onChange={(e) => setNewItem({ ...newItem, ctn: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Enter CTN"
                required
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product
              </label>
              <input
                type="text"
                value={newItem.product}
                onChange={(e) => setNewItem({ ...newItem, product: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Enter product"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total CBM
              </label>
              <input
                type="number"
                step="0.001"
                value={newItem.totalCBM}
                onChange={(e) => setNewItem({ ...newItem, totalCBM: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Enter CBM"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Weight (kg)
              </label>
              <input
                type="number"
                value={newItem.totalWeight}
                onChange={(e) => setNewItem({ ...newItem, totalWeight: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Enter weight"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Date
              </label>
              <input
                type="date"
                value={newItem.deliveryDate}
                onChange={(e) => setNewItem({ ...newItem, deliveryDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice No.
              </label>
              <input
                type="text"
                value={newItem.invNo}
                onChange={(e) => setNewItem({ ...newItem, invNo: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Enter invoice number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GST
              </label>
              <input
                type="text"
                value={newItem.gst}
                onChange={(e) => setNewItem({ ...newItem, gst: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Enter GST"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From
              </label>
              <input
                type="text"
                value={newItem.from}
                onChange={(e) => setNewItem({ ...newItem, from: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Enter sender"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To
              </label>
              <input
                type="text"
                value={newItem.to}
                onChange={(e) => setNewItem({ ...newItem, to: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Enter receiver"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                LR Number
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newItem.lr}
                  onChange={(e) => setNewItem({ ...newItem, lr: e.target.value })}
                  className="flex-1 px-3 py-2 border rounded-lg"
                  placeholder="Enter LR number"
                />
                <label className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={!!newItem.lr}
                    onChange={(e) => setNewItem({ 
                      ...newItem, 
                      lr: e.target.checked ? (newItem.lr || 'YES') : '' 
                    })}
                    className="rounded"
                  />
                  Done
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={!newItem.clientName || !newItem.ctn}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Add Client
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}