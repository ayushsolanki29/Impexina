import React, { useState } from 'react';
import { X, Download, FileSpreadsheet, FileText, ImageIcon, Check } from 'lucide-react';

const ExportModal = ({ 
  containerCode, 
  exportType, 
  filters, 
  clientGroups, 
  onClose, 
  onExport 
}) => {
  const [selectedClients, setSelectedClients] = useState([]);
  const [includeImages, setIncludeImages] = useState(true);
  const [format, setFormat] = useState(exportType === 'excel' ? 'xlsx' : 'pdf');
  const [exporting, setExporting] = useState(false);

  const toggleAllClients = () => {
    if (selectedClients.length === clientGroups.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(clientGroups.map(g => g.client));
    }
  };

  const toggleClient = (client) => {
    setSelectedClients(prev =>
      prev.includes(client)
        ? prev.filter(c => c !== client)
        : [...prev, client]
    );
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      // Here you would call your backend export API
      // For now, simulate export
      await new Promise(resolve => setTimeout(resolve, 1000));
      onExport();
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  const getExportIcon = () => {
    switch (exportType) {
      case 'excel':
        return <FileSpreadsheet className="w-5 h-5" />;
      case 'pdf':
        return <FileText className="w-5 h-5" />;
      case 'image':
        return <ImageIcon className="w-5 h-5" />;
      default:
        return <Download className="w-5 h-5" />;
    }
  };

  const getExportTitle = () => {
    switch (exportType) {
      case 'excel':
        return 'Export to Excel';
      case 'pdf':
        return 'Export to PDF';
      case 'image':
        return 'Export to Image';
      default:
        return 'Export';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              {getExportIcon()}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {getExportTitle()}
              </h3>
              <p className="text-sm text-gray-600">
                {containerCode} • Configure export options
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Client Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Clients to Export
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto p-3 border rounded-lg">
              <label className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedClients.length === clientGroups.length}
                  onChange={toggleAllClients}
                  className="rounded border-gray-300"
                />
                <span className="font-medium">
                  {selectedClients.length === clientGroups.length
                    ? "Deselect All"
                    : "Select All"} ({clientGroups.length})
                </span>
              </label>
              {clientGroups.map((group) => (
                <label key={group.client} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedClients.includes(group.client)}
                    onChange={() => toggleClient(group.client)}
                    className="rounded border-gray-300"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{group.client}</div>
                    <div className="text-sm text-gray-500">
                      {group.items.length} items • CTN: {group.totals.ctn}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Export Options
              </label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeImages}
                    onChange={(e) => setIncludeImages(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span>Include item images in export</span>
                </label>
                
                {exportType === 'pdf' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PDF Format
                    </label>
                    <select
                      value={format}
                      onChange={(e) => setFormat(e.target.value)}
                      className="w-full p-2.5 border rounded-lg"
                    >
                      <option value="pdf">Standard PDF</option>
                      <option value="a4">A4 Format</option>
                      <option value="letter">Letter Format</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Export Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Export Summary</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Selected Clients:</span>
                <span className="ml-2 font-medium">
                  {selectedClients.length === 0 ? 'All' : selectedClients.length}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Total Items:</span>
                <span className="ml-2 font-medium">
                  {clientGroups
                    .filter(group => selectedClients.length === 0 || selectedClients.includes(group.client))
                    .reduce((acc, group) => acc + group.items.length, 0)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Include Images:</span>
                <span className="ml-2 font-medium">
                  {includeImages ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Format:</span>
                <span className="ml-2 font-medium capitalize">{format}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-6">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {exporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export Now
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;