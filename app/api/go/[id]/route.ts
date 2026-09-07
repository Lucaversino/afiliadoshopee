import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rateLimit';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';

  // Trava cliques repetidos em looping/bot, sem bloquear um humano normal.
  const limited = rateLimit(`go:${ip}`, 30, 60 * 1000);
  if (!limited.allowed) {
    return NextResponse.json({ error: 'Muitas requisições.' }, { status: 429 });
  }

  const product = await db.product.findUnique({ where: { id: params.id } });
  if (!product || !product.published) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Hash truncado do IP + dia: dá pra notar cliques repetidos no mesmo dia
  // sem guardar o IP em si (dado pessoal) — só um resumo irreversível.
  const visitorHash = crypto
    .createHash('sha256')
    .update(ip + new Date().toISOString().slice(0, 10))
    .digest('hex')
    .slice(0, 16);

  await db.clickLog.create({
    data: { productId: product.id, visitorHash },
  });

  return NextResponse.redirect(product.affiliateUrl, { status: 302 });
}
