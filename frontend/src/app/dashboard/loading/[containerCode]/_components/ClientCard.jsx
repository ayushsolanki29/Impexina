import React from 'react';
import { ChevronDown, ChevronUp, Eye, Copy, Share2, Edit, ExternalLink } from 'lucide-react';

const ClientCard = ({ 
  group, 
  isExpanded, 
  previewImages,
  statusColor,
  onToggleExpand, 
  onPreview, 
  onEdit, 
  onCopySummary, 
  onShare 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
      {/* Client Header */}
      <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onToggleExpand}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 group"
            >
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 transition-transform" />
              ) : (
                <ChevronDown className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
              )}
              <h3 className="text-lg font-semibold">{group.client}</h3>
            </button>

            <div className="flex flex-wrap gap-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor}`}>
                {group.status}
              </span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                {group.items.length} items
              </span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                CTN: {group.totals.ctn}
              </span>
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                Weight: {group.totals.twt.toFixed(2)} kg
              </span>
              <span className="text-xs text-gray-500">
                {new Date(group.loadingDate).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onPreview}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
              title="Preview client"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button
              onClick={onCopySummary}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
              title="Copy client summary"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
            <button
              onClick={onShare}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-800 rounded-lg text-sm transition-colors"
              title="Share via WhatsApp"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button
              onClick={onEdit}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-sm transition-colors"
              title="Edit client"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Items Table */}
      {isExpanded && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Particular
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Mark
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  CTN Mark
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  CTN
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  PCS
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  T.PCS
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  CBM
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  T.CBM
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  WT
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  T.WT
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {group.items.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {previewImages && item.photo && (
                        <div className="relative group">
                          <img
                            src={item.photo}
                            alt={item.particular}
                            className="w-12 h-12 object-cover rounded-lg border cursor-pointer"
                            onClick={() => window.open(item.photo, '_blank')}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <ExternalLink className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.particular}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.itemNo}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">
                      {item.mark}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {item.ctnMark}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                    {item.ctn}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">
                    {item.pcs}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                    {item.tpcs}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">
                    {item.cbm}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                    {item.tcbm.toFixed(3)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">
                    {item.wt}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                    {item.twt.toFixed(2)}
                  </td>
                </tr>
              ))}

              {/* Client Totals Row */}
              <tr className="bg-gray-50 font-semibold border-t-2 border-gray-300">
                <td colSpan={3} className="px-4 py-3 text-sm text-gray-900">
                  TOTAL for {group.client}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">
                  {group.totals.ctn}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">
                  —
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">
                  {group.totals.pcs}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">
                  —
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">
                  {group.totals.tcbm.toFixed(3)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">
                  —
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">
                  {group.totals.twt.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ClientCard;