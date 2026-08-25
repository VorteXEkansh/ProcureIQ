export const formatInr = (value: number, compact = true): string => {
  const absolute = Math.abs(value);
  const sign = value < 0 ? "−" : "";
  if (compact && absolute >= 10_000_000) {
    return `${sign}₹${(absolute / 10_000_000).toFixed(absolute >= 100_000_000 ? 1 : 2)} Cr`;
  }
  if (compact && absolute >= 100_000) {
    return `${sign}₹${(absolute / 100_000).toFixed(absolute >= 1_000_000 ? 1 : 2)} L`;
  }
  return `${sign}${new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(absolute)}`;
};

export const formatNumber = (value: number, maximumFractionDigits = 0): string =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits }).format(value);

export const formatPercent = (value: number, digits = 1): string => `${value.toFixed(digits)}%`;

export const formatDate = (iso: string): string =>
  new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(`${iso.slice(0, 10)}T00:00:00`),
  );

export const downloadBlob = (filename: string, body: BlobPart, type: string): void => {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};
