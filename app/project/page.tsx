"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { EstimateWorkspace } from "@/components/estimate/estimate-workspace";

function Inner() {
  const id = useSearchParams().get("p") ?? "";
  return <EstimateWorkspace projectId={id} />;
}

export default function ProjectEstimatePage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
