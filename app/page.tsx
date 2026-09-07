import { db } from '@/lib/db';
import ProductCard3D from '@/components/ProductCard3D';

export const revalidate = 60; // ISR: regenera a home a cada 60s

async function getProducts() {
  return db.product.findMany({
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
}

export default async function HomePage() {
  const products = await getProducts();
  const categories = Array.from(new Set(products.map((p) => p.category)));

  return (
    <main className="mx-auto max-w-6xl px-6 pb-24 pt-16 sm:px-8">
      <header className="mb-14 max-w-2xl">
        <p className="mb-3 font-body text-sm font-medium text-ink/50">
          Atualizado todo dia
        </p>
        <h1 className="font-display text-4xl font-semibold italic leading-[1.1] sm:text-5xl">
          Achados que valem o clique.
        </h1>
        <p className="mt-4 font-body text-base leading-relaxed text-ink/70">
          Cada produto aqui foi escolhido, não gerado — preço conferido e link
          direto pra comprar, sem enrolação.
        </p>
      </header>

      {products.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink/15 p-10 text-center text-ink/50">
          Nenhum produto publicado ainda. Entre no painel administrativo para
          adicionar o primeiro.
        </p>
      ) : (
        categories.map((category) => (
          <section key={category} className="mb-16">
            <h2 className="mb-6 font-display text-2xl font-medium capitalize">
              {category}
            </h2>
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {products
                .filter((p) => p.category === category)
                .map((product) => (
                  <ProductCard3D key={product.id} {...product} />
                ))}
            </div>
          </section>
        ))
      )}
    </main>
  );
}
