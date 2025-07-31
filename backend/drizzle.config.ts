import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: '../shared/schema.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/bms_db',
  },
});