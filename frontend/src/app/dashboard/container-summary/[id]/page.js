"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import API from "@/lib/api";
import ContainerSummaryForm from "../_components/ContainerSummaryForm";

export default function ContainerSummaryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/container-summaries/${id}`);
      if (res.data.success) {
        setSummary(res.data.data);
      }
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
          isEdit={isEditing}
          onCancel={() => {
            if (isEditing) {
              setIsEditing(false);
              fetchData();
            } else {
              router.push("/dashboard/container-summary");
            }
          }}
        />

        {!isEditing && (
          <div className="fixed bottom-12 right-12 flex gap-4 z-[200]">
            <button
              onClick={() => setIsEditing(true)}
              className="px-10 py-4 bg-indigo-600 text-white rounded-full font-black shadow-[0_20px_50px_rgba(79,70,229,0.3)] hover:bg-indigo-700 transition-all hover:scale-110 active:scale-95 flex items-center gap-3 uppercase tracking-widest text-xs"
            >
              UNLOCK & EDIT EXCEL
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
