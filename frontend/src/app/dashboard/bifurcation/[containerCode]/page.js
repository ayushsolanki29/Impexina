"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import API from "@/lib/api";

// Components
import Header from "./_components/Header";
import SummaryCards from "./_components/SummaryCards";
import ClientRow from "./_components/ClientRow";
import ActivitiesList from "./_components/ActivitiesList";
import AddClientForm from "./_components/AddClientForm";

export default function BifurcationPage() {
  const router = useRouter();
  const params = useParams();
  const containerCode = params?.containerCode;

  // State
  const [loading, setLoading] = useState(true);
  const [bifurcationData, setBifurcationData] = useState(null);
  const [loadingSheetData, setLoadingSheetData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    clientName: "",
    ctn: "",
    product: "",
    totalCBM: "",
    totalWeight: "",
    deliveryDate: "",
    invNo: "",
    gst: "",
    from: "",
    to: "",
    lr: "",
  });

  // Load data
  const loadData = async () => {
    setLoading(true);
    try {
      // Try to get bifurcation data
      const bifurcationResponse = await API.get(
        `/bifurcation/${containerCode}`
      );

      if (bifurcationResponse.data?.success) {
        setBifurcationData(bifurcationResponse.data.data);
        setItems(bifurcationResponse.data.data.data.clients || []);
        setActivities(bifurcationResponse.data.data.activities || []);
      } else {
        // Load loading sheet data as fallback
        await loadLoadingSheetData();
      }
    } catch (error) {
      console.error("Error loading data:", error);
      await loadLoadingSheetData();
    } finally {
      setLoading(false);
    }
  };

  // Load loading sheet data
  const loadLoadingSheetData = async () => {
    try {
      const response = await API.get(
        `/loading/containers/${containerCode}/details`
      );
      if (response.data?.success) {
        setLoadingSheetData(response.data.data);
      }
    } catch (error) {
      toast.error("Failed to load container data");
    }
  };

  // Initialize bifurcation
  const initializeBifurcation = async () => {
    try {
      const response = await API.post(
        `/bifurcation/initialize/${containerCode}`
      );
      if (response.data?.success) {
        toast.success("Bifurcation initialized");
        loadData();
      }
    } catch (error) {
      toast.error("Failed to initialize bifurcation");
    }
  };

  // Check data sources
  const hasBifurcationData = !!bifurcationData;
  const hasLoadingSheetData = !!loadingSheetData;

  // Process loading sheet data
  const processLoadingSheetData = useMemo(() => {
    if (!loadingSheetData?.clientGroups) return [];
    return loadingSheetData.clientGroups.map((clientGroup) => ({
      id: `loading-${clientGroup.client}`,
      clientName: clientGroup.client,
      ctn: clientGroup.totals?.ctn || 0,
      product: "MIX ITEM",
      totalCBM: clientGroup.totals?.tcbm || 0,
      totalWeight: clientGroup.totals?.twt || 0,
      loadingDate: clientGroup.loadingDate,
      deliveryDate: "",
      invNo: "",
      gst: "",
      from: "",
      to: "",
      lr: "",
      fromLoadingSheet: true,
    }));
  }, [loadingSheetData]);

  // Current items
  const currentItems = hasBifurcationData ? items : processLoadingSheetData;

  // Filter items
  const filteredItems = useMemo(() => {
    if (!searchQuery) return currentItems;
    const query = searchQuery.toLowerCase();
    return currentItems.filter(
      (item) =>
        item.clientName?.toLowerCase().includes(query) ||
        item.product?.toLowerCase().includes(query) ||
        item.invNo?.toLowerCase().includes(query)
    );
  }, [currentItems, searchQuery]);

  // Calculate totals
  const totals = useMemo(() => {
    return filteredItems.reduce(
      (acc, item) => ({
        clientCount: acc.clientCount + 1,
        totalCTN: acc.totalCTN + (item.ctn || 0),
        totalCBM: acc.totalCBM + (item.totalCBM || 0),
        totalWeight: acc.totalWeight + (item.totalWeight || 0),
        itemsWithDelivery: acc.itemsWithDelivery + (item.deliveryDate ? 1 : 0),
        itemsWithInvoice: acc.itemsWithInvoice + (item.invNo ? 1 : 0),
        itemsWithLR: acc.itemsWithLR + (item.lr ? 1 : 0),
      }),
      {
        clientCount: 0,
        totalCTN: 0,
        totalCBM: 0,
        totalWeight: 0,
        itemsWithDelivery: 0,
        itemsWithInvoice: 0,
        itemsWithLR: 0,
      }
    );
  }, [filteredItems]);

  // Initialize
  useEffect(() => {
    if (containerCode) {
      loadData();
    }
  }, [containerCode]);

  // Edit functions
  const startEdit = (item) => {
    if (!hasBifurcationData) {
      toast.error("Initialize bifurcation first");
      return;
    }
    setEditingId(item.id);
    setEditForm({
      deliveryDate: item.deliveryDate || "",
      invNo: item.invNo || "",
      gst: item.gst || "",
      from: item.from || "",
      to: item.to || "",
      lr: item.lr || "",
    });
  };

  const saveEdit = async () => {
    try {
      const client = items.find((item) => item.id === editingId);
      if (!client) return;

      const response = await API.patch(
        `/bifurcation/${containerCode}/clients/${client.clientName}`,
        editForm
      );

      if (response.data?.success) {
        setItems(
          items.map((item) =>
            item.id === editingId ? { ...item, ...editForm } : item
          )
        );
        setEditingId(null);
        toast.success("Updated successfully");
        loadData(); // Refresh to get updated activities
      }
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  // Add new client
  const handleAddClient = async () => {
    try {
      const response = await API.post(`/bifurcation/${containerCode}/clients`, {
        clientName: newItem.clientName,
        mark: newItem.clientName,
        ctn: newItem.ctn,
        product: newItem.product,
        totalCBM: newItem.totalCBM,
        totalWeight: newItem.totalWeight,
        deliveryDate: newItem.deliveryDate,
        invNo: newItem.invNo,
        gst: newItem.gst,
        from: newItem.from,
        to: newItem.to,
        lr: newItem.lr,
      });

      if (response.data?.success) {
        setItems([...items, response.data.data]);
        setNewItem({
          clientName: "",
          ctn: "",
          product: "",
          totalCBM: "",
          totalWeight: "",
          deliveryDate: "",
          invNo: "",
          gst: "",
          from: "",
          to: "",
          lr: "",
        });
        setShowAddForm(false);
        toast.success("Client added");
        loadData(); // Refresh activities
      }
    } catch (error) {
      toast.error("Failed to add client");
    }
  };

  // Delete client
  const handleDelete = async (item) => {
    if (window.confirm(`Delete ${item.clientName}?`)) {
      try {
        const response = await API.delete(
          `/bifurcation/${containerCode}/clients/${item.id}`
        );
        if (response.data?.success) {
          setItems(items.filter((i) => i.id !== item.id));
          toast.success("Client deleted");
          loadData(); // Refresh activities
        }
      } catch (error) {
        toast.error("Failed to delete");
      }
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredItems.map((item) => ({
        Client: item.clientName,
        CTN: item.ctn,
        Product: item.product,
        CBM: item.totalCBM,
        Weight: item.totalWeight,
        "Delivery Date": item.deliveryDate,
        "Invoice No.": item.invNo,
        GST: item.gst,
        From: item.from,
        To: item.to,
        LR: item.lr,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bifurcation");
    XLSX.writeFile(workbook, `${containerCode}_bifurcation.xlsx`);
    toast.success("Exported successfully");
  };

  // Container details
  const containerDetails = bifurcationData || loadingSheetData?.container;
  const containerStatus = bifurcationData?.status || "LOADING_SHEET";

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        containerCode={containerCode}
        status={bifurcationData?.status || "DRAFT"}
        onBack={() => router.push("/dashboard/loading")}
        onRefresh={loadData}
        onExport={exportToExcel}
        hasBifurcationData={hasBifurcationData}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Warning for loading sheet data */}
        {!hasBifurcationData && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-800">
                  Loading Sheet Data
                </h3>
                <p className="text-blue-700 text-sm">
                  Initialize bifurcation to edit data
                </p>
              </div>
              <button
                onClick={initializeBifurcation}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Initialize Bifurcation
              </button>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <SummaryCards totals={totals} containerDetails={containerDetails} />

        {/* Action Bar */}
        <div className="mb-6 flex items-center justify-between">
          <div className="relative">
            <input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg w-64"
            />
            <svg
              className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          {hasBifurcationData && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Client
            </button>
          )}
        </div>

        {/* Bifurcation Table */}
        <div className="bg-white rounded-lg border overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CTN
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CBM
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weight
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loading Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivery & Invoice
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    From / To
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    LR Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GST
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              {filteredItems.map((item) => (
                <ClientRow
                  key={item.id || item.clientName}
                  item={item}
                  onSave={(id, data) => {
                    // Handle save logic
                    const client = items.find((i) => i.id === id);
                    if (client) {
                      const updatedItems = items.map((i) =>
                        i.id === id ? { ...i, ...data } : i
                      );
                      setItems(updatedItems);
                      // Call API to save
                      saveToAPI(id, data);
                    }
                  }}
                  onDelete={handleDelete}
                  canEdit={hasBifurcationData}
                />
              ))}
            </table>
          </div>
        </div>

        {/* Activities Section */}
        <div className="mb-8">
          <ActivitiesList activities={activities} />
        </div>
      </main>

      {/* Add Client Form Modal */}
      <AddClientForm
        show={showAddForm}
        onClose={() => setShowAddForm(false)}
        newItem={newItem}
        setNewItem={setNewItem}
        onSubmit={handleAddClient}
      />
    </div>
  );
}
