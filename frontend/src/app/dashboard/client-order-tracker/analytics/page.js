"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Package,
  Truck,
  CheckCircle,
  Clock,
  Calendar,
  Filter,
} from "lucide-react";
import API from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function OrderAnalytics() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalOrders: 0,
    statusCounts: {
      loaded: 0,
      inTransit: 0,
      arrived: 0,
      delivered: 0,
      pending: 0,
      cancelled: 0
    },
    totals: {
      quantity: 0,
      ctn: 0,
      amount: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("all");

  useEffect(() => {
    loadStats();
  }, [timeFilter]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await API.get("/client-order-tracker/stats");
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePercentage = (value) => {
    if (stats.totalOrders === 0) return 0;
    return ((value / stats.totalOrders) * 100).toFixed(1);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
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
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Order Analytics
              </h1>
              <p className="text-gray-600 mt-1">
                Insights and statistics for order tracking
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <Select value={timeFilter} onValueChange={setTimeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Time period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Orders</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
                </div>
                <BarChart3 className="w-10 h-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Quantity</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.totals.quantity.toLocaleString()}
                  </p>
                </div>
                <Package className="w-10 h-10 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(stats.totals.amount)}
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Order Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.statusCounts).map(([status, count]) => {
                  const percentage = calculatePercentage(count);
                  return (
                    <div key={status} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {status === "loaded" && <Package className="w-4 h-4 text-blue-500" />}
                          {status === "inTransit" && <Truck className="w-4 h-4 text-purple-500" />}
                          {status === "arrived" && <CheckCircle className="w-4 h-4 text-green-500" />}
                          {status === "delivered" && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                          {status === "pending" && <Clock className="w-4 h-4 text-yellow-500" />}
                          {status === "cancelled" && <TrendingDown className="w-4 h-4 text-red-500" />}
                          <span className="capitalize">{status.replace(/([A-Z])/g, ' $1')}</span>
                        </div>
                        <span className="font-medium">{count} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: 
                              status === "loaded" ? "#3b82f6" :
                              status === "inTransit" ? "#8b5cf6" :
                              status === "arrived" ? "#10b981" :
                              status === "delivered" ? "#059669" :
                              status === "pending" ? "#f59e0b" : "#ef4444"
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Additional Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Container Summary</p>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-blue-700">
                          {stats.totals.ctn.toLocaleString()}
                        </p>
                        <p className="text-sm text-blue-600">Total CTN</p>
                      </div>
                      <Package className="w-8 h-8 text-blue-500" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-2">Average per Order</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-lg font-bold">
                        {stats.totalOrders > 0 
                          ? Math.round(stats.totals.quantity / stats.totalOrders)
                          : 0
                        }
                      </p>
                      <p className="text-xs text-gray-500">Avg. Quantity</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-lg font-bold">
                        {stats.totalOrders > 0 
                          ? Math.round(stats.totals.ctn / stats.totalOrders)
                          : 0
                        }
                      </p>
                      <p className="text-xs text-gray-500">Avg. CTN</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-2">Completion Rate</p>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-green-700">
                          {stats.totalOrders > 0
                            ? Math.round((stats.statusCounts.delivered / stats.totalOrders) * 100)
                            : 0
                          }%
                        </p>
                        <p className="text-sm text-green-600">Orders Delivered</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium text-gray-900">Most Common Status</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {Object.entries(stats.statusCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0]
                    .replace(/([A-Z])/g, ' $1')
                    .toLowerCase()
                    .replace(/^\w/, c => c.toUpperCase())}
                </p>
              </div>
              
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-medium text-gray-900">Order Value</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Average order value: {formatCurrency(
                    stats.totalOrders > 0 ? stats.totals.amount / stats.totalOrders : 0
                  )}
                </p>
              </div>
              
              <div className="border-l-4 border-amber-500 pl-4">
                <h3 className="font-medium text-gray-900">Inventory Summary</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {stats.totals.quantity.toLocaleString()} units across {stats.totals.ctn.toLocaleString()} containers
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}