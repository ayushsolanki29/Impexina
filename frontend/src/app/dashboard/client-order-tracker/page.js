"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3,
  FileSpreadsheet,
  Copy,
  Tag,
  Calendar,
  Hash,
  User,
  PackagePlus,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import API from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function OrderTracker() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [shippingCodeFilter, setShippingCodeFilter] = useState("ALL");
  const [supplierFilter, setSupplierFilter] = useState("ALL");
  const [stats, setStats] = useState({
    totalOrders: 0,
    statusCounts: {
      loaded: 0,
      inTransit: 0,
      arrived: 0,
      delivered: 0,
      pending: 0
    },
    totals: {
      quantity: 0,
      ctn: 0,
      amount: 0
    }
  });
  const [shippingCodes, setShippingCodes] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkData, setBulkData] = useState("");
  const [importing, setImporting] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 1,
  });

  // Load orders
  const loadOrders = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 50,
        search,
        ...(statusFilter !== "ALL" && { status: statusFilter }),
        ...(shippingCodeFilter !== "ALL" && { shippingCode: shippingCodeFilter }),
        ...(supplierFilter !== "ALL" && { supplier: supplierFilter }),
      };

      const response = await API.get("/client-order-tracker", { params });

      if (response.data.success) {
        setOrders(response.data.data.orders || []);
        setPagination(response.data.data.pagination || {
          page: 1,
          limit: 50,
          total: 0,
          pages: 1,
        });
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      toast.error(error.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  // Load stats
  const loadStats = async () => {
    try {
      const response = await API.get("/client-order-tracker/stats");
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  // Load unique shipping codes and suppliers
  const loadFilters = async () => {
    try {
      const response = await API.get("/client-order-tracker?limit=1000");
      if (response.data.success && response.data.data.orders) {
        const orders = response.data.data.orders;
        
        // Extract unique shipping codes
        const codes = [...new Set(orders.map(o => o.shippingCode).filter(Boolean))];
        setShippingCodes(codes);
        
        // Extract unique suppliers
        const suppliers = [...new Set(orders.map(o => o.supplier).filter(Boolean))];
        setSuppliers(suppliers);
      }
    } catch (error) {
      console.error("Error loading filters:", error);
    }
  };

  useEffect(() => {
    loadOrders();
    loadStats();
    loadFilters();
  }, [search, statusFilter, shippingCodeFilter, supplierFilter]);

  // Delete order
  const deleteOrder = async (orderId) => {
    if (!confirm("Are you sure you want to delete this order?")) {
      return;
    }

    try {
      const response = await API.delete(`/client-order-tracker/${orderId}`);
      if (response.data.success) {
        toast.success(response.data.message || "Order deleted successfully");
        loadOrders();
        loadStats();
        loadFilters();
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error(error.message || "Failed to delete order");
    }
  };

  // Update status
  const updateStatus = async (orderId, newStatus) => {
    try {
      const response = await API.post(`/client-order-tracker/${orderId}/status`, {
        status: newStatus
      });
      
      if (response.data.success) {
        toast.success("Order status updated");
        loadOrders();
        loadStats();
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(error.message || "Failed to update status");
    }
  };

  // Copy shipping mark
  const copyShippingMark = (shippingMark) => {
    navigator.clipboard.writeText(shippingMark);
    toast.success("Shipping mark copied to clipboard");
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "LOADED":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Package className="w-3 h-3 mr-1" />
            Loaded
          </Badge>
        );
      case "IN_TRANSIT":
        return (
          <Badge className="bg-purple-100 text-purple-800 border-purple-200">
            <Truck className="w-3 h-3 mr-1" />
            In Transit
          </Badge>
        );
      case "ARRIVED":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Arrived
          </Badge>
        );
      case "DELIVERED":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Delivered
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format date display
  const formatDateDisplay = (dateString) => {
    if (!dateString) return "-";
    if (typeof dateString === 'string' && dateString.includes('-')) {
      return dateString; // Return as is for strings like "25-09-25"
    }
    try {
      return new Date(dateString).toLocaleDateString("en-GB");
    } catch (e) {
      return dateString;
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Handle bulk import
  const handleBulkImport = async () => {
    if (!bulkData.trim()) {
      toast.error("Please paste order data");
      return;
    }

    try {
      setImporting(true);
      
      // Parse CSV-like data
      const lines = bulkData.trim().split('\n');
      const ordersToImport = [];
      
      // Skip header if exists
      const startIndex = lines[0].includes('SHIPPING MARK') ? 1 : 0;
      
      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Parse CSV (simple comma-separated)
        const columns = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
        
        if (columns.length >= 5) {
          const order = {
            shippingMark: columns[0] || "",
            supplier: columns[1] || "",
            product: columns[2] || "",
            quantity: parseInt(columns[3]) || 0,
            ctn: parseInt(columns[4]) || 0,
            shippingMode: columns[5] || "",
            deposit: parseFloat(columns[6]) || 0,
            balanceAmount: parseFloat(columns[7]) || 0,
            totalAmount: parseFloat(columns[8]) || 0,
            paymentDate: columns[9] || "",
            deliveryDate: columns[10] || "",
            loadingDate: columns[11] || "",
            arrivalDate: columns[12] || "",
            shippingCode: columns[13] || "",
            status: "PENDING",
            lrNo: columns[15] || ""
          };
          
          ordersToImport.push(order);
        }
      }
      
      if (ordersToImport.length === 0) {
        toast.error("No valid orders found in the data");
        return;
      }
      
      const response = await API.post("/client-order-tracker/bulk", {
        orders: ordersToImport
      });
      
      if (response.data.success) {
        toast.success(response.data.message);
        setShowBulkImport(false);
        setBulkData("");
        loadOrders();
        loadStats();
        loadFilters();
      }
    } catch (error) {
      console.error("Error importing orders:", error);
      toast.error(error.message || "Failed to import orders");
    } finally {
      setImporting(false);
    }
  };

  // Export to CSV
  const exportToCSV = async () => {
    try {
      const response = await API.get("/client-order-tracker/export?format=csv", {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `orders-export-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success("Orders exported successfully");
    } catch (error) {
      console.error("Error exporting orders:", error);
      toast.error("Failed to export orders");
    }
  };

  // Quick status actions
  const quickStatusActions = [
    { label: "Mark as Loaded", value: "LOADED", color: "text-blue-600", icon: <Package className="w-4 h-4" /> },
    { label: "Mark as In Transit", value: "IN_TRANSIT", color: "text-purple-600", icon: <Truck className="w-4 h-4" /> },
    { label: "Mark as Arrived", value: "ARRIVED", color: "text-green-600", icon: <CheckCircle className="w-4 h-4" /> },
    { label: "Mark as Delivered", value: "DELIVERED", color: "text-emerald-600", icon: <CheckCircle className="w-4 h-4" /> },
    { label: "Mark as Pending", value: "PENDING", color: "text-yellow-600", icon: <Clock className="w-4 h-4" /> },
  ];

  // Pagination controls
  const PaginationControls = () => (
    <div className="flex items-center justify-between px-4 py-3 border-t">
      <div className="text-sm text-gray-500">
        Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
        {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
        {pagination.total} orders
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadOrders(pagination.page - 1)}
          disabled={pagination.page === 1}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadOrders(pagination.page + 1)}
          disabled={pagination.page >= pagination.pages}
        >
          Next
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Order Tracker
              </h1>
              <p className="text-gray-600 mt-1">
                Track shipping orders with complete details
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/client-order-tracker/analytics")}
                className="flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
              </Button>
              
              <Dialog open={showBulkImport} onOpenChange={setShowBulkImport}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Bulk Import
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Bulk Import Orders</DialogTitle>
                    <DialogDescription>
                      Paste CSV data with columns: SHIPPING MARK, SUPPLIER, PRODUCT, QTY., CTN, SHIPPING MODE, DEPOSIT, BALANCE AMOUNT, TOTAL AMOUNT, PAYMENT DATE, DELIVERY DATE, LOADING DATE, ARRIVAL DATE, SHIPPING CODE, STATUS, LR NO
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Textarea
                      placeholder="Paste your CSV data here..."
                      value={bulkData}
                      onChange={(e) => setBulkData(e.target.value)}
                      rows={10}
                      className="font-mono text-sm"
                    />
                    <div className="mt-3 text-sm text-gray-500">
                      <p className="font-medium mb-1">Sample format:</p>
                      <pre className="bg-gray-50 p-2 rounded text-xs">
                        BHK - 328,,SS HEAVY FLOWER CUTTER,3600,50,,0,0,27000,25-09-25,26-09-25,29-09-25,29-10-25,PSDE-83,LOADED,
                      </pre>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowBulkImport(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleBulkImport} disabled={importing}>
                      {importing ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Import Orders
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Button
                variant="outline"
                onClick={exportToCSV}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
              
              <Button
                onClick={() => router.push("/dashboard/client-order-tracker/create")}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add New Order
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Orders</p>
                    <p className="text-xl md:text-2xl font-bold">{stats.totalOrders}</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Pending</p>
                    <p className="text-xl md:text-2xl font-bold">{stats.statusCounts.pending}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Loaded</p>
                    <p className="text-xl md:text-2xl font-bold">{stats.statusCounts.loaded}</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">In Transit</p>
                    <p className="text-xl md:text-2xl font-bold">{stats.statusCounts.inTransit}</p>
                  </div>
                  <Truck className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Qty.</p>
                    <p className="text-xl md:text-2xl font-bold">
                      {stats.totals.quantity.toLocaleString()}
                    </p>
                  </div>
                  <Layers className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total CTN</p>
                    <p className="text-xl font-bold">{stats.totals.ctn.toLocaleString()}</p>
                  </div>
                  <PackagePlus className="w-6 h-6 text-indigo-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Arrived</p>
                    <p className="text-xl font-bold">{stats.statusCounts.arrived}</p>
                  </div>
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Delivered</p>
                    <p className="text-xl font-bold">{stats.statusCounts.delivered}</p>
                  </div>
                  <CheckCircle className="w-6 h-6 text-emerald-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="text-xl font-bold">{formatCurrency(stats.totals.amount)}</p>
                  </div>
                  <Hash className="w-6 h-6 text-amber-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by shipping mark, product, or supplier..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="LOADED">Loaded</SelectItem>
                  <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                  <SelectItem value="ARRIVED">Arrived</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={shippingCodeFilter} onValueChange={setShippingCodeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by shipping code" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Shipping Codes</SelectItem>
                  {shippingCodes.map((code) => (
                    <SelectItem key={code} value={code}>
                      {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Suppliers</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier} value={supplier}>
                      {supplier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Shipping Mark</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="min-w-[200px]">Product</TableHead>
                    <TableHead className="text-right">Qty.</TableHead>
                    <TableHead className="text-right">CTN</TableHead>
                    <TableHead className="w-[100px]">Shipping Mode</TableHead>
                    <TableHead className="text-right">Amounts</TableHead>
                    <TableHead className="w-[100px]">Dates</TableHead>
                    <TableHead>Shipping Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>LR No</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center py-8">
                        <div className="flex justify-center">
                          <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center py-8">
                        <div className="text-gray-500">
                          <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                          <p>No orders found</p>
                          {search || statusFilter !== "ALL" || shippingCodeFilter !== "ALL" || supplierFilter !== "ALL" ? (
                            <Button
                              variant="link"
                              onClick={() => {
                                setSearch("");
                                setStatusFilter("ALL");
                                setShippingCodeFilter("ALL");
                                setSupplierFilter("ALL");
                              }}
                              className="mt-2"
                            >
                              Clear filters
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              onClick={() => router.push("/dashboard/client-order-tracker/create")}
                              className="mt-2"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add First Order
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order) => (
                      <TableRow
                        key={order.id}
                        className="hover:bg-gray-50"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyShippingMark(order.shippingMark)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <span className="font-medium">{order.shippingMark}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {order.supplier ? (
                            <div className="flex items-center gap-2">
                              <User className="w-3 h-3 text-gray-400" />
                              <span>{order.supplier}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium truncate max-w-[200px]">{order.product}</p>
                            {order.shippingMode && (
                              <p className="text-xs text-gray-500">Mode: {order.shippingMode}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-medium">{order.quantity.toLocaleString()}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="font-medium">
                            {order.ctn}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{order.shippingMode || "-"}</span>
                        </TableCell>
                        <TableCell>
                          <div className="text-right space-y-1">
                            {order.totalAmount > 0 && (
                              <p className="font-medium">{formatCurrency(order.totalAmount)}</p>
                            )}
                            {order.deposit > 0 && (
                              <p className="text-xs text-gray-500">Dep: {formatCurrency(order.deposit)}</p>
                            )}
                            {order.balanceAmount > 0 && (
                              <p className="text-xs text-gray-500">Bal: {formatCurrency(order.balanceAmount)}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs space-y-1">
                            {order.paymentDate && (
                              <p>
                                <span className="text-gray-500">Pay:</span> {formatDateDisplay(order.paymentDate)}
                              </p>
                            )}
                            {order.deliveryDate && (
                              <p>
                                <span className="text-gray-500">Del:</span> {formatDateDisplay(order.deliveryDate)}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {order.shippingCode ? (
                            <Badge variant="outline" className="font-mono">
                              {order.shippingCode}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(order.status)}
                        </TableCell>
                        <TableCell>
                          {order.lrNo ? (
                            <Badge variant="outline" className="font-mono text-xs">
                              {order.lrNo}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => router.push(`/dashboard/client-order-tracker/${order.id}`)}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => router.push(`/dashboard/client-order-tracker/${order.id}/edit`)}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Order
                                </DropdownMenuItem>
                                
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                                {quickStatusActions.map((action) => (
                                  <DropdownMenuItem
                                    key={action.value}
                                    onClick={() => updateStatus(order.id, action.value)}
                                    className={action.color}
                                  >
                                    {action.icon}
                                    <span className="ml-2">{action.label}</span>
                                  </DropdownMenuItem>
                                ))}
                                
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => deleteOrder(order.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Order
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {!loading && orders.length > 0 && <PaginationControls />}
          </CardContent>
        </Card>

        {/* Quick Help */}
        <Card className="mt-6">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-gray-900">Quick Tips</h3>
                <ul className="text-sm text-gray-600 mt-2 space-y-1">
                  <li>• Click the copy icon next to shipping mark to copy it</li>
                  <li>• Use bulk import for adding multiple orders quickly</li>
                  <li>• Filter by shipping code to see all items in a container</li>
                  <li>• Update status quickly using the actions menu</li>
                  <li>• Export to CSV for reporting or backup</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}