import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export default function NotFoundPage() {
  return <main className="not-found-page"><Logo linked={false} /><span>404</span><h1>This procurement view does not exist.</h1><p>Return to the executive overview or open the public landing page.</p><div><Link className="button button-primary" href="/workspace/overview">Open overview</Link><Link className="button button-secondary" href="/">ProcureIQ home</Link></div></main>;
}
