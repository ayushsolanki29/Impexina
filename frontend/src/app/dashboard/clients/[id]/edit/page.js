"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { get } from "@/lib/api";
import ClientForm from "../../_components/ClientForm";

export default function EditClientPage() {
  const { id } = useParams();
  const router = useRouter();
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
      } else {
        toast.error("Client not found");
        router.push("/dashboard/clients");
      }
    } catch (error) {
      toast.error("Failed to fetch client details");
      router.push("/dashboard/clients");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-slate-500">Loading...</div>;
  }

  if (!client) return null;

  return <ClientForm initialData={client} mode="edit" />;
}
