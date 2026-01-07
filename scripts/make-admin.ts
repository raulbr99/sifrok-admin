import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeAdmin(email: string) {
  const user = await prisma.user.update({
    where: { email },
    data: { role: 'admin' },
  });

  console.log(`✅ Usuario ${user.email} ahora es admin`);
  return user;
}

// Cambiar el email por el tuyo
const email = process.argv[2];

if (!email) {
  console.log('Uso: npx tsx scripts/make-admin.ts tu@email.com');
  process.exit(1);
}

makeAdmin(email)
  .catch(console.error)
  .finally(() => prisma.$disconnect());
