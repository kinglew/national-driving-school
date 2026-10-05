export function handleRecords(input: {
  method?: string;
  path?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
  env?: { DATABASE_URL?: string };
  db?: {
    query: (text: string, params?: unknown[]) => Promise<unknown[]>;
  };
}): Promise<{ status: number; allow?: string; body: Record<string, unknown> }>;
