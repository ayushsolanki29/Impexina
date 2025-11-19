"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Search,
  Filter,
  X,
  CheckCircle,
  Clock,
  CreditCard,
  User,
  TrendingUp,
  Receipt,
  Plus,
  Calendar,
  DollarSign,
  AlertTriangle,
  Eye, 
  List, // For Ledger View
  ChevronDown, // Keep only one import
} from "lucide-react";

/* ------------------- mock data (SIMULATING PRISMA DATA) ------------------- */
const mockInvoices = [
  {
    id: "INV-001",
    invoiceNo: "INV-1001",
    clientName: "Alpha Corp",
    clientId: "C001",
    totalAmount: 125000.50,
    paidAmount: 0.00,
    balance: 125000.50,
    invoiceDate: "2025-11-15T00:00:00Z",
    dueDate: "2025-12-15T00:00:00Z",
    status: "PENDING",
    isOverdue: false,
  },
  {
    id: "INV-002",
    invoiceNo: "INV-1002",
    clientName: "Beta Distributors",
    clientId: "C002",
    totalAmount: 450000.00,
    paidAmount: 0.00,
    balance: 450000.00,
    invoiceDate: "2025-10-01T00:00:00Z",
    dueDate: "2025-11-01T00:00:00Z",
    status: "OVERDUE",
    isOverdue: true,
  },
  {
    id: "INV-003",
    invoiceNo: "INV-1003",
    clientName: "Gamma Retail",
    clientId: "C003",
    totalAmount: 75200.75,
    paidAmount: 75200.75,
    balance: 0.00,
    invoiceDate: "2025-11-20T00:00:00Z",
    dueDate: "2025-12-20T00:00:00Z",
    status: "PAID",
    isOverdue: false,
  },
  {
    id: "INV-004",
    invoiceNo: "INV-1004",
    clientName: "Alpha Corp",
    clientId: "C001",
    totalAmount: 32000.00,
    paidAmount: 16000.00,
    balance: 16000.00,
    invoiceDate: "2025-11-05T00:00:00Z",
    dueDate: "2025-11-05T00:00:00Z",
    status: "PARTIAL",
    isOverdue: false,
  },
];

const mockLedgerEntries = [
    { id: 'L001', type: 'PAYMENT', amount: 50000.00, client: 'Alpha Corp', date: '2025-11-20', ref: 'UPI-1234' },
    { id: 'L002', type: 'INVOICE', amount: 450000.00, client: 'Beta Distributors', date: '2025-10-01', ref: 'INV-1002' },
    { id: 'L003', type: 'ADJUSTMENT', amount: 500.00, client: 'Gamma Retail', date: '2025-11-25', ref: 'SYS-ADJ' },
];

const mockFinancialStats = [
    { title: 'Total Receivable', value: '₹6.00 L', icon: DollarSign, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { title: 'Overdue Invoices', value: '1', icon: AlertTriangle, color: 'text-orange-600', bgColor: 'bg-orange-50' },
    { title: 'Pending (30 days)', value: '2', icon: Clock, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { title: 'Total Paid YTD', value: '₹48.2 L', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50' },
];

/* ------------------- helpers ------------------- */
const formatCurrency = (amount) => `₹${(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatDate = (d) => {
  try {
    return new Date(d).toLocaleDateString('en-IN');
  } catch {
    return "N/A";
  }
};
const mockUser = { name: "Accounts User", id: "U-1234" };

const statusMap = {
  DRAFT: { label: "Draft", classes: "bg-gray-100 text-gray-700 border border-gray-300", icon: Clock },
  PENDING: { label: "Pending", classes: "bg-blue-100 text-blue-700 border border-blue-300", icon: Clock },
  SENT: { label: "Sent", classes: "bg-blue-100 text-blue-700 border border-blue-300", icon: CreditCard },
  PARTIAL: { label: "Partial Paid", classes: "bg-blue-100 text-blue-700 border border-blue-300", icon: CreditCard },
  PAID: { label: "Paid", classes: "bg-green-100 text-green-700 border border-green-300", icon: CheckCircle },
  OVERDUE: { label: "Overdue", classes: "bg-orange-100 text-orange-700 border border-orange-300", icon: AlertTriangle },
  CANCELLED: { label: "Cancelled", classes: "bg-red-100 text-red-700 border border-red-300", icon: X },
};

const ledgerTypeMap = {
    INVOICE: { label: "Invoice", icon: Receipt, color: "text-blue-600", bgColor: "bg-blue-50" },
    PAYMENT: { label: "Payment", icon: DollarSign, color: "text-green-600", bgColor: "bg-green-50" },
    ADJUSTMENT: { label: "Adjustment", icon: Clock, color: "text-gray-600", bgColor: "bg-gray-50" },
    CREDIT_NOTE: { label: "Credit Note", icon: CreditCard, color: "text-blue-600", bgColor: "bg-blue-50" },
};

// **FIXED COMPONENT: StatusTag is now globally available**
const StatusTag = ({ status }) => {
    const meta = statusMap[status] || { label: status, classes: "bg-gray-100 text-gray-800", icon: Clock };
    const Icon = meta.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${meta.classes}`}>
        <Icon className="w-3 h-3" />
        <span>{meta.label}</span>
      </span>
    );
};


/* ------------------- MAIN COMPONENT ------------------- */

export default function InvoiceManagement() {
  const user = mockUser;
  const authLoading = false; 

  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [ledgerEntries, setLedgerEntries] = useState([]); // State for Ledger Tab
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedInvoice, setSelectedInvoice] = useState(null); // For detail modal
  const [activeTab, setActiveTab] = useState('invoices'); // 'invoices' or 'ledger'

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError("");
      try {
        await new Promise((r) => setTimeout(r, 700));
        setInvoices(mockInvoices);
        setLedgerEntries(mockLedgerEntries); // Load ledger entries
      } catch (err) {
        setError("Failed to load data. Try again.");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetch();
    }
  }, []); 

  const visibleInvoices = useMemo(() => {
    let list = [...invoices];
    if (statusFilter !== "ALL") {
      list = list.filter((i) => i.status === statusFilter);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (i) =>
          i.invoiceNo.toLowerCase().includes(q) ||
          i.clientName.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime());
    return list;
  }, [invoices, query, statusFilter]);

  const visibleLedger = useMemo(() => {
    let list = [...ledgerEntries];
    // Filter logic for ledger could be added here (e.g., by type, client)
    if (query.trim()) {
        const q = query.toLowerCase();
        list = list.filter(
            (e) => 
                e.client.toLowerCase().includes(q) ||
                e.ref.toLowerCase().includes(q)
        );
    }
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return list;
  }, [ledgerEntries, query]);

  const updateInvoiceStatus = (id, newStatus) => {
    setInvoices((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: newStatus, isOverdue: newStatus === 'OVERDUE' } : i))
    );
  };
  
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-700">Authenticating...</div>
      </div>
    );
  }

  // --- UI Components ---

  const StatCard = ({ title, value, Icon, color, bgColor }) => (
    <div className="bg-white rounded-xl shadow-lg transition duration-300 p-6 border border-gray-100 hover:shadow-xl">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider truncate">{title}</p>
          <p className="text-3xl font-extrabold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`rounded-full ${bgColor} p-3 ml-4`}>
          {Icon && <Icon className={`w-6 h-6 ${color}`} />} 
        </div>
      </div>
    </div>
  );

  const InvoiceRow = ({ i }) => {
    const meta = statusMap[i.status] || statusMap['DRAFT'];
    const balanceDueClass = i.balance > 0 && i.isOverdue ? 'text-orange-600 font-extrabold' : 'text-gray-900 font-bold';

    return (
      <div 
        className={`bg-white rounded-xl border-l-4 p-4 grid items-center gap-4 cursor-pointer transition hover:shadow-lg ${i.isOverdue ? 'border-orange-500' : 'border-blue-500'}`}
        style={{ gridTemplateColumns: 'minmax(120px, 1fr) minmax(200px, 1.5fr) minmax(130px, 1fr) minmax(130px, 1fr) minmax(100px, 0.8fr) minmax(100px, 0.5fr)' }}
        onClick={() => setSelectedInvoice(i)}
      >
        {/* Column 1: Invoice Number */}
        <div className="min-w-0 pr-2">
          <div className="text-lg font-bold text-blue-700 truncate">{i.invoiceNo}</div>
          <p className="text-xs text-gray-500 truncate mt-0.5">ID: {i.id}</p>
        </div>
        
        {/* Column 2: Client & Dates */}
        <div className="min-w-0 pr-2">
          <div className="flex items-center text-sm font-semibold text-gray-800 truncate">
            <User className="w-3.5 h-3.5 text-gray-400 mr-1" />
            {i.clientName}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center">
            <Calendar className="w-3 h-3 text-gray-400 mr-1" />
            Due: {formatDate(i.dueDate)}
            {i.isOverdue && <span className="ml-2 text-orange-500 font-semibold">(OVERDUE)</span>}
          </p>
        </div>

        {/* Column 3: Total Amount */}
        <div className="flex flex-col space-y-0.5 text-sm">
            <span className="text-base text-gray-900 font-bold">{formatCurrency(i.totalAmount)}</span>
            <span className="text-xs text-gray-500">Total</span>
        </div>

        {/* Column 4: Balance Due */}
        <div className="flex flex-col space-y-0.5 text-sm">
            <span className={`text-xl ${balanceDueClass}`}>{formatCurrency(i.balance)}</span>
            <span className="text-xs text-gray-500">Balance Due</span>
        </div>

        {/* Column 5: Status Tag */}
        <div className="flex justify-center">
          <StatusTag status={i.status} />
        </div>
        
        {/* Column 6: Actions */}
        <div className="flex justify-end gap-2">
          <button
            title="Send WhatsApp Reminder"
            onClick={(e) => { e.stopPropagation(); alert(`Mock: Sending reminder for ${i.invoiceNo}`); }}
            className="p-2 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition border border-green-200"
          >
            <Receipt className="w-4 h-4" />
          </button>
          <button
            title="View Details"
            onClick={(e) => { e.stopPropagation(); setSelectedInvoice(i); }}
            className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition border border-blue-200"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };
  
  const LedgerRow = ({ e }) => {
    const meta = ledgerTypeMap[e.type] || ledgerTypeMap['ADJUSTMENT'];
    const Icon = meta.icon;
    const isCredit = e.type === 'PAYMENT';

    return (
        <div 
            className={`bg-white rounded-xl border-l-4 p-4 grid items-center gap-4 transition hover:shadow-md ${isCredit ? 'border-green-500' : 'border-blue-500'}`}
            style={{ gridTemplateColumns: 'minmax(120px, 1fr) minmax(200px, 1.5fr) minmax(130px, 1fr) minmax(130px, 1fr) minmax(100px, 0.5fr)' }}
        >
            {/* Column 1: Date */}
            <div className="min-w-0 pr-2">
                <div className="text-sm font-semibold text-gray-800">{formatDate(e.date)}</div>
                <p className="text-xs text-gray-500 truncate mt-0.5">Ref: {e.ref}</p>
            </div>
            
            {/* Column 2: Client */}
            <div className="min-w-0 pr-2 flex items-center">
                <User className="w-3.5 h-3.5 text-gray-400 mr-1" />
                <span className="text-sm font-medium text-gray-800 truncate">{e.client}</span>
            </div>

            {/* Column 3: Type */}
            <div className="flex justify-start">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${meta.bgColor} ${meta.color}`}>
                    <Icon className="w-3 h-3" />
                    {meta.label}
                </span>
            </div>

            {/* Column 4: Amount */}
            <div className="flex flex-col space-y-0.5 text-sm">
                <span className={`text-xl font-bold ${isCredit ? 'text-green-600' : 'text-blue-600'}`}>
                    {isCredit ? '+' : '-'} {formatCurrency(e.amount)}
                </span>
            </div>

            {/* Column 5: Actions */}
            <div className="flex justify-end gap-2">
                <button
                    title="View Details"
                    onClick={(event) => { event.stopPropagation(); alert(`Viewing details for Ledger Entry ${e.id}`); }}
                    className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition border border-blue-200"
                >
                    <Eye className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
  };
  
  // Reusable Dropdown Filter Component (defined outside for clarity)
  const DropdownFilter = ({ icon: Icon, value, onChange, options }) => (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-9 pr-8 py-2 border border-gray-300 rounded-full bg-white text-sm font-medium text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
    </div>
  );
  
  const TabButton = ({ name, icon: Icon, label }) => (
    <button
        onClick={() => { setActiveTab(name); setQuery(''); setStatusFilter('ALL'); }}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === name 
            ? 'bg-blue-600 text-white shadow-md' 
            : 'text-gray-700 hover:bg-gray-100'
        }`}
    >
        <Icon className="w-4 h-4" />
        {label}
    </button>
  );


  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      
      {/* HEADER */}
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-7 h-7 text-blue-600" /> Accounts & Finance
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {user.name}'s view: Manage invoices, payments, and ledger entries.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setLoading(true) || setTimeout(() => { setInvoices(mockInvoices); setLedgerEntries(mockLedgerEntries); setLoading(false); }, 500)}
              title="Refresh Data"
              className="p-3 rounded-full bg-white border border-gray-200 hover:bg-gray-100 transition shadow-sm"
            >
              <RefreshCw className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => console.log("Open create invoice modal")}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-full text-sm font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-200/50 flex items-center"
            >
              <Plus className="w-4 h-4 mr-1" /> New Invoice
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* 1. FINANCIAL STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {mockFinancialStats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        {/* 2. TABS */}
        <div className="flex space-x-4 mb-6 border-b border-gray-300">
            <TabButton name="invoices" icon={Receipt} label="Invoices" />
            <TabButton name="ledger" icon={List} label="Ledger Entries" />
        </div>

        {/* 3. CONTROLS (Unified Filter Bar) */}
        <div className="mb-6 bg-white p-4 rounded-xl shadow-lg border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={activeTab === 'invoices' ? "Search by invoice # or client name..." : "Search by client or reference #..."}
                className="pl-10 pr-4 py-2 w-full rounded-full border border-gray-300 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
              />
            </div>

            {/* Status Filter Dropdown (Only for Invoices) */}
            {activeTab === 'invoices' && (
                <div className="flex gap-3">
                    <DropdownFilter 
                        icon={Filter} 
                        value={statusFilter} 
                        onChange={setStatusFilter}
                        options={[
                          { value: "ALL", label: "All Statuses" },
                          ...Object.keys(statusMap).map(key => ({ value: key, label: statusMap[key].label }))
                        ]}
                      />
                </div>
            )}
            {/* Action button in filter bar (Only for Ledger) */}
            {activeTab === 'ledger' && (
                <button
                    onClick={() => console.log("Open record payment modal")}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-full text-sm font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-200/50 flex items-center"
                >
                    <DollarSign className="w-4 h-4 mr-1" /> Record Payment
                </button>
            )}
          </div>
        </div>

        {/* 4. CONTENT */}
        <section>
          {loading ? (
            // Skeleton Loader
            <div className="space-y-4">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="animate-pulse bg-white rounded-xl p-6 border border-gray-100 shadow-md h-20"
                />
              ))}
            </div>
          ) : (
            // List View based on activeTab
            <div className="space-y-4">
                {activeTab === 'invoices' && (
                    <>
                        {/* Invoice Header */}
                        <div 
                            className="hidden lg:grid text-xs font-semibold uppercase text-gray-500 px-4 pb-2"
                            style={{ gridTemplateColumns: 'minmax(120px, 1fr) minmax(200px, 1.5fr) minmax(130px, 1fr) minmax(130px, 1fr) minmax(100px, 0.8fr) minmax(100px, 0.5fr)' }}
                        >
                            <div>Invoice # / ID</div>
                            <div>Client / Due Date</div>
                            <div>Total Amount</div>
                            <div>Balance Due</div>
                            <div className="text-center">Status</div>
                            <div className="text-right">Actions</div>
                        </div>

                        {visibleInvoices.length === 0 ? (
                            <div className="bg-white p-10 rounded-xl border border-gray-100 shadow-lg text-center text-base text-gray-500">
                              <Receipt className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                              No invoices found matching the criteria.
                            </div>
                        ) : (
                            <div className="grid gap-4">
                              {visibleInvoices.map((i) => (<InvoiceRow key={i.id} i={i} />))}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'ledger' && (
                    <>
                        {/* Ledger Header */}
                        <div 
                            className="hidden lg:grid text-xs font-semibold uppercase text-gray-500 px-4 pb-2"
                            style={{ gridTemplateColumns: 'minmax(120px, 1fr) minmax(200px, 1.5fr) minmax(130px, 1fr) minmax(130px, 1fr) minmax(100px, 0.5fr)' }}
                        >
                            <div>Date / Reference</div>
                            <div>Client</div>
                            <div>Type</div>
                            <div>Amount</div>
                            <div className="text-right">Actions</div>
                        </div>
                        
                        {visibleLedger.length === 0 ? (
                            <div className="bg-white p-10 rounded-xl border border-gray-100 shadow-lg text-center text-base text-gray-500">
                                <List className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                                No ledger entries found matching the criteria.
                            </div>
                        ) : (
                            <div className="grid gap-4">
                              {visibleLedger.map((e) => (<LedgerRow key={e.id} e={e} />))}
                            </div>
                        )}
                    </>
                )}
            </div>
          )}
        </section>
      </main>

      {/* INVOICE DETAIL MODAL */}
      {selectedInvoice && (
        <InvoiceDetailModal 
            invoice={selectedInvoice} 
            onClose={() => setSelectedInvoice(null)} 
            onUpdateStatus={updateInvoiceStatus}
        />
      )}
    </div>
  );
}

// --- MODALS AND HELPERS ---

const InvoiceDetailModal = ({ invoice, onClose, onUpdateStatus }) => {
    
    // Mock details for the modal
    const mockItems = [
        { itemName: "Loading Sheet PSDH-87 Fee", quantity: 1, unitPrice: 100000.00, totalPrice: 100000.00 },
        { itemName: "Bifurcation Service Fee", quantity: 1, unitPrice: 20000.00, totalPrice: 20000.00 },
    ];
    
    // Mock Ledger history
    const mockLedger = [
        { type: 'INVOICE', amount: invoice.totalAmount, date: invoice.invoiceDate, balance: invoice.totalAmount },
        { type: 'PAYMENT', amount: 50000.00, date: new Date().toISOString(), balance: invoice.totalAmount - 50000.00 }
    ].filter(entry => invoice.status === 'PARTIAL' ? true : entry.type === 'INVOICE');
    
    const currentBalance = invoice.balance;

    const handleAction = (action) => {
        if (action === 'mark_paid') {
            onUpdateStatus(invoice.id, 'PAID');
            onClose();
        } else if (action === 'send_whatsapp') {
            alert(`Mock: Sending detailed WhatsApp for ${invoice.invoiceNo}`);
        } else {
            alert(`Action: ${action} for ${invoice.invoiceNo}`);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative max-w-5xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{invoice.invoiceNo}</h2>
                        <p className="text-sm text-gray-500 mt-1">Client: {invoice.clientName} | Issued: {formatDate(invoice.invoiceDate)}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        {/* FIX: StatusTag is now globally available */}
                        <StatusTag status={invoice.status} />
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><X className="w-5 h-5" /></button>
                    </div>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                    
                    {/* Summary & Actions Row */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        
                        {/* Summary Card */}
                        <div className="md:col-span-2 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                            <p className="text-sm text-blue-700 font-medium">TOTAL DUE</p>
                            <p className="text-4xl font-extrabold text-blue-900 mt-1">{formatCurrency(currentBalance)}</p>
                            <p className="text-xs text-gray-500 mt-2">Original: {formatCurrency(invoice.totalAmount)} | Due Date: {formatDate(invoice.dueDate)}</p>
                        </div>
                        
                        {/* Quick Actions */}
                        <div className="md:col-span-2 grid grid-cols-2 gap-3">
                            <button onClick={() => handleAction('mark_paid')} disabled={invoice.status === 'PAID' || currentBalance === 0} className="py-3 px-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50">
                                Mark Fully Paid
                            </button>
                            <button onClick={() => handleAction('record_payment')} className="py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
                                Record Payment
                            </button>
                            <button onClick={() => handleAction('send_whatsapp')} className="py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition border">
                                Send Reminder
                            </button>
                            <button onClick={() => handleAction('download')} className="py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition border">
                                Download PDF
                            </button>
                        </div>
                    </div>
                    
                    {/* Invoice Items & Ledger */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Left: Invoice Items */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold text-gray-800">Invoice Items</h3>
                            <div className="divide-y border rounded-xl">
                                <div className="grid grid-cols-4 text-xs font-semibold uppercase text-gray-500 bg-gray-50 p-3 rounded-t-xl">
                                    <div className="col-span-2">Item/Description</div>
                                    <div className="text-center">Quantity</div>
                                    <div className="text-right">Total Price</div>
                                </div>
                                {mockItems.map((item, index) => (
                                    <div key={index} className="grid grid-cols-4 text-sm p-3 hover:bg-gray-50">
                                        <div className="col-span-2 font-medium text-gray-900">{item.itemName}</div>
                                        <div className="text-center text-gray-600">{item.quantity}</div>
                                        <div className="text-right font-semibold text-gray-800">{formatCurrency(item.totalPrice)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right: Ledger/Payment History */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold text-gray-800">Ledger History</h3>
                            <div className="divide-y border rounded-xl">
                                <div className="grid grid-cols-3 text-xs font-semibold uppercase text-gray-500 bg-gray-50 p-3 rounded-t-xl">
                                    <div>Date</div>
                                    <div>Type</div>
                                    <div className="text-right">Amount</div>
                                </div>
                                {mockLedger.map((entry, index) => (
                                    <div key={index} className="grid grid-cols-3 text-sm p-3 hover:bg-gray-50">
                                        <div className="text-gray-600">{formatDate(entry.date)}</div>
                                        <div className={`font-semibold ${entry.type === 'INVOICE' ? 'text-blue-600' : 'text-green-600'}`}>{entry.type}</div>
                                        <div className="text-right font-bold">{formatCurrency(entry.amount)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};