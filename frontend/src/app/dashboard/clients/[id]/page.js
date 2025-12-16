"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  Building2, 
  Briefcase,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { Toaster, toast } from "sonner";

export default function RecordDetail() {
  const router = useRouter();
  const { id } = useParams();
  
  const [data, setData] = useState({
    id: "",
    type: "lead", // or client
    name: "",
    contact: "",
    phone: "",
    email: "",
    city: "",
    address: "",
    gst: "",
    status: "New",
    notes: ""
  });

  const [loading, setLoading] = useState(true);

  // Load Record
  useEffect(() => {
    // If ID is 'new', we just stop loading
    if (id === 'new') {
        setLoading(false);
        setData(prev => ({...prev, id: `rec_${Date.now()}`}));
        return;
    }

    // Otherwise fetch from storage
    const allRecords = JSON.parse(localStorage.getItem("igpl_crm_records") || "[]");
    const found = allRecords.find(r => r.id === id);
    if (found) {
        setData(found);
    } else {
        toast.error("Record not found");
        router.push('/dashboard/clients');
    }
    setLoading(false);
  }, [id, router]);

  // Save Record
  const handleSave = (e) => {
    e.preventDefault();
    const allRecords = JSON.parse(localStorage.getItem("igpl_crm_records") || "[]");
    
    let updatedRecords;
    if (id === 'new') {
        updatedRecords = [data, ...allRecords];
    } else {
        updatedRecords = allRecords.map(r => r.id === id ? data : r);
    }

    localStorage.setItem("igpl_crm_records", JSON.stringify(updatedRecords));
    toast.success("Record saved successfully");
    if (id === 'new') router.push('/dashboard/clients');
  };

  const convertToClient = () => {
     if(confirm("Promote this Lead to an Active Client?")) {
        setData(prev => ({...prev, type: 'client', status: 'Active'}));
        toast.success("Lead promoted to Client!");
     }
  }

  const handleDelete = () => {
    if(confirm("Permanently delete this record?")) {
        const allRecords = JSON.parse(localStorage.getItem("igpl_crm_records") || "[]");
        const filtered = allRecords.filter(r => r.id !== id);
        localStorage.setItem("igpl_crm_records", JSON.stringify(filtered));
        toast.success("Record deleted");
        router.push('/dashboard/clients');
    }
  }

  if (loading) return <div className="p-10">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex justify-center">
      <div className="w-full max-w-4xl">
         <Toaster position="top-center" />
         
         {/* Top Navigation */}
         <div className="flex items-center justify-between mb-6">
            <button 
                onClick={() => router.push('/dashboard/clients')}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Back to List
            </button>

            <div className="flex gap-3">
               {data.id !== 'new' && (
                  <button 
                    type="button"
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
               )}
            </div>
         </div>

         <form onSubmit={handleSave}>
             {/* Header Card */}
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-inner ${
                        data.type === 'client' 
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' 
                            : 'bg-gradient-to-br from-amber-400 to-amber-500 text-white'
                    }`}>
                        {data.name ? data.name.charAt(0) : <Briefcase className="w-8 h-8 opacity-50" />}
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <input 
                                required
                                className="text-2xl font-bold text-slate-900 placeholder:text-slate-300 outline-none bg-transparent w-full md:w-auto focus:border-b-2 focus:border-slate-900 transition-all"
                                placeholder="Company / Person Name"
                                value={data.name}
                                onChange={e => setData({...data, name: e.target.value})}
                            />
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                             <select 
                                className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded border outline-none cursor-pointer ${
                                    data.type === 'client' 
                                        ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                                value={data.type}
                                onChange={e => setData({...data, type: e.target.value})}
                             >
                                <option value="lead">Lead</option>
                                <option value="client">Client</option>
                             </select>
                             
                             <span className="text-slate-300">|</span>
                             
                             <select
                                className="text-sm font-medium text-slate-600 bg-transparent outline-none cursor-pointer hover:text-slate-900"
                                value={data.status}
                                onChange={e => setData({...data, status: e.target.value})}
                             >
                                <option>New</option>
                                <option>Contacted</option>
                                <option>Negotiating</option>
                                <option>Active</option>
                                <option>Inactive</option>
                             </select>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    {data.type === 'lead' && id !== 'new' && (
                        <button 
                            type="button"
                            onClick={convertToClient}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-sm transition-all"
                        >
                            <CheckCircle2 className="w-4 h-4" /> Convert to Client
                        </button>
                    )}
                    <button 
                        type="submit"
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg shadow-lg transition-all"
                    >
                        <Save className="w-4 h-4" /> Save Changes
                    </button>
                </div>
             </div>

             {/* Details Grid */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Contact Info Column */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-slate-500" /> 
                            Basic Information
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1 block">Primary Contact Person</label>
                                <div className="relative">
                                    <input 
                                        className="w-full pl-3 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-200 outline-none"
                                        placeholder="e.g. Rahul Verma"
                                        value={data.contact}
                                        onChange={e => setData({...data, contact: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1 block">GST Number</label>
                                <input 
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-200 outline-none font-mono uppercase"
                                    placeholder="24AAAAA0000A1Z5"
                                    value={data.gst}
                                    onChange={e => setData({...data, gst: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1 block">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="tel"
                                        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-200 outline-none"
                                        placeholder="+91 98765 43210"
                                        value={data.phone}
                                        onChange={e => setData({...data, phone: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1 block">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="email"
                                        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-200 outline-none"
                                        placeholder="name@company.com"
                                        value={data.email}
                                        onChange={e => setData({...data, email: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-slate-500" /> 
                            Address & Location
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                             <div className="col-span-1">
                                <label className="text-xs font-semibold text-slate-500 mb-1 block">City</label>
                                <input 
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-200 outline-none"
                                    placeholder="Surat"
                                    value={data.city}
                                    onChange={e => setData({...data, city: e.target.value})}
                                />
                             </div>
                             <div className="col-span-2">
                                <label className="text-xs font-semibold text-slate-500 mb-1 block">Full Address</label>
                                <input 
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-200 outline-none"
                                    placeholder="Shop No. 4, Market Yard..."
                                    value={data.address}
                                    onChange={e => setData({...data, address: e.target.value})}
                                />
                             </div>
                        </div>
                    </div>
                </div>

                {/* Notes Column */}
                <div className="md:col-span-1">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full flex flex-col">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-500" /> 
                            Internal Notes
                        </h3>
                        <textarea 
                            className="flex-1 w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-200 outline-none resize-none bg-yellow-50/50"
                            placeholder="Add notes about this client/lead here..."
                            value={data.notes}
                            onChange={e => setData({...data, notes: e.target.value})}
                        />
                        <div className="mt-3 text-xs text-slate-400">
                           Notes are private and only visible to your team.
                        </div>
                    </div>
                </div>

             </div>
         </form>
      </div>
    </div>
  );
}

// Helper Icon for notes
function FileText({ className }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/>
            <line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/>
        </svg>
    )
}