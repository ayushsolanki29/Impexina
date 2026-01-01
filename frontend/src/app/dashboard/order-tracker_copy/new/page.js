"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "sonner";
import {
  Save,
  X,
  Plus,
  Trash2,
  Upload,
  Calendar,
  DollarSign,
  Package,
  Truck,
  Building,
  User,
  FileText,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  Download,
} from "lucide-react";

const DEFAULT_ORDER = {
  shippingMark: "",
  supplier: "",
  product: "",
  quantity: "",
  cartons: "",
  shippingMode: "Sea Freight",
  deposit: "",
  balanceAmount: "",
  totalAmount: "",
  paymentDate: "",
  deliveryDateExpected: "",
  loadingDate: "",
  arrivalDate: "",
  shippingCode: "",
  status: "Pending",
  lrNo: "",
  mainClient: "",
  subClient: "",
};

const SHIPPING_MODES = ["Sea Freight", "Air Freight", "Road", "Express"];
const STATUS_OPTIONS = ["Pending", "Processing", "Loaded", "In Transit", "Delivered", "Cancelled"];
const MAIN_CLIENTS = ["MELISSAYU", "BRAVEMAN", "VIKTA", "SS Supplier", "Tool Master", "Hardware Co", "Metal Works", "Tooling Inc", "Precision Tools"];
const BHK_PREFIXES = ["BHK - 19", "BHK - 319", "BHK - 320", "BHK - 322", "BHK - 324", "BHK - 99", "BHK - 91", "BHK - 158", "BHK - 328", "BHK - 273", "BHK - 327", "BHK - 217", "BHK - 274"];

export default function NewOrderPage() {
  const router = useRouter();
  
  // State for multiple orders (batch entry)
  const [orders, setOrders] = useState([{ ...DEFAULT_ORDER }]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showCalculations, setShowCalculations] = useState(false);

  // Auto-generate shipping code based on date and mode
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    
    const newOrders = orders.map(order => {
      if (!order.shippingCode || order.shippingCode.startsWith('PSD')) {
        const prefix = order.shippingMode === "Sea Freight" ? "PSD" : 
                      order.shippingMode === "Air Freight" ? "AIR" : "TRK";
        return {
          ...order,
          shippingCode: `${prefix}${year}${month}-${randomNum}`
        };
      }
      return order;
    });
    
    if (JSON.stringify(newOrders) !== JSON.stringify(orders)) {
      setOrders(newOrders);
    }
  }, [orders]);

  // Handle input change for specific order
  const handleInputChange = (index, field, value) => {
    const newOrders = [...orders];
    
    // Update the field
    newOrders[index] = {
      ...newOrders[index],
      [field]: value
    };

    // Auto-calculate related fields
    if (field === "totalAmount" || field === "deposit") {
      const totalAmount = parseFloat(newOrders[index].totalAmount) || 0;
      const deposit = parseFloat(newOrders[index].deposit) || 0;
      newOrders[index].balanceAmount = (totalAmount - deposit).toString();
    }

    if (field === "quantity" || field === "cartons") {
      // Auto-calculate carton rate or suggest values
      const qty = parseInt(newOrders[index].quantity) || 0;
      const cartons = parseInt(newOrders[index].cartons) || 0;
      
      if (qty > 0 && cartons > 0) {
        const pcsPerCarton = Math.ceil(qty / cartons);
        if (pcsPerCarton > 100) {
          // Suggest optimal carton count
          const suggestedCartons = Math.ceil(qty / 50);
          newOrders[index].suggestedCartons = suggestedCartons;
        }
      }
    }

    // Auto-set BHK prefix for shipping mark
    if (field === "mainClient" && value === "MELISSAYU" && !newOrders[index].shippingMark) {
      const availablePrefix = BHK_PREFIXES.find(prefix => 
        !orders.some((o, i) => i !== index && o.shippingMark === prefix)
      );
      if (availablePrefix) {
        newOrders[index].shippingMark = availablePrefix;
        newOrders[index].subClient = availablePrefix;
      }
    }

    setOrders(newOrders);
    // Clear error for this field
    if (errors[`${index}-${field}`]) {
      const newErrors = { ...errors };
      delete newErrors[`${index}-${field}`];
      setErrors(newErrors);
    }
  };

  // Add new order row
  const addOrderRow = () => {
    setOrders([...orders, { 
      ...DEFAULT_ORDER, 
      shippingCode: orders[0]?.shippingCode || "PSD000-00" 
    }]);
  };

  // Remove order row
  const removeOrderRow = (index) => {
    if (orders.length > 1) {
      const newOrders = orders.filter((_, i) => i !== index);
      setOrders(newOrders);
      toast.success("Order row removed");
    } else {
      toast.error("At least one order row is required");
    }
  };

  // Validate all orders
  const validateOrders = () => {
    const newErrors = {};
    
    orders.forEach((order, index) => {
      // Required fields validation
      if (!order.shippingMark?.trim()) {
        newErrors[`${index}-shippingMark`] = "Shipping Mark is required";
      }
      if (!order.product?.trim()) {
        newErrors[`${index}-product`] = "Product description is required";
      }
      if (!order.quantity || isNaN(order.quantity) || parseInt(order.quantity) <= 0) {
        newErrors[`${index}-quantity`] = "Valid quantity is required";
      }
      if (!order.cartons || isNaN(order.cartons) || parseInt(order.cartons) <= 0) {
        newErrors[`${index}-cartons`] = "Valid carton count is required";
      }
      if (!order.totalAmount || isNaN(order.totalAmount) || parseFloat(order.totalAmount) <= 0) {
        newErrors[`${index}-totalAmount`] = "Valid total amount is required";
      }
      if (!order.shippingCode?.trim()) {
        newErrors[`${index}-shippingCode`] = "Shipping Code is required";
      }
      
      // Date validations
      if (order.paymentDate) {
        const paymentDate = new Date(order.paymentDate);
        if (isNaN(paymentDate.getTime())) {
          newErrors[`${index}-paymentDate`] = "Invalid payment date";
        }
      }
      
      if (order.loadingDate && order.arrivalDate) {
        const loadingDate = new Date(order.loadingDate);
        const arrivalDate = new Date(order.arrivalDate);
        if (loadingDate > arrivalDate) {
          newErrors[`${index}-loadingDate`] = "Loading date cannot be after arrival date";
        }
      }
      
      // Amount validation
      const totalAmount = parseFloat(order.totalAmount) || 0;
      const deposit = parseFloat(order.deposit) || 0;
      const balance = parseFloat(order.balanceAmount) || 0;
      
      if (Math.abs(totalAmount - (deposit + balance)) > 0.01) {
        newErrors[`${index}-totalAmount`] = "Total amount must equal deposit + balance";
      }
      
      if (deposit < 0) {
        newErrors[`${index}-deposit`] = "Deposit cannot be negative";
      }
      
      if (balance < 0) {
        newErrors[`${index}-balanceAmount`] = "Balance cannot be negative";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Calculate totals for all orders
  const calculateTotals = () => {
    return orders.reduce((acc, order) => ({
      totalQuantity: acc.totalQuantity + (parseInt(order.quantity) || 0),
      totalCartons: acc.totalCartons + (parseInt(order.cartons) || 0),
      totalAmount: acc.totalAmount + (parseFloat(order.totalAmount) || 0),
      totalDeposit: acc.totalDeposit + (parseFloat(order.deposit) || 0),
      totalBalance: acc.totalBalance + (parseFloat(order.balanceAmount) || 0),
    }), {
      totalQuantity: 0,
      totalCartons: 0,
      totalAmount: 0,
      totalDeposit: 0,
      totalBalance: 0,
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateOrders()) {
      toast.error("Please fix all validation errors before submitting");
      return;
    }

    setLoading(true);

    try {
      // Get existing orders from localStorage
      const existingOrders = JSON.parse(localStorage.getItem("igpl_orders") || "[]");
      
      // Prepare new orders with IDs and timestamps
      const newOrdersWithIds = orders.map(order => ({
        ...order,
        id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Convert string numbers to actual numbers
        quantity: parseInt(order.quantity) || 0,
        cartons: parseInt(order.cartons) || 0,
        deposit: parseFloat(order.deposit) || 0,
        balanceAmount: parseFloat(order.balanceAmount) || 0,
        totalAmount: parseFloat(order.totalAmount) || 0,
      }));

      // Combine with existing orders
      const allOrders = [...existingOrders, ...newOrdersWithIds];
      
      // Save to localStorage
      localStorage.setItem("igpl_orders", JSON.stringify(allOrders));
      
      // Also update container overview if needed
      const containerData = JSON.parse(localStorage.getItem("igpl_loading") || "[]");
      const newContainerData = [...containerData];
      
      // Group orders by shipping code for container overview
      const ordersByShippingCode = {};
      newOrdersWithIds.forEach(order => {
        if (!ordersByShippingCode[order.shippingCode]) {
          ordersByShippingCode[order.shippingCode] = {
            orders: [],
            totalQuantity: 0,
            totalCartons: 0,
            totalAmount: 0,
          };
        }
        ordersByShippingCode[order.shippingCode].orders.push(order);
        ordersByShippingCode[order.shippingCode].totalQuantity += order.quantity;
        ordersByShippingCode[order.shippingCode].totalCartons += order.cartons;
        ordersByShippingCode[order.shippingCode].totalAmount += order.totalAmount;
      });

      // Update or create container entries
      Object.entries(ordersByShippingCode).forEach(([shippingCode, data]) => {
        const existingContainer = newContainerData.find(c => c.containerCode === shippingCode);
        
        if (existingContainer) {
          // Update existing container
          existingContainer.tpcs += data.totalQuantity;
          existingContainer.tctn += data.totalCartons;
          existingContainer.clients = Array.from(
            new Set([...existingContainer.clients, ...data.orders.map(o => o.mainClient || o.supplier)])
          );
        } else {
          // Create new container entry
          const firstOrder = data.orders[0];
          newContainerData.push({
            id: `container-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            containerCode: shippingCode,
            origin: "YIWU", // Default origin
            loadingDate: firstOrder.loadingDate || new Date().toISOString().split('T')[0],
            status: firstOrder.status || "Loaded",
            tctn: data.totalCartons,
            tpcs: data.totalQuantity,
            tcbm: (data.totalCartons * 0.05).toFixed(3), // Estimate CBM
            twt: (data.totalCartons * 10).toFixed(2), // Estimate weight
            clients: data.orders.map(o => o.mainClient || o.supplier).filter(Boolean),
          });
        }
      });

      localStorage.setItem("igpl_loading", JSON.stringify(newContainerData));
      
      toast.success(`Successfully created ${orders.length} order(s)`);
      
      // Navigate to orders page
      setTimeout(() => {
        router.push("/dashboard/orders");
      }, 1500);

    } catch (error) {
      console.error("Error saving orders:", error);
      toast.error("Failed to save orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle file import (CSV/Excel)
  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const lines = content.split('\n');
        
        // Skip header line
        const dataLines = lines.slice(1).filter(line => line.trim());
        
        if (dataLines.length === 0) {
          toast.error("No data found in file");
          return;
        }

        const importedOrders = dataLines.map(line => {
          const columns = line.split('\t');
          return {
            shippingMark: columns[0]?.trim() || "",
            supplier: columns[1]?.trim() || "",
            product: columns[2]?.trim() || "",
            quantity: columns[3]?.trim() || "",
            cartons: columns[4]?.trim() || "",
            shippingMode: "Sea Freight",
            deposit: "",
            balanceAmount: "",
            totalAmount: columns[9]?.trim() || "",
            paymentDate: columns[10]?.trim() || "",
            deliveryDateExpected: columns[11]?.trim() || "",
            loadingDate: columns[12]?.trim() || "",
            arrivalDate: columns[13]?.trim() || "",
            shippingCode: columns[14]?.trim() || "",
            status: columns[15]?.trim() || "Pending",
            lrNo: columns[16]?.trim() || "",
          };
        }).filter(order => order.shippingMark); // Filter out empty rows

        if (importedOrders.length > 0) {
          setOrders(importedOrders);
          toast.success(`Imported ${importedOrders.length} orders from file`);
        }
      } catch (error) {
        console.error("Error parsing file:", error);
        toast.error("Failed to parse file. Please check the format.");
      }
    };

    reader.readAsText(file);
  };

  // Quick fill example data
  const fillExampleData = () => {
    const exampleOrder = {
      shippingMark: "BHK - 328",
      supplier: "SS Supplier",
      product: "SS HEAVY FLOWER CUTTER",
      quantity: "3600",
      cartons: "50",
      shippingMode: "Sea Freight",
      deposit: "27000",
      balanceAmount: "0",
      totalAmount: "27000",
      paymentDate: "2025-09-25",
      deliveryDateExpected: "2025-09-26",
      loadingDate: "2025-09-29",
      arrivalDate: "2025-10-29",
      shippingCode: "PSDE-83",
      status: "Loaded",
      lrNo: "",
      mainClient: "MELISSAYU",
      subClient: "BHK - 328",
    };
    
    setOrders([exampleOrder]);
    toast.info("Example data loaded. Modify as needed.");
  };

  // Clear all orders
  const clearAllOrders = () => {
    if (window.confirm("Are you sure you want to clear all orders?")) {
      setOrders([{ ...DEFAULT_ORDER }]);
      setErrors({});
      toast.info("All orders cleared");
    }
  };

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-6">
      <Toaster position="top-right" />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/dashboard/orders")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <X className="w-5 h-5" />
            Cancel
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Create New Order(s)
              </h1>
              <p className="text-gray-600 mt-1">
                Add single or multiple orders. Batch entry supported.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={fillExampleData}
                className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded"
              >
                <FileText className="w-4 h-4" />
                Load Example
              </button>
              
              <label className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded hover:bg-gray-50 cursor-pointer">
                <Upload className="w-4 h-4" />
                Import CSV
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-white rounded-lg shadow border mb-6">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Order Summary
              </h3>
              <button
                onClick={() => setShowCalculations(!showCalculations)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showCalculations ? "Hide Calculations" : "Show Calculations"}
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-sm text-gray-600">Total Orders</div>
                <div className="text-2xl font-bold text-gray-900">
                  {orders.length}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-sm text-gray-600">Total Quantity</div>
                <div className="text-2xl font-bold text-gray-900">
                  {totals.totalQuantity.toLocaleString()}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-sm text-gray-600">Total Cartons</div>
                <div className="text-2xl font-bold text-gray-900">
                  {totals.totalCartons}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-sm text-gray-600">Total Amount</div>
                <div className="text-2xl font-bold text-gray-900">
                  ${totals.totalAmount.toLocaleString()}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-sm text-gray-600">Balance Due</div>
                <div className="text-2xl font-bold text-gray-900">
                  ${totals.totalBalance.toLocaleString()}
                </div>
              </div>
            </div>

            {showCalculations && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Auto-Calculations</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Balance = Total Amount - Deposit</li>
                  <li>• Suggested cartons based on quantity (50 pcs/carton)</li>
                  <li>• Shipping code auto-generated based on mode and date</li>
                  <li>• BHK prefix auto-assigned for MELISSAYU clients</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg shadow border mb-6 overflow-hidden">
            {/* Form Header */}
            <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Order Details
                  </h3>
                  <p className="text-sm text-gray-600">
                    Fill in details for each order. Add multiple rows for batch entry.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={addOrderRow}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                  >
                    <Plus className="w-4 h-4" />
                    Add Row
                  </button>
                  <button
                    type="button"
                    onClick={clearAllOrders}
                    className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear All
                  </button>
                </div>
              </div>
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Shipping Mark
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      QTY
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      CTN
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Shipping Mode
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((order, index) => (
                    <React.Fragment key={index}>
                      {/* Compact Row */}
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <input
                              type="text"
                              value={order.shippingMark}
                              onChange={(e) => handleInputChange(index, "shippingMark", e.target.value)}
                              className={`w-full px-3 py-2 border rounded text-sm ${
                                errors[`${index}-shippingMark`] ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="BHK - 328"
                              list="bhk-prefixes"
                            />
                            <datalist id="bhk-prefixes">
                              {BHK_PREFIXES.map(prefix => (
                                <option key={prefix} value={prefix} />
                              ))}
                            </datalist>
                            {errors[`${index}-shippingMark`] && (
                              <p className="text-xs text-red-600 mt-1">
                                {errors[`${index}-shippingMark`]}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={order.supplier}
                            onChange={(e) => handleInputChange(index, "supplier", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            placeholder="MELISSAYU"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <textarea
                            value={order.product}
                            onChange={(e) => handleInputChange(index, "product", e.target.value)}
                            className={`w-full px-3 py-2 border rounded text-sm ${
                              errors[`${index}-product`] ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="ANGLE GRINDING BRACKET STAND"
                            rows={2}
                          />
                          {errors[`${index}-product`] && (
                            <p className="text-xs text-red-600 mt-1">
                              {errors[`${index}-product`]}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={order.quantity}
                            onChange={(e) => handleInputChange(index, "quantity", e.target.value)}
                            className={`w-full px-3 py-2 border rounded text-sm ${
                              errors[`${index}-quantity`] ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="560"
                            min="1"
                          />
                          {errors[`${index}-quantity`] && (
                            <p className="text-xs text-red-600 mt-1">
                              {errors[`${index}-quantity`]}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <input
                              type="number"
                              value={order.cartons}
                              onChange={(e) => handleInputChange(index, "cartons", e.target.value)}
                              className={`w-full px-3 py-2 border rounded text-sm ${
                                errors[`${index}-cartons`] ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="10"
                              min="1"
                            />
                            {order.suggestedCartons && (
                              <p className="text-xs text-blue-600 mt-1">
                                Suggested: {order.suggestedCartons} cartons
                              </p>
                            )}
                            {errors[`${index}-cartons`] && (
                              <p className="text-xs text-red-600 mt-1">
                                {errors[`${index}-cartons`]}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={order.shippingMode}
                            onChange={(e) => handleInputChange(index, "shippingMode", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                          >
                            {SHIPPING_MODES.map(mode => (
                              <option key={mode} value={mode}>{mode}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={order.status}
                            onChange={(e) => handleInputChange(index, "status", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                          >
                            {STATUS_OPTIONS.map(status => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => removeOrderRow(index)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                            title="Remove this order"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Details Row */}
                      <tr className="bg-gray-50">
                        <td colSpan={9} className="px-4 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Amount Section */}
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  <DollarSign className="w-4 h-4 inline mr-1" />
                                  Total Amount
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={order.totalAmount}
                                  onChange={(e) => handleInputChange(index, "totalAmount", e.target.value)}
                                  className={`w-full px-3 py-2 border rounded text-sm ${
                                    errors[`${index}-totalAmount`] ? 'border-red-500' : 'border-gray-300'
                                  }`}
                                  placeholder="18566"
                                />
                                {errors[`${index}-totalAmount`] && (
                                  <p className="text-xs text-red-600 mt-1">
                                    {errors[`${index}-totalAmount`]}
                                  </p>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Deposit
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={order.deposit}
                                    onChange={(e) => handleInputChange(index, "deposit", e.target.value)}
                                    className={`w-full px-3 py-2 border rounded text-sm ${
                                      errors[`${index}-deposit`] ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="18566"
                                  />
                                  {errors[`${index}-deposit`] && (
                                    <p className="text-xs text-red-600 mt-1">
                                      {errors[`${index}-deposit`]}
                                    </p>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Balance
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={order.balanceAmount}
                                    onChange={(e) => handleInputChange(index, "balanceAmount", e.target.value)}
                                    className={`w-full px-3 py-2 border rounded text-sm ${
                                      errors[`${index}-balanceAmount`] ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="0"
                                    readOnly
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Dates Section */}
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  <Calendar className="w-4 h-4 inline mr-1" />
                                  Payment Date
                                </label>
                                <input
                                  type="date"
                                  value={order.paymentDate}
                                  onChange={(e) => handleInputChange(index, "paymentDate", e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Expected Delivery
                                </label>
                                <input
                                  type="date"
                                  value={order.deliveryDateExpected}
                                  onChange={(e) => handleInputChange(index, "deliveryDateExpected", e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                />
                              </div>
                            </div>

                            {/* Shipping Dates Section */}
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  <Truck className="w-4 h-4 inline mr-1" />
                                  Loading Date (China)
                                </label>
                                <input
                                  type="date"
                                  value={order.loadingDate}
                                  onChange={(e) => handleInputChange(index, "loadingDate", e.target.value)}
                                  className={`w-full px-3 py-2 border rounded text-sm ${
                                    errors[`${index}-loadingDate`] ? 'border-red-500' : 'border-gray-300'
                                  }`}
                                />
                                {errors[`${index}-loadingDate`] && (
                                  <p className="text-xs text-red-600 mt-1">
                                    {errors[`${index}-loadingDate`]}
                                  </p>
                                )}
                              </div>
                              
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Arrival Date (India)
                                </label>
                                <input
                                  type="date"
                                  value={order.arrivalDate}
                                  onChange={(e) => handleInputChange(index, "arrivalDate", e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                />
                              </div>
                            </div>

                            {/* Client & Shipping Section */}
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  <Building className="w-4 h-4 inline mr-1" />
                                  Main Client
                                </label>
                                <select
                                  value={order.mainClient}
                                  onChange={(e) => handleInputChange(index, "mainClient", e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                >
                                  <option value="">Select Client</option>
                                  {MAIN_CLIENTS.map(client => (
                                    <option key={client} value={client}>{client}</option>
                                  ))}
                                </select>
                              </div>
                              
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  <User className="w-4 h-4 inline mr-1" />
                                  Sub Client
                                </label>
                                <input
                                  type="text"
                                  value={order.subClient}
                                  onChange={(e) => handleInputChange(index, "subClient", e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                  placeholder="BHK - 328"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Shipping Code
                                </label>
                                <input
                                  type="text"
                                  value={order.shippingCode}
                                  onChange={(e) => handleInputChange(index, "shippingCode", e.target.value)}
                                  className={`w-full px-3 py-2 border rounded text-sm ${
                                    errors[`${index}-shippingCode`] ? 'border-red-500' : 'border-gray-300'
                                  }`}
                                  placeholder="PSDL-90"
                                />
                                {errors[`${index}-shippingCode`] && (
                                  <p className="text-xs text-red-600 mt-1">
                                    {errors[`${index}-shippingCode`]}
                                  </p>
                                )}
                              </div>
                              
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  LR No.
                                </label>
                                <input
                                  type="text"
                                  value={order.lrNo}
                                  onChange={(e) => handleInputChange(index, "lrNo", e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                  placeholder="LR123456"
                                />
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Form Footer */}
            <div className="p-4 border-t bg-gray-50">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  <AlertCircle className="w-4 h-4 inline mr-1 text-yellow-600" />
                  Fill all required fields marked with validation
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard/orders")}
                    className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded shadow disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save {orders.length > 1 ? `${orders.length} Orders` : "Order"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Quick Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Quick Tips
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use TAB key to navigate quickly between fields</li>
            <li>• Import CSV files from Excel/Google Sheets</li>
            <li>• Shipping code auto-generates based on mode and date</li>
            <li>• Balance auto-calculates from Total Amount - Deposit</li>
            <li>• Select MELISSAYU to auto-assign BHK shipping mark</li>
            <li>• Add multiple rows for batch order entry</li>
          </ul>
        </div>

        {/* Template Download */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">
                Need to import many orders?
              </h4>
              <p className="text-sm text-gray-600">
                Download our CSV template and import multiple orders at once.
              </p>
            </div>
            <button
              onClick={() => {
                // Create CSV template
                const headers = [
                  "SHIPPING MARK",
                  "SUPPLIER",
                  "PRODUCT",
                  "QTY",
                  "CTN",
                  "SHIPPING MODE",
                  "DEPOSIT",
                  "BALANCE AMOUNT",
                  "TOTAL AMOUNT",
                  "PAYMENT DATE",
                  "DELIVERY DATE EXPECTED",
                  "LOADING DATE",
                  "ARRIVAL DATE",
                  "SHIPPING CODE",
                  "STATUS",
                  "LR NO",
                ];
                
                const csvContent = [headers.join('\t')].join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'order_template.csv';
                a.click();
                
                toast.success("Template downloaded");
              }}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded"
            >
              <Download className="w-4 h-4" />
              Download CSV Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}