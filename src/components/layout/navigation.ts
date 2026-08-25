import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Boxes,
  Calculator,
  ChartNoAxesCombined,
  CircleDollarSign,
  Database,
  FileChartColumn,
  FlaskConical,
  Gauge,
  GitCompareArrows,
  Handshake,
  Network,
  Settings,
  ShieldCheck,
} from "lucide-react";

export type WorkspaceModule =
  | "overview"
  | "spend"
  | "suppliers"
  | "comparison"
  | "should-cost"
  | "rfq"
  | "optimizer"
  | "negotiation"
  | "scenario"
  | "savings"
  | "reports"
  | "data"
  | "methodology"
  | "settings";

export interface NavigationItem {
  slug: WorkspaceModule;
  label: string;
  icon: LucideIcon;
}

export const navigationGroups: Array<{ label: string; items: NavigationItem[] }> = [
  {
    label: "Intelligence",
    items: [
      { slug: "overview", label: "Overview", icon: Gauge },
      { slug: "spend", label: "Spend Intelligence", icon: BarChart3 },
      { slug: "suppliers", label: "Suppliers", icon: Boxes },
      { slug: "comparison", label: "Supplier Comparison", icon: GitCompareArrows },
    ],
  },
  {
    label: "Decision tools",
    items: [
      { slug: "should-cost", label: "Should-Cost", icon: Calculator },
      { slug: "rfq", label: "RFQ Analysis", icon: FileChartColumn },
      { slug: "optimizer", label: "Sourcing Optimizer", icon: Network },
      { slug: "negotiation", label: "Negotiation Lab", icon: Handshake },
      { slug: "scenario", label: "Scenario Lab", icon: FlaskConical },
    ],
  },
  {
    label: "Management",
    items: [
      { slug: "savings", label: "Savings Opportunities", icon: CircleDollarSign },
      { slug: "reports", label: "Reports", icon: ChartNoAxesCombined },
      { slug: "data", label: "Data Workspace", icon: Database },
      { slug: "methodology", label: "Methodology", icon: ShieldCheck },
      { slug: "settings", label: "Settings", icon: Settings },
    ],
  },
];

export const allNavigationItems = navigationGroups.flatMap((group) => group.items);
export const workspaceModules = new Set(allNavigationItems.map((item) => item.slug));
