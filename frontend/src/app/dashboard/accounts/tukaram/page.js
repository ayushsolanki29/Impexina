"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, FolderOpen } from "lucide-react";
import { tukaramAPI } from "@/services/tukaram.service";
import { toast } from "sonner";

export default function TukaramRedirect() {
  const router = useRouter();

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        // 1. Try to find an existing active sheet
        const response = await tukaramAPI.getSheets({
          status: "ACTIVE",
          limit: 1
        });

        const activeSheet = response.data?.data?.sheets?.[0];

        if (activeSheet) {
          // 2. Redirect to existing active sheet
          router.replace(`/dashboard/accounts/tukaram/${activeSheet.id}`);
        } else {
          // 3. Create a new "TukaramJI Master" sheet if none exists
          const titleData = await tukaramAPI.generateDefaultTitle();
          const defaultTitle = titleData.data?.data?.title || "TukaramJI Master";

          const newSheetResponse = await tukaramAPI.createSheet({
            title: defaultTitle,
            description: "Primary TukaramJI Collection Ledger",
            status: "ACTIVE"
          });

          if (newSheetResponse.data?.success) {
            router.replace(`/dashboard/accounts/tukaram/${newSheetResponse.data.data.id}`);
          }
        }
      } catch (error) {
        console.error("Redirect Error:", error);
        toast.error("Failed to access TukaramJI ledger");
        router.replace("/dashboard/accounts");
      }
    };

    handleRedirect();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center text-center max-w-sm w-full">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 border border-blue-100">
          <FolderOpen className="w-8 h-8 text-blue-600 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Opening TukaramJI Ledger</h2>
        <p className="text-slate-500 text-sm mb-6">Please wait while we prepare your account sheet...</p>
        <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest">
          <Loader2 className="w-4 h-4 animate-spin" />
          Synchronizing
        </div>
      </div>
    </div>
  );
}
