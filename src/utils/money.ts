const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

export function formatUsd(value: unknown): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return null;
  }

  return usdFormatter.format(amount);
}
