export function applyResult(
  res: {
    setHeader: (name: string, value: string) => void;
    status?: (code: number) => { json: (body: unknown) => void };
    statusCode?: number;
    end: (body?: string) => void;
  },
  result: { status: number; allow?: string; body?: unknown },
): void;

export function readRequestJson(req: AsyncIterable<Uint8Array | string> & { body?: unknown }): Promise<unknown>;
