import { notFound } from "next/navigation";
import { ModuleRouter } from "@/components/modules/module-router";
import { workspaceModules, type WorkspaceModule } from "@/components/layout/navigation";

export default async function WorkspaceModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  if (!workspaceModules.has(module as WorkspaceModule)) notFound();
  return <ModuleRouter module={module as WorkspaceModule} />;
}
