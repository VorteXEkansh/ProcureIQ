"use client";

import { useRef, useState } from "react";
import Papa from "papaparse";
import { Check, Database, Download, FileJson, FileSpreadsheet, FileUp, Printer, RotateCcw, ShieldCheck, Upload } from "lucide-react";
import { Badge, Kpi, PageHeading, Section } from "@/components/ui/primitives";
import { buildRecommendations } from "@/domain/procurement/recommendations";
import { nonOverlappingOpportunityValue } from "@/domain/procurement/savings";
import { calculateOverview } from "@/domain/procurement/spend-analysis";
import { formatDate, formatInr, formatPercent, downloadBlob } from "@/lib/format";
import { useWorkspace } from "@/stores/workspace-store";
import type { ScoringWeights, Supplier, Material, PurchaseOrderLine, WorkspaceSettings, WorkspaceSnapshot } from "@/types/procurement";

const reportTypes = [
  ["Executive Procurement Review", "KPIs, management attention and top savings opportunities"],
  ["Supplier Performance Review", "Supplier scores, operational risk and recommended actions"],
  ["Savings Opportunity Report", "Prioritized value pipeline, confidence and status"],
  ["Supplier Comparison Report", "Quotation, evaluated total cost and recommendation"],
  ["Should-Cost Report", "Cost build-up, range, assumptions and negotiation gap"],
  ["RFQ Evaluation Report", "Normalized offers and recommended supplier"],
  ["Sourcing Optimization Report", "Constraints, allocation and expected savings"],
] as const;

const escapeHtml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

export function ReportsModule() {
  const workspace = useWorkspace();
  const overview = calculateOverview(workspace.dataset);
  const recommendations = buildRecommendations(workspace.dataset, workspace.opportunities);
  const opportunityValue = nonOverlappingOpportunityValue(workspace.opportunities);
  const [preview, setPreview] = useState<(typeof reportTypes)[number][0]>(reportTypes[0][0]);
  const generateReport = (title: string, openPrint = false) => {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)} · ProcureIQ</title><style>body{font:14px Arial;color:#17201e;margin:48px;max-width:1000px}header{border-bottom:3px solid #174f48;padding-bottom:18px}h1{font-size:30px}small{color:#68736f}.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:28px 0}.kpi{border:1px solid #dfe3de;padding:16px}.kpi b{display:block;font-size:20px;margin-top:8px}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{text-align:left;padding:10px;border-bottom:1px solid #dfe3de}th{font-size:11px;text-transform:uppercase;color:#68736f}.num{text-align:right}footer{margin-top:40px;color:#68736f;font-size:11px}@media print{body{margin:24px}}</style></head><body><header><strong>ProcureIQ</strong><h1>${escapeHtml(title)}</h1><small>Asteron Components Pvt. Ltd. · Jan 2025 – Jun 2026 · Generated ${escapeHtml(new Date().toLocaleString("en-IN"))}</small></header><section class="kpis"><div class="kpi">Procurement spend<b>${formatInr(overview.totalSpend)}</b></div><div class="kpi">Opportunity<b>${formatInr(opportunityValue)}</b></div><div class="kpi">On-time delivery<b>${formatPercent(overview.onTimeDelivery)}</b></div><div class="kpi">Rejection rate<b>${formatPercent(overview.rejectionRate, 2)}</b></div></section><h2>Management recommendations</h2><table><thead><tr><th>Recommendation</th><th>Evidence</th><th>Confidence</th><th class="num">Impact</th></tr></thead><tbody>${recommendations.map((item) => `<tr><td>${escapeHtml(item.title)}</td><td>${escapeHtml(item.evidence.join(" · "))}</td><td>${item.confidence}</td><td class="num">${formatInr(item.expectedImpact)}</td></tr>`).join("")}</tbody></table><h2>Assumptions and limitations</h2><p>Values are deterministic decision-support estimates using a fictional manufacturing dataset. Savings may overlap and are not guaranteed. No external AI, market-data or supplier-credit API was used.</p><footer>ProcureIQ · Strategic Procurement &amp; Cost Intelligence · Fictional portfolio dataset</footer>${openPrint ? "<script>window.onload=()=>window.print()</script>" : ""}</body></html>`;
    if (openPrint) {
      const windowRef = window.open("", "_blank", "noopener,noreferrer");
      if (windowRef) { windowRef.document.write(html); windowRef.document.close(); }
    } else downloadBlob(`${title.toLowerCase().replaceAll(" ", "-")}.html`, html, "text/html;charset=utf-8");
  };
  return (
    <>
      <PageHeading eyebrow="Communicate" title="Reports" description="Generate source-backed management reports from the active local workspace. Reports contain actual KPIs, recommendations, assumptions and timestamps." actions={<button className="button button-secondary button-small" onClick={() => generateReport(preview, true)}><Printer size={14} />Print selected</button>} />
      <div className="kpi-grid"><Kpi label="Available reports" value={String(reportTypes.length)} note="Management and sourcing workflows" /><Kpi label="Current dataset" value="18 months" note={`${workspace.dataset.purchaseOrderLines.length.toLocaleString("en-IN")} PO lines`} /><Kpi label="Recommendations" value={String(recommendations.length)} note="Calculated from active workspace" /><Kpi label="External report API" value="None" note="Generated entirely in the browser" tone="positive" /></div>
      <div className="report-grid">{reportTypes.map(([title, description]) => <article key={title} className={preview === title ? "selected" : ""} onClick={() => setPreview(title)}><div className="report-icon"><FileSpreadsheet size={19} /></div><h2>{title}</h2><p>{description}</p><footer><span>HTML · Print-ready</span><button className="button button-small button-secondary" onClick={(event) => { event.stopPropagation(); generateReport(title); }}><Download size={13} />Generate</button></footer></article>)}</div>
      <div className="report-preview"><header><div><span>ProcureIQ</span><h2>{preview}</h2><p>Asteron Components Pvt. Ltd. · Jan 2025 – Jun 2026</p></div><Badge tone="positive">Live workspace</Badge></header><div className="report-preview-kpis"><div><span>Spend</span><strong>{formatInr(overview.totalSpend)}</strong></div><div><span>Opportunity</span><strong>{formatInr(opportunityValue)}</strong></div><div><span>OTD</span><strong>{formatPercent(overview.onTimeDelivery)}</strong></div></div><h3>Management attention</h3>{recommendations.slice(0, 3).map((item) => <p key={item.id}><b>{item.title}</b><span>{item.evidence[0]} · {formatInr(item.expectedImpact)}</span></p>)}</div>
    </>
  );
}

type ImportKind = "purchaseOrderLines" | "suppliers" | "materials";
type ImportRow = Record<string, unknown>;

const importFields: Record<ImportKind, string[]> = {
  purchaseOrderLines: ["date", "supplierId", "plantId", "materialId", "quantity", "unitPrice", "freight", "contracted"],
  suppliers: ["id", "name", "city", "state", "categoryIds", "paymentTermsDays", "leadTimeDays", "capacityMonthly", "defectRate", "onTimeDelivery"],
  materials: ["id", "sku", "name", "categoryId", "unit", "standardPrice", "annualDemand", "criticality", "preferredSupplierIds"],
};

const requiredFields: Record<ImportKind, string[]> = {
  purchaseOrderLines: ["date", "supplierId", "plantId", "materialId", "quantity", "unitPrice"],
  suppliers: ["id", "name", "categoryIds"],
  materials: ["id", "sku", "name", "categoryId", "standardPrice", "annualDemand"],
};

const normalize = (value: string) => value.toLowerCase().replaceAll(/[^a-z0-9]/g, "");

export function DataModule() {
  const workspace = useWorkspace();
  const [kind, setKind] = useState<ImportKind>("purchaseOrderLines");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const backupInput = useRef<HTMLInputElement>(null);

  const initializeRows = (parsed: ImportRow[], name: string) => {
    const safeRows = parsed.slice(0, 5_000);
    const sourceColumns = Object.keys(safeRows[0] ?? {});
    const autoMapping = Object.fromEntries(importFields[kind].map((field) => [field, sourceColumns.find((column) => normalize(column) === normalize(field)) ?? ""]));
    setRows(safeRows); setColumns(sourceColumns); setMapping(autoMapping); setFileName(name); setErrors([]);
  };

  const parseFile = async (file: File) => {
    if (file.size > 5_000_000) { setErrors(["File exceeds the 5 MB local import limit."]); return; }
    if (file.name.toLowerCase().endsWith(".xlsx") || file.name.toLowerCase().endsWith(".xls")) {
      const { default: readXlsxFile } = await import("read-excel-file/browser");
      const sheets = await readXlsxFile(file);
      const table = sheets[0]?.data ?? [];
      const [headerRow, ...dataRows] = table;
      if (!headerRow) { setErrors(["Workbook does not contain a readable worksheet."]); return; }
      const headers = headerRow.map((cell) => String(cell ?? ""));
      initializeRows(dataRows.map((dataRow) => Object.fromEntries(headers.map((header, index) => [header, dataRow[index] ?? ""]))), file.name);
      return;
    }
    Papa.parse<ImportRow>(file, { header: true, skipEmptyLines: true, complete: (result) => initializeRows(result.data, file.name), error: (error) => setErrors([error.message]) });
  };

  const getValue = (row: ImportRow, field: string) => row[mapping[field] ?? ""];
  const validate = (): boolean => {
    const issues: string[] = [];
    for (const field of requiredFields[kind]) if (!mapping[field]) issues.push(`Map the required ${field} field.`);
    rows.forEach((row, index) => {
      for (const field of requiredFields[kind]) if (mapping[field] && String(getValue(row, field) ?? "").trim() === "") issues.push(`Row ${index + 2}: ${field} is missing.`);
      if (kind === "purchaseOrderLines") {
        if (Number(getValue(row, "quantity")) <= 0) issues.push(`Row ${index + 2}: quantity must be positive.`);
        if (Number(getValue(row, "unitPrice")) < 0) issues.push(`Row ${index + 2}: unitPrice cannot be negative.`);
        if (!workspace.dataset.suppliers.some((supplier) => supplier.id === String(getValue(row, "supplierId")))) issues.push(`Row ${index + 2}: unknown supplier ${String(getValue(row, "supplierId"))}.`);
        if (!workspace.dataset.materials.some((material) => material.id === String(getValue(row, "materialId")))) issues.push(`Row ${index + 2}: unknown material ${String(getValue(row, "materialId"))}.`);
      }
    });
    setErrors([...new Set(issues)].slice(0, 50));
    return issues.length === 0;
  };

  const importRows = () => {
    if (!rows.length || !validate()) return;
    const dataset = structuredClone(workspace.dataset);
    if (kind === "purchaseOrderLines") {
      const start = dataset.purchaseOrderLines.length + 1;
      const next = rows.map((row, index): PurchaseOrderLine => {
        const materialId = String(getValue(row, "materialId"));
        const material = dataset.materials.find((item) => item.id === materialId)!;
        const id = `IMP-POL-${String(start + index).padStart(5, "0")}`;
        return { id, purchaseOrderId: `IMP-PO-${String(start + index).padStart(5, "0")}`, date: String(getValue(row, "date")).slice(0, 10), supplierId: String(getValue(row, "supplierId")), plantId: String(getValue(row, "plantId")) as PurchaseOrderLine["plantId"], materialId, categoryId: material.categoryId, quantity: Number(getValue(row, "quantity")), unitPrice: Number(getValue(row, "unitPrice")), freight: Number(getValue(row, "freight") ?? 0), inspectionCost: 0, contracted: String(getValue(row, "contracted") ?? "true").toLowerCase() !== "false" };
      });
      dataset.purchaseOrderLines.push(...next);
    } else if (kind === "suppliers") {
      const next = rows.map((row): Supplier => ({ id: String(getValue(row, "id")), name: String(getValue(row, "name")), city: String(getValue(row, "city") ?? ""), state: String(getValue(row, "state") ?? ""), categoryIds: String(getValue(row, "categoryIds")).split(/[;,]/).map((value) => value.trim()), paymentTermsDays: Number(getValue(row, "paymentTermsDays") ?? 30), leadTimeDays: Number(getValue(row, "leadTimeDays") ?? 20), capacityMonthly: Number(getValue(row, "capacityMonthly") ?? 0), defectRate: Number(getValue(row, "defectRate") ?? .02), onTimeDelivery: Number(getValue(row, "onTimeDelivery") ?? .9), deliveryVariability: 4, commercialFlexibility: 60, audited: false, status: "Approved" }));
      dataset.suppliers = [...dataset.suppliers.filter((current) => !next.some((item) => item.id === current.id)), ...next];
    } else {
      const next = rows.map((row): Material => ({ id: String(getValue(row, "id")), sku: String(getValue(row, "sku")), name: String(getValue(row, "name")), categoryId: String(getValue(row, "categoryId")), unit: (String(getValue(row, "unit") || "nos") as Material["unit"]), standardPrice: Number(getValue(row, "standardPrice")), annualDemand: Number(getValue(row, "annualDemand")), criticality: (String(getValue(row, "criticality") || "Medium") as Material["criticality"]), preferredSupplierIds: String(getValue(row, "preferredSupplierIds") ?? "").split(/[;,]/).map((value) => value.trim()).filter(Boolean) }));
      dataset.materials = [...dataset.materials.filter((current) => !next.some((item) => item.id === current.id)), ...next];
    }
    dataset.generatedAt = new Date().toISOString();
    workspace.importDataset(dataset);
    setRows([]); setColumns([]); setFileName(""); setErrors([]);
  };

  const template = (name: string) => {
    const examples: Record<string, string> = {
      suppliers: "id,name,city,state,categoryIds,paymentTermsDays,leadTimeDays,capacityMonthly,defectRate,onTimeDelivery\nSUP-101,Example Supplier,Pune,Maharashtra,CAT-ALU,45,14,25000,0.012,0.94",
      materials: "id,sku,name,categoryId,unit,standardPrice,annualDemand,criticality,preferredSupplierIds\nMAT-501,AC-NEW-001,Example Component,CAT-ALU,nos,450,24000,High,SUP-101",
      purchase_orders: "date,supplierId,plantId,materialId,quantity,unitPrice,freight,contracted\n2026-07-01,SUP-001,PLT-GGN,MAT-004,1000,1200,18000,true",
      delivery: "id,purchaseOrderLineId,promisedDate,deliveredDate,quantityDelivered,delayDays\nDEL-NEW-001,POL-00001,2026-07-15,2026-07-16,1000,1",
      quality: "id,purchaseOrderLineId,inspectedQuantity,rejectedQuantity,reworkCost,disruptionCost\nQLT-NEW-001,POL-00001,1000,12,5400,0",
      quotations: "rfqId,lineId,supplierId,unitPrice,freightPerUnit,moq,leadTimeDays,capacity,paymentTermsDays\nRFQ-001,RFQL-001,SUP-001,1150,18,1000,14,30000,45",
    };
    downloadBlob(`procureiq-${name}-template.csv`, examples[name] ?? "", "text/csv;charset=utf-8");
  };

  const exportBackup = () => downloadBlob(`procureiq-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ id: workspace.id, dataset: workspace.dataset, opportunities: workspace.opportunities, savedShouldCostModels: workspace.savedShouldCostModels, savedScenarios: workspace.savedScenarios, settings: workspace.settings, updatedAt: new Date().toISOString() }, null, 2), "application/json");
  const restoreBackup = async (file: File) => {
    if (file.size > 10_000_000) { setErrors(["Workspace backup exceeds 10 MB."]); return; }
    try {
      const value = JSON.parse(await file.text()) as WorkspaceSnapshot;
      if (value.id !== "active" || value.dataset?.version !== 1 || !Array.isArray(value.dataset.purchaseOrderLines)) throw new Error("Invalid ProcureIQ workspace backup.");
      workspace.restoreSnapshot(value);
    } catch (error) { setErrors([error instanceof Error ? error.message : "Invalid workspace backup."]); }
  };

  return (
    <>
      <PageHeading eyebrow="Local workspace" title="Data workspace" description="Import CSV or XLSX procurement data locally, validate it before use, and keep portable JSON backups. Files are not sent to a ProcureIQ database." actions={<button className="button button-secondary button-small" onClick={exportBackup}><FileJson size={14} />Export backup</button>} />
      <div className="privacy-banner"><ShieldCheck size={20} /><div><strong>Your procurement data stays in this browser.</strong><p>Parsing and persistence are local. Stateless analytical routes accept only data explicitly submitted for a calculation and do not permanently store it.</p></div><Badge tone={workspace.persistenceAvailable ? "positive" : "warning"}>{workspace.persistenceAvailable ? "IndexedDB active" : "Session only"}</Badge></div>
      <div className="kpi-grid"><Kpi label="Suppliers" value={String(workspace.dataset.suppliers.length)} note="Active workspace records" /><Kpi label="Materials / SKUs" value={String(workspace.dataset.materials.length)} note={`${workspace.dataset.categories.length} categories`} /><Kpi label="PO lines" value={workspace.dataset.purchaseOrderLines.length.toLocaleString("en-IN")} note="Available to spend analytics" /><Kpi label="Last dataset update" value={formatDate(workspace.dataset.generatedAt)} note="Local workspace timestamp" /></div>
      <div className="workspace-grid">
        <Section className="span-8" title="Guided importer" description="Upload → preview → map → validate → import">
          <div className="import-steps">{["Upload", "Preview", "Map", "Validate", "Import"].map((step, index) => <span className={rows.length ? index <= (errors.length ? 3 : 4) ? "active" : "" : index === 0 ? "active" : ""} key={step}><b>{index + 1}</b>{step}</span>)}</div>
          <div className="form-section"><div className="select-field"><label htmlFor="import-kind">Dataset type</label><select id="import-kind" value={kind} onChange={(event) => { setKind(event.target.value as ImportKind); setRows([]); setColumns([]); setErrors([]); }}><option value="purchaseOrderLines">Purchase order lines</option><option value="suppliers">Suppliers</option><option value="materials">Materials</option></select></div><label className="file-drop"><FileUp size={25} /><strong>{fileName || "Choose a CSV or XLSX file"}</strong><span>Maximum 5 MB · Up to 5,000 rows per import</span><input type="file" accept=".csv,.xlsx,.xls" onChange={(event) => { const file = event.target.files?.[0]; if (file) void parseFile(file); }} /></label></div>
          {rows.length ? <><div className="mapping-grid">{importFields[kind].map((field) => <div className="select-field" key={field}><label htmlFor={`map-${field}`}>{field}{requiredFields[kind].includes(field) ? " *" : ""}</label><select id={`map-${field}`} value={mapping[field] ?? ""} onChange={(event) => setMapping((current) => ({ ...current, [field]: event.target.value }))}><option value="">Not mapped</option>{columns.map((column) => <option key={column}>{column}</option>)}</select></div>)}</div><div className="table-scroll import-preview"><table className="data-table"><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.slice(0, 5).map((row, index) => <tr key={index}>{columns.map((column) => <td key={column}>{String(row[column] ?? "")}</td>)}</tr>)}</tbody></table></div><div className="import-actions"><span>{rows.length.toLocaleString("en-IN")} rows ready for validation</span><button className="button button-secondary button-small" onClick={validate}><Check size={13} />Validate</button><button className="button button-primary button-small" onClick={importRows}><Upload size={13} />Import records</button></div></> : null}
          {errors.length ? <div className="validation-errors" role="alert"><strong>{errors.length} validation issue{errors.length === 1 ? "" : "s"}</strong><ul>{errors.slice(0, 12).map((error) => <li key={error}>{error}</li>)}</ul></div> : null}
        </Section>
        <div className="span-4 stacked-panels">
          <Section title="Import templates" description="Download a schema-aligned CSV starting point"><div className="template-list">{([["suppliers", "Suppliers"], ["materials", "Materials"], ["purchase_orders", "Purchase orders"], ["delivery", "Delivery"], ["quality", "Quality"], ["quotations", "Quotations"]] as const).map(([id, label]) => <button key={id} onClick={() => template(id)}><FileSpreadsheet size={16} /><span>{label}</span><Download size={13} /></button>)}</div></Section>
          <Section title="Workspace recovery" description="Portable backup and restore"><div className="recovery-actions"><button className="button button-secondary button-small" onClick={exportBackup}><Download size={13} />Export JSON backup</button><button className="button button-secondary button-small" onClick={() => backupInput.current?.click()}><Upload size={13} />Restore backup</button><input ref={backupInput} hidden type="file" accept="application/json,.json" onChange={(event) => { const file = event.target.files?.[0]; if (file) void restoreBackup(file); }} /></div></Section>
        </div>
      </div>
    </>
  );
}

export function SettingsModule() {
  const workspace = useWorkspace();
  const [settings, setSettings] = useState<WorkspaceSettings>(() => structuredClone(workspace.settings));
  const weights = settings.scoringWeights;
  const totalWeight = Object.values(weights).reduce((total, value) => total + value, 0);
  const updateWeight = (key: keyof ScoringWeights, value: number) => setSettings((current) => ({ ...current, scoringWeights: { ...current.scoringWeights, [key]: value } }));
  return (
    <>
      <PageHeading eyebrow="Configure" title="Settings" description="Control carrying cost, supplier scoring, concentration and risk preferences for this local workspace." actions={<button className="button button-primary button-small" disabled={Math.abs(totalWeight - 100) > .001} onClick={() => workspace.updateSettings(settings)}><Check size={14} />Save settings</button>} />
      <div className="workspace-grid">
        <Section className="span-7" title="Analytical defaults" description="Applied to TCO, supplier evaluation and optimization"><div className="form-section"><div className="form-grid"><div className="select-field"><label htmlFor="settings-currency">Currency</label><select id="settings-currency" disabled><option>INR · Indian Rupee</option></select></div><div className="select-field"><label htmlFor="settings-format">Number format</label><select id="settings-format" disabled><option>Indian · lakh / crore</option></select></div><div className="field"><label htmlFor="settings-carry">Annual carrying rate (%)</label><input id="settings-carry" type="number" min="0" max="100" value={settings.carryingRate * 100} onChange={(event) => setSettings((current) => ({ ...current, carryingRate: Number(event.target.value) / 100 }))} /></div><div className="field"><label htmlFor="settings-share">Maximum supplier share (%)</label><input id="settings-share" type="number" min="10" max="100" value={settings.maxSupplierShare * 100} onChange={(event) => setSettings((current) => ({ ...current, maxSupplierShare: Number(event.target.value) / 100 }))} /></div><div className="select-field"><label htmlFor="settings-risk">Risk preference</label><select id="settings-risk" value={settings.riskPreference} onChange={(event) => setSettings((current) => ({ ...current, riskPreference: event.target.value as WorkspaceSettings["riskPreference"] }))}><option>Balanced</option><option>Cost Focused</option><option>Resilience Focused</option></select></div></div></div></Section>
        <Section className="span-5" title="Workspace storage" description="No hosted ProcureIQ database"><div className="storage-status"><Database size={23} /><div><strong>{workspace.persistenceAvailable ? "IndexedDB available" : "Browser persistence unavailable"}</strong><p>{workspace.persistenceAvailable ? "Changes are stored locally and survive reload on this browser." : "Export a backup before leaving this session."}</p></div></div><div className="danger-zone"><strong>Reset workspace</strong><p>Replace imports, statuses, models and scenarios with the original deterministic demo workspace.</p><button className="button button-danger button-small" onClick={() => { if (window.confirm("Reset the entire local ProcureIQ workspace to demo data?")) void workspace.resetWorkspace(); }}><RotateCcw size={13} />Reset to demo data</button></div></Section>
      </div>
      <Section title="Supplier scoring weights" description={`Cost + quality + delivery + reliability + commercial + risk must total 100%. Current total: ${totalWeight}%`} action={<Badge tone={Math.abs(totalWeight - 100) < .001 ? "positive" : "critical"}>{totalWeight}%</Badge>}><div className="weight-grid">{(Object.keys(weights) as Array<keyof ScoringWeights>).map((key) => <div key={key}><div><label htmlFor={`weight-${key}`}>{key}</label><span>{weights[key]}%</span></div><input id={`weight-${key}`} type="range" min="0" max="50" step="1" value={weights[key]} onChange={(event) => updateWeight(key, Number(event.target.value))} /></div>)}</div>{Math.abs(totalWeight - 100) > .001 ? <div className="validation-errors"><strong>Weights must total 100% before settings can be saved.</strong></div> : null}</Section>
    </>
  );
}
