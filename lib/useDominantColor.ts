'use client';

/**
 * Tenta estimar a cor dominante de uma imagem lendo os pixels via canvas.
 *
 * Limitação real: se o CDN da imagem não enviar os headers de CORS certos,
 * o canvas fica "tainted" e o navegador bloqueia a leitura dos pixels
 * (SecurityError) — é uma proteção do próprio navegador, não um bug. Por
 * isso essa função sempre falha de forma silenciosa nesse caso, e o painel
 * admin deixa o campo de cor editável manualmente como respaldo.
 */
export async function estimateDominantColor(imageUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 32; // downscale: mais rápido e suficiente pra uma média
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3];
          if (alpha < 200) continue; // ignora pixels transparentes de fundo
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count += 1;
        }
        if (count === 0) return resolve(null);
        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);
        const toHex = (n: number) => n.toString(16).padStart(2, '0');
        resolve(`#${toHex(r)}${toHex(g)}${toHex(b)}`);
      } catch {
        resolve(null); // canvas "tainted" por CORS — cai no campo manual
      }
    };
    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
}

/** Escurece um hex para gerar a variante "dark" usada em gradientes/texto. */
export function darkenHex(hex: string, amount = 0.35): string {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  const r = Math.max(0, ((num >> 16) & 0xff) * (1 - amount));
  const g = Math.max(0, ((num >> 8) & 0xff) * (1 - amount));
  const b = Math.max(0, (num & 0xff) * (1 - amount));
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
