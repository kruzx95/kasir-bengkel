const { PrismaClient } = require('./src/generated/prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
prisma.user.findMany({ include: { branch: true } }).then(u => {
  console.log(JSON.stringify(u, null, 2));
  prisma.$disconnect();
});
