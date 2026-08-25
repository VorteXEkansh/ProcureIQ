import { Suspense } from "react";
import { WorkspaceFrame } from "@/components/layout/workspace-frame";
import { WorkspaceProvider } from "@/stores/workspace-store";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceProvider><Suspense fallback={<div className="workspace-loading">Preparing ProcureIQ workspace…</div>}><WorkspaceFrame>{children}</WorkspaceFrame></Suspense></WorkspaceProvider>;
}
