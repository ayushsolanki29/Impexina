"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import API from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function EditOrder() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shippingCodes, setShippingCodes] = useState([]);
  const [formData, setFormData] = useState({
    shippingMark: "",
    supplier: "",
    product: "",
    quantity: 1,
    ctn: 1,
    shippingMode: "",
    deposit: 0,
    balanceAmount: 0,
    totalAmount: 0,
    paymentDate: "",
    deliveryDate: "",
    loadingDate: "",
    arrivalDate: "",
    shippingCode: "",
    status: "PENDING",
    lrNo: "",
    notes: "",
  });

  // Load order data and shipping codes
  useEffect(() => {
    if (params.id) {
      loadOrder();
      loadShippingCodes();
    }
  }, [params.id]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/client-order-tracker/${params.id}`);
      if (response.data.success) {
        const order = response.data.data;

        // Format the data for the form
        setFormData({
          shippingMark: order.shippingMark || "",
          supplier: order.supplier || "",
          product: order.product || "",
          quantity: order.quantity || 1,
          ctn: order.ctn || 1,
          shippingMode: order.shippingMode || "",
          deposit: order.deposit || 0,
          balanceAmount: order.balanceAmount || 0,
          totalAmount: order.totalAmount || 0,
          paymentDate: order.paymentDate || "",
          deliveryDate: order.deliveryDate || "",
          loadingDate: order.loadingDate || "",
          arrivalDate: order.arrivalDate || "",
          shippingCode: order.shippingCode || "",
          status: order.status || "PENDING",
          lrNo: order.lrNo || "",
          notes: order.notes || "",
        });
      }
    } catch (error) {
      console.error("Error loading order:", error);
      toast.error(error.message || "Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  const loadShippingCodes = async () => {
    try {
      const response = await API.get("/client-order-tracker?limit=100");
      if (response.data.success && response.data.data.orders) {
        const codes = [
          ...new Set(
            response.data.data.orders.map((o) => o.shippingCode).filter(Boolean)
          ),
        ];
        setShippingCodes(codes);
      }
    } catch (error) {
      console.error("Error loading shipping codes:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Allow only letters, numbers, hyphen and underscore for shippingCode
    if (name === "shippingCode") {
      const sanitized = value.replace(/[^A-Za-z0-9\-_]/g, "");
      setFormData((prev) => ({
        ...prev,
        shippingCode: sanitized,
      }));
      return;
    }

    // Handle amount calculations
    if (
      name === "deposit" ||
      name === "balanceAmount" ||
      name === "totalAmount"
    ) {
      const newValue = value === "" ? 0 : parseFloat(value) || 0;
      setFormData((prev) => ({
        ...prev,
        [name]: newValue,
      }));

      // Recalculate total if deposit or balance changes
      if (name === "deposit" || name === "balanceAmount") {
        setTimeout(() => calculateTotalAmount(), 10);
      }
    } else if (name === "quantity" || name === "ctn") {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? 0 : parseInt(value) || 0,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const calculateTotalAmount = () => {
    const deposit = parseFloat(formData.deposit) || 0;
    const balance = parseFloat(formData.balanceAmount) || 0;
    const total = deposit + balance;

    setFormData((prev) => ({
      ...prev,
      totalAmount: total,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (
      !formData.shippingMark ||
      !formData.product ||
      !formData.quantity ||
      !formData.ctn
    ) {
      toast.error(
        "Please fill in required fields (Shipping Mark, Product, Qty., CTN)"
      );
      return;
    }

    try {
      setSaving(true);

      const dataToSend = {
        ...formData,
        quantity: parseInt(formData.quantity) || 1,
        ctn: parseInt(formData.ctn) || 1,
        deposit: parseFloat(formData.deposit) || 0,
        balanceAmount: parseFloat(formData.balanceAmount) || 0,
        totalAmount: parseFloat(formData.totalAmount) || 0,
      };

      const response = await API.put(
        `/client-order-tracker/${params.id}`,
        dataToSend
      );

      if (response.data.success) {
        toast.success(response.data.message || "Order updated successfully");
        router.push(`/dashboard/client-order-tracker/${params.id}`);
      }
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error(error.message || "Failed to update order");
    } finally {
      setSaving(false);
    }
  };

  // Auto-fill shipping code from shipping mark
  const autoFillShippingCode = () => {
    const mark = formData.shippingMark;
    if (mark && mark.includes("-")) {
      const code = mark.split("-")[1]?.trim();
      if (code) {
        setFormData((prev) => ({
          ...prev,
          shippingCode: `PSD${code}`,
        }));
        toast.success("Shipping code auto-filled");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Order
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Edit Order
          </h1>
          <p className="text-gray-600 mt-1">
            Update order information for {formData.shippingMark}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Basic Information Card */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="shippingMark" className="mb-2 block">
                      Shipping Mark *
                    </Label>
                    <Input
                      id="shippingMark"
                      name="shippingMark"
                      value={formData.shippingMark}
                      onChange={handleChange}
                      placeholder="BHK - 328"
                      required
                      onBlur={autoFillShippingCode}
                    />
                  </div>

                  <div>
                    <Label htmlFor="supplier" className="mb-2 block">
                      Supplier
                    </Label>
                    <Input
                      id="supplier"
                      name="supplier"
                      value={formData.supplier}
                      onChange={handleChange}
                      placeholder="MELISSAYU"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="product" className="mb-2 block">
                      Product *
                    </Label>
                    <Input
                      id="product"
                      name="product"
                      value={formData.product}
                      onChange={handleChange}
                      placeholder="SS HEAVY FLOWER CUTTER"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="quantity" className="mb-2 block">
                      Quantity *
                    </Label>
                    <Input
                      type="number"
                      id="quantity"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      min="1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="ctn" className="mb-2 block">
                      CTN *
                    </Label>
                    <Input
                      type="number"
                      id="ctn"
                      name="ctn"
                      value={formData.ctn}
                      onChange={handleChange}
                      min="1"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Information Card */}
            <Card>
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="shippingMode" className="mb-2 block">
                      Shipping Mode
                    </Label>
                    <Input
                      id="shippingMode"
                      name="shippingMode"
                      value={formData.shippingMode}
                      onChange={handleChange}
                      placeholder="Sea, Air, etc."
                    />
                  </div>

                  <div>
                    <Label htmlFor="shippingCode" className="mb-2 block">
                      Shipping Code
                    </Label>
                    <Input
                      id="shippingCode"
                      name="shippingCode"
                      type="text"
                      inputMode="text"
                      autoComplete="off"
                      value={formData.shippingCode || ""}
                      onChange={handleChange}
                      placeholder="Enter custom shipping code"
                      className="mt-2"
                      pattern="[A-Za-z0-9\-_]+"
                      title="Only letters, numbers, hyphen and underscore allowed"
                    />
                  </div>

                  <div>
                    <Label htmlFor="status" className="mb-2 block">
                      Status *
                    </Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        handleSelectChange("status", value)
                      }
                    >
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="LOADED">Loaded</SelectItem>
                        <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                        <SelectItem value="ARRIVED">Arrived</SelectItem>
                        <SelectItem value="DELIVERED">Delivered</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="lrNo" className="mb-2 block">
                      LR Number
                    </Label>
                    <Input
                      id="lrNo"
                      name="lrNo"
                      value={formData.lrNo}
                      onChange={handleChange}
                      placeholder="LR number"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Information Card */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="deposit" className="mb-2 block">
                      Deposit
                    </Label>
                    <Input
                      type="number"
                      id="deposit"
                      name="deposit"
                      value={formData.deposit}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <Label htmlFor="balanceAmount" className="mb-2 block">
                      Balance Amount
                    </Label>
                    <Input
                      type="number"
                      id="balanceAmount"
                      name="balanceAmount"
                      value={formData.balanceAmount}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block">Total Amount</Label>
                    <div className="relative">
                      <Input
                        id="totalAmount"
                        name="totalAmount"
                        value={formData.totalAmount}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="bg-gray-50 font-bold pr-20"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={calculateTotalAmount}
                        className="absolute right-1 top-1 h-7"
                      >
                        Calculate
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  <p>
                    Tip: Enter Deposit and Balance Amount, then click Calculate
                    for Total Amount
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Dates Card */}
            <Card>
              <CardHeader>
                <CardTitle>Important Dates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="paymentDate" className="mb-2 block">
                      Payment Date
                    </Label>
                    <Input
                      id="paymentDate"
                      name="paymentDate"
                      value={formData.paymentDate}
                      onChange={handleChange}
                      placeholder="25-09-25"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Format: DD-MM-YY
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="deliveryDate" className="mb-2 block">
                      Delivery Date (China)
                    </Label>
                    <Input
                      id="deliveryDate"
                      name="deliveryDate"
                      value={formData.deliveryDate}
                      onChange={handleChange}
                      placeholder="26-09-25"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Format: DD-MM-YY
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="loadingDate" className="mb-2 block">
                      Loading Date (China)
                    </Label>
                    <Input
                      id="loadingDate"
                      name="loadingDate"
                      value={formData.loadingDate}
                      onChange={handleChange}
                      placeholder="29-09-25"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Format: DD-MM-YY
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="arrivalDate" className="mb-2 block">
                      Arrival Date (India)
                    </Label>
                    <Input
                      id="arrivalDate"
                      name="arrivalDate"
                      value={formData.arrivalDate}
                      onChange={handleChange}
                      placeholder="29-10-25"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Format: DD-MM-YY
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes Card */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Enter any additional notes..."
                  rows={3}
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse md:flex-row gap-3 justify-between">
              <div className="space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => loadOrder()}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset Changes
                </Button>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    router.push(`/dashboard/client-order-tracker/${params.id}`)
                  }
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  View Details
                </Button>

                <Button
                  type="submit"
                  disabled={saving}
                  className="min-w-[120px]"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>

        {/* Help Section */}
        <Card className="mt-6">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-gray-900">Editing Tips</h3>
                <ul className="text-sm text-gray-600 mt-2 space-y-1">
                  <li>• Fields marked with * are required</li>
                  <li>
                    • Click "Calculate" to update Total Amount from Deposit and
                    Balance
                  </li>
                  <li>• Use DD-MM-YY format for dates (e.g., 25-09-25)</li>
                  <li>• Click "Reset Changes" to reload original values</li>
                  <li>
                    • Shipping code will auto-fill when you leave the Shipping
                    Mark field
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
