"use client";
import ContainerSummaryEditor from "@/components/ContainerSummaryEditor";
import { useParams } from "next/navigation";

export default function EditContainerSummary() {
  const params = useParams();
  return <ContainerSummaryEditor />;
}