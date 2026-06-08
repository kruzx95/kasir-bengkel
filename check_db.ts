import 'dotenv/config'
import { PrismaClient } from './src/generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const url = new URL(process.env.DATABASE_URL!)
const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.replace('/', ''),
})
const prisma = new PrismaClient({ adapter })

async function main() {
  const settings = await prisma.appSetting.findMany()
  console.log(settings)
}

main().finally(() => prisma.$disconnect())
