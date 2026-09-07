import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { extractProductFromUrl } from '@/lib/extractProduct';
import { rateLimit } from '@/lib/rateLimit';

// O middleware já garante que só um admin autenticado chega aqui.

const BodySchema = z.object({
  url: z.string().url().max(2000),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const limited = rateLimit(`extract:${ip}`, 20, 60 * 1000);
  if (!limited.allowed) {
    return NextResponse.json({ error: 'Muitas requisições. Aguarde um instante.' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Link inválido.' }, { status: 400 });
  }

  try {
    const data = await extractProductFromUrl(parsed.data.url);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Falha ao extrair dados do produto.';
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
