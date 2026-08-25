"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Building2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Command,
  Download,
  FileUp,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { allNavigationItems, navigationGroups } from "@/components/layout/navigation";
import { downloadBlob } from "@/lib/format";
import { useWorkspace } from "@/stores/workspace-store";

const demoSteps = [
  { slug: "overview", title: "Executive Overview", copy: "Start with calculated spend, savings potential, delivery and risk. Open Management Attention to frame the decision." },
  { slug: "spend", title: "Spend Intelligence", copy: "Filter Aluminium, inspect adverse PPV and show how a small set of materials drives most spend." },
  { slug: "suppliers", title: "Supplier Analysis", copy: "Open Arka Precision Metals to see how low price can coexist with quality and delivery risk." },
  { slug: "comparison", title: "Supplier Comparison", copy: "Separate lowest quotation from lowest evaluated total cost and explain the recommendation." },
  { slug: "should-cost", title: "Should-Cost", copy: "Change the Aluminium Bracket material rate or cycle time and quantify negotiation headroom." },
  { slug: "rfq", title: "RFQ Analysis", copy: "Compare normalized bids across freight, quality, inventory, payment terms and risk." },
  { slug: "optimizer", title: "Sourcing Optimizer", copy: "Run a 60% concentration ceiling to produce a feasible cost-risk allocation." },
  { slug: "scenario", title: "Scenario Lab", copy: "Apply Supplier Capacity Loss and compare its TCO and risk deltas against baseline." },
] as const;

export function WorkspaceFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const workspace = useWorkspace();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [demoStep, setDemoStep] = useState<number | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("procureiq:ui:v1");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { collapsed?: boolean };
        const handle = window.setTimeout(() => setCollapsed(Boolean(parsed.collapsed)), 0);
        return () => window.clearTimeout(handle);
      } catch {
        window.localStorage.removeItem("procureiq:ui:v1");
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("procureiq:ui:v1", JSON.stringify({ collapsed }));
  }, [collapsed]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
      if (event.key === "Escape") {
        setPaletteOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filteredActions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return allNavigationItems.filter((item) => !normalized || item.label.toLowerCase().includes(normalized));
  }, [query]);

  const navigate = (slug: string) => {
    router.push(`/workspace/${slug}`);
    setPaletteOpen(false);
    setMobileOpen(false);
  };

  const startDemo = () => {
    setDemoStep(0);
    navigate(demoSteps[0].slug);
  };

  const moveDemo = (next: number) => {
    if (next < 0 || next >= demoSteps.length) {
      setDemoStep(null);
      return;
    }
    setDemoStep(next);
    navigate(demoSteps[next]!.slug);
  };

  const exportWorkspace = () => {
    const snapshot = {
      id: workspace.id,
      dataset: workspace.dataset,
      opportunities: workspace.opportunities,
      savedShouldCostModels: workspace.savedShouldCostModels,
      savedScenarios: workspace.savedScenarios,
      settings: workspace.settings,
      updatedAt: new Date().toISOString(),
    };
    downloadBlob(`procureiq-workspace-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(snapshot, null, 2), "application/json");
  };

  return (
    <div className={`workspace-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside className={`workspace-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-brand"><Logo compact={collapsed} linked /><button className="sidebar-mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={18} /></button></div>
        <nav aria-label="Workspace navigation">
          {navigationGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <span className="nav-label">{group.label}</span>
              {group.items.map((item) => {
                const active = pathname === `/workspace/${item.slug}`;
                const Icon = item.icon;
                return <Link key={item.slug} href={`/workspace/${item.slug}`} className={active ? "active" : ""} onClick={() => setMobileOpen(false)} title={collapsed ? item.label : undefined}><Icon size={17} /><span>{item.label}</span>{active ? <i /> : null}</Link>;
              })}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <Link href="/about/architecture"><CircleHelp size={16} /><span>Architecture &amp; About</span></Link>
          <button onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}<span>Collapse sidebar</span></button>
          <small>v1.0 · Fictional demo data</small>
        </div>
      </aside>
      {mobileOpen ? <button className="sidebar-backdrop" onClick={() => setMobileOpen(false)} aria-label="Close navigation overlay" /> : null}

      <div className="workspace-main">
        <header className="workspace-topbar">
          <div className="topbar-left">
            <button className="mobile-menu-button" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={19} /></button>
            <div className="workspace-company"><span><Building2 size={15} /></span><div><b>Asteron Components Pvt. Ltd.</b><small>India · 3 plants</small></div></div>
            <div className="topbar-period"><small>Reporting period</small><strong>Jan 2025 – Jun 2026</strong></div>
            <span className="dataset-indicator"><i />Demo dataset</span>
          </div>
          <div className="topbar-actions">
            <button className="command-trigger" onClick={() => setPaletteOpen(true)}><Search size={15} /><span>Search workspace</span><kbd>⌘ K</kbd></button>
            <button className="button button-small button-secondary topbar-hide-mobile" onClick={() => navigate("data")}><FileUp size={15} />Import data</button>
            <button className="icon-button" onClick={exportWorkspace} aria-label="Export workspace" title="Export workspace"><Download size={16} /></button>
            <button className="button button-small button-primary" onClick={startDemo}>Guided demo <ArrowRight size={14} /></button>
          </div>
        </header>
        <main className="workspace-content">{children}</main>
      </div>

      {workspace.notice ? <div className="toast" role="status"><span>{workspace.notice}</span><button onClick={workspace.dismissNotice} aria-label="Dismiss notification"><X size={14} /></button></div> : null}

      {paletteOpen ? (
        <div className="modal-backdrop" onMouseDown={() => setPaletteOpen(false)}>
          <div className="command-palette" role="dialog" aria-modal="true" aria-label="Search workspace" onMouseDown={(event) => event.stopPropagation()}>
            <div className="command-input"><Search size={18} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Open a workspace, report or decision tool…" /><kbd>Esc</kbd></div>
            <div className="command-results">
              <span>Navigate</span>
              {filteredActions.map((item) => <button key={item.slug} onClick={() => navigate(item.slug)}><item.icon size={17} /><b>{item.label}</b><small>/workspace/{item.slug}</small><ChevronRight size={15} /></button>)}
              {filteredActions.length === 0 ? <p>No matching workspace found.</p> : null}
            </div>
            <footer><span><Command size={13} />K to open</span><span>↑↓ Navigate · Enter open</span></footer>
          </div>
        </div>
      ) : null}

      {demoStep !== null ? (
        <aside className="guided-demo" aria-label="Guided demo">
          <header><span>Guided demo · {demoStep + 1} of {demoSteps.length}</span><button onClick={() => setDemoStep(null)} aria-label="Exit guided demo"><X size={17} /></button></header>
          <div className="demo-progress"><span style={{ width: `${((demoStep + 1) / demoSteps.length) * 100}%` }} /></div>
          <div className="demo-body"><small>Recruiter walkthrough</small><h2>{demoSteps[demoStep]!.title}</h2><p>{demoSteps[demoStep]!.copy}</p></div>
          <footer><button className="button button-small button-secondary" disabled={demoStep === 0} onClick={() => moveDemo(demoStep - 1)}><ChevronLeft size={15} />Previous</button><button className="button button-small button-primary" onClick={() => moveDemo(demoStep + 1)}>{demoStep === demoSteps.length - 1 ? "Finish" : "Next"}<ChevronRight size={15} /></button></footer>
        </aside>
      ) : null}
    </div>
  );
}
