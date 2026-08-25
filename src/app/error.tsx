"use client";

import { AlertTriangle } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="error-page"><AlertTriangle size={30} /><h1>ProcureIQ could not complete this view.</h1><p>Your local workspace has not been deleted. Try the view again or use Reset Workspace from Settings if local data is corrupted.</p><button className="button button-primary" onClick={reset}>Try again</button></main>;
}
