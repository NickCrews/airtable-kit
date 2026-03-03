export function mdTable(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  const formattedRows = rows.map(row => row.map(val => formatMdValue(val)));

  const colWidths = headers.map((header, colIdx) => {
    const headerWidth = header.length;
    const maxRowWidth = Math.max(
      ...formattedRows.map(row => row[colIdx]?.length ?? 0),
      3
    );
    return Math.max(headerWidth, maxRowWidth);
  });

  const padded = (val: string, width: number) => val.padEnd(width);
  const header = `| ${headers.map((h, i) => padded(h, colWidths[i])).join(" | ")} |`;
  const separator = `| ${colWidths.map(width => "-".repeat(width)).join(" | ")} |`;
  const body = formattedRows
    .map(row => `| ${row.map((val, i) => padded(val, colWidths[i])).join(" | ")} |`)
    .join("\n");
  return `${header}\n${separator}\n${body}`;
}

function formatMdValue(val: string | number | boolean | null | undefined): string {
  if (typeof val === "string") {
    return truncate(val);
  }
  if (typeof val === "boolean") {
    return "`" + String(val) + "`";
  }
  if (val === null || val === undefined) {
    return ""
  }
  if (typeof val === "number") {
    return String(val);
  }
  throw new Error(`Unsupported value type: ${val satisfies never}`);
}

function truncate(str: string, maxLen: number = 60): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "...";
}