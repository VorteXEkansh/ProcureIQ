import Link from "next/link";

interface LogoProps {
  compact?: boolean;
  inverse?: boolean;
  linked?: boolean;
  className?: string;
}

function Mark({ inverse = false }: { inverse?: boolean }) {
  const ink = inverse ? "#F4F7F4" : "#143F3A";
  const accent = inverse ? "#D9A441" : "#B57A18";
  return (
    <svg viewBox="0 0 44 44" role="img" aria-label="ProcureIQ" width="38" height="38">
      <rect width="44" height="44" rx="11" fill={inverse ? "#183B38" : "#E7EFEB"} />
      <circle cx="9.5" cy="11" r="2.5" fill={ink} />
      <circle cx="9.5" cy="22" r="2.5" fill={ink} />
      <circle cx="9.5" cy="33" r="2.5" fill={ink} />
      <path d="M12 11H18L25.5 21.8M12 22H25.5M12 33H18L25.5 22.2" fill="none" stroke={ink} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24.5 22L30 27.5L38 16" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ compact = false, inverse = false, linked = true, className = "" }: LogoProps) {
  const content = (
    <span className={`brand-lockup ${className}`.trim()}>
      <Mark inverse={inverse} />
      {compact ? null : (
        <span className="brand-type">
          <span className="brand-name">ProcureIQ</span>
          <span className="brand-subtitle">Strategic Procurement Intelligence</span>
        </span>
      )}
    </span>
  );
  return linked ? <Link href="/" aria-label="ProcureIQ home">{content}</Link> : content;
}
