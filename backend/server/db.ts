import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "../../shared/schema.js";

const DATABASE_URL = process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/bms_db';

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Please provide a MySQL connection string.",
  );
}

// Create MySQL connection pool for better performance
const pool = mysql.createPool({
  uri: DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Create Drizzle instance
export const db = drizzle(pool, { schema, mode: 'default' });

export default db;