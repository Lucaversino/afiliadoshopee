import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com';
  const products = await db.product.findMany({
    where: { published: true },
    select: { slug: true, updatedAt: true },
  });

  return [
    { url: siteUrl, changeFrequency: 'daily', priority: 1 },
    ...products.map((p) => ({
      url: `${siteUrl}/produto/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];
}
