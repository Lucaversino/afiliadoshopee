import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import slugify from 'slugify';
import { db } from '@/lib/db';
import { isAllowedProductUrl } from '@/lib/extractProduct';

const ProductSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  price: z.number().positive().max(1_000_000),
  originalUrl: z.string().url().max(2000),
  affiliateUrl: z.string().url().max(2000),
  imageUrl: z.string().url().max(2000),
  category: z.string().max(60).default('geral'),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#ff5722'),
  accentColorDark: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#c41e1e'),
  published: z.boolean().default(false),
});

export async function GET() {
  // Lista completa (inclui rascunhos) para o painel admin gerenciar.
  const products = await db.product.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = ProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  if (!isAllowedProductUrl(data.originalUrl)) {
    return NextResponse.json({ error: 'Link original precisa ser um domínio Shopee.' }, { status: 400 });
  }

  const baseSlug = slugify(data.title, { lower: true, strict: true }).slice(0, 80);
  let slug = baseSlug;
  let attempt = 0;
  // Garante slug único mesmo se dois produtos tiverem título parecido.
  while (await db.product.findUnique({ where: { slug } })) {
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }

  const product = await db.product.create({
    data: {
      slug,
      title: data.title,
      description: data.description,
      priceCents: Math.round(data.price * 100),
      originalUrl: data.originalUrl,
      affiliateUrl: data.affiliateUrl,
      imageUrl: data.imageUrl,
      category: data.category,
      accentColor: data.accentColor,
      accentColorDark: data.accentColorDark,
      published: data.published,
    },
  });

  return NextResponse.json(product, { status: 201 });
}
