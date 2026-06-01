export function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}

export function qualifiedTable(schemaName: string, tableName: string): string {
  return `${quoteIdentifier(schemaName)}.${quoteIdentifier(tableName)}`;
}

export function columnRef(alias: string, columnName: string): string {
  return `${quoteIdentifier(alias)}.${quoteIdentifier(columnName)}`;
}
