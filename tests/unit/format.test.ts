import { describe, expect, it } from "vitest";
import { formatInr } from "@/lib/format";

describe("Indian currency formatting", () => {
  it("formats lakh and crore values", () => {
    expect(formatInr(1_840_000)).toBe("₹18.4 L");
    expect(formatInr(23_100_000)).toBe("₹2.31 Cr");
  });

  it("formats exact rupees using Indian grouping", () => {
    expect(formatInr(123_456, false)).toBe("₹1,23,456");
    expect(formatInr(-500, false)).toBe("−₹500");
  });
});
