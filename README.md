# Site de afiliado Shopee

Next.js 14 (App Router) + TypeScript + Tailwind + Prisma. Pronto para Vercel + Supabase (free tier).

## O que já vem pronto

- **Home** com produtos agrupados por categoria, cards com efeito 3D (tilt ao mover o mouse) e cor de destaque própria por produto.
- **Página de produto** com tema colorido dinâmico, SEO (metadata, Open Graph, JSON-LD de `Product`), e link de compra "cloacado" (o link de afiliado real nunca aparece no HTML — `/api/go/[id]` redireciona e registra o clique).
- **Painel admin** (`/admin/dashboard`): cola o link do produto na Shopee → o sistema tenta extrair título, imagem, descrição e preço automaticamente; você confere/edita e publica.
- **Segurança**: login com bcrypt + JWT em cookie `httpOnly`, bloqueio de conta após 5 tentativas erradas, rate limiting em login/extração/redirecionamento, validação de todo input com Zod, proteção contra SSRF na extração de link (só aceita domínios Shopee), headers de segurança (CSP, HSTS, X-Frame-Options, etc.), sem rota pública de cadastro de admin.
- **SEO**: `sitemap.xml` e `robots.txt` gerados dinamicamente, metadata por página, dados estruturados.

## Limitações importantes (leia antes de prometer isso ao cliente/você mesmo)

1. **Não existe API oficial da Shopee conectada.** A extração de dados lê as meta tags públicas (`og:title`, `og:image`, `og:description`) da página do produto — o mesmo que WhatsApp/Facebook leem para gerar preview de link. Funciona bem para título e imagem. **O preço nem sempre vem certo automaticamente**, porque o preço real da Shopee é montado por JavaScript no navegador, não está sempre no HTML puro. Por isso o painel sempre deixa você conferir e editar antes de publicar.
2. **"3D" aqui é efeito visual (CSS perspective + tilt), não modelagem 3D real.** Fotos de produto da Shopee não vêm com modelo 3D — não existe isso pra puxar. O efeito de tilt + profundidade de sombra é o que dá a sensação "premium" sem inventar dado que não existe.
3. **Rate limiting é em memória.** Funciona bem em um único servidor (ex.: uma VPS). Se o tráfego crescer e você rodar em várias instâncias serverless simultâneas, troque `lib/rateLimit.ts` por Upstash Redis (free tier, plug-and-play com Vercel) — a interface já foi pensada pra essa troca ser simples.
4. **Scraping de terceiros é sempre frágil.** Se a Shopee mudar o HTML da página, a extração automática pode parar de achar algum campo — por isso o formulário nunca depende 100% disso.

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha DATABASE_URL e SESSION_SECRET
npx prisma db push           # cria as tabelas no banco
npm run seed:admin -- seuemail@exemplo.com "uma-senha-de-verdade-forte"
npm run dev
```

Acesse `http://localhost:3000` e `http://localhost:3000/admin/login`.

## Deploy (Vercel + Supabase)

1. Crie um projeto grátis em [supabase.com](https://supabase.com), copie a **Connection string** (modo "Transaction pooler") em Project Settings → Database.
2. Suba este código para um repositório no GitHub.
3. Importe o repositório na [Vercel](https://vercel.com/new).
4. Em Vercel → Settings → Environment Variables, adicione `DATABASE_URL`, `SESSION_SECRET` (gere com `openssl rand -base64 48`), `NEXT_PUBLIC_SITE_URL` e `NEXT_PUBLIC_SITE_NAME`.
5. Depois do primeiro deploy, rode `npx prisma db push` apontando pro banco de produção (localmente, com o `.env` de produção) e depois `npm run seed:admin -- ... ...` pra criar seu usuário admin.
6. Acesse `https://seusite.vercel.app/admin/login`.

## Próximos passos sugeridos

- Trocar `lib/rateLimit.ts` por Upstash Redis se o tráfego crescer.
- Ajustar a lista de domínios de imagem em `next.config.js` (`images.remotePatterns`) para o CDN exato que aparecer nas suas fotos de produto.
- Adicionar 2FA no login do admin se o site começar a gerar receita relevante.
- Configurar backups automáticos do banco (Supabase já oferece isso no painel).
