import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const products = await db.product.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      slug: true,
      title: true,
      priceCents: true,
      imageUrl: true,
      category: true,
      accentColor: true,
      accentColorDark: true,
    },
  });

  return NextResponse.json(products, {
    headers: {
      // Cacheia por 60s no edge, mas permite servir versão "stale" por mais
      // tempo enquanto revalida em segundo plano — bom para SEO/performance
      // sem deixar o catálogo desatualizado por muito tempo.
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
