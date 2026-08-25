import type { SpendBreakdown } from "./spend-analysis";

export interface AbcItem extends SpendBreakdown {
  cumulativeShare: number;
  classification: "A" | "B" | "C";
}

export const classifyAbc = (
  items: SpendBreakdown[],
  thresholds: { a: number; b: number } = { a: 80, b: 95 },
): AbcItem[] => {
  let cumulative = 0;
  return [...items]
    .sort((a, b) => b.spend - a.spend)
    .map((item) => {
      const previous = cumulative;
      cumulative += item.share;
      const classification = previous < thresholds.a ? "A" : previous < thresholds.b ? "B" : "C";
      return { ...item, cumulativeShare: Math.min(100, cumulative), classification };
    });
};

export const abcSummary = (items: AbcItem[]) =>
  (["A", "B", "C"] as const).map((classification) => {
    const group = items.filter((item) => item.classification === classification);
    return {
      classification,
      itemCount: group.length,
      spend: group.reduce((total, item) => total + item.spend, 0),
      share: group.reduce((total, item) => total + item.share, 0),
      approach:
        classification === "A"
          ? "Executive oversight, should-cost and supplier strategy"
          : classification === "B"
            ? "Quarterly sourcing review and price control"
            : "Simplify, catalogue and reduce transaction effort",
    };
  });
