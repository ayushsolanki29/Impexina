"use client";
import React from "react";
import { useRouter } from "next/navigation";
import ContainerSummaryForm from "../_components/ContainerSummaryForm";

export default function CreateContainerSummary() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <div className="max-w-[1600px] mx-auto h-[calc(100vh-4rem)]">
        <ContainerSummaryForm
          isCreate={true}
          isEdit={true}
          onCancel={() => router.push("/dashboard/container-summary")}
        />
      </div>
    </div>
  );
}
