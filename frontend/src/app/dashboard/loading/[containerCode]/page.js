"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/api";
import ContainerHeader from "./_components/ContainerHeader";
import StatsCards from "./_components/StatsCards";
import SearchFilters from "./_components/SearchFilters";
import ClientGroupsList from "./_components/ClientGroupsList";
import PreviewModal from "./_components/PreviewModal";
import ExportModal from "./_components/ExportModal";
import EditClientModal from "./_components/EditClientModal";

export default function ContainerDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const containerCode = decodeURIComponent(params?.containerCode || "");

  // State
  const [loading, setLoading] = useState(true);
  const [containerData, setContainerData] = useState(null);
  const [containerStatus, setContainerStatus] = useState("DRAFT");

  // Filters state
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    dateFrom: "",
    dateTo: "",
    minCTN: "",
    maxCTN: "",
    minWeight: "",
    maxWeight: "",
    minCBM: "",
    maxCBM: "",
    sortBy: "client",
  });

  // UI state
  const [selectedClients, setSelectedClients] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [previewClient, setPreviewClient] = useState(null);
  const [exportType, setExportType] = useState(null);
  const [editClient, setEditClient] = useState(null);
  const [previewImages, setPreviewImages] = useState(true);

  // Load container data
  useEffect(() => {
    if (containerCode) {
      fetchContainerData();
    }
  }, [containerCode, filters]);

  const fetchContainerData = async () => {
    try {
      setLoading(true);
      const paramsObj = new URLSearchParams();

      // Add all filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          paramsObj.set(key, value);
        }
      });

      const response = await api.get(
        `/loading/containers/${encodeURIComponent(
          containerCode
        )}/details?${paramsObj}`
      );

      if (response.data.success) {
        const data = response.data.data;
        setContainerData(data);

        if (data.clientGroups.length > 0) {
          setContainerStatus(data.clientGroups[0].status || "DRAFT");
        }
      } else {
        toast.error(response.data.message || "Failed to load container data");
      }
    } catch (error) {
      console.error("Error fetching container data:", error);
      toast.error("Failed to load container data");
    } finally {
      setLoading(false);
    }
  };

  // Update container status
  const updateContainerStatus = async (newStatus) => {
    try {
       if (!["DRAFT", "CONFIRMED"].includes(newStatus)) {
        toast.error("Invalid status");
        return;
      }

      const response = await api.patch(
        `/loading/containers/${encodeURIComponent(containerCode)}/status`,
        {
          status: newStatus,
        }
      );

      if (response.data.success) {
        setContainerStatus(newStatus);
        toast.success(`Container status updated to ${newStatus}`);
        fetchContainerData();
      } else {
        toast.error(response.data.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Status update error:", error);
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: "",
      status: "",
      dateFrom: "",
      dateTo: "",
      minCTN: "",
      maxCTN: "",
      minWeight: "",
      maxWeight: "",
      minCBM: "",
      maxCBM: "",
      sortBy: "client",
    });
    setSelectedClients([]);
  };

  if (loading && !containerData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading container data...</p>
        </div>
      </div>
    );
  }

  if (!containerData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => router.push("/dashboard/loading")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            Back to Containers
          </button>
          <div className="bg-white rounded-lg shadow border p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Container Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              The container {containerCode} does not exist or has no data.
            </p>
            <button
              onClick={() => router.push("/dashboard/loading")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Containers List
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <ContainerHeader
          containerCode={containerCode}
          containerData={containerData}
          containerStatus={containerStatus}
          onBack={() => router.push("/dashboard/loading")}
          onStatusUpdate={updateContainerStatus}
          onPreviewAll={() => setPreviewClient("all")}
          onExportClick={(type) => setExportType(type)}
        />

        <StatsCards totals={containerData.overallTotals} />

        <SearchFilters
          filters={filters}
          showFilters={showFilters}
          selectedClients={selectedClients}
          clientGroups={containerData.clientGroups}
          onFilterChange={handleFilterChange}
          onToggleFilters={() => setShowFilters(!showFilters)}
          onToggleClient={(client) => {
            setSelectedClients((prev) =>
              prev.includes(client)
                ? prev.filter((c) => c !== client)
                : [...prev, client]
            );
          }}
          onToggleAllClients={() => {
            const allClients = containerData.clientGroups.map((g) => g.client);
            setSelectedClients((prev) =>
              prev.length === allClients.length ? [] : allClients
            );
          }}
          onClearFilters={clearFilters}
        />

        <div className="my-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing{" "}
            <span className="font-semibold">
              {containerData.clientGroups.length}
            </span>{" "}
            clients
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={previewImages}
              onChange={(e) => setPreviewImages(e.target.checked)}
              className="rounded border-gray-300"
            />
            Show Images
          </label>
        </div>

        <ClientGroupsList
          clientGroups={containerData.clientGroups}
          selectedClients={selectedClients}
          previewImages={previewImages}
          onPreview={setPreviewClient}
          onEdit={setEditClient}
          onCopySummary={async (clientName) => {
            try {
              const response = await api.get(
                `/loading/containers/${encodeURIComponent(
                  containerCode
                )}/clients/${clientName}/summary`
              );
              if (response.data.success) {
                await navigator.clipboard.writeText(response.data.data.summary);
                toast.success("Client summary copied to clipboard");
              }
            } catch (error) {
              toast.error("Failed to copy summary");
            }
          }}
          onShare={(clientName) => {
            const clientGroup = containerData.clientGroups.find(
              (g) => g.client === clientName
            );
            if (!clientGroup) return;

            const message = encodeURIComponent(
              `
*${containerCode} - ${clientName} Summary*

📦 Total CTN: ${clientGroup.totals.ctn}
📊 Total PCS: ${clientGroup.totals.pcs}
⚖️ Total Weight: ${clientGroup.totals.twt.toFixed(2)} kg
📏 Total CBM: ${clientGroup.totals.tcbm.toFixed(3)}
📋 Items: ${clientGroup.totals.itemCount}
📅 Loading Date: ${new Date(clientGroup.loadingDate).toLocaleDateString()}
✅ Status: ${clientGroup.status}
            `.trim()
            );

            window.open(`https://wa.me/?text=${message}`, "_blank");
          }}
        />
      </div>

      {previewClient && (
        <PreviewModal
          containerCode={containerCode}
          containerData={containerData}
          previewClient={previewClient}
          previewImages={previewImages}
          onClose={() => setPreviewClient(null)}
          onToggleImages={() => setPreviewImages(!previewImages)}
          onExport={(type) => setExportType(type)}
        />
      )}

      {exportType && (
        <ExportModal
          containerCode={containerCode}
          exportType={exportType}
          filters={filters}
          clientGroups={containerData.clientGroups}
          onClose={() => setExportType(null)}
          onExport={() => {
            // Export logic here
            setExportType(null);
          }}
        />
      )}

      {editClient && (
        <EditClientModal
          containerCode={containerCode}
          clientName={editClient}
          clientData={containerData.clientGroups.find(
            (g) => g.client === editClient
          )}
          onClose={() => setEditClient(null)}
          onSave={(updatedData) => {
            // Handle edit save
            toast.success(`${editClient} updated successfully`);
            setEditClient(null);
            fetchContainerData();
          }}
        />
      )}
    </div>
  );
}
