import { PrismaClient } from '@/generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is missing!')
  }

  try {
    const url = new URL(databaseUrl)
    const adapter = new PrismaMariaDb({
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.replace('/', ''),
      allowPublicKeyRetrieval: true,
      connectTimeout: 10000,
    })
    return new PrismaClient({ adapter })
  } catch (err) {
    console.error('Failed to parse DATABASE_URL:', err)
    throw err
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
