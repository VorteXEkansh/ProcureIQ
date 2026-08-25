import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export const metadata = { title: "About" };

export default function AboutPage() {
  return <main className="document-page"><header><Logo /><Link href="/"><ArrowLeft size={14} />Back to ProcureIQ</Link></header><article><span className="eyebrow">Portfolio context</span><h1>About ProcureIQ</h1><p className="document-lead">A portfolio-grade exploration of the intersection between Production &amp; Industrial Engineering, procurement, operations research, cost engineering and management decision support.</p><div className="about-principles"><div><span>01</span><h2>Business problem</h2><p>Procurement teams often have transaction data but lack a connected, explainable workflow from spend visibility to a sourcing decision.</p></div><div><span>02</span><h2>Product response</h2><p>ProcureIQ combines spend analytics, supplier evaluation, TCO, should-cost, RFQ normalization, constrained optimization and what-if analysis in one local workspace.</p></div><div><span>03</span><h2>Transparent context</h2><p>Asteron Components Pvt. Ltd. and every supplier are fictional. No claim is made that this project is used by a real business.</p></div></div><div className="document-actions"><Link className="button button-primary" href="/workspace/overview">Open demo workspace <ArrowRight size={15} /></Link><Link className="button button-secondary" href="/about/architecture">View architecture</Link></div></article></main>;
}
