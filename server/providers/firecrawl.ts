/**
 * Minimal client for Firecrawl Alexandria capabilities.
 * The API key is read from the environment by the caller and never leaves the server.
 */

const ENDPOINT = 'https://api.firecrawl.dev/v2/scrape';
export const ALEXANDRIA_MAX_BATCH = 10;

export interface AlexandriaCall {
  provider: string;
  capability: string;
  options: Record<string, unknown>;
}

export interface AlexandriaResult<T> {
  data: T | null;
  error: string | null;
}

export interface FirecrawlClientOptions {
  apiKey: string;
  timeoutMs?: number;
  maxRetries?: number;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
}

export class FirecrawlError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'FirecrawlError';
  }
}

const defaultSleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export function createFirecrawlClient(options: FirecrawlClientOptions) {
  const { apiKey, timeoutMs = 30_000, maxRetries = 2, fetchImpl = fetch, sleep = defaultSleep } = options;
  let creditsUsed = 0;

  /** POST with timeout and retry on 429 and 5xx. Returns the parsed JSON body. */
  async function post(payload: unknown): Promise<any> {
    let lastError: FirecrawlError = new FirecrawlError('Firecrawl request failed');
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) await sleep(500 * 2 ** (attempt - 1));
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetchImpl(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        if (res.status === 429 || res.status >= 500) {
          lastError = new FirecrawlError(`Firecrawl returned ${res.status}`, res.status);
          continue; // retryable
        }
        if (!res.ok) throw new FirecrawlError(`Firecrawl returned ${res.status}`, res.status);
        return await res.json();
      } catch (err: any) {
        if (err instanceof FirecrawlError) throw err;
        lastError = new FirecrawlError(err?.name === 'AbortError' ? 'Firecrawl request timed out' : `Firecrawl request failed: ${err?.message ?? err}`);
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastError;
  }

  /** Runs up to ALEXANDRIA_MAX_BATCH calls in one request. Results come back in call order. */
  async function runBatch<T>(calls: AlexandriaCall[]): Promise<AlexandriaResult<T>[]> {
    if (calls.length === 0) return [];
    if (calls.length > ALEXANDRIA_MAX_BATCH) throw new FirecrawlError(`Batch of ${calls.length} exceeds ${ALEXANDRIA_MAX_BATCH}`);
    const body = await post({ alexandria: calls });
    const results: any[] = body?.data?.alexandria;
    if (!Array.isArray(results) || results.length !== calls.length) throw new FirecrawlError('Unexpected Firecrawl response shape');
    if (typeof body?.data?.creditsCost === 'number') creditsUsed += body.data.creditsCost;
    return results.map(r => ({
      data: (r?.data ?? null) as T | null,
      error: r?.error ? (typeof r.error === 'string' ? r.error : r.error.message || r.error.code || 'Provider error') : null
    }));
  }

  /** Fetches one page as markdown, limited to its tables. The URL must come from server side config. */
  async function scrapeTables(url: string): Promise<string> {
    const body = await post({ url, formats: ['markdown'], includeTags: ['table'] });
    const markdown = body?.data?.markdown;
    if (typeof markdown !== 'string' || markdown.length === 0) throw new FirecrawlError('Firecrawl returned no markdown');
    const credits = body?.data?.metadata?.creditsUsed;
    if (typeof credits === 'number') creditsUsed += credits;
    return markdown;
  }

  return { runBatch, scrapeTables, getCreditsUsed: () => creditsUsed };
}

export type FirecrawlClient = ReturnType<typeof createFirecrawlClient>;
