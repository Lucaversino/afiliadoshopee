import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const SESSION_COOKIE = 'admin_session';
const ALG = 'HS256';

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    // Falha alto e cedo: nunca rode em produção com um segredo fraco/ausente.
    throw new Error(
      'SESSION_SECRET ausente ou curto demais (mínimo 32 caracteres). Gere um com: openssl rand -base64 48'
    );
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(plain: string): Promise<string> {
  // 12 rounds é um bom equilíbrio custo/segurança em 2026.
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function createSessionToken(adminId: string): Promise<string> {
  return new SignJWT({ sub: adminId })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<{ sub: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.sub !== 'string') return null;
    return { sub: payload.sub };
  } catch {
    // Token expirado, adulterado ou assinado com outro segredo — nunca
    // confie em nada aqui, apenas trate como "não autenticado".
    return null;
  }
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 8, // 8 horas, igual à expiração do JWT
};
