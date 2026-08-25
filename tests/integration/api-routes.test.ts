import { describe, expect, it } from "vitest";
import { POST as postTco } from "@/app/api/analyze/tco/route";
import { POST as postSpend } from "@/app/api/analyze/spend/route";
import { GET as getHealth } from "@/app/api/health/route";
import { POST as postOptimize } from "@/app/api/optimize/sourcing/route";

const jsonRequest = (url: string, body: unknown, headers: HeadersInit = {}) => new Request(url, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });

describe("route handlers", () => {
  it("reports backend health without infrastructure detail", async () => {
    const response = getHealth();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok", service: "ProcureIQ", version: "1.0.0" });
  });

  it("calculates TCO for a valid request", async () => {
    const response = await postTco(jsonRequest("http://localhost/api/analyze/tco", { annualQuantity: 1_000, unitPrice: 100, freightPerUnit: 2, inspectionPerUnit: 1, rejectionRate: .01, reworkPerRejectedUnit: 50, leadTimeDays: 10, dailyDemand: 3, carryingRate: .18, delayProbability: .1, delayCostPerEvent: 5_000, administrationAnnual: 1_000 }));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.result.annualTco).toBeGreaterThan(100_000);
  });

  it("rejects missing fields and malformed JSON", async () => {
    const missing = await postTco(jsonRequest("http://localhost/api/analyze/tco", { unitPrice: 10 }));
    expect(missing.status).toBe(400);
    const malformed = await postTco(new Request("http://localhost/api/analyze/tco", { method: "POST", body: "{" }));
    expect(malformed.status).toBe(400);
  });

  it("rejects oversized payloads", async () => {
    const response = await postSpend(jsonRequest("http://localhost/api/analyze/spend", { lines: [] }, { "content-length": "1000001" }));
    expect(response.status).toBe(413);
  });

  it("runs spend analytics on submitted lines", async () => {
    const response = await postSpend(jsonRequest("http://localhost/api/analyze/spend", { lines: [{ id: "1", purchaseOrderId: "PO", date: "2026-01-01", supplierId: "S", plantId: "PLT-GGN", materialId: "M", categoryId: "C", quantity: 10, unitPrice: 100, freight: 25, inspectionCost: 5, contracted: true }] }));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.result.totalSpend).toBe(1_030);
  });

  it("runs feasible sourcing optimization through the API", async () => {
    const response = await postOptimize(jsonRequest("http://localhost/api/optimize/sourcing", { suppliers: [{ supplierId: "A", capacity: 600, minimumAllocation: 0, moq: 0, unitTco: 10, qualityScore: 90, riskScore: 20 }, { supplierId: "B", capacity: 600, minimumAllocation: 0, moq: 0, unitTco: 11, qualityScore: 90, riskScore: 20 }], constraints: { demand: 1_000, maxSupplierShare: .6, minQualityScore: 50, maxRiskScore: 80, excludedSupplierIds: [] } }));
    const body = await response.json();
    expect(body.result.feasible).toBe(true);
    expect(body.result.demandFulfilled).toBe(1_000);
  });
});
