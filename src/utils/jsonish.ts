export function parseNameList(value: unknown): string[] {
  if (value === null || value === undefined || value === "") {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map(itemToName).filter(Boolean);
  }

  if (typeof value !== "string") {
    return [itemToName(value)].filter(Boolean);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }

  const parsed = tryParseJson(trimmed);
  if (parsed !== null) {
    return parseNameList(parsed);
  }

  return trimmed
    .split(/[|,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function itemToName(item: unknown): string {
  if (item === null || item === undefined) {
    return "";
  }

  if (typeof item === "object") {
    const record = item as Record<string, unknown>;
    return String(record.name ?? record.title ?? "").trim();
  }

  return String(item).trim();
}

function tryParseJson(value: string): unknown | null {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}
