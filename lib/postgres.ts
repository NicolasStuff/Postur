import { Pool } from "pg"

const globalForPostgres = globalThis as unknown as {
  postgresPool?: Pool
}

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured")
}

export const postgresPool =
  globalForPostgres.postgresPool ?? new Pool({ connectionString })

if (process.env.NODE_ENV !== "production") {
  globalForPostgres.postgresPool = postgresPool
}
