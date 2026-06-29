"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ProjectForm } from "@/components/projects/project-form";
import { useStore } from "@/components/store/store-provider";
import { Button } from "@/components/ui/button";

function Inner() {
  const id = useSearchParams().get("p") ?? "";
  const { getProject } = useStore();
  const project = getProject(id);

  if (!project) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
        <p className="text-sm text-muted">This project could not be found.</p>
        <Link href="/projects">
          <Button variant="outline" size="sm">Back to projects</Button>
        </Link>
      </div>
    );
  }
  return <ProjectForm project={project} />;
}

export default function EditProjectPage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
