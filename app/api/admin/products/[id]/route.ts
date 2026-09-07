import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';

const UpdateSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(2000).optional(),
  price: z.number().positive().max(1_000_000).optional(),
  affiliateUrl: z.string().url().max(2000).optional(),
  imageUrl: z.string().url().max(2000).optional(),
  category: z.string().max(60).optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  accentColorDark: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  published: z.boolean().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { price, ...rest } = parsed.data;

  const existing = await db.product.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'Produto não encontrado.' }, { status: 404 });

  const product = await db.product.update({
    where: { id: params.id },
    data: {
      ...rest,
      ...(price !== undefined ? { priceCents: Math.round(price * 100) } : {}),
    },
  });

  return NextResponse.json(product);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const existing = await db.product.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'Produto não encontrado.' }, { status: 404 });

  await db.product.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
