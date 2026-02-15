"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Globe } from "lucide-react";
import API from "@/lib/api";
import { toast } from "sonner";

export default function PartnerRedirect({ partner = "David", prefix = "DAVID", partnerPath = "david" }) {
  const router = useRouter();

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const response = await API.get('/accounts/david?page=1&limit=20');
        const sheets = response.data?.data?.sheets || [];
        
        // Find most recent sheet for this partner
        const partnerSheets = sheets
          .filter(s => s.name.toUpperCase().startsWith(prefix) && s.status !== "ARCHIVED")
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        if (partnerSheets.length > 0) {
          // Redirect to the most recent active sheet
          router.replace(`/dashboard/accounts/${partnerPath}/${partnerSheets[0].id}`);
        } else {
          // Create new sheet
          const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
          const now = new Date();
          const sheetName = `${prefix} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;
          
          const newSheetResponse = await API.post("/accounts/david/", {
            name: sheetName,
            description: `Monthly ledger for ${partner}`,
            tags: ["forex", "ledger", partner.toLowerCase()]
          });

          if (newSheetResponse.data?.success) {
            router.replace(`/dashboard/accounts/${partnerPath}/${newSheetResponse.data.data.id}`);
          }
        }
      } catch (error) {
        console.error("Redirect Error:", error);
        toast.error(`Failed to access ${partner} accounts`);
        router.replace("/dashboard/accounts");
      }
    };

    handleRedirect();
  }, [router, partner, prefix, partnerPath]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center text-center max-w-sm w-full">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 border border-blue-100">
          <Globe className="w-8 h-8 text-blue-600 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Opening {partner}'s Ledger</h2>
        <p className="text-slate-500 text-sm mb-6">Synchronizing multi-currency records...</p>
        <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest">
          <Loader2 className="w-4 h-4 animate-spin" />
          Synchronizing
        </div>
      </div>
    </div>
  );
}
