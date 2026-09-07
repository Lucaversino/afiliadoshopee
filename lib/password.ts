import bcrypt from 'bcryptjs';

// Só use este arquivo em rotas de API (Node.js runtime) ou scripts — nunca
// no middleware.ts. bcryptjs usa APIs do Node (process.nextTick,
// setImmediate) que não existem no Edge Runtime.

export async function hashPassword(plain: string): Promise<string> {
  // 12 rounds é um bom equilíbrio custo/segurança em 2026.
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
