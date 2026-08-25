"use client";

import type { WorkspaceModule } from "@/components/layout/navigation";
import { ComparisonModule } from "./supplier-modules";
import { DataModule, ReportsModule, SettingsModule } from "./workspace-modules";
import { MethodologyModule } from "./methodology-module";
import { NegotiationModule, ScenarioModule } from "./scenario-modules";
import { OptimizerModule, RfqModule } from "./commercial-modules";
import { OverviewModule } from "./overview-module";
import { SavingsModule } from "./savings-module";
import { ShouldCostModule } from "./should-cost-module";
import { SpendModule } from "./spend-module";
import { SuppliersModule } from "./supplier-modules";

export function ModuleRouter({ module }: { module: WorkspaceModule }) {
  switch (module) {
    case "overview": return <OverviewModule />;
    case "spend": return <SpendModule />;
    case "suppliers": return <SuppliersModule />;
    case "comparison": return <ComparisonModule />;
    case "should-cost": return <ShouldCostModule />;
    case "rfq": return <RfqModule />;
    case "optimizer": return <OptimizerModule />;
    case "negotiation": return <NegotiationModule />;
    case "scenario": return <ScenarioModule />;
    case "savings": return <SavingsModule />;
    case "reports": return <ReportsModule />;
    case "data": return <DataModule />;
    case "methodology": return <MethodologyModule />;
    case "settings": return <SettingsModule />;
  }
}
