import * as cheerio from 'cheerio';

export type ExtractedProduct = {
  title: string | null;
  imageUrl: string | null;
  description: string | null;
  price: number | null; // em reais, não centavos — a rota converte
};

const ALLOWED_HOSTS = new Set([
  'shopee.com.br',
  'shope.ee', // links curtos de afiliado
  'shopee.com',
]);

/**
 * Valida que a URL é realmente um domínio Shopee antes de o servidor
 * fazer o fetch. Sem isso, o campo "cole o link aqui" vira um SSRF: um
 * atacante poderia colar http://169.254.169.254/... ou uma URL interna
 * e usar seu servidor como proxy para escanear sua própria rede.
 */
export function isAllowedProductUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'https:') return false;
    const hostname = url.hostname.toLowerCase();
    return [...ALLOWED_HOSTS].some(
      (host) => hostname === host || hostname.endsWith(`.${host}`)
    );
  } catch {
    return false;
  }
}

/**
 * Busca a página do produto e lê as meta tags Open Graph (og:title,
 * og:image, og:description). Isso é o que a própria Shopee expõe para
 * qualquer preview (WhatsApp, Facebook etc.), então é um caminho estável
 * mesmo sem API oficial — mas o preço nem sempre vem nas meta tags,
 * porque o preço real é montado por JavaScript no navegador. Por isso
 * o admin sempre pode revisar/editar os campos antes de publicar.
 */
export async function extractProductFromUrl(rawUrl: string): Promise<ExtractedProduct> {
  if (!isAllowedProductUrl(rawUrl)) {
    throw new Error('URL não é um link válido da Shopee.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  let html: string;
  try {
    const res = await fetch(rawUrl, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        // Alguns sites servem HTML diferente (ou bloqueiam) sem um
        // User-Agent parecido com navegador real.
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Accept: 'text/html',
      },
    });
    if (!res.ok) throw new Error(`Falha ao buscar a página (status ${res.status}).`);
    html = await res.text();
  } finally {
    clearTimeout(timeout);
  }

  const $ = cheerio.load(html);

  const title =
    $('meta[property="og:title"]').attr('content') ??
    $('title').text() ??
    null;

  const imageUrl = $('meta[property="og:image"]').attr('content') ?? null;

  const description =
    $('meta[property="og:description"]').attr('content') ??
    $('meta[name="description"]').attr('content') ??
    null;

  // Tentativa best-effort de achar um preço em R$ no HTML estático.
  // Não confie cegamente nisso — sempre deixe o admin conferir.
  const priceMatch = html.match(/R\$\s*([\d.,]+)/);
  const price = priceMatch
    ? parseFloat(priceMatch[1].replace(/\./g, '').replace(',', '.'))
    : null;

  return {
    title: title?.trim() || null,
    imageUrl: imageUrl?.trim() || null,
    description: description?.trim() || null,
    price: price && !Number.isNaN(price) ? price : null,
  };
}
