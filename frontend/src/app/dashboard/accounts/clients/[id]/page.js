"use client";
import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {  toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  Save,
  Trash2,
  Printer,
  FileDown,
  PlusCircle,
  Calculator,
  Search,
  X,
  Check,
  Package,
  Users,
  Filter,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Link as LinkIcon,
  Unlink
} from "lucide-react";

import AutoSuggestInput from "@/components/AutoSuggestInput";
import accountsAPI from "@/services/accounts.clients.service";

export default function ClientLedgerPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id;

  const [client, setClient] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [containers, setContainers] = useState([]);
  const [showLinkedContainers, setShowLinkedContainers] = useState(false);
  
  // Filters
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });

  // --- Form State for New Entry ---
  const [entry, setEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    containerCode: "",
    containerMark: "",
    particulars: "",
    billingType: "cbm",
    quantity: "",
    rate: "",
    amount: 0,
    paid: "",
    paymentMode: "",
    paymentDate: "",
    paymentRef: "",
    fromAccount: "Main",
    toAccount: "Client",
    type: "EXPENSE",
    notes: "",
  });

  // Load Client and Data
  useEffect(() => {
    loadClientData();
    loadTransactions();
    loadClientContainers();
  }, [clientId, dateRange]);

  const loadClientData = async () => {
    try {
      const data = await accountsAPI.getClient(clientId);
      setClient(data.data.data);
    } catch (error) {
      toast.error(error.message || "Failed to load client");
    }
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const params = {
        startDate: dateRange.start,
        endDate: dateRange.end,
        page: pagination.page,
        limit: pagination.limit,
      };
      
      const data = await accountsAPI.getClientLedger(clientId, params);
      setTransactions(data.data.data.transactions || []);
      setPagination(data.data.data.pagination);
    } catch (error) {
      toast.error(error.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const loadClientContainers = async () => {
    try {
      const data = await accountsAPI.getClientContainers(clientId);
      setContainers(data.data.data || []);
    } catch (error) {
      console.error("Failed to load containers:", error);
    }
  };

  // Calculate total automatically
  useEffect(() => {
    const qty = parseFloat(entry.quantity) || 0;
    const rate = parseFloat(entry.rate) || 0;
    const total = qty * rate;
    setEntry(prev => ({ 
      ...prev, 
      amount: isNaN(total) ? 0 : parseFloat(total.toFixed(2))
    }));
  }, [entry.quantity, entry.rate]);

  // Handle Container Selection
  const handleContainerSelect = async (container) => {
    const containerCode = container.containerCode;
    const mark = container.clients?.[0]?.name || containerCode;
    
    // Get items for this container from suggestions
    const suggestions = await accountsAPI.getContainerSuggestions(containerCode);
    
    if (suggestions.data.data?.[0]) {
      const selectedContainer = suggestions.data.data[0];
      const items = selectedContainer.clients
        .flatMap(client => client.items.map(item => ({
          ...item,
          clientName: client.clientName,
        })))
        .filter(item => item.particular);
      
      setEntry(prev => ({
        ...prev,
        containerCode,
        containerMark: mark,
      }));
      
      // Link container to client if not already linked
      const isLinked = containers.some(c => 
        c.containerCode === containerCode && c.mark === mark
      );
      
      if (!isLinked && items.length > 0) {
        try {
          await accountsAPI.linkContainer(clientId, {
            containerCode,
            mark,
            totalCBM: selectedContainer.totalCBM || 0,
            totalWeight: selectedContainer.totalWeight || 0,
            ctn: items.length,
            product: items.map(item => item.particular).join(", ").slice(0, 100),
            deliveryDate: selectedContainer.loadingDate,
          });
          toast.success("Container linked to client");
          loadClientContainers();
        } catch (error) {
          console.error("Failed to link container:", error);
        }
      }
    }
  };

  // Handle Add Transaction
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    
    if (!entry.particulars || !entry.amount) {
      return toast.error("Particulars and Amount are required");
    }

    try {
      const transactionData = {
        ...entry,
        transactionDate: entry.date,
        amount: parseFloat(entry.amount),
        paid: parseFloat(entry.paid) || 0,
        quantity: entry.quantity ? parseFloat(entry.quantity) : null,
        rate: entry.rate ? parseFloat(entry.rate) : null,
        paymentDate: entry.paymentDate || null,
      };

      await accountsAPI.addTransaction(clientId, transactionData);
      
      toast.success("Transaction added successfully");
      
      // Reset form
      setEntry({
        date: new Date().toISOString().split('T')[0],
        containerCode: "",
        containerMark: "",
        particulars: "",
        billingType: "cbm",
        quantity: "",
        rate: "",
        amount: 0,
        paid: "",
        paymentMode: "",
        paymentDate: "",
        paymentRef: "",
        fromAccount: "Main",
        toAccount: "Client",
        type: "EXPENSE",
        notes: "",
      });
      
      // Reload data
      loadTransactions();
      loadClientData();
    } catch (error) {
      toast.error(error.message || "Failed to add transaction");
    }
  };

  // Handle Delete Transaction
  const handleDeleteTransaction = async (transactionId) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;
    
    try {
      await accountsAPI.deleteTransaction(transactionId);
      toast.success("Transaction deleted");
      loadTransactions();
      loadClientData();
    } catch (error) {
      toast.error(error.message || "Failed to delete transaction");
    }
  };

  // Handle Export
  const handleExport = async () => {
    try {
      const blob = await accountsAPI.exportLedger(clientId, {
        startDate: dateRange.start,
        endDate: dateRange.end,
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${client?.name}_ledger_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error(error.message || "Failed to export");
    }
  };

  // Calculate totals
  const totals = useMemo(() => {
    return transactions.reduce(
      (acc, t) => ({
        expense: acc.expense + (t.type === 'EXPENSE' ? t.amount : 0),
        paid: acc.paid + (t.paid || 0),
        balance: acc.balance + t.balance,
      }),
      { expense: 0, paid: 0, balance: 0 }
    );
  }, [transactions]);

  if (loading && !client) return <div className="p-10 text-center">Loading...</div>;
  if (!client) return <div className="p-10 text-center">Client not found</div>;

  return (
    <div className="p-6 min-h-screen bg-gradient-to-b from-slate-50 to-white">


      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push("/dashboard/accounts/clients")}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Clients
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowLinkedContainers(!showLinkedContainers)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              {showLinkedContainers ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Linked Containers ({containers.length})
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <FileDown className="w-4 h-4" />
              Export Excel
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>
        </div>

        {/* Client Info Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">{client.name}</h1>
                  <div className="flex items-center gap-3 mt-1">
                    {client.location && (
                      <span className="text-slate-600">{client.location}</span>
                    )}
                    {client.phone && (
                      <span className="text-slate-500">• {client.phone}</span>
                    )}
                  </div>
                </div>
              </div>
              
              {client.gst && (
                <div className="mt-2 text-sm text-slate-500">
                  GST: {client.gst}
                </div>
              )}
            </div>
            
            <div className="text-right">
              <div className="text-sm text-slate-500">Balance Due</div>
              <div className={`text-3xl font-bold ${client.balance > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                ₹{client.balance?.toLocaleString()}
              </div>
              <div className="text-sm text-slate-500 mt-1">
                Last active: {new Date(client.lastActive).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Linked Containers Panel */}
        {showLinkedContainers && containers.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
            <h3 className="font-semibold text-slate-800 mb-3">Linked Containers</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {containers.map((container) => (
                <div key={container.id} className="border border-slate-200 rounded-lg p-3 hover:border-blue-300">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-slate-900">{container.containerCode}</div>
                      <div className="text-xs text-slate-500">{container.mark}</div>
                    </div>
                    <button
                      onClick={async () => {
                        if (confirm("Unlink this container?")) {
                          try {
                            await accountsAPI.unlinkContainer(container.id);
                            toast.success("Container unlinked");
                            loadClientContainers();
                          } catch (error) {
                            toast.error("Failed to unlink container");
                          }
                        }
                      }}
                      className="text-slate-300 hover:text-red-500"
                    >
                      <Unlink className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="text-slate-500">CBM: <span className="font-medium">{container.totalCBM}</span></div>
                    <div className="text-slate-500">CTN: <span className="font-medium">{container.ctn}</span></div>
                    <div className="col-span-2 text-slate-500 truncate">
                      Items: {container.product || "N/A"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Entry Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-blue-100 shadow-sm sticky top-6">
            <div className="bg-blue-50 px-5 py-3 border-b border-blue-100">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-600" />
                New Transaction
              </h2>
            </div>
            
            <form onSubmit={handleAddTransaction} className="p-5 space-y-4">
              {/* Container Auto-Suggest */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Container / Mark
                </label>
                <AutoSuggestInput
                  placeholder="Search container (e.g., PSDH-171)"
                  onSelect={handleContainerSelect}
                  fetchSuggestions={accountsAPI.getContainerSuggestions}
                  displayValue={(container) => `${container.containerCode} - ${container.origin || ''}`}
                  suggestionKey="containerCode"
                />
                {entry.containerCode && (
                  <div className="mt-1 text-xs text-blue-600 flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    Selected: {entry.containerCode} {entry.containerMark && `(${entry.containerMark})`}
                  </div>
                )}
              </div>

              {/* Date */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={entry.date}
                  onChange={(e) => setEntry({ ...entry, date: e.target.value })}
                  required
                />
              </div>

              {/* Particulars */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Particulars *
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Enter description (items from container will auto-suggest)"
                  value={entry.particulars}
                  onChange={(e) => setEntry({ ...entry, particulars: e.target.value })}
                  required
                />
              </div>

              {/* Calculation Section */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="flex items-center gap-4 mb-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={entry.billingType === 'cbm'}
                      onChange={() => setEntry({ ...entry, billingType: 'cbm' })}
                    />
                    <span className="text-sm">CBM</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={entry.billingType === 'weight'}
                      onChange={() => setEntry({ ...entry, billingType: 'weight' })}
                    />
                    <span className="text-sm">Weight</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={entry.billingType === 'flat'}
                      onChange={() => setEntry({ ...entry, billingType: 'flat' })}
                    />
                    <span className="text-sm">Flat</span>
                  </label>
                </div>

                {entry.billingType !== 'flat' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-500">
                        Qty ({entry.billingType})
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        className="w-full px-3 py-2 border rounded text-sm"
                        value={entry.quantity}
                        onChange={(e) => setEntry({ ...entry, quantity: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Rate (₹)</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border rounded text-sm"
                        value={entry.rate}
                        onChange={(e) => setEntry({ ...entry, rate: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Amount & Paid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border rounded-lg font-medium text-slate-900"
                    value={entry.amount}
                    onChange={(e) => setEntry({ ...entry, amount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Paid (₹)
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-green-200 rounded-lg"
                    placeholder="0"
                    value={entry.paid}
                    onChange={(e) => setEntry({ ...entry, paid: e.target.value })}
                  />
                </div>
              </div>

              {/* Payment Details */}
              {entry.paid > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-500">Payment Mode</label>
                      <select
                        className="w-full px-3 py-2 border rounded text-sm"
                        value={entry.paymentMode}
                        onChange={(e) => setEntry({ ...entry, paymentMode: e.target.value })}
                      >
                        <option value="">Select</option>
                        <option value="CASH">Cash</option>
                        <option value="CHEQUE">Cheque</option>
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                        <option value="UPI">UPI</option>
                        <option value="CARD">Card</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Payment Date</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border rounded text-sm"
                        value={entry.paymentDate}
                        onChange={(e) => setEntry({ ...entry, paymentDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Payment Reference</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded text-sm"
                      placeholder="Cheque/UTR No."
                      value={entry.paymentRef}
                      onChange={(e) => setEntry({ ...entry, paymentRef: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Notes
                </label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="Additional notes..."
                  value={entry.notes}
                  onChange={(e) => setEntry({ ...entry, notes: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Transaction
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Ledger Table */}
        <div className="lg:col-span-2">
          {/* Date Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">From</label>
                  <input
                    type="date"
                    className="px-3 py-2 border rounded text-sm"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">To</label>
                  <input
                    type="date"
                    className="px-3 py-2 border rounded text-sm"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  />
                </div>
                <button
                  onClick={loadTransactions}
                  className="mt-6 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded text-sm font-medium"
                >
                  Apply
                </button>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-500">Showing {transactions.length} transactions</div>
                <div className="text-xs text-slate-400">
                  Page {pagination.page} of {pagination.totalPages}
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                      Date & Container
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                      Particulars
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">
                      Paid
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">
                      Balance
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        <Calculator className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        No transactions found
                      </td>
                    </tr>
                  ) : (
                    transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3">
                          <div className="text-sm text-slate-900">
                            {new Date(transaction.transactionDate).toLocaleDateString()}
                          </div>
                          {transaction.containerCode && (
                            <div className="text-xs text-slate-500 flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              {transaction.containerCode}
                              {transaction.containerMark && ` (${transaction.containerMark})`}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-slate-900 whitespace-pre-wrap">
                            {transaction.particulars}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            {transaction.billingType !== 'flat' && (
                              <>
                                {transaction.quantity} {transaction.billingType} × ₹{transaction.rate}
                              </>
                            )}
                          </div>
                          {transaction.notes && (
                            <div className="text-xs text-slate-500 mt-1 italic">
                              {transaction.notes}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="text-sm font-medium text-slate-900">
                            ₹{transaction.amount.toLocaleString()}
                          </div>
                          <div className="text-xs text-slate-500">
                            {transaction.type}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {transaction.paid > 0 ? (
                            <>
                              <div className="text-sm font-medium text-green-700">
                                ₹{transaction.paid.toLocaleString()}
                              </div>
                              {transaction.paymentMode && (
                                <div className="text-xs text-slate-500">
                                  {transaction.paymentMode}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-sm text-slate-400">-</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className={`text-sm font-medium ${
                            transaction.balance > 0 ? 'text-amber-600' : 'text-green-600'
                          }`}>
                            ₹{transaction.balance.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDeleteTransaction(transaction.id)}
                            className="text-slate-300 hover:text-red-500 p-1"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-slate-500">
                  Total Transactions: {pagination.total}
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Total Expense</div>
                    <div className="text-lg font-bold text-slate-900">
                      ₹{totals.expense.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Total Paid</div>
                    <div className="text-lg font-bold text-green-700">
                      ₹{totals.paid.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-amber-100 px-4 py-2 rounded-lg border border-amber-200">
                    <div className="text-xs text-amber-800">Balance Due</div>
                    <div className="text-lg font-bold text-amber-900">
                      ₹{totals.balance.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <button
                    onClick={() => {
                      setPagination({ ...pagination, page: pagination.page - 1 });
                      loadTransactions();
                    }}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm text-slate-600">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => {
                      setPagination({ ...pagination, page: pagination.page + 1 });
                      loadTransactions();
                    }}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}