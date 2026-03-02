import type { BaseSchema, TableSchema } from "../types.ts";

function section(title: string, content: string): string {
  return `## ${title}\n\n${content}\n`;
}

function mdTable(headers: string[], rows: string[][]): string {
  const header = `| ${headers.join(" | ")} |`;
  const separator = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map(row => `| ${row.join(" | ")} |`).join("\n");
  return `${header}\n${separator}\n${body}`;
}

function truncate(str: string, maxLen: number = 60): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "...";
}

export function formatBase(base: BaseSchema): string {
  const metadata = mdTable(
    ["Property", "Value"],
    [
      ["ID", base.id],
      ["Name", base.name],
    ]
  );

  const tableCount = base.tables.length;
  const tableList = base.tables
    .map(t => `- **${t.name}** (\`${t.id}\`): ${t.fields.length} fields`)
    .join("\n");

  return `# ${base.name}\n\n${section("Metadata", metadata)}${section("Tables", `**Total: ${tableCount} tables**\n\n${tableList}`)}`;
}

export function formatBaseList(bases: BaseSchema[]): string {
  if (bases.length === 0) {
    return "No bases found.";
  }

  const rows = bases.map(b => [b.name, b.id, String(b.tables.length)]);
  return `${mdTable(["Name", "ID", "Tables"], rows)}\n\n**Total: ${bases.length} bases**`;
}

export function formatTable(table: TableSchema): string {
  const metadata = mdTable(
    ["Property", "Value"],
    [
      ["ID", table.id],
      ["Name", table.name],
      ["Fields", String(table.fields.length)],
      ...(table.description ? [["Description", table.description]] : []),
    ]
  );

  const fieldList = table.fields
    .map(f => {
      const opts = (f as any).options
        ? ` — ${JSON.stringify((f as any).options).slice(0, 40)}...`
        : "";
      return `- **${f.name}** (\`${f.id}\`) — ${(f as any).type}${opts}`;
    })
    .join("\n");

  return `# ${table.name}\n\n${section("Metadata", metadata)}${section("Fields", fieldList)}`;
}

export function formatTableList(tables: TableSchema[]): string {
  if (tables.length === 0) {
    return "No tables found.";
  }

  const rows = tables.map(t => [t.name, t.id, String(t.fields.length), t.description || ""]);
  return `${mdTable(["Name", "ID", "Fields", "Description"], rows)}\n\n**Total: ${tables.length} tables**`;
}

export function formatField(field: any): string {
  const rows: [string, string][] = [
    ["ID", field.id],
    ["Name", field.name],
    ["Type", field.type],
  ];

  if (field.description) {
    rows.push(["Description", field.description]);
  }

  if (field.options) {
    rows.push(["Options", JSON.stringify(field.options, null, 2)]);
  }

  return `# ${field.name}\n\n${section("Details", mdTable(["Property", "Value"], rows as string[][]))}`;
}

export function formatFieldList(fields: any[]): string {
  if (fields.length === 0) {
    return "No fields found.";
  }

  const rows = fields.map(f => [f.name, f.id, f.type, f.description || ""]);
  return `${mdTable(["Name", "ID", "Type", "Description"], rows)}\n\n**Total: ${fields.length} fields**`;
}

export function formatRecord(record: { id: string; fields: Record<string, any> }, tableFields?: any[]): string {
  const rows: [string, string][] = [["ID", record.id]];

  for (const [fieldId, value] of Object.entries(record.fields)) {
    const field = tableFields?.find((f: any) => f.id === fieldId);
    const fieldName = field?.name || fieldId;
    const displayValue =
      value === null ? "(empty)" :
        Array.isArray(value) ? `[${value.length} items]` :
          typeof value === "object" ? JSON.stringify(value).slice(0, 50) :
            String(value);
    rows.push([fieldName, truncate(displayValue)]);
  }

  return `# Record ${record.id}\n\n${section("Fields", mdTable(["Field", "Value"], rows as string[][]))}`;
}

export function formatRecordList(records: any[], fields?: any[]): string {
  if (records.length === 0) {
    return "No records found.";
  }

  const fieldNames = fields?.map((f: any) => f.name) || [];

  const headers = ["ID", ...fieldNames];
  const rows = records.map(record => [
    record.id,
    ...fieldNames.map(fname => {
      const field = fields?.find((f: any) => f.name === fname);
      const value = record.fields[field?.id];
      return truncate(
        value === null ? "(empty)" :
          Array.isArray(value) ? `[${value.length}]` :
            typeof value === "object" ? JSON.stringify(value) :
              String(value)
      );
    }),
  ]);

  return `\n${mdTable(headers, rows)}\n\n**Total: ${records.length} records**`;
}

export function formatJson(data: any): string {
  return JSON.stringify(data, null, 2);
}

export function format(data: any, type: "markdown" | "json", entityType: string): string {
  if (type === "json") {
    return formatJson(data);
  }

  switch (entityType) {
    case "base":
      return formatBase(data);
    case "base-list":
      return formatBaseList(data);
    case "table":
      return formatTable(data);
    case "table-list":
      return formatTableList(data);
    case "field":
      return formatField(data);
    case "field-list":
      return formatFieldList(data);
    case "record":
      return formatRecord(data);
    case "record-list":
      return formatRecordList(data.records, data.fields);
    default:
      return formatJson(data);
  }
}
