"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Toaster, toast } from "sonner";
import {
  ChevronLeft,
  Download,
  Printer,
  FileText,
  FileSpreadsheet,
  Copy,
  X,
  CheckCircle,
  Clock,
  Truck,
  Package,
  Box,
  DollarSign,
  Calendar,
  User,
  Building,
  Search,
  Filter,
} from "lucide-react";

// Mock data for the shipping code
const SHIPPING_CODE_DATA = {
  shippingCode: "PSDL-90",
  shippingMode: "Sea Freight",
  loadingDate: "17-10-25",
  arrivalDate: "17-11-25",
  status: "Loaded",
  orders: [
    {
      shippingMark: "BHK - 19",
      supplier: "MELISSAYU",
      product: "ANGLE GRINDING BRACKET STAND",
      quantity: 560,
      cartons: 10,
      totalAmount: 18566,
      balanceAmount: 0,
      deposit: 18566,
      paymentDate: "11-10-28",
      deliveryDateExpected: "13-10-25",
    },
    {
      shippingMark: "BHK - 319",
      supplier: "Tool Master",
      product: "SLIDING GRINDING STAND",
      quantity: 90,
      cartons: 15,
      totalAmount: 4500,
      balanceAmount: 4500,
      deposit: 0,
      paymentDate: "",
      deliveryDateExpected: "17-10-25",
    },
    {
      shippingMark: "BHK - 320",
      supplier: "Hardware Co",
      product: "ANGLE GRINDING STAND",
      quantity: 80,
      cartons: 10,
      totalAmount: 3200,
      balanceAmount: 3200,
      deposit: 0,
      paymentDate: "",
      deliveryDateExpected: "17-10-25",
    },
    {
      shippingMark: "BHK - 322",
      supplier: "Metal Works",
      product: "ADJUSTABLE PRESS VICE",
      quantity: 150,
      cartons: 5,
      totalAmount: 7500,
      balanceAmount: 7500,
      deposit: 0,
      paymentDate: "",
      deliveryDateExpected: "17-10-25",
    },
    {
      shippingMark: "BHK - 324",
      supplier: "Tooling Inc",
      product: "90 DEGREE ANGLE CORNER CLAMP SET OF 4",
      quantity: 500,
      cartons: 10,
      totalAmount: 25000,
      balanceAmount: 25000,
      deposit: 0,
      paymentDate: "",
      deliveryDateExpected: "17-10-25",
    },
    {
      shippingMark: "BHK - 99",
      supplier: "Precision Tools",
      product: "360 UNIVERSAL ROTATING VICE",
      quantity: 48,
      cartons: 2,
      totalAmount: 4800,
      balanceAmount: 4800,
      deposit: 0,
      paymentDate: "",
      deliveryDateExpected: "17-10-25",
    },
    {
      shippingMark: "BHK - 91",
      supplier: "14117",
      product: "VIKTA TOP CUTTING WHEEL",
      quantity: 500,
      cartons: 1,
      totalAmount: 55250,
      balanceAmount: 55250,
      deposit: 0,
      paymentDate: "11-Oct",
      deliveryDateExpected: "09-10-25",
    },
  ],
};

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const shippingCode = params?.shippingCode || "PSDL-90";

  // State
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");

  // Load data
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      // In real app, fetch from localStorage or API
      setData(SHIPPING_CODE_DATA);
      setLoading(false);
    }, 500);
  }, [shippingCode]);

  // Calculate totals
  const totals = useMemo(() => {
    if (!data) return {};
    
    const orders = data.orders || [];
    return {
      totalOrders: orders.length,
      totalQuantity: orders.reduce((sum, order) => sum + (order.quantity || 0), 0),
      totalCartons: orders.reduce((sum, order) => sum + (order.cartons || 0), 0),
      totalAmount: orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
      totalBalance: orders.reduce((sum, order) => sum + (order.balanceAmount || 0), 0),
      totalDeposit: orders.reduce((sum, order) => sum + (order.deposit || 0), 0),
    };
  }, [data]);

  // Get unique suppliers
  const uniqueSuppliers = useMemo(() => {
    if (!data) return [];
    const suppliers = [...new Set(data.orders.map(order => order.supplier))];
    return suppliers.sort();
  }, [data]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    if (!data) return [];
    
    let orders = [...data.orders];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      orders = orders.filter(order =>
        order.product?.toLowerCase().includes(query) ||
        order.shippingMark?.toLowerCase().includes(query) ||
        order.supplier?.toLowerCase().includes(query)
      );
    }
    
    if (selectedSupplier) {
      orders = orders.filter(order => order.supplier === selectedSupplier);
    }
    
    return orders;
  }, [data, searchQuery, selectedSupplier]);

  // Export functions
  const exportToPDF = () => {
    toast.success(`PDF for ${shippingCode} generated`);
  };

  const exportToExcel = () => {
    toast.success(`Excel for ${shippingCode} downloaded`);
  };

  const copySummary = () => {
    const summary = `
Shipping Code: ${data?.shippingCode}
Status: ${data?.status}
Loading Date: ${data?.loadingDate}
Arrival Date: ${data?.arrivalDate}
Total Orders: ${totals.totalOrders}
Total Quantity: ${totals.totalQuantity}
Total Cartons: ${totals.totalCartons}
Total Amount: $${totals.totalAmount.toLocaleString()}
    `.trim();
    
    navigator.clipboard.writeText(summary);
    toast.success("Summary copied to clipboard");
  };

  // Get status icon
  function getStatusIcon(status) {
    switch (status) {
      case "Loaded":
        return <Truck className="w-5 h-5 text-green-600" />;
      case "Pending":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case "Delivered":
        return <CheckCircle className="w-5 h-5 text-purple-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 mb-3 text-lg">Shipping code not found</div>
          <button
            onClick={() => router.push("/dashboard/orders")}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-6">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/dashboard/order-tracker")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Orders
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {data.shippingCode}
                <span className="text-gray-600 ml-2">- {data.shippingMode}</span>
              </h1>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(data.status)}
                  <span className="font-medium">{data.status}</span>
                </div>
                <span className="text-gray-400">•</span>
                <div className="flex items-center gap-1 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Loading: {data.loadingDate}</span>
                </div>
                <span className="text-gray-400">•</span>
                <div className="flex items-center gap-1 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Arrival: {data.arrivalDate}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={copySummary}
                className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded hover:bg-gray-50"
              >
                <Copy className="w-4 h-4" />
                Copy Summary
              </button>
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </button>
              <button
                onClick={exportToPDF}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded"
              >
                <Printer className="w-4 h-4" />
                Print/PDF
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-sm text-gray-600">Total Orders</div>
            <div className="text-2xl font-bold text-gray-900">{totals.totalOrders}</div>
            <div className="text-xs text-gray-500 mt-1">{uniqueSuppliers.length} suppliers</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-sm text-gray-600">Total Quantity</div>
            <div className="text-2xl font-bold text-gray-900 flex items-center gap-1">
              <Package className="w-5 h-5 text-blue-600" />
              {totals.totalQuantity.toLocaleString()}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-sm text-gray-600">Total Cartons</div>
            <div className="text-2xl font-bold text-gray-900 flex items-center gap-1">
              <Box className="w-5 h-5 text-green-600" />
              {totals.totalCartons}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-sm text-gray-600">Total Amount</div>
            <div className="text-2xl font-bold text-gray-900 flex items-center gap-1">
              <DollarSign className="w-5 h-5 text-yellow-600" />
              ${totals.totalAmount.toLocaleString()}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-sm text-gray-600">Total Deposit</div>
            <div className="text-2xl font-bold text-gray-900">
              ${totals.totalDeposit.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {((totals.totalDeposit / totals.totalAmount) * 100).toFixed(1)}% paid
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-sm text-gray-600">Balance Due</div>
            <div className="text-2xl font-bold text-gray-900">
              ${totals.totalBalance.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow border mb-6">
          <div className="p-4 border-b">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products, shipping marks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="w-full md:w-64">
                <div className="relative">
                  <Filter className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <select
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Suppliers</option>
                    {uniqueSuppliers.map((supplier) => (
                      <option key={supplier} value={supplier}>
                        {supplier}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Shipping Mark
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Cartons
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Payment Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Expected Delivery
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.map((order, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.shippingMark}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{order.supplier}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {order.product}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {order.quantity.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-900">{order.cartons}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-bold text-gray-900">
                        ${order.totalAmount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className={`text-sm font-medium ${
                        order.balanceAmount > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        ${order.balanceAmount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.paymentDate || "—"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.deliveryDateExpected}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.balanceAmount === 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.balanceAmount === 0 ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}

                {/* Totals Row */}
                <tr className="bg-gray-50 font-bold">
                  <td colSpan={3} className="px-6 py-4 text-sm text-gray-900">
                    GRAND TOTAL
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">
                    {totals.totalQuantity.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">
                    {totals.totalCartons}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">
                    ${totals.totalAmount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">
                    ${totals.totalBalance.toLocaleString()}
                  </td>
                  <td colSpan={3} className="px-6 py-4 text-sm text-gray-900">
                    {/* Empty cells */}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Supplier Summary */}
        <div className="mt-6 bg-white rounded-lg shadow border">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Supplier Summary</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uniqueSuppliers.map((supplier) => {
                const supplierOrders = data.orders.filter(o => o.supplier === supplier);
                const supplierTotal = supplierOrders.reduce((sum, o) => sum + o.totalAmount, 0);
                const supplierQuantity = supplierOrders.reduce((sum, o) => sum + o.quantity, 0);
                
                return (
                  <div key={supplier} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Building className="w-4 h-4 text-gray-400 mr-2" />
                        <h4 className="font-medium text-gray-900">{supplier}</h4>
                      </div>
                      <span className="text-sm text-gray-600">
                        {supplierOrders.length} order{supplierOrders.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Quantity:</span>
                        <span className="font-medium">{supplierQuantity.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Amount:</span>
                        <span className="font-bold">${supplierTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-600">
            Shipping Code: {data.shippingCode} • Status: {data.status} • 
            Last Updated: {new Date().toLocaleDateString()}
          </div>
          <div className="text-sm text-gray-600">
            {filteredOrders.length} of {data.orders.length} orders shown
          </div>
        </div>
      </div>
    </div>
  );
}