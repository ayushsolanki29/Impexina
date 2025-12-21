import React, { useRef } from 'react';
import { X, Eye, EyeOff, FileSpreadsheet, FileText, ImageIcon, Copy, Share2, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

const PreviewModal = ({ 
  containerCode, 
  containerData, 
  previewClient, 
  previewImages,
  onClose, 
  onToggleImages,
  onExport 
}) => {
  const previewRef = useRef(null);
  const [exporting, setExporting] = React.useState(false);

  // Get filtered client groups based on preview selection
  const previewGroups = previewClient === 'all' 
    ? containerData.clientGroups 
    : containerData.clientGroups.filter(g => g.client === previewClient);

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800 border border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const exportToImage = async (clientName = null) => {
    try {
      setExporting(true);
      const element = previewRef.current;
      if (!element) {
        toast.error("No content to generate image");
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const filename = clientName 
        ? `${containerCode}_${clientName}_${new Date().toISOString().slice(0,10)}.png`
        : `${containerCode}_report_${new Date().toISOString().slice(0,10)}.png`;

      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast.success(`Image downloaded successfully`);
    } catch (error) {
      console.error("Image export error:", error);
      toast.error("Failed to generate image");
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = async (clientName = null) => {
    try {
      setExporting(true);
      const element = previewRef.current;
      if (!element) {
        toast.error("No content to generate PDF");
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const filename = clientName 
        ? `${containerCode}_${clientName}_${new Date().toISOString().slice(0,10)}.pdf`
        : `${containerCode}_report_${new Date().toISOString().slice(0,10)}.pdf`;

      pdf.save(filename);
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setExporting(false);
    }
  };

  const handleExport = (type) => {
    switch(type) {
      case 'excel':
        onExport('excel');
        break;
      case 'pdf':
        exportToPDF();
        break;
      case 'image':
        exportToImage();
        break;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {previewClient === 'all' ? 'Preview All Clients' : `Preview - ${previewClient}`}
            </h3>
            <p className="text-sm text-gray-600">
              {containerCode} • {previewGroups.length} client(s)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onToggleImages}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${
                previewImages 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {previewImages ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {previewImages ? 'Images On' : 'Images Off'}
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => handleExport('excel')}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </button>
              <button
                onClick={() => handleExport('pdf')}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                PDF
              </button>
              <button
                onClick={() => handleExport('image')}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <ImageIcon className="w-4 h-4" />
                Image
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto p-6">
          <div ref={previewRef} className="space-y-6">
            {previewGroups.map((group) => (
              <div
                key={group.client}
                className="bg-white border rounded-xl p-6 shadow-sm"
              >
                <div className="mb-4 pb-4 border-b">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xl font-bold text-gray-900">
                        {group.client}
                      </h4>
                      <div className="text-sm text-gray-600 mt-1">
                        Loading Date: {new Date(group.loadingDate).toLocaleDateString()} | 
                        Status: <span className={`ml-1 px-2 py-1 rounded text-xs ${getStatusColor(group.status)}`}>{group.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-2 text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                          {group.items.length} items
                        </span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                          CTN: {group.totals.ctn}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-2">Particular</th>
                        <th className="border border-gray-300 p-2">Mark</th>
                        <th className="border border-gray-300 p-2">CTN Mark</th>
                        <th className="border border-gray-300 p-2">CTN</th>
                        <th className="border border-gray-300 p-2">PCS</th>
                        <th className="border border-gray-300 p-2">T.PCS</th>
                        <th className="border border-gray-300 p-2">CBM</th>
                        <th className="border border-gray-300 p-2">T.CBM</th>
                        <th className="border border-gray-300 p-2">WT</th>
                        <th className="border border-gray-300 p-2">T.WT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((item, idx) => (
                        <tr key={idx} className="border hover:bg-gray-50">
                          <td className="border border-gray-300 p-2">
                            <div className="flex items-center gap-2">
                              {previewImages && item.photo && (
                                <div className="w-8 h-8 bg-gray-100 rounded overflow-hidden">
                                  <img 
                                    src={item.photo} 
                                    alt={item.particular}
                                    className="w-full h-full object-cover cursor-pointer"
                                    onClick={() => window.open(item.photo, '_blank')}
                                  />
                                </div>
                              )}
                              <div>
                                <div>{item.particular}</div>
                                <div className="text-xs text-gray-500">{item.itemNo}</div>
                              </div>
                            </div>
                          </td>
                          <td className="border border-gray-300 p-2">
                            {item.mark}
                          </td>
                          <td className="border border-gray-300 p-2">
                            {item.ctnMark}
                          </td>
                          <td className="border border-gray-300 p-2 text-right">
                            {item.ctn}
                          </td>
                          <td className="border border-gray-300 p-2 text-right">
                            {item.pcs}
                          </td>
                          <td className="border border-gray-300 p-2 text-right">
                            {item.tpcs}
                          </td>
                          <td className="border border-gray-300 p-2 text-right">
                            {item.cbm}
                          </td>
                          <td className="border border-gray-300 p-2 text-right">
                            {item.tcbm.toFixed(3)}
                          </td>
                          <td className="border border-gray-300 p-2 text-right">
                            {item.wt}
                          </td>
                          <td className="border border-gray-300 p-2 text-right">
                            {item.twt.toFixed(2)}
                          </td>
                        </tr>
                      ))}

                      {/* Totals */}
                      <tr className="bg-gray-50 font-bold">
                        <td colSpan={3} className="border border-gray-300 p-2">
                          TOTAL
                        </td>
                        <td className="border border-gray-300 p-2 text-right">
                          {group.totals.ctn}
                        </td>
                        <td className="border border-gray-300 p-2 text-right">—</td>
                        <td className="border border-gray-300 p-2 text-right">
                          {group.totals.pcs}
                        </td>
                        <td className="border border-gray-300 p-2 text-right">—</td>
                        <td className="border border-gray-300 p-2 text-right">
                          {group.totals.tcbm.toFixed(3)}
                        </td>
                        <td className="border border-gray-300 p-2 text-right">—</td>
                        <td className="border border-gray-300 p-2 text-right">
                          {group.totals.twt.toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Summary Box */}
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-blue-900">
                        Summary for {group.client}
                      </div>
                      <div className="text-sm text-blue-700 mt-1">
                        CTN: {group.totals.ctn} • PCS: {group.totals.pcs} • 
                        Weight: {group.totals.twt.toFixed(2)} kg • 
                        CBM: {group.totals.tcbm.toFixed(3)} • 
                        Items: {group.items.length}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="flex items-center gap-1 px-3 py-1.5 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 text-sm"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </button>
                      <button
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-100 border border-green-200 text-green-800 rounded-lg hover:bg-green-200 text-sm"
                      >
                        <Share2 className="w-4 h-4" />
                        WhatsApp
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div>
              Previewing {previewGroups.length} client(s)
            </div>
            <div>
              Total Items: {previewGroups.reduce((acc, group) => acc + group.items.length, 0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;