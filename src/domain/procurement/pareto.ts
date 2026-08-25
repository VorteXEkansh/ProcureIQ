import type { SpendBreakdown } from "./spend-analysis";

export const paretoCutoff = (items: SpendBreakdown[], target = 80) => {
  let cumulative = 0;
  const contributors: Array<SpendBreakdown & { cumulativeShare: number }> = [];
  for (const item of [...items].sort((a, b) => b.spend - a.spend)) {
    cumulative += item.share;
    contributors.push({ ...item, cumulativeShare: cumulative });
    if (cumulative >= target) break;
  }
  return { target, contributors, count: contributors.length, achievedShare: cumulative };
};
