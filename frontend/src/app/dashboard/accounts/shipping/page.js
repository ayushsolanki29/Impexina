"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Ship } from "lucide-react";
import API from "@/lib/api";
import { toast } from "sonner";

export default function ShippingRedirect() {
  const router = useRouter();

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        // 1. Try to find an existing active sheet (PLANNED, LOADING, IN_TRANSIT, ARRIVED are all active-ish)
        // The API returns sheets sorted by date usually. We'll take the most recent non-archived one.
        const response = await API.get('/accounts/shipping?page=1&limit=10');

        // Filter out ARCHIVED (CANCELLED) if any, though the API returns according to status filter usually.
        // For shipping, they use "CANCELLED" for archived.
        const activeSheet = response.data?.data?.sheets?.find(s => s.status !== "CANCELLED");

        if (activeSheet) {
          // 2. Redirect to existing active sheet
          router.replace(`/dashboard/accounts/shipping/${activeSheet.id}`);
        } else {
          // 3. Create a new "Shipping Matrix Master" sheet if none exists
          const newSheetResponse = await API.post("/accounts/shipping/", {
            name: `Shipping Matrix Master`,
            description: "Primary Logistics & Container Tracking Ledger",
            fiscalYear: "2024-2025",
            tags: ["shipping", "master"]
          });

          if (newSheetResponse.data?.success) {
            router.replace(`/dashboard/accounts/shipping/${newSheetResponse.data.data.id}`);
          }
        }
      } catch (error) {
        console.error("Redirect Error:", error);
        toast.error("Failed to access Shipping ledger");
        router.replace("/dashboard/accounts");
      }
    };

    handleRedirect();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center text-center max-w-sm w-full">
        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 border border-indigo-100">
          <Ship className="w-8 h-8 text-indigo-600 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Opening Shipping Matrix</h2>
        <p className="text-slate-500 text-sm mb-6">Preparing logistics data and container costs...</p>
        <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest">
          <Loader2 className="w-4 h-4 animate-spin" />
          Synchronizing
        </div>
      </div>
    </div>
  );
}