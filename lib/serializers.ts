type PlainValue = string | number | boolean | null | undefined | PlainValue[] | { [key: string]: PlainValue };

function serialize(value: unknown): PlainValue {
  if (value === null || value === undefined) return value;
  if (typeof value !== "object") return value as string | number | boolean;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serialize);

  const candidate = value as { _bsontype?: unknown; toString?: () => string };
  if (typeof candidate._bsontype === "string" && typeof candidate.toString === "function") {
    return candidate.toString();
  }

  const output: { [key: string]: PlainValue } = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    output[key] = serialize(nestedValue);
  }
  return output;
}

export function toPlain<T>(doc: T): T {
  return serialize(doc) as T;
}

export function toPlainArray<T>(docs: T[]): T[] {
  return docs.map((doc) => serialize(doc) as T);
}
