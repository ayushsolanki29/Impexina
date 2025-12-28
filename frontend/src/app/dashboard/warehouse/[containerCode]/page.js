"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import API from "@/lib/api";

// Components
import Header from "./_components/Header";
import SummaryCards from "./_components/SummaryCards";
import MarkRow from "./_components/MarkRow";
import ActivitiesList from "./_components/ActivitiesList";
import AddMarkForm from "./_components/AddMarkForm";

export default function WarehousePlanPage() {
  const router = useRouter();
  const params = useParams();
  const containerCode = params?.containerCode;

  // State
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [warehousePlan, setWarehousePlan] = useState(null);
  const [activities, setActivities] = useState([]);
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [transporterFilter, setTransporterFilter] = useState("all");
  const [uniqueTransporters, setUniqueTransporters] = useState([]);
  const [uploadingExcel, setUploadingExcel] = useState(false);

  const [newItem, setNewItem] = useState({
    mark: "",
    ctn: "",
    product: "",
    totalCBM: "",
    totalWeight: "",
    loadingDate: new Date().toLocaleDateString("en-GB").replace(/\//g, "-"),
    deliveryDate: "",
    invNo: "",
    gst: "",
    transporter: "",
    status: "pending",
  });

  // Load warehouse plan data
  const loadWarehousePlan = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/warehouse/${containerCode}`);
      
      if (response.data?.success) {
        setWarehousePlan(response.data.data);
        setItems(response.data.data.marks || []);
        setActivities(response.data.data.activities || []);
        
        // Extract unique transporters from marks
        const transporters = [...new Set(
          response.data.data.marks
            ?.map(mark => mark.transporter)
            .filter(Boolean)
        )].sort();
        setUniqueTransporters(transporters);
      }
    } catch (error) {
      console.error("Error loading warehouse plan:", error);
      if (error.response?.status === 404) {
        toast.info("Warehouse plan not found. Click 'Initialize Plan' to create one.");
      } else {
        toast.error("Failed to load warehouse plan");
      }
    } finally {
      setLoading(false);
    }
  };

  // Initialize warehouse plan
  const initializeWarehousePlan = async () => {
    try {
      setInitializing(true);
      const response = await API.post(`/warehouse/initialize/${containerCode}`);
      if (response.data?.success) {
        toast.success("Warehouse plan initialized successfully");
        await loadWarehousePlan();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to initialize warehouse plan");
    } finally {
      setInitializing(false);
    }
  };

  // Check data sources
  const hasWarehousePlan = !!warehousePlan;

  // Current items
  const currentItems = hasWarehousePlan ? items : [];

  // Filter items
  const filteredItems = useMemo(() => {
    let result = currentItems;

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((item) => item.status === statusFilter);
    }

    // Transporter filter
    if (transporterFilter !== "all") {
      result = result.filter((item) => item.transporter === transporterFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.mark?.toLowerCase().includes(query) ||
          item.product?.toLowerCase().includes(query) ||
          item.transporter?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [currentItems, searchQuery, statusFilter, transporterFilter]);

  // Calculate totals
  const totals = useMemo(() => {
    return filteredItems.reduce(
      (acc, item) => ({
        totalCTN: acc.totalCTN + (item.ctn || 0),
        totalCBM: acc.totalCBM + (item.totalCBM || 0),
        totalWeight: acc.totalWeight + (item.totalWeight || 0),
        itemsWithDelivery: acc.itemsWithDelivery + (item.deliveryDate ? 1 : 0),
        itemsWithInvoice: acc.itemsWithInvoice + (item.invNo ? 1 : 0),
        itemsWithTransporter: acc.itemsWithTransporter + (item.transporter ? 1 : 0),
        completedItems: acc.completedItems + (item.status === "COMPLETED" ? 1 : 0),
        totalMarks: filteredItems.length,
      }),
      {
        totalCTN: 0,
        totalCBM: 0,
        totalWeight: 0,
        itemsWithDelivery: 0,
        itemsWithInvoice: 0,
        itemsWithTransporter: 0,
        completedItems: 0,
        totalMarks: 0,
      }
    );
  }, [filteredItems]);

  // Initialize
  useEffect(() => {
    if (containerCode) {
      loadWarehousePlan();
    }
  }, [containerCode]);

  // Add new mark
  const handleAddMark = async () => {
    if (!newItem.mark) {
      toast.error("Mark is required");
      return;
    }

    try {
      const response = await API.post(`/warehouse/${containerCode}/marks`, {
        mark: newItem.mark,
        ctn: newItem.ctn,
        product: newItem.product,
        totalCBM: newItem.totalCBM,
        totalWeight: newItem.totalWeight,
        loadingDate: newItem.loadingDate,
        deliveryDate: newItem.deliveryDate,
        invNo: newItem.invNo,
        gst: newItem.gst,
        transporter: newItem.transporter,
        status: newItem.status,
      });

      if (response.data?.success) {
        setItems([...items, response.data.data]);
        setNewItem({
          mark: "",
          ctn: "",
          product: "",
          totalCBM: "",
          totalWeight: "",
          loadingDate: new Date().toLocaleDateString("en-GB").replace(/\//g, "-"),
          deliveryDate: "",
          invNo: "",
          gst: "",
          transporter: "",
          status: "pending",
        });
        setShowAddForm(false);
        toast.success("Mark added successfully");
        loadWarehousePlan(); // Refresh data
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add mark");
    }
  };

  // Update mark
  const handleUpdateMark = async (markId, data) => {
    try {
      const response = await API.patch(
        `/warehouse/${containerCode}/marks/${markId}`,
        data
      );

      if (response.data?.success) {
        setItems(items.map((item) =>
          item._id === markId ? { ...item, ...data } : item
        ));
        toast.success("Mark updated successfully");
        loadWarehousePlan(); // Refresh data
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update mark");
    }
  };

  // Delete mark
  const handleDeleteMark = async (markId) => {
    if (window.confirm("Are you sure you want to delete this mark?")) {
      try {
        const response = await API.delete(
          `/warehouse/${containerCode}/marks/${markId}`
        );

        if (response.data?.success) {
          setItems(items.filter((item) => item._id !== markId));
          toast.success("Mark deleted successfully");
          loadWarehousePlan(); // Refresh data
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to delete mark");
      }
    }
  };

  // Export to Excel
  const exportToExcel = async () => {
    try {
      const response = await API.get(
        `/warehouse/${containerCode}/export/excel`,
        { responseType: 'blob' }
      );
      
      // Create blob from response
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${containerCode}_warehouse_plan_${new Date().toISOString().split("T")[0]}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success("Excel file downloaded");
    } catch (error) {
      console.error("Export error:", error);
      // Fallback to client-side export
      toast.info("Using fallback export method");
      
      const worksheet = XLSX.utils.json_to_sheet(
        filteredItems.map((item) => ({
          "CONTAINER CODE": containerCode,
          "MARK": item.mark,
          "CTN": item.ctn,
          "PRODUCT": item.product || "-",
          "TOTAL CBM": item.totalCBM?.toFixed(3) || "-",
          "TOTAL WEIGHT": item.totalWeight || "-",
          "LOADING DATE": item.loadingDate,
          "DELIVERY DATE": item.deliveryDate || "-",
          "INV NO.": item.invNo || "-",
          "GST": item.gst || "-",
          "TRANSPORTER": item.transporter || "-",
          "STATUS": item.status,
        }))
      );

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Warehouse Plan");

      // Add summary sheet
      const summaryData = [
        {
          CONTAINER: containerCode,
          "TOTAL MARKS": totals.totalMarks,
          "TOTAL CTN": totals.totalCTN,
          "TOTAL CBM": totals.totalCBM.toFixed(3),
          "TOTAL WEIGHT": totals.totalWeight,
          "WITH DELIVERY": totals.itemsWithDelivery,
          "WITH INVOICE": totals.itemsWithInvoice,
          "WITH TRANSPORTER": totals.itemsWithTransporter,
          "COMPLETED MARKS": totals.completedItems,
          "GENERATED DATE": new Date().toLocaleDateString(),
        },
      ];

      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

      XLSX.writeFile(
        workbook,
        `${containerCode}_warehouse_plan_${new Date().toISOString().split("T")[0]}.xlsx`
      );
    }
  };

  // Import from Excel
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploadingExcel(true);
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await API.post(
        `/warehouse/${containerCode}/import`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data?.success) {
        toast.success("Excel imported successfully");
        await loadWarehousePlan();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to import Excel");
    } finally {
      setUploadingExcel(false);
      event.target.value = ""; // Reset file input
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setTransporterFilter("all");
  };

  // Refresh data
  const refreshData = async () => {
    await loadWarehousePlan();
    toast.success("Data refreshed");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        containerCode={containerCode}
        status={warehousePlan?.status || "DRAFT"}
        onBack={() => router.push("/dashboard/warehouse")}
        onRefresh={refreshData}
        onExport={exportToExcel}
        hasWarehousePlan={hasWarehousePlan}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Warning for no warehouse plan */}
        {!hasWarehousePlan && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-800">
                  No Warehouse Plan Found
                </h3>
                <p className="text-blue-700 text-sm">
                  Initialize warehouse plan to start tracking marks
                </p>
              </div>
              <button
                onClick={initializeWarehousePlan}
                disabled={initializing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {initializing ? "Initializing..." : "Initialize Plan"}
              </button>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <SummaryCards totals={totals} containerDetails={warehousePlan} />

        {/* File Upload Button */}
        {hasWarehousePlan && (
          <div className="mb-4">
            <label className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded w-fit cursor-pointer">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span>{uploadingExcel ? "Uploading..." : "Import from Excel"}</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploadingExcel}
              />
            </label>
            <p className="text-xs text-gray-500 mt-1">Upload Excel file to import marks</p>
          </div>
        )}

        {/* Action Bar */}
        {hasWarehousePlan && (
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by mark, product, or transporter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border rounded-lg w-full"
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
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
                <option value="DRAFT">Draft</option>
                <option value="HOLD">Hold</option>
              </select>

              {/* Transporter Filter */}
              <select
                value={transporterFilter}
                onChange={(e) => setTransporterFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="all">All Transporters</option>
                {uniqueTransporters.map((transporter) => (
                  <option key={transporter} value={transporter}>
                    {transporter}
                  </option>
                ))}
              </select>

              {/* Clear Filters Button */}
              {(searchQuery || statusFilter !== "all" || transporterFilter !== "all") && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50"
                >
                  Clear
                </button>
              )}

              {/* Add Mark Button */}
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Mark
              </button>
            </div>
          </div>
        )}

        {/* Results Info */}
        {hasWarehousePlan && (
          <div className="mb-4 flex items-center justify-between text-sm text-gray-600">
            <div>
              Showing <span className="font-semibold">{filteredItems.length}</span>{" "}
              of <span className="font-semibold">{items.length}</span> marks
            </div>
            <div>
              {statusFilter !== "all" && `Status: ${statusFilter} `}
              {transporterFilter !== "all" && `| Transporter: ${transporterFilter}`}
            </div>
          </div>
        )}

        {/* Warehouse Plan Table */}
        {hasWarehousePlan ? (
          <div className="bg-white rounded-lg border overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mark
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
                      Transporter
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      GST
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    // Skeleton Loaders
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 11 }).map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                        No marks found matching your filters
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <MarkRow
                        key={item._id || item.id}
                        item={item}
                        onUpdate={handleUpdateMark}
                        onDelete={handleDeleteMark}
                        canEdit={hasWarehousePlan}
                      />
                    ))
                  )}

                  {/* Totals Row */}
                  {!loading && filteredItems.length > 0 && (
                    <tr className="bg-gray-50 font-semibold border-t-2 border-gray-300">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        TOTAL ({filteredItems.length} marks)
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-center">
                        {totals.totalCTN}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-center">
                        {totals.totalCBM.toFixed(3)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-center">
                        {totals.totalWeight} kg
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">-</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-center">
                        {totals.itemsWithDelivery} / {filteredItems.length}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-center">
                        {totals.itemsWithTransporter} / {filteredItems.length}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-center">
                        {totals.completedItems} / {filteredItems.length}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">-</td>
                      <td className="px-4 py-3 text-sm text-gray-900">-</td>
                      <td className="px-4 py-3 text-sm text-gray-900">-</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {/* Activities Section */}
        {hasWarehousePlan && activities.length > 0 && (
          <div className="mb-8">
            <ActivitiesList activities={activities} />
          </div>
        )}
      </main>

      {/* Add Mark Form Modal */}
      <AddMarkForm
        show={showAddForm}
        onClose={() => setShowAddForm(false)}
        newItem={newItem}
        setNewItem={setNewItem}
        onSubmit={handleAddMark}
      />
    </div>
  );
}