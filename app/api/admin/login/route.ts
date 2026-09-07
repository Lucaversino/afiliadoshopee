import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import {
  verifyPassword,
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';

const LoginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(200),
});

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutos

export async function POST(req: NextRequest) {
  // 1) Rate limit por IP: no máximo 10 tentativas de login a cada 5 minutos,
  // independente do e-mail usado — freia scripts de brute force logo na porta.
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const limited = rateLimit(`login:${ip}`, 10, 5 * 60 * 1000);
  if (!limited.allowed) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const admin = await db.adminUser.findUnique({ where: { email } });

  // Resposta genérica sempre que a credencial falha — nunca revele se foi
  // o e-mail ou a senha que estava errada (isso ajuda quem está tentando
  // adivinhar contas válidas).
  const genericError = NextResponse.json(
    { error: 'E-mail ou senha inválidos.' },
    { status: 401 }
  );

  if (!admin) return genericError;

  if (admin.lockedUntil && admin.lockedUntil > new Date()) {
    return NextResponse.json(
      { error: 'Conta temporariamente bloqueada por excesso de tentativas.' },
      { status: 423 }
    );
  }

  const validPassword = await verifyPassword(password, admin.passwordHash);

  if (!validPassword) {
    const attempts = admin.failedLoginAttempts + 1;
    await db.adminUser.update({
      where: { id: admin.id },
      data: {
        failedLoginAttempts: attempts,
        lockedUntil:
          attempts >= MAX_FAILED_ATTEMPTS
            ? new Date(Date.now() + LOCK_DURATION_MS)
            : null,
      },
    });
    return genericError;
  }

  // Login certo: zera o contador de falhas e registra o horário.
  await db.adminUser.update({
    where: { id: admin.id },
    data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
  });

  const token = await createSessionToken(admin.id);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
  return res;
}
