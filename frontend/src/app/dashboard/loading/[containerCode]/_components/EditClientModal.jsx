import React, { useState, useEffect } from "react";
import { X, Save, Upload, Image as ImageIcon } from "lucide-react";

const EditClientModal = ({
  containerCode,
  clientName,
  clientData,
  onClose,
  onSave,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    clientName: "",
    status: "",
    loadingDate: "",
    items: [],
  });

  // Initialize form data
  useEffect(() => {
    if (clientData) {
      setFormData({
        clientName: clientData.client,
        status: clientData.status,
        loadingDate: new Date(clientData.loadingDate)
          .toISOString()
          .split("T")[0],
        items: clientData.items.map((item) => ({
          ...item,
          originalPhoto: item.photo,
        })),
      });
    }
  }, [clientData]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Recalculate totals for numeric fields
    if (["ctn", "pcs", "cbm", "wt"].includes(field)) {
      const ctn = Number(updatedItems[index].ctn || 0);
      const pcs = Number(updatedItems[index].pcs || 0);
      const cbm = Number(updatedItems[index].cbm || 0);
      const wt = Number(updatedItems[index].wt || 0);

      updatedItems[index].tpcs = ctn * pcs;
      updatedItems[index].tcbm = parseFloat((ctn * cbm).toFixed(3));
      updatedItems[index].twt = parseFloat((ctn * wt).toFixed(2));
    }

    setFormData((prev) => ({ ...prev, items: updatedItems }));
  };

  const handlePhotoUpload = async (index, file) => {
    if (!file) return;

    try {
      // In a real app, upload to server and get URL
      // For now, create object URL
      const objectUrl = URL.createObjectURL(file);

      const updatedItems = [...formData.items];
      updatedItems[index].photo = objectUrl;
      updatedItems[index].photoFile = file;

      setFormData((prev) => ({ ...prev, items: updatedItems }));
    } catch (error) {
      console.error("Photo upload error:", error);
    }
  };

  const handleAddItem = () => {
    const newItem = {
      id: `new-${Date.now()}`,
      particular: "",
      mark: formData.clientName,
      ctnMark: "",
      itemNo: "",
      ctn: 0,
      pcs: 0,
      tpcs: 0,
      unit: "PCS",
      cbm: 0,
      tcbm: 0,
      wt: 0,
      twt: 0,
      photo: null,
    };

    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const handleRemoveItem = (index) => {
    const updatedItems = [...formData.items];
    updatedItems.splice(index, 1);
    setFormData((prev) => ({ ...prev, items: updatedItems }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare data for saving
      const saveData = {
        clientName: formData.clientName,
        status: formData.status,
        loadingDate: formData.loadingDate,
        items: formData.items.map(async (item) => ({
          particular: item.particular,
          mark: item.mark,
          ctnMark: item.ctnMark,
          itemNo: item.itemNo,
          ctn: Number(item.ctn),
          pcs: Number(item.pcs),
          unit: item.unit,
          cbm: Number(item.cbm),
          wt: Number(item.wt),
          photo: item.photoFile
            ? await uploadPhotoToServer(item.photoFile)
            : item.originalPhoto,
        })),
      };

      // Call onSave callback
      await onSave(saveData);
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setLoading(false);
    }
  };

  const uploadPhotoToServer = async (file) => {
    // Implement actual photo upload
    return URL.createObjectURL(file); // Temporary
  };

  if (!clientData) return null;

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Edit Client: {clientName}
            </h3>
            <p className="text-sm text-gray-600">Container: {containerCode}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            {/* Client Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Name *
                </label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) =>
                    handleInputChange("clientName", e.target.value)
                  }
                  className="w-full p-2.5 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  className="w-full p-2.5 border rounded-lg"
                  required
                >
                  <option value="DRAFT">Draft</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loading Date *
                </label>
                <input
                  type="date"
                  value={formData.loadingDate}
                  onChange={(e) =>
                    handleInputChange("loadingDate", e.target.value)
                  }
                  className="w-full p-2.5 border rounded-lg"
                  required
                />
              </div>
            </div>

            {/* Items Table */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold">
                  Items ({formData.items.length})
                </h4>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Item
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-2">Photo</th>
                      <th className="border border-gray-300 p-2">
                        Particular *
                      </th>
                      <th className="border border-gray-300 p-2">CTN Mark *</th>
                      <th className="border border-gray-300 p-2">CTN *</th>
                      <th className="border border-gray-300 p-2">PCS *</th>
                      <th className="border border-gray-300 p-2">Unit</th>
                      <th className="border border-gray-300 p-2">CBM *</th>
                      <th className="border border-gray-300 p-2">Weight *</th>
                      <th className="border border-gray-300 p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr
                        key={item.id || index}
                        className="border hover:bg-gray-50"
                      >
                        {/* Photo Upload */}
                        <td className="border border-gray-300 p-2">
                          <div className="flex items-center gap-2">
                            <label className="cursor-pointer">
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200">
                                {item.photo ? (
                                  <img
                                    src={item.photo}
                                    alt="Item"
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                ) : (
                                  <ImageIcon className="w-5 h-5 text-gray-400" />
                                )}
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) =>
                                  handlePhotoUpload(index, e.target.files[0])
                                }
                              />
                            </label>
                          </div>
                        </td>

                        {/* Particular */}
                        <td className="border border-gray-300 p-2">
                          <input
                            type="text"
                            value={item.particular}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "particular",
                                e.target.value
                              )
                            }
                            className="w-full p-1 border rounded"
                            required
                          />
                        </td>

                        {/* CTN Mark */}
                        <td className="border border-gray-300 p-2">
                          <input
                            type="text"
                            value={item.ctnMark}
                            onChange={(e) =>
                              handleItemChange(index, "ctnMark", e.target.value)
                            }
                            className="w-full p-1 border rounded"
                            required
                          />
                        </td>

                        {/* CTN */}
                        <td className="border border-gray-300 p-2">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={item.ctn}
                            onChange={(e) =>
                              handleItemChange(index, "ctn", e.target.value)
                            }
                            className="w-full p-1 border rounded"
                            required
                          />
                        </td>

                        {/* PCS */}
                        <td className="border border-gray-300 p-2">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={item.pcs}
                            onChange={(e) =>
                              handleItemChange(index, "pcs", e.target.value)
                            }
                            className="w-full p-1 border rounded"
                            required
                          />
                        </td>

                        {/* Unit */}
                        <td className="border border-gray-300 p-2">
                          <select
                            value={item.unit}
                            onChange={(e) =>
                              handleItemChange(index, "unit", e.target.value)
                            }
                            className="w-full p-1 border rounded"
                          >
                            <option value="PCS">PCS</option>
                            <option value="SET">SET</option>
                            <option value="BOX">BOX</option>
                            <option value="PAIR">PAIR</option>
                          </select>
                        </td>

                        {/* CBM */}
                        <td className="border border-gray-300 p-2">
                          <input
                            type="number"
                            min="0"
                            step="0.001"
                            value={item.cbm}
                            onChange={(e) =>
                              handleItemChange(index, "cbm", e.target.value)
                            }
                            className="w-full p-1 border rounded"
                            required
                          />
                        </td>

                        {/* Weight */}
                        <td className="border border-gray-300 p-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.wt}
                            onChange={(e) =>
                              handleItemChange(index, "wt", e.target.value)
                            }
                            className="w-full p-1 border rounded"
                            required
                          />
                        </td>

                        {/* Actions */}
                        <td className="border border-gray-300 p-2">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals Display */}
            {formData.items.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold mb-3">Calculated Totals</h4>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total CTN:</span>
                    <span className="ml-2 font-bold">
                      {formData.items.reduce(
                        (sum, item) => sum + Number(item.ctn || 0),
                        0
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total PCS:</span>
                    <span className="ml-2 font-bold">
                      {formData.items.reduce(
                        (sum, item) => sum + Number(item.tpcs || 0),
                        0
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total CBM:</span>
                    <span className="ml-2 font-bold">
                      {formData.items
                        .reduce((sum, item) => sum + Number(item.tcbm || 0), 0)
                        .toFixed(3)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Weight:</span>
                    <span className="ml-2 font-bold">
                      {formData.items
                        .reduce((sum, item) => sum + Number(item.twt || 0), 0)
                        .toFixed(2)}{" "}
                      kg
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="border-t p-6">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
      </div>
    </div>
  );
};

export default EditClientModal;
