"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Copy,
  Printer,
  Download,
  Package,
  Truck,
  Calendar,
  Hash,
  User,
  CheckCircle,
  Clock,
  AlertCircle,
  Layers,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import API from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function OrderDetails() {
  const router = useRouter();
  const params = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadOrder();
    }
  }, [params.id]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/client-order-tracker/${params.id}`);
      if (response.data.success) {
        setOrder(response.data.data);
      }
    } catch (error) {
      console.error("Error loading order:", error);
      toast.error(error.message || "Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async () => {
    try {
      const response = await API.delete(`/client-order-tracker/${params.id}`);
      if (response.data.success) {
        toast.success(response.data.message || "Order deleted successfully");
        router.push("/dashboard/client-order-tracker");
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error(error.message || "Failed to delete order");
    }
  };

  const updateStatus = async (newStatus) => {
    try {
      const response = await API.post(`/client-order-tracker/${params.id}/status`, {
        status: newStatus
      });
      
      if (response.data.success) {
        toast.success("Order status updated");
        loadOrder();
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(error.message || "Failed to update status");
    }
  };

  const copyToClipboard = (text, label = "text") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const formatCurrency = (amount) => {
    if (!amount) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "LOADED":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Loaded</Badge>;
      case "IN_TRANSIT":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">In Transit</Badge>;
      case "ARRIVED":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Arrived</Badge>;
      case "DELIVERED":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Delivered</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case "CANCELLED":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return "Not specified";
    if (typeof dateString === 'string' && dateString.includes('-')) {
      return dateString;
    }
    try {
      return new Date(dateString).toLocaleDateString("en-GB");
    } catch (e) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-6xl mx-auto text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order not found</h2>
          <p className="text-gray-600 mb-6">The order you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/dashboard/client-order-tracker")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {order.shippingMark}
                </h1>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(order.shippingMark, "Shipping mark")}
                  className="h-8 w-8"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                {getStatusBadge(order.status)}
                {order.shippingCode && (
                  <Badge variant="outline" className="font-mono">
                    {order.shippingCode}
                  </Badge>
                )}
                <span className="text-sm text-gray-500">
                  Created: {formatDateDisplay(order.createdAt)}
                </span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => window.print()}
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              
              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/client-order-tracker/${order.id}/edit`)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              
              <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Order</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this order? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={deleteOrder}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Order
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Details */}
            <Card>
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Product Name</p>
                      <p className="font-medium text-lg">{order.product}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Supplier</p>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <p className="font-medium">{order.supplier || "Not specified"}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Quantity</p>
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-gray-400" />
                        <p className="font-medium text-xl">{order.quantity.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">CTN</p>
                      <Badge variant="outline" className="text-lg px-3 py-1">
                        {order.ctn}
                      </Badge>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Shipping Mode</p>
                      <p className="font-medium">{order.shippingMode || "Not specified"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="w-5 h-5" />
                  Financial Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Deposit</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(order.deposit)}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Balance Amount</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {formatCurrency(order.balanceAmount)}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="text-3xl font-bold text-green-600">
                      {formatCurrency(order.totalAmount)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Shipping Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {order.paymentDate && (
                      <div>
                        <p className="text-sm text-gray-500">Payment Date</p>
                        <p className="font-medium">{formatDateDisplay(order.paymentDate)}</p>
                      </div>
                    )}
                    
                    {order.deliveryDate && (
                      <div>
                        <p className="text-sm text-gray-500">Delivery Date (China)</p>
                        <p className="font-medium">{formatDateDisplay(order.deliveryDate)}</p>
                      </div>
                    )}
                    
                    {order.loadingDate && (
                      <div>
                        <p className="text-sm text-gray-500">Loading Date (China)</p>
                        <p className="font-medium">{formatDateDisplay(order.loadingDate)}</p>
                      </div>
                    )}
                    
                    {order.arrivalDate && (
                      <div>
                        <p className="text-sm text-gray-500">Arrival Date (India)</p>
                        <p className="font-medium">{formatDateDisplay(order.arrivalDate)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Shipping Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Shipping Code</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <p className="font-medium font-mono">{order.shippingCode || "Not assigned"}</p>
                    {order.shippingCode && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(order.shippingCode, "Shipping code")}
                        className="h-6 w-6"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="mt-2">
                    {getStatusBadge(order.status)}
                  </div>
                </div>
                
                {order.lrNo && (
                  <div>
                    <p className="text-sm text-gray-500">LR Number</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="font-mono">
                        {order.lrNo}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(order.lrNo, "LR number")}
                        className="h-6 w-6"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Status Update Buttons */}
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500 mb-2">Update Status:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {order.status !== "LOADED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus("LOADED")}
                      >
                        <Package className="w-3 h-3 mr-1" />
                        Loaded
                      </Button>
                    )}
                    {order.status !== "IN_TRANSIT" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus("IN_TRANSIT")}
                      >
                        <Truck className="w-3 h-3 mr-1" />
                        In Transit
                      </Button>
                    )}
                    {order.status !== "ARRIVED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus("ARRIVED")}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Arrived
                      </Button>
                    )}
                    {order.status !== "DELIVERED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus("DELIVERED")}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Delivered
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/dashboard/client-order-tracker/${order.id}/edit`)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Order
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.print()}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Details
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => copyToClipboard(order.shippingMark, "Shipping mark")}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Shipping Mark
                </Button>
                
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Order
                </Button>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Created By:</span>
                    <span>{order.createdBy?.name || "System"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Created On:</span>
                    <span>{formatDateDisplay(order.createdAt)}</span>
                  </div>
                  {order.updatedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Last Updated:</span>
                      <span>{formatDateDisplay(order.updatedAt)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}