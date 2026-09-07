import { SignJWT, jwtVerify } from 'jose';

// Este arquivo só usa `jose`, que roda tanto no Edge Runtime quanto no
// Node.js. O middleware.ts (que roda no Edge por padrão) importa DAQUI,
// nunca de lib/password.ts — se ele importasse um arquivo que usa
// bcryptjs, o build tentaria empacotar bcryptjs pro Edge Runtime, onde
// ele não funciona (usa APIs do Node como process.nextTick).

const SESSION_COOKIE = 'admin_session';
const ALG = 'HS256';

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'SESSION_SECRET ausente ou curto demais (mínimo 32 caracteres). Gere um com: openssl rand -base64 48'
    );
  }
  return new TextEncoder().encode(secret);
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
