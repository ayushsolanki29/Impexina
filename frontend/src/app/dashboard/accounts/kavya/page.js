"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Package } from "lucide-react";
import { kavyaAPI } from "@/services/kavya.service";
import { toast } from "sonner";

export default function KavyaRedirect() {
  const router = useRouter();

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        // 1. Try to find existing active sheets
        const params = {
          page: 1,
          limit: 10,
          status: "ACTIVE"
        };
        const response = await kavyaAPI.getSheets(params);
        const activeSheet = response.data?.data?.sheets?.[0];

        if (activeSheet) {
          // 2. Redirect to existing active sheet
          router.replace(`/dashboard/accounts/kavya/${activeSheet.id}`);
        } else {
          // 3. Create a new sheet if none exists
          const titleData = await kavyaAPI.generateDefaultTitle();
          const defaultTitle = titleData.data.data.title;

          const newSheet = await kavyaAPI.createSheet({
            title: defaultTitle,
          });

          if (newSheet.data?.success) {
            router.replace(`/dashboard/accounts/kavya/${newSheet.data.data.id}`);
          }
        }
      } catch (error) {
        console.error("Redirect Error:", error);
        toast.error("Failed to access Kavya Ledger");
        router.replace("/dashboard/accounts");
      }
    };

    handleRedirect();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center text-center max-w-sm w-full">
        <div className="w-16 h-16 bg-pink-50 rounded-2xl flex items-center justify-center mb-6 border border-pink-100">
          <Package className="w-8 h-8 text-pink-600 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Opening Kavya Accounts</h2>
        <p className="text-slate-500 text-sm mb-6">Accessing container-wise logistics ledgers...</p>
        <div className="flex items-center gap-2 text-pink-600 font-bold text-xs uppercase tracking-widest">
          <Loader2 className="w-4 h-4 animate-spin" />
          Synchronizing
        </div>
      </div>
    </div>
  );
}
