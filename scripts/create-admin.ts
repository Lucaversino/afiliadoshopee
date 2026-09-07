// Roda com: npm run seed:admin -- seuemail@exemplo.com "sua-senha-forte"
//
// Não existe rota /admin/signup de propósito: um formulário de cadastro
// público no painel administrativo é a forma mais comum de um site desses
// ser invadido. Criar o admin por aqui, com acesso direto ao banco,
// significa que só quem tem as credenciais do servidor consegue criar
// uma conta administrativa.
import { db } from '../lib/db';
import { hashPassword } from '../lib/auth';

async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password) {
    console.error('Uso: npm run seed:admin -- email@exemplo.com "senha-forte"');
    process.exit(1);
  }
  if (password.length < 12) {
    console.error('Use uma senha com pelo menos 12 caracteres.');
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  const admin = await db.adminUser.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });

  console.log(`Admin pronto: ${admin.email}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
