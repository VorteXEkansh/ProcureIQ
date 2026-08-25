import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

export function PageHeading({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description: string; actions?: ReactNode }) {
  return (
    <header className="page-heading">
      <div>{eyebrow ? <span className="page-eyebrow">{eyebrow}</span> : null}<h1>{title}</h1><p>{description}</p></div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  );
}

export function Kpi({ label, value, delta, tone = "neutral", note }: { label: string; value: string; delta?: number; tone?: "neutral" | "positive" | "warning" | "critical"; note?: string }) {
  const DeltaIcon = delta === undefined || delta === 0 ? Minus : delta > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <article className={`kpi kpi-${tone}`}>
      <span>{label}</span>
      <strong className="numeric">{value}</strong>
      {delta !== undefined ? <small className={delta > 0 ? "delta-up" : delta < 0 ? "delta-down" : ""}><DeltaIcon size={13} />{Math.abs(delta).toFixed(1)}% <em>vs prior period</em></small> : note ? <small>{note}</small> : null}
    </article>
  );
}

export function Section({ title, description, action, children, className = "" }: { title: string; description?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`panel ${className}`.trim()}>
      <header className="panel-heading"><div><h2>{title}</h2>{description ? <p>{description}</p> : null}</div>{action}</header>
      {children}
    </section>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "positive" | "warning" | "critical" | "info" | "gold" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-mark" /><h3>{title}</h3><p>{description}</p>{action}</div>;
}

export function ProgressBar({ value, tone = "brand", label }: { value: number; tone?: "brand" | "gold" | "positive" | "critical"; label?: string }) {
  return <div className="progress-wrap" aria-label={label ?? `${value.toFixed(1)} percent`}><span className={`progress progress-${tone}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}
