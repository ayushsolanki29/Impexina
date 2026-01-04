"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import API from "@/lib/api";
import {
  Plus,
  Trash2,
  Image as ImageIcon,
  Printer,
  Download,
  Save,
  X,
  Banknote,
  Weight,
  Package,
  Eye,
  Edit2,
  CheckCircle,
  Upload,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Building,
  FileText,
  Truck,
  CreditCard,
  User,
  Calendar,
  Hash,
  MapPin,
  ArrowLeft,
  Copy,
  Settings,
  Activity,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Stamp,
} from "lucide-react";

export default function PackingListPage() {
  const router = useRouter();
  const params = useParams();
  const containerCode = params.containerCode;

  const [packingList, setPackingList] = useState(null);
  const [companyMaster, setCompanyMaster] = useState(null);
  const [items, setItems] = useState([]);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [availableCompanies, setAvailableCompanies] = useState([]);
  const [initializing, setInitializing] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Form states - ALL fields are now editable
  const [formData, setFormData] = useState({
    // Header Information
    headerCompanyName: "",
    headerCompanyAddress: "",
    headerPhone: "",
    
    // Seller Information
    sellerCompanyName: "",
    sellerAddress: "",
    sellerIecNo: "AAHCI1462J",
    sellerGst: "",
    sellerEmail: "impexina91@gmail.com",
    
    // Invoice Information
    invoiceNo: "",
    date: new Date().toISOString().split("T")[0],
    from: "CHINA",
    to: "INDIA",
    lrNo: "",
    
    // Bank Details
    bankName: "",
    beneficiaryName: "",
    swiftBic: "",
    bankAddress: "",
    accountNumber: "",
    
    // Stamp Settings
    stampImage: null,
    stampPosition: "BOTTOM_RIGHT",
    stampText: "Authorized Signatory",
    
    // Column Settings
    showMixColumn: true,
    showHsnColumn: true,
    
    // Status
    status: "DRAFT",
  });

  // Load packing list data
  useEffect(() => {
    if (containerCode) {
      loadPackingList();
      loadAvailableCompanies();
      loadActivities();
    }
  }, [containerCode]);

  // Load activities
  async function loadActivities() {
    try {
      const response = await API.get(`/packing-list/${containerCode}/activities`);
      if (response.data.success && response.data.data) {
        setActivities(response.data.data);
      }
    } catch (error) {
      console.error("Error loading activities:", error);
    }
  }

  // Load available companies for initialization
  async function loadAvailableCompanies() {
    try {
      const response = await API.get("/packing-list/company-masters/all");
      if (response.data.success && response.data.data) {
        setAvailableCompanies(response.data.data);
      } else {
        setAvailableCompanies([]);
      }
    } catch (error) {
      console.error("Error loading companies:", error);
      setAvailableCompanies([]);
    }
  }

  async function loadPackingList() {
    try {
      setIsLoading(true);

      const response = await API.get(`/packing-list/${containerCode}`);

      if (response.data.success && response.data.data) {
        const packingListData = response.data.data;
        setPackingList(packingListData);

        // Check if companyMaster exists in response
        if (packingListData.companyMaster) {
          setCompanyMaster(packingListData.companyMaster);
          // Pre-fill form with company master data if not already set
          if (!packingListData.headerCompanyName) {
            setFormData(prev => ({
              ...prev,
              headerCompanyName: packingListData.companyMaster.companyName,
              headerCompanyAddress: packingListData.companyMaster.companyAddress,
              headerPhone: packingListData.companyMaster.companyPhone,
              bankName: packingListData.companyMaster.bankName,
              beneficiaryName: packingListData.companyMaster.beneficiaryName,
              swiftBic: packingListData.companyMaster.swiftBic,
              bankAddress: packingListData.companyMaster.bankAddress,
              accountNumber: packingListData.companyMaster.accountNumber,
              stampText: packingListData.companyMaster.signatureText || "Authorized Signatory",
            }));
          }
        }

        setItems(packingListData.items || []);

        // Set ALL form data from database
        setFormData(prev => ({
          ...prev,
          // Header Information
          headerCompanyName: packingListData.headerCompanyName || packingListData.companyMaster?.companyName || "",
          headerCompanyAddress: packingListData.headerCompanyAddress || packingListData.companyMaster?.companyAddress || "",
          headerPhone: packingListData.headerPhone || packingListData.companyMaster?.companyPhone || "",
          
          // Seller Information
          sellerCompanyName: packingListData.sellerCompanyName || packingListData.sellerName || "",
          sellerAddress: packingListData.sellerAddress || "",
          sellerIecNo: packingListData.sellerIecNo || "AAHCI1462J",
          sellerGst: packingListData.sellerGst || packingListData.gst || "",
          sellerEmail: packingListData.sellerEmail || "impexina91@gmail.com",
          
          // Invoice Information
          invoiceNo: packingListData.invoiceNo || packingListData.invNo || "",
          date: packingListData.invoiceDate 
            ? new Date(packingListData.invoiceDate).toISOString().split("T")[0]
            : (packingListData.date 
                ? new Date(packingListData.date).toISOString().split("T")[0]
                : new Date().toISOString().split("T")[0]),
          from: packingListData.from || "CHINA",
          to: packingListData.to || "INDIA",
          lrNo: packingListData.lrNo || "",
          
          // Bank Details
          bankName: packingListData.bankName || packingListData.companyMaster?.bankName || "",
          beneficiaryName: packingListData.beneficiaryName || packingListData.companyMaster?.beneficiaryName || "",
          swiftBic: packingListData.swiftBic || packingListData.companyMaster?.swiftBic || "",
          bankAddress: packingListData.bankAddress || packingListData.companyMaster?.bankAddress || "",
          accountNumber: packingListData.accountNumber || packingListData.companyMaster?.accountNumber || "",
          
          // Stamp Settings
          stampImage: packingListData.stampImage || null,
          stampPosition: packingListData.stampPosition || "BOTTOM_RIGHT",
          stampText: packingListData.stampText || packingListData.companyMaster?.signatureText || "Authorized Signatory",
          
          // Column Settings
          showMixColumn: packingListData.showMixColumn !== false,
          showHsnColumn: packingListData.showHsnColumn !== false,
          
          // Status
          status: packingListData.status || "DRAFT",
        }));
      } else {
        toast.info(
          "Packing list not found. You can initialize one from bifurcation data."
        );
      }
    } catch (error) {
      console.error("Error loading packing list:", error);
      if (error.response?.status === 404) {
        toast.info("No packing list found. Click 'Initialize' to create one.");
      } else {
        toast.error(error.message || "Failed to load packing list");
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Initialize packing list with selected company
  async function initializePackingList(companyMasterId) {
    try {
      setInitializing(true);

      const response = await API.post(
        `/packing-list/initialize/${containerCode}`,
        { companyMasterId }
      );

      if (response.data.success) {
        toast.success("Packing list initialized successfully!");
        setShowCompanyModal(false);
        loadPackingList();
      } else {
        throw new Error(response.data.message || "Failed to initialize");
      }
    } catch (error) {
      console.error("Initialize error:", error);
      toast.error(`Failed to initialize: ${error.message}`);
    } finally {
      setInitializing(false);
    }
  }

  // Handle stamp upload
  function handleStampUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData(prev => ({ ...prev, stampImage: event.target.result }));
    };
    reader.readAsDataURL(file);
  }

  // Save packing list
  async function savePackingList() {
    try {
      // Validation
      if (!formData.headerCompanyName.trim()) {
        toast.error("Header Company Name is required");
        return;
      }
      if (!formData.sellerCompanyName.trim()) {
        toast.error("Seller Company Name is required");
        return;
      }
      if (!formData.sellerGst.trim()) {
        toast.error("GST Number is required");
        return;
      }

      setIsSaving(true);

      // Prepare data for saving
      const saveData = {
        // Header Information
        headerCompanyName: formData.headerCompanyName,
        headerCompanyAddress: formData.headerCompanyAddress,
        headerPhone: formData.headerPhone,
        
        // Seller Information
        sellerCompanyName: formData.sellerCompanyName,
        sellerAddress: formData.sellerAddress,
        sellerIecNo: formData.sellerIecNo,
        sellerGst: formData.sellerGst,
        sellerEmail: formData.sellerEmail,
        
        // Invoice Information
        invoiceNo: formData.invoiceNo,
        invoiceDate: formData.date,
        from: formData.from,
        to: formData.to,
        lrNo: formData.lrNo,
        
        // Bank Details
        bankName: formData.bankName,
        beneficiaryName: formData.beneficiaryName,
        swiftBic: formData.swiftBic,
        bankAddress: formData.bankAddress,
        accountNumber: formData.accountNumber,
        
        // Stamp Settings
        stampImage: formData.stampImage,
        stampPosition: formData.stampPosition,
        stampText: formData.stampText,
        
        // Column Settings
        showMixColumn: formData.showMixColumn,
        showHsnColumn: formData.showHsnColumn,
        
        // Status
        status: formData.status,
      };

      // Update packing list details
      const updateResponse = await API.patch(
        `/packing-list/${containerCode}`,
        saveData
      );

      if (!updateResponse.data.success) {
        throw new Error(
          updateResponse.data.message || "Failed to update packing list"
        );
      }

      // Prepare items for saving (remove temporary IDs)
      const itemsToSave = items.map(({ id, ...rest }) => {
        // Remove temp IDs that start with 'item_'
        const finalId = id && id.startsWith("item_") ? undefined : id;
        return {
          ...rest,
          id: finalId,
          ctn: Number(rest.ctn) || 0,
          qtyPerCtn: Number(rest.qtyPerCtn) || 0,
          tQty: Number(rest.tQty) || 0,
          kg: Number(rest.kg) || 0,
          tKg: Number(rest.tKg) || 0,
          mix: rest.mix || "",
          hsn: rest.hsn || "",
        };
      });

      // Update items
      const itemsResponse = await API.patch(
        `/packing-list/${containerCode}/items`,
        {
          items: itemsToSave,
        }
      );

      if (!itemsResponse.data.success) {
        throw new Error(itemsResponse.data.message || "Failed to update items");
      }

      // Log activity
      await API.post(`/packing-list/${containerCode}/activity`, {
        type: "FIELDS_UPDATED",
        note: "Updated packing list fields and items",
      });

      toast.success("Packing list saved successfully!");
      loadPackingList();
      loadActivities();
    } catch (error) {
      console.error("Save error:", error);
      toast.error(error.message || "Failed to save packing list");
    } finally {
      setIsSaving(false);
    }
  }

  // Item management functions
  function baseEmptyRow() {
    return {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      itemNumber: "",
      particular: "",
      ctn: 0,
      qtyPerCtn: 0,
      unit: "PCS",
      tQty: 0,
      kg: 0,
      tKg: 0,
      mix: "",
      hsn: "",
      photo: null,
    };
  }

  function addRow() {
    setItems([...items, baseEmptyRow()]);
  }

  function duplicateRow(id) {
    const rowToDuplicate = items.find(item => item.id === id);
    if (rowToDuplicate) {
      const duplicatedRow = {
        ...rowToDuplicate,
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
      setItems([...items, duplicatedRow]);
    }
  }

  function insertRowAfter(id) {
    const index = items.findIndex(item => item.id === id);
    if (index !== -1) {
      const newItems = [...items];
      newItems.splice(index + 1, 0, baseEmptyRow());
      setItems(newItems);
    }
  }

  function updateRow(id, field, value) {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          
          // Auto-calculate totals
          if (field === "ctn" || field === "qtyPerCtn") {
            updated.tQty = (Number(updated.ctn) || 0) * (Number(updated.qtyPerCtn) || 0);
          }
          if (field === "ctn" || field === "kg") {
            updated.tKg = (Number(updated.ctn) || 0) * (Number(updated.kg) || 0);
          }
          
          return updated;
        }
        return item;
      })
    );
  }

  function removeRow(id) {
    setItems(items.filter((item) => item.id !== id));
  }

  // Handle photo upload
  function handlePhotoUpload(e, itemId) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      updateRow(itemId, "photo", event.target.result);
    };
    reader.readAsDataURL(file);
  }

  // Calculate totals
  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.ctn += Number(item.ctn) || 0;
        acc.tQty += Number(item.tQty) || 0;
        acc.tKg += Number(item.tKg) || 0;
        return acc;
      },
      { ctn: 0, tQty: 0, tKg: 0 }
    );
  }, [items]);

  // Build printable HTML with all editable fields
  function buildPrintableHTML() {
    const stampPositionStyle = {
      "BOTTOM_LEFT": "text-align: left;",
      "BOTTOM_CENTER": "text-align: center;",
      "BOTTOM_RIGHT": "text-align: right;",
    }[formData.stampPosition] || "text-align: right;";

    function escapeHtml(s) {
      if (s === null || s === undefined) return "";
      return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    // Generate table headers including MIX and HSN if enabled
    const tableHeaders = `
<tr>
  <th>S.N.</th>
  <th>Item Number</th>
  <th>Photo</th>
  <th>Descriptions</th>
  <th>Ctn.</th>
  <th>Qty./ Ctn</th>
  <th>Unit</th>
  <th>T-QTY</th>
  <th>KG</th>
  <th>T.KG</th>

</tr>`;

    const rowsHtml = items
      .map((it, i) => {
        const photoCell = it.photo
          ? `<img src="${it.photo}" style="max-width:55px;max-height:40px;" />`
          : "";
        return `
<tr>
  <td class="center">${i + 1}</td>
  <td class="center">${escapeHtml(it.itemNumber)}</td>
  <td class="center">${photoCell}</td>
  <td>${escapeHtml(it.particular)}</td>
  <td class="right">${it.ctn}</td>
  <td class="right">${it.qtyPerCtn}</td>
  <td class="center">${escapeHtml(it.unit)}</td>
  <td class="right">${it.tQty}</td>
  <td class="right">${it.kg}</td>
  <td class="right">${Number(it.tKg).toFixed(2)}</td>

</tr>`;
      })
      .join("");

    // Calculate colspan for totals row
    const totalColspan = 4 ;

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Packing List - ${escapeHtml(formData.invoiceNo)}</title>

<style>
@page { size:A4; margin:10mm; }

body {
font-family: Cambria, "Cambria Math", "Times New Roman", serif;
  font-size: 11px;
  color: #000;
}

table {
  width:100%;
  border-collapse:collapse;
}

th, td {
  border:1px solid #000;
  padding:4px;
}

th {
  text-align:center;
  font-weight:bold;
}
.company-name {
  font-size: 20px;
  font-weight: bold;
}

.packing-title {
  font-size: 24px;
  font-weight: bold;
}

.center { text-align:center; }
.right { text-align:right; }
.bold { font-weight:bold; }
</style>
</head>

<body>

<!-- Header Company -->
<table>
<tr>
  <td class="center bold company-name" style="font-size:20px;">
    ${escapeHtml(formData.headerCompanyName)}
  </td>
</tr>
<tr>
  <td class="center">
    ${escapeHtml(formData.headerCompanyAddress)}
    ${formData.headerPhone ? `<br/>Tel: ${escapeHtml(formData.headerPhone)}` : ''}
  </td>
</tr>
<tr>
  <td class="center bold packing-title " style="font-size:24px;">
    PACKING LIST
  </td>
</tr>
</table>

<!-- Seller and Invoice Info -->
<table>
<tr>
  <td style="width:65%;vertical-align:top;">
    <b>${escapeHtml(formData.sellerCompanyName)}</b><br/>
    ${escapeHtml(formData.sellerAddress)}<br/>
    ${formData.sellerIecNo ? `IEC NO.: ${escapeHtml(formData.sellerIecNo)}<br/>` : ''}
    ${formData.sellerGst ? `GST NO.: ${escapeHtml(formData.sellerGst)}<br/>` : ''}
    ${formData.sellerEmail ? `EMAIL: ${escapeHtml(formData.sellerEmail)}` : ''}
  </td>
  <td style="width:35%;vertical-align:top;">
    ${formData.invoiceNo ? `<b>INV NO.:</b> ${escapeHtml(formData.invoiceNo)}<br/>` : ''}
    <b>DATE :</b> ${new Date(formData.date).toLocaleDateString('en-GB')}<br/>
    ${formData.to ? `<b>${escapeHtml(formData.to)}</b><br/>` : ''}
    ${formData.from ? `<b>FROM:</b> ${escapeHtml(formData.from)}` : ''}
    ${formData.lrNo ? `<br/><b>LR NO:</b> ${escapeHtml(formData.lrNo)}` : ''}
  </td>
</tr>
</table>

<!-- Items Table -->
<table>
<thead>
${tableHeaders}
</thead>

<tbody>
${rowsHtml}

<tr class="bold">
  <td colspan="${totalColspan}" class="center">TOTAL</td>
  <td class="right">${totals.ctn}</td>
  <td></td>
  <td></td>
  <td class="right">${totals.tQty}</td>
  <td></td>
  <td class="right">${totals.tKg.toFixed(2)}</td>

</tr>
</tbody>
</table>

<!-- Bank Details -->
<table style="margin-top:8px;">
<tr><td class="bold">Bank Detail:</td></tr>
<tr><td><b>BENEFICIARY'S BANK NAME:</b> ${escapeHtml(formData.bankName)}</td></tr>
<tr><td><b>BENEFICIARY NAME :</b> ${escapeHtml(formData.beneficiaryName)}</td></tr>
<tr><td><b>SWIFT BIC:</b> ${escapeHtml(formData.swiftBic)}</td></tr>
<tr><td><b>BENEFICIARY'S BANK ADD:</b> ${escapeHtml(formData.bankAddress)}</td></tr>
<tr><td><b>BENEFICIARY A/C NO.:</b> ${escapeHtml(formData.accountNumber)}</td></tr>
</table>

<!-- Stamp/Signature with position -->
<table style="margin-top:12px;">
<tr>
  <td></td>
  <td class="center" style="${stampPositionStyle}">
    ${formData.stampImage ? `<img src="${formData.stampImage}" style="max-height:70px"/><br/>` : ""}
    ${escapeHtml(formData.stampText)}
  </td>
</tr>
</table>

</body>
</html>`;
  }

  function openPreview() {
    const html = buildPrintableHTML();
    setPreviewHtml(html);
    setPreviewOpen(true);
  }

  function printPreview() {
    const html = previewHtml || buildPrintableHTML();
    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) return toast.error("Popup blocked");
    w.document.open();
    w.document.write(
      html + "<script>setTimeout(()=>window.print(),200);</script>"
    );
    w.document.close();
  }

  // Company Selection Modal Component
  function CompanySelectionModal() {
    const [selectedCompany, setSelectedCompany] = useState(null);

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Select Company Template</h3>
            <button
              onClick={() => setShowCompanyModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Select a company template to pre-fill the packing list fields. You can edit all fields afterwards.
          </p>

          <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
            {availableCompanies.map((company) => (
              <div
                key={company.id}
                className={`p-3 border rounded cursor-pointer transition-colors ${
                  selectedCompany?.id === company.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
                onClick={() => setSelectedCompany(company)}
              >
                <div className="font-medium text-sm">{company.companyName}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {company.bankName}
                </div>
              </div>
            ))}

            {availableCompanies.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No company masters found. Please create one first.
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowCompanyModal(false)}
              className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
              disabled={initializing}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (selectedCompany) {
                  // Pre-fill form with selected company data
                  setFormData(prev => ({
                    ...prev,
                    headerCompanyName: selectedCompany.companyName,
                    headerCompanyAddress: selectedCompany.companyAddress,
                    headerPhone: selectedCompany.companyPhone || "",
                    bankName: selectedCompany.bankName,
                    beneficiaryName: selectedCompany.beneficiaryName,
                    swiftBic: selectedCompany.swiftBic,
                    bankAddress: selectedCompany.bankAddress,
                    accountNumber: selectedCompany.accountNumber,
                    stampText: selectedCompany.signatureText || "Authorized Signatory",
                  }));
                  toast.success("Company data loaded. You can now edit all fields.");
                  setShowCompanyModal(false);
                }
              }}
              disabled={!selectedCompany}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Load Template
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading packing list...</div>
      </div>
    );
  }

  // If no packing list exists, show initialization screen
  if (!packingList) {
    return (
      <div className="p-6">

        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold mb-2">Initialize Packing List</h2>
          <p className="text-gray-600 mb-6">
            No packing list found for container <strong>{containerCode}</strong>
            . Start with a company template or create from scratch.
          </p>

          <div className="mb-6">
            <h3 className="font-semibold mb-2">Available Company Templates</h3>
            {availableCompanies.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableCompanies.map((company) => (
                  <div key={company.id} className="p-3 border rounded">
                    <div className="font-medium">{company.companyName}</div>
                    <div className="text-sm text-gray-600">
                      {company.bankName}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-yellow-600 bg-yellow-50 p-3 rounded border border-yellow-200">
                No company templates found. You can create one in Company Master.
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowCompanyModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Use Template
            </button>
            <button
              onClick={() => {
                // Create empty packing list
                setPackingList({
                  containerCode,
                  invNo: `PL-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
                  status: "DRAFT",
                });
                toast.success("Created new packing list. You can now edit all fields.");
              }}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Create from Scratch
            </button>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Go Back
            </button>
          </div>
        </div>

        {showCompanyModal && <CompanySelectionModal />}
      </div>
    );
  }

  // Main packing list editor UI
  return (
    <div className="p-6 min-h-screen bg-gradient-to-b from-white to-slate-50">

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Packing List Editor
              </h1>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-gray-600">
                  Container: <strong>{containerCode}</strong>
                </span>
                <span className="text-gray-600">
                  Invoice No: <strong>{formData.invoiceNo || "Not Set"}</strong>
                </span>
                <span className="text-gray-600">
                  Status:{" "}
                  <span
                    className={`font-semibold ${
                      formData.status === "CONFIRMED"
                        ? "text-green-600"
                        : formData.status === "PRINTED"
                        ? "text-blue-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {formData.status}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="px-3 py-2 border border-gray-300 rounded inline-flex items-center gap-2 hover:bg-gray-50"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
            <button
              onClick={savePackingList}
              disabled={isSaving}
              className="px-4 py-2 bg-emerald-600 text-white rounded inline-flex items-center gap-2 hover:bg-emerald-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={openPreview}
              className="px-4 py-2 bg-slate-800 text-white rounded inline-flex items-center gap-2 hover:bg-slate-900"
            >
              <Eye className="w-4 h-4" /> Preview
            </button>
            <button
              onClick={printPreview}
              className="px-4 py-2 bg-blue-600 text-white rounded inline-flex items-center gap-2 hover:bg-blue-700"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </div>

        {/* Advanced Settings Panel */}
        {showAdvancedSettings && (
          <div className="bg-white rounded-lg border p-4 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-800">Advanced Settings</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stamp Position
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFormData({...formData, stampPosition: "BOTTOM_LEFT"})}
                    className={`flex-1 p-2 border rounded flex items-center justify-center gap-2 ${
                      formData.stampPosition === "BOTTOM_LEFT" 
                        ? "border-blue-500 bg-blue-50" 
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <AlignLeft className="w-4 h-4" />
                    Left
                  </button>
                  <button
                    onClick={() => setFormData({...formData, stampPosition: "BOTTOM_CENTER"})}
                    className={`flex-1 p-2 border rounded flex items-center justify-center gap-2 ${
                      formData.stampPosition === "BOTTOM_CENTER" 
                        ? "border-blue-500 bg-blue-50" 
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <AlignCenter className="w-4 h-4" />
                    Center
                  </button>
                  <button
                    onClick={() => setFormData({...formData, stampPosition: "BOTTOM_RIGHT"})}
                    className={`flex-1 p-2 border rounded flex items-center justify-center gap-2 ${
                      formData.stampPosition === "BOTTOM_RIGHT" 
                        ? "border-blue-500 bg-blue-50" 
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <AlignRight className="w-4 h-4" />
                    Right
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Table Columns
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.showMixColumn}
                      onChange={(e) => setFormData({...formData, showMixColumn: e.target.checked})}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Show MIX Column</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.showHsnColumn}
                      onChange={(e) => setFormData({...formData, showHsnColumn: e.target.checked})}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Show HSN Column</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stamp/Signature
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={formData.stampText}
                    onChange={(e) => setFormData({...formData, stampText: e.target.value})}
                    className="w-full p-2 border rounded text-sm"
                    placeholder="Authorized Signatory"
                  />
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleStampUpload}
                        className="w-full text-sm"
                      />
                    </div>
                    {formData.stampImage && (
                      <img
                        src={formData.stampImage}
                        alt="Stamp"
                        className="w-10 h-10 object-contain border rounded"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header Company Information */}
        <div className="bg-white rounded-lg border p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Building className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Header Company Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                value={formData.headerCompanyName}
                onChange={(e) => setFormData({...formData, headerCompanyName: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded text-sm"
                placeholder="YIWU ZHOULAI TRADING CO., LIMITED"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="text"
                value={formData.headerPhone}
                onChange={(e) => setFormData({...formData, headerPhone: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded text-sm"
                placeholder="13735751445"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Address *
              </label>
              <textarea
                value={formData.headerCompanyAddress}
                onChange={(e) => setFormData({...formData, headerCompanyAddress: e.target.value})}
                rows={2}
                className="w-full p-2 border border-gray-300 rounded text-sm"
                placeholder="Add.: Room 801, Unit 3, Building 1, Jiuheyuan, Jiangdong Street, Yiwu City, Jinhua City, Zhejiang Province"
              />
            </div>
          </div>
        </div>

        {/* Seller Information */}
        <div className="bg-white rounded-lg border p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-gray-800">Seller Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                value={formData.sellerCompanyName}
                onChange={(e) => setFormData({...formData, sellerCompanyName: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded text-sm"
                placeholder="IMPEXINA GLOBAL PVT LTD"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IEC No.
              </label>
              <input
                type="text"
                value={formData.sellerIecNo}
                onChange={(e) => setFormData({...formData, sellerIecNo: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GST No. *
              </label>
              <input
                type="text"
                value={formData.sellerGst}
                onChange={(e) => setFormData({...formData, sellerGst: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded text-sm"
                placeholder="27AAHCI1462J1ZG"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seller Address *
              </label>
              <textarea
                value={formData.sellerAddress}
                onChange={(e) => setFormData({...formData, sellerAddress: e.target.value})}
                rows={2}
                className="w-full p-2 border border-gray-300 rounded text-sm"
                placeholder="Ground Floor, C-5, Gami Industrial Park Pawane, MIDC Road NAVI MUMBAI, THANE, Maharashtra, 400705"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.sellerEmail}
                onChange={(e) => setFormData({...formData, sellerEmail: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>
        </div>

        {/* Invoice Information */}
        <div className="bg-white rounded-lg border p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-800">Invoice Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice No.
              </label>
              <input
                type="text"
                value={formData.invoiceNo}
                onChange={(e) => setFormData({...formData, invoiceNo: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded text-sm"
                placeholder="IGPLEV86"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From
              </label>
              <input
                type="text"
                value={formData.from}
                onChange={(e) => setFormData({...formData, from: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To
              </label>
              <input
                type="text"
                value={formData.to}
                onChange={(e) => setFormData({...formData, to: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                LR No.
              </label>
              <input
                type="text"
                value={formData.lrNo}
                onChange={(e) => setFormData({...formData, lrNo: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded text-sm"
              >
                <option value="DRAFT">Draft</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PRINTED">Printed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-white rounded-lg border p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Banknote className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-gray-800">Bank Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Beneficiary's Bank Name
              </label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded text-sm"
                placeholder="ZHEJIANG TAILONG COMMERCIAL BANK"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Beneficiary Name
              </label>
              <input
                type="text"
                value={formData.beneficiaryName}
                onChange={(e) => setFormData({...formData, beneficiaryName: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded text-sm"
                placeholder="YIWU ZHOULAI TRADING CO.,LIMITED"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SWIFT BIC
              </label>
              <input
                type="text"
                value={formData.swiftBic}
                onChange={(e) => setFormData({...formData, swiftBic: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded text-sm"
                placeholder="ZJTLCNBHXXX"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Number
              </label>
              <input
                type="text"
                value={formData.accountNumber}
                onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded text-sm"
                placeholder="33080020201000155179"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Address
              </label>
              <textarea
                value={formData.bankAddress}
                onChange={(e) => setFormData({...formData, bankAddress: e.target.value})}
                rows={2}
                className="w-full p-2 border border-gray-300 rounded text-sm"
                placeholder="ROOM 801, UNIT 3, BUILDING 1, JIUHEYUAN, JIANGDONG STREET, YIWU CITY, JINHUA CITY, ZHEJIANG PROVINCE"
              />
            </div>
          </div>
        </div>

        {/* Totals Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Package className="w-4 h-4 text-yellow-700" />
              <span className="text-xs font-semibold text-yellow-800">
                TOTAL CTN
              </span>
            </div>
            <div className="text-2xl font-bold text-yellow-900">
              {totals.ctn}
            </div>
            <div className="text-xs text-yellow-600 mt-1">Cartons</div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Weight className="w-4 h-4 text-blue-700" />
              <span className="text-xs font-semibold text-blue-800">
                TOTAL WEIGHT
              </span>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {totals.tKg.toFixed(2)}
            </div>
            <div className="text-xs text-blue-600 mt-1">Kilograms</div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Package className="w-4 h-4 text-slate-700" />
              <span className="text-xs font-semibold text-slate-800">
                TOTAL QUANTITY
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {totals.tQty}
            </div>
            <div className="text-xs text-slate-600 mt-1">Units</div>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-lg border overflow-hidden mb-6">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Items List</h3>
            <div className="flex gap-2">
              <button
                onClick={addRow}
                className="px-3 py-1.5 bg-amber-600 text-white rounded inline-flex items-center gap-2 text-sm hover:bg-amber-700"
              >
                <Plus className="w-4 h-4" /> Add Row
              </button>
              <button
                onClick={() => setShowCompanyModal(true)}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50"
              >
                Load Template
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50 text-xs text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-medium">S.N.</th>
                  <th className="px-3 py-2 font-medium">Item Number</th>
                  <th className="px-3 py-2 font-medium">Photo</th>
                  <th className="px-3 py-2 font-medium">Descriptions</th>
                  <th className="px-3 py-2 font-medium">Ctn.</th>
                  <th className="px-3 py-2 font-medium">Qty./Ctn</th>
                  <th className="px-3 py-2 font-medium">Unit</th>
                  <th className="px-3 py-2 font-medium">T-QTY</th>
                  <th className="px-3 py-2 font-medium">KG</th>
                  <th className="px-3 py-2 font-medium">T.KG</th>
                  {formData.showMixColumn && (
                    <th className="px-3 py-2 font-medium">MIX</th>
                  )}
                  {formData.showHsnColumn && (
                    <th className="px-3 py-2 font-medium">HSN</th>
                  )}
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm text-center">{idx + 1}</td>
                    <td className="px-3 py-2">
                      <input
                        value={item.itemNumber}
                        onChange={(e) =>
                          updateRow(item.id, "itemNumber", e.target.value)
                        }
                        className="w-32 p-1 border rounded text-sm"
                        placeholder="Item No."
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {item.photo ? (
                          <img
                            src={item.photo}
                            alt="thumb"
                            className="w-12 h-8 object-cover rounded border"
                          />
                        ) : (
                          <div className="w-12 h-8 border rounded flex items-center justify-center text-slate-400">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handlePhotoUpload(e, item.id)}
                            className="hidden"
                          />
                          <div className="text-xs text-blue-600 hover:text-blue-800">
                            Upload
                          </div>
                        </label>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={item.particular}
                        onChange={(e) =>
                          updateRow(item.id, "particular", e.target.value)
                        }
                        className="w-60 p-1 border rounded text-sm"
                        placeholder="Description"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={item.ctn}
                        onChange={(e) =>
                          updateRow(item.id, "ctn", e.target.value)
                        }
                        className="w-20 p-1 border rounded text-sm text-right bg-yellow-50"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={item.qtyPerCtn}
                        onChange={(e) =>
                          updateRow(item.id, "qtyPerCtn", e.target.value)
                        }
                        className="w-20 p-1 border rounded text-sm text-right"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={item.unit}
                        onChange={(e) =>
                          updateRow(item.id, "unit", e.target.value)
                        }
                        className="w-20 p-1 border rounded text-sm"
                      />
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-medium">
                      {item.tQty}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={item.kg}
                        onChange={(e) =>
                          updateRow(item.id, "kg", e.target.value)
                        }
                        className="w-20 p-1 border rounded text-sm text-right"
                      />
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-medium bg-blue-50">
                      {item.tKg.toFixed(2)}
                    </td>
                    {formData.showMixColumn && (
                      <td className="px-3 py-2">
                        <input
                          value={item.mix}
                          onChange={(e) =>
                            updateRow(item.id, "mix", e.target.value)
                          }
                          className="w-24 p-1 border rounded text-sm"
                          placeholder="Mix"
                        />
                      </td>
                    )}
                    {formData.showHsnColumn && (
                      <td className="px-3 py-2">
                        <input
                          value={item.hsn}
                          onChange={(e) =>
                            updateRow(item.id, "hsn", e.target.value)
                          }
                          className="w-24 p-1 border rounded text-sm"
                          placeholder="HSN Code"
                        />
                      </td>
                    )}
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        <button
                          onClick={() => duplicateRow(item.id)}
                          className="p-1 text-slate-600 hover:text-slate-800"
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => insertRowAfter(item.id)}
                          className="p-1 text-slate-600 hover:text-slate-800"
                          title="Insert Below"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeRow(item.id)}
                          className="p-1 text-rose-600 hover:text-rose-800"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50">
                <tr>
                  <td
                    colSpan="4"
                    className="px-3 py-2 font-semibold text-center"
                  >
                    TOTAL
                  </td>
                  <td className="px-3 py-2 text-right font-semibold bg-yellow-100">
                    {totals.ctn}
                  </td>
                  <td className="px-3 py-2"></td>
                  <td className="px-3 py-2"></td>
                  <td className="px-3 py-2 text-right font-semibold">
                    {totals.tQty}
                  </td>
                  <td className="px-3 py-2"></td>
                  <td className="px-3 py-2 text-right font-semibold bg-blue-100">
                    {totals.tKg.toFixed(2)}
                  </td>
                  {formData.showMixColumn && <td className="px-3 py-2"></td>}
                  {formData.showHsnColumn && <td className="px-3 py-2"></td>}
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Activity Log */}
        <div className="bg-white rounded-lg border p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-800">Activity Log</h3>
          </div>
          
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {activities.length > 0 ? (
              activities.map((activity) => (
                <div key={activity.id} className="p-3 border rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-sm">{activity.type}</div>
                      <div className="text-xs text-gray-600">{activity.note}</div>
                      {activity.field && (
                        <div className="text-xs text-gray-500 mt-1">
                          Field: {activity.field} | 
                          Old: {activity.oldValue || 'N/A'} → 
                          New: {activity.newValue || 'N/A'}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">
                        {new Date(activity.createdAt).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600">
                        By: {activity.user?.name || 'System'}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                No activities recorded yet
              </div>
            )}
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Last updated:{" "}
            {packingList.updatedAt
              ? new Date(packingList.updatedAt).toLocaleString()
              : "Never"}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={savePackingList}
              disabled={isSaving}
              className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      {showCompanyModal && <CompanySelectionModal />}

      {/* Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-md shadow-xl w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-3 border-b">
              <div className="font-semibold text-sm">
                Packing List — Preview
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={printPreview}
                  className="px-3 py-1 rounded bg-sky-600 text-white inline-flex items-center gap-2 text-xs"
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button
                  onClick={() => {
                    const html = previewHtml || buildPrintableHTML();
                    const w = window.open("", "_blank", "noopener,noreferrer");
                    if (!w) return toast.error("Popup blocked");
                    w.document.open();
                    w.document.write(html);
                    w.document.close();
                  }}
                  className="px-3 py-1 rounded bg-slate-800 text-white inline-flex items-center gap-2 text-xs"
                >
                  <Download className="w-4 h-4" /> Open
                </button>
                <button
                  onClick={() => setPreviewOpen(false)}
                  className="px-3 py-1 rounded bg-slate-100 text-xs"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <iframe
                title="packing-preview"
                srcDoc={previewHtml || buildPrintableHTML()}
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}