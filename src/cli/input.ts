import { readFileSync } from "fs";
import { existsSync } from "fs";

export interface InputOptions {
  data?: string;
  file?: string;
  stdin?: boolean;
}

export async function readInput(options: InputOptions): Promise<any> {
  let content: string | null = null;

  if (options.data) {
    content = options.data;
  } else if (options.file) {
    if (!existsSync(options.file)) {
      throw new Error(`File not found: ${options.file}`);
    }
    content = readFileSync(options.file, "utf-8");
  } else if (options.stdin) {
    content = await readStdin();
  }

  if (!content) {
    throw new Error("No input provided. Use --data, --file, or pipe stdin.");
  }

  try {
    return JSON.parse(content);
  } catch (e) {
    throw new Error(`Invalid JSON input: ${(e as Error).message}`);
  }
}

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.on("readable", () => {
      let chunk;
      while ((chunk = process.stdin.read()) !== null) {
        data += chunk;
      }
    });
    process.stdin.on("end", () => {
      resolve(data);
    });
    process.stdin.on("error", reject);
  });
}

export function validateRecordData(data: any): void {
  if (typeof data !== "object" || data === null) {
    throw new Error("Record data must be a JSON object");
  }
  if (!data.fields || typeof data.fields !== "object") {
    throw new Error('Record data must have a "fields" property');
  }
}

export function validateBatchData(data: any): any[] {
  if (Array.isArray(data)) {
    data.forEach(validateRecordData);
    return data;
  }
  validateRecordData(data);
  return [data];
}
