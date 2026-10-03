export function databaseHealth(
  env: { DATABASE_URL?: string },
  probeFactory?: (databaseUrl: string) => {
    ping: () => Promise<void>;
    schemaReady: () => Promise<boolean>;
  },
): Promise<{ status: number; body: { ok: boolean; database: string; schemaReady?: boolean } }>;

export function handleHealth(
  method: string | undefined,
  env: { DATABASE_URL?: string },
  probeFactory?: (databaseUrl: string) => {
    ping: () => Promise<void>;
    schemaReady: () => Promise<boolean>;
  },
): Promise<{
  status: number;
  allow?: string;
  body: { ok: boolean; database?: string; error?: string; schemaReady?: boolean };
}>;
