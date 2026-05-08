import type { Config } from 'drizzle-kit'
import { config } from 'dotenv'

// drizzle-kit doesn't auto-load .env.local — load it explicitly
config({ path: '.env.local' })

export default {
  schema:    './lib/db/schema.ts',
  out:       './drizzle',
  dialect:   'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config
