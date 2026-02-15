"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import API from "@/lib/api";
import { toast } from "sonner";

export default function PaymentCollectionRedirect() {
  const router = useRouter();

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        // Fetch existing sheets to find the most recent active one
        const response = await API.get("/accounts/collection?limit=1&status=ACTIVE");

        if (response.data.success && response.data.data.sheets && response.data.data.sheets.length > 0) {
          // Redirect to the first active sheet found
          const latestSheetId = response.data.data.sheets[0].id;
          router.replace(`/dashboard/accounts/collection/${latestSheetId}`);
        } else {
          // No active sheet found, create a new one
          const createResponse = await API.post("/accounts/collection/", {
            name: "Payment Collection Master",
            description: "Main payment collection tracking sheet",
            fiscalYear: "2024-2025",
            tags: ["master", "collection"],
          });

          if (createResponse.data.success) {
            router.replace(`/dashboard/accounts/collection/${createResponse.data.data.id}`);
          } else {
            toast.error("Failed to create collection sheet");
            router.push("/dashboard/accounts");
          }
        }
      } catch (error) {
        console.error("Error during redirect:", error);
        toast.error("Failed to load payment collection");
        router.push("/dashboard/accounts");
      }
    };

    handleRedirect();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
        <p className="text-slate-600 font-medium">Opening Payment Collection...</p>
      </div>
    </div>
  );
}
