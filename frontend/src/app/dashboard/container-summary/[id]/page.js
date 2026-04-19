"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import API from "@/lib/api";
import ContainerSummaryForm from "../_components/ContainerSummaryForm";
import { toast } from "sonner";

export default function ContainerSummaryPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/container-summaries/${id}`);
      if (res.data.success) setSummary(res.data.data);
    } catch (error) {
      console.error("Failed to load summary", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <div className="max-w-[1600px] mx-auto h-[calc(100vh-4rem)]">
        <ContainerSummaryForm
          initialData={summary}
          isEdit={true}
          onCancel={() => router.push("/dashboard/container-summary")}
          initialSearchParams={searchParams}
        />
      </div>
    </div>
  );
}
