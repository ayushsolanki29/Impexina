import React, { Suspense } from "react";
import InvoiceClient from "./InvoiceClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">Loading...</div>
        </div>
      }
    >
      <InvoiceClient />
    </Suspense>
  );
}