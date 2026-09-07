'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { estimateDominantColor, darkenHex } from '@/lib/useDominantColor';

type Product = {
  id: string;
  slug: string;
  title: string;
  priceCents: number;
  imageUrl: string;
  category: string;
  accentColor: string;
  accentColorDark: string;
  published: boolean;
  affiliateUrl: string;
  originalUrl: string;
};

const emptyForm = {
  originalUrl: '',
  affiliateUrl: '',
  title: '',
  description: '',
  price: '',
  imageUrl: '',
  category: 'geral',
  accentColor: '#ff5722',
  accentColorDark: '#c41e1e',
};

export default function AdminDashboard() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function loadProducts() {
    const res = await fetch('/api/admin/products');
    if (res.ok) setProducts(await res.json());
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function handleExtract() {
    if (!form.originalUrl) return;
    setExtracting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: form.originalUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? 'Não consegui extrair os dados. Preencha manualmente.');
        return;
      }

      let accentColor = form.accentColor;
      let accentColorDark = form.accentColorDark;
      if (data.imageUrl) {
        const estimated = await estimateDominantColor(data.imageUrl);
        if (estimated) {
          accentColor = estimated;
          accentColorDark = darkenHex(estimated);
        }
      }

      setForm((prev) => ({
        ...prev,
        title: data.title ?? prev.title,
        description: data.description ?? prev.description,
        imageUrl: data.imageUrl ?? prev.imageUrl,
        price: data.price != null ? String(data.price) : prev.price,
        accentColor,
        accentColorDark,
      }));

      if (!data.price) {
        setMessage('Título e imagem extraídos. O preço não veio automático — confira e preencha.');
      }
    } finally {
      setExtracting(false);
    }
  }

  async function handleSave(publish: boolean) {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          price: parseFloat(form.price),
          originalUrl: form.originalUrl,
          affiliateUrl: form.affiliateUrl || form.originalUrl,
          imageUrl: form.imageUrl,
          category: form.category,
          accentColor: form.accentColor,
          accentColorDark: form.accentColorDark,
          published: publish,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setMessage(JSON.stringify(data.error ?? 'Erro ao salvar.'));
        return;
      }
      setForm(emptyForm);
      setMessage(publish ? 'Produto publicado!' : 'Rascunho salvo.');
      loadProducts();
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(product: Product) {
    await fetch(`/api/admin/products/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !product.published }),
    });
    loadProducts();
  }

  async function deleteProduct(id: string) {
    if (!confirm('Remover este produto definitivamente?')) return;
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    loadProducts();
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Painel administrativo</h1>
        <button onClick={handleLogout} className="text-sm text-ink/50 underline">
          Sair
        </button>
      </div>

      <section className="mb-12 rounded-2xl border border-ink/10 p-6">
        <h2 className="mb-4 font-display text-lg font-medium">Novo produto</h2>

        <label className="mb-4 block">
          <span className="mb-1 block text-sm text-ink/60">Link do produto na Shopee</span>
          <div className="flex gap-2">
            <input
              value={form.originalUrl}
              onChange={(e) => setForm({ ...form, originalUrl: e.target.value })}
              placeholder="https://shopee.com.br/..."
              className="flex-1 rounded-lg border border-ink/15 px-3 py-2"
            />
            <button
              type="button"
              onClick={handleExtract}
              disabled={extracting || !form.originalUrl}
              className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {extracting ? 'Extraindo…' : 'Extrair dados'}
            </button>
          </div>
        </label>

        <label className="mb-4 block">
          <span className="mb-1 block text-sm text-ink/60">Link de afiliado (o que o cliente vai clicar)</span>
          <input
            value={form.affiliateUrl}
            onChange={(e) => setForm({ ...form, affiliateUrl: e.target.value })}
            placeholder="Cole aqui o link gerado no painel de afiliados da Shopee"
            className="w-full rounded-lg border border-ink/15 px-3 py-2"
          />
        </label>

        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm text-ink/60">Título</span>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg border border-ink/15 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-ink/60">Preço (R$)</span>
            <input
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full rounded-lg border border-ink/15 px-3 py-2"
            />
          </label>
        </div>

        <label className="mb-4 block">
          <span className="mb-1 block text-sm text-ink/60">Imagem (URL)</span>
          <input
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            className="w-full rounded-lg border border-ink/15 px-3 py-2"
          />
        </label>

        <label className="mb-4 block">
          <span className="mb-1 block text-sm text-ink/60">Descrição</span>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full rounded-lg border border-ink/15 px-3 py-2"
          />
        </label>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-sm text-ink/60">Categoria</span>
            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-lg border border-ink/15 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-ink/60">Cor</span>
            <input
              type="color"
              value={form.accentColor}
              onChange={(e) =>
                setForm({ ...form, accentColor: e.target.value, accentColorDark: darkenHex(e.target.value) })
              }
              className="h-10 w-full rounded-lg border border-ink/15"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-ink/60">Cor escura</span>
            <input
              type="color"
              value={form.accentColorDark}
              onChange={(e) => setForm({ ...form, accentColorDark: e.target.value })}
              className="h-10 w-full rounded-lg border border-ink/15"
            />
          </label>
        </div>

        {message && <p className="mb-4 text-sm text-ink/70">{message}</p>}

        <div className="flex gap-3">
          <button
            onClick={() => handleSave(false)}
            disabled={saving || !form.title || !form.price || !form.imageUrl}
            className="rounded-lg border border-ink/15 px-5 py-2.5 text-sm font-medium disabled:opacity-50"
          >
            Salvar rascunho
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving || !form.title || !form.price || !form.imageUrl}
            className="rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            Publicar
          </button>
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-lg font-medium">Produtos ({products.length})</h2>
        <div className="space-y-2">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-ink/10 px-4 py-3"
            >
              <div>
                <p className="font-medium">{p.title}</p>
                <p className="text-sm text-ink/50">
                  {(p.priceCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} · {p.category} ·{' '}
                  {p.published ? 'publicado' : 'rascunho'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => togglePublished(p)}
                  className="rounded-lg border border-ink/15 px-3 py-1.5 text-sm"
                >
                  {p.published ? 'Despublicar' : 'Publicar'}
                </button>
                <button
                  onClick={() => deleteProduct(p.id)}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600"
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
