// Rate limiter em memória — funciona para um único servidor/VPS.
//
// IMPORTANTE: se você rodar em serverless com múltiplas instâncias (Vercel
// com tráfego alto), esse Map não é compartilhado entre instâncias. Para
// produção séria, troque por Upstash Redis (@upstash/ratelimit) — é grátis
// no plano free e funciona nativamente com Vercel Edge. A interface abaixo
// foi feita para ser trocada por essa lib sem tocar em quem a chama.

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number): {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
} {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterMs: existing.resetAt - now };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, retryAfterMs: 0 };
}

// Limpa buckets expirados periodicamente para não vazar memória.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}, 60_000).unref?.();
