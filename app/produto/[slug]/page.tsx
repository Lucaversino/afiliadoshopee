import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { db } from '@/lib/db';

type Props = { params: { slug: string } };

async function getProduct(slug: string) {
  return db.product.findUnique({ where: { slug, published: true } });
}

export async function generateStaticParams() {
  const products = await db.product.findMany({
    where: { published: true },
    select: { slug: true },
  });
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return {};

  const price = (product.priceCents / 100).toFixed(2);

  return {
    title: product.title,
    description: product.description ?? `${product.title} — a partir de R$ ${price}`,
    alternates: { canonical: `/produto/${product.slug}` },
    openGraph: {
      title: product.title,
      description: product.description ?? undefined,
      images: [{ url: product.imageUrl }],
      type: 'website',
    },
  };
}

const priceFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export default async function ProductPage({ params }: Props) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description ?? undefined,
    image: product.imageUrl,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'BRL',
      price: (product.priceCents / 100).toFixed(2),
      availability: 'https://schema.org/InStock',
      url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/api/go/${product.id}`,
    },
  };

  return (
    <main
      className="min-h-screen px-6 py-16 sm:px-8"
      style={{
        ['--accent' as string]: product.accentColor,
        ['--accent-dark' as string]: product.accentColorDark,
        background: `radial-gradient(circle at 20% 0%, ${product.accentColor}22, transparent 55%), radial-gradient(circle at 100% 30%, ${product.accentColorDark}18, transparent 50%)`,
      }}
    >
      {/* Dados estruturados: ajudam o Google a mostrar preço/disponibilidade
          direto no resultado de busca. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto grid max-w-5xl gap-10 sm:grid-cols-2 sm:items-center">
        <div className="perspective-1200 mx-auto w-full max-w-md">
          <div
            className="preserve-3d relative aspect-square w-full"
            style={{ transform: 'rotateY(-8deg) rotateX(4deg)' }}
          >
            <Image
              src={product.imageUrl}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 90vw, 480px"
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>
        </div>

        <div>
          <p className="mb-2 font-body text-sm font-medium capitalize text-ink/50">
            {product.category}
          </p>
          <h1 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
            {product.title}
          </h1>
          {product.description && (
            <p className="mt-4 max-w-md font-body leading-relaxed text-ink/70">
              {product.description}
            </p>
          )}
          <p
            className="mt-6 font-display text-4xl font-bold"
            style={{ color: product.accentColorDark }}
          >
            {priceFormatter.format(product.priceCents / 100)}
          </p>

          <a
            href={`/api/go/${product.id}`}
            rel="nofollow sponsored"
            className="mt-8 inline-flex items-center justify-center rounded-full px-8 py-4 font-body text-base font-semibold text-white shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: `linear-gradient(135deg, ${product.accentColor}, ${product.accentColorDark})` }}
          >
            Ver na Shopee
          </a>
          <p className="mt-3 font-body text-xs text-ink/40">
            Link de afiliado — ao comprar, este site pode receber uma comissão,
            sem custo adicional para você.
          </p>
        </div>
      </div>
    </main>
  );
}
