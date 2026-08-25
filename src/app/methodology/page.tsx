import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { procurementMethods } from "@/domain/procurement/methodology";

export const metadata = { title: "Methodology" };

export default function PublicMethodologyPage() {
  return <main className="document-page"><header><Logo /><Link href="/"><ArrowLeft size={14} />Back to ProcureIQ</Link></header><article><span className="eyebrow">Explainable procurement analytics</span><h1>Methodology</h1><p className="document-lead">The formulas, assumptions and limitations behind ProcureIQ’s deterministic decision engine.</p>{procurementMethods.map((method, index) => <section key={method.name}><span>{String(index + 1).padStart(2, "0")}</span><div><h2>{method.name}</h2><p>{method.purpose}</p><code>{method.formula}</code><dl><dt>Assumptions</dt><dd>{method.assumptions}</dd><dt>Limitations</dt><dd>{method.limitation}</dd></dl></div></section>)}</article></main>;
}
