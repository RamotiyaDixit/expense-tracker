import 'dotenv/config';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? 'expense_user',
  password: process.env.DB_PASSWORD ?? 'expense_password',
  database: process.env.DB_NAME ?? 'expense_tracker',
  multipleStatements: true
});

try {
  const fs = await import('node:fs/promises');
  const schema = await fs.readFile(new URL('../sql/schema.sql', import.meta.url), 'utf8');
  await connection.query(schema);
  console.log('Database schema initialized successfully.');
} finally {
  await connection.end();
}
