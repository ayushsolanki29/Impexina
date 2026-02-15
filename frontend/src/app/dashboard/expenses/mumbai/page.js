"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import API from "@/lib/api";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function MumbaiLedgerRedirect() {
  const router = useRouter();

  useEffect(() => {
    const findLatestOrNew = async () => {
      try {
        const response = await API.get("/expenses/mumbai-ledger?limit=1&status=ACTIVE");
        if (response.data.success && response.data.data.ledgers.length > 0) {
          router.replace(`/dashboard/expenses/mumbai/${response.data.data.ledgers[0].id}`);
        } else {
          // Create new one if none active
          const now = new Date();
          const timestamp = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const createResponse = await API.post("/expenses/mumbai-ledger", {
            name: `ML - ${now.toLocaleDateString('en-IN')} ${timestamp}`,
            description: "Direct Open Session",
            month: now.getMonth() + 1,
            year: now.getFullYear(),
          });
          if (createResponse.data.success) {
            router.replace(`/dashboard/expenses/mumbai/${createResponse.data.data.id}`);
          } else {
            toast.error(createResponse.data.message || "Initializing failed");
            router.replace("/dashboard/expenses/mumbai/list");
          }
        }
      } catch (error) {
        console.error("Redirect error:", error);
        toast.error(error.response?.data?.message || "Direct open failed. Redirecting to registry...");
        router.replace("/dashboard/expenses/mumbai/list");
      }
    };

    findLatestOrNew();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
      <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse italic">
        Direct Opening Mumbai Registry...
      </h2>
    </div>
  );
}
