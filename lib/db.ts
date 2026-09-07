import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Em serverless (Vercel), cada função pode instanciar o client de novo.
// Guardar no `global` evita abrir uma conexão nova a cada hot-reload em dev.
export const db = global.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = db;
}
