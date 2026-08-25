"use client";

import { BookOpen, ExternalLink } from "lucide-react";
import { Badge, PageHeading, Section } from "@/components/ui/primitives";
import { procurementMethods as methods } from "@/domain/procurement/methodology";

export function MethodologyModule() {
  return (
    <>
      <PageHeading eyebrow="Explain" title="Methodology" description="Every ProcureIQ recommendation is backed by a documented calculation, explicit assumptions and honest limitations." actions={<a className="button button-secondary button-small" href="/about/architecture"><ExternalLink size={14} />Architecture</a>} />
      <div className="methodology-intro"><BookOpen size={24} /><div><h2>Deterministic decision intelligence</h2><p>ProcureIQ does not use an LLM or external AI service. The same input always produces the same result, and every metric can be traced to transaction data and the formula below.</p></div><Badge tone="positive">No AI API</Badge></div>
      <div className="methodology-grid">{methods.map((method, index) => <Section key={method.name} title={`${String(index + 1).padStart(2, "0")} · ${method.name}`}><div className="method-card-body"><div><span>Purpose</span><p>{method.purpose}</p></div><div className="formula"><span>Formula / rule</span><code>{method.formula}</code></div><div><span>Assumptions</span><p>{method.assumptions}</p></div><div><span>Limitation</span><p>{method.limitation}</p></div></div></Section>)}</div>
    </>
  );
}
