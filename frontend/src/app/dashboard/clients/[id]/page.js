"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, Mail, Phone, MapPin, Building, Calendar } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { get } from "@/lib/api";

export default function ClientDetailPage() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClient();
  }, [id]);

  const fetchClient = async () => {
    try {
      setLoading(true);
      const res = await get(`/clients/${id}`);
      if (res.success) {
        setClient(res.data);
      }
    } catch (error) {
      toast.error("Failed to fetch client details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-slate-500">Loading...</div>;
  }

  if (!client) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/clients" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{client.name}</h1>
            <p className="text-slate-500">{client.companyName || 'No Company'}</p>
          </div>
        </div>
        <Link
          href={`/dashboard/clients/${id}/edit`}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
        >
          <Edit className="w-4 h-4" />
          Edit Client
        </Link>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact Info */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-semibold text-slate-900 mb-4">Contact Information</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-slate-600">
              <Mail className="w-4 h-4 mt-1" />
              <span>{client.email || 'No email provided'}</span>
            </div>
            <div className="flex items-start gap-3 text-slate-600">
              <Phone className="w-4 h-4 mt-1" />
              <span>{client.phone || 'No phone provided'}</span>
            </div>
          </div>
        </div>

        {/* Business Info */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-semibold text-slate-900 mb-4">Business Details</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-slate-600">
              <Building className="w-4 h-4 mt-1" />
              <div>
                <span className="block">{client.companyName || 'No company'}</span>
                {client.gstNumber && <span className="text-sm text-slate-400">GST: {client.gstNumber}</span>}
              </div>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-slate-500">Status</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 uppercase`}>
                    {client.status}
                </span>
            </div>
             <div className="flex items-center justify-between">
                <span className="text-slate-500">Type</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 uppercase`}>
                    {client.type}
                </span>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-semibold text-slate-900 mb-4">Address</h2>
          <div className="flex items-start gap-3 text-slate-600">
            <MapPin className="w-4 h-4 mt-1" />
            <div>
              <p>{client.address || 'No address provided'}</p>
              <p>{[client.city, client.state, client.country].filter(Boolean).join(', ')}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Notes */}
      {client.notes && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="font-semibold text-slate-900 mb-2">Notes</h2>
              <p className="text-slate-600 whitespace-pre-wrap">{client.notes}</p>
          </div>
      )}

      {/* Recent Activity / Loading Sheets (Placeholder for now) */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-4">Recent Activity</h2>
          <div className="text-center py-8 text-slate-500">
              No recent activity found.
          </div>
      </div>
    </div>
  );
}
