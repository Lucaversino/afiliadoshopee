'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';

type Props = {
  id: string;
  slug: string;
  title: string;
  priceCents: number;
  imageUrl: string;
  accentColor: string;
  accentColorDark: string;
};

const priceFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export default function ProductCard3D({
  slug,
  title,
  priceCents,
  imageUrl,
  accentColor,
  accentColorDark,
}: Props) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [hovering, setHovering] = useState(false);

  function handleMouseMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width; // 0..1
    const py = (e.clientY - rect.top) / rect.height; // 0..1
    // Máximo de ~10 graus — sutil o suficiente pra não enjoar.
    const ry = (px - 0.5) * 18;
    const rx = (0.5 - py) * 14;
    setTilt({ rx, ry });
  }

  return (
    <a
      ref={cardRef}
      href={`/produto/${slug}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => {
        setHovering(false);
        setTilt({ rx: 0, ry: 0 });
      }}
      className="group perspective-1200 block rounded-3xl"
      style={{ ['--accent' as string]: accentColor, ['--accent-dark' as string]: accentColorDark }}
    >
      <div
        className="preserve-3d relative overflow-hidden rounded-3xl border border-black/5 p-5 transition-shadow duration-300"
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transition: hovering ? 'transform 60ms linear' : 'transform 400ms ease-out',
          background: `linear-gradient(155deg, ${accentColor}1a, ${accentColorDark}0d 60%, transparent)`,
          boxShadow: hovering
            ? `0 30px 60px -20px ${accentColor}66, 0 8px 20px -8px ${accentColorDark}40`
            : '0 8px 24px -12px rgba(0,0,0,0.12)',
        }}
      >
        <div
          className="relative mx-auto aspect-square w-full max-w-[220px]"
          style={{
            transform: hovering ? 'translateZ(46px)' : 'translateZ(0px)',
            transition: 'transform 300ms ease-out',
          }}
        >
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="220px"
            className="object-contain drop-shadow-xl"
          />
        </div>

        <div className="relative mt-4 space-y-1" style={{ transform: 'translateZ(20px)' }}>
          <h3 className="line-clamp-2 font-body text-sm font-medium leading-snug text-ink/90">
            {title}
          </h3>
          <p
            className="font-display text-xl font-semibold"
            style={{ color: accentColorDark }}
          >
            {priceFormatter.format(priceCents / 100)}
          </p>
        </div>

        {/* Brilho que segue o mouse — reforça a sensação de profundidade */}
        <div
          className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(circle at ${50 + tilt.ry * 2}% ${50 - tilt.rx * 2}%, ${accentColor}33, transparent 55%)`,
          }}
        />
      </div>
    </a>
  );
}
