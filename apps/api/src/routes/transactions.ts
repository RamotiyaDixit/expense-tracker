import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { asAmount } from '../services/money.js';

export const transactionsRouter = Router();

const querySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  type: z.enum(['income', 'expense']).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  search: z.string().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0)
});

const createSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.coerce.number().positive().max(9999999999.99),
  categoryId: z.coerce.number().int().positive(),
  description: z.string().trim().max(255).default(''),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

transactionsRouter.get('/', async (req, res, next) => {
  try {
    const filters = querySchema.parse(req.query);
    const where: string[] = [];
    const values: Array<string | number> = [];

    if (filters.from) { where.push('t.transaction_date >= ?'); values.push(filters.from); }
    if (filters.to) { where.push('t.transaction_date <= ?'); values.push(filters.to); }
    if (filters.type) { where.push('t.type = ?'); values.push(filters.type); }
    if (filters.categoryId) { where.push('t.category_id = ?'); values.push(filters.categoryId); }
    if (filters.search) {
      where.push('(t.description LIKE ? OR c.name LIKE ?)');
      values.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [rows] = await pool.query(
      `SELECT t.id, t.type, t.amount, t.category_id AS categoryId,
              c.name AS categoryName, c.color AS categoryColor,
              t.description, DATE_FORMAT(t.transaction_date, '%Y-%m-%d') AS transactionDate
       FROM transactions t
       JOIN categories c ON c.id = t.category_id
       ${clause}
       ORDER BY t.transaction_date DESC, t.id DESC
       LIMIT ? OFFSET ?`,
      [...values, filters.limit, filters.offset]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

transactionsRouter.post('/', async (req, res, next) => {
  try {
    const payload = createSchema.parse(req.body);
    const amount = asAmount(payload.amount);
    const [categoryRows] = await pool.query(
      'SELECT id FROM categories WHERE id = ? AND type = ?',
      [payload.categoryId, payload.type]
    );
    if (!(categoryRows as unknown[]).length) {
      res.status(400).json({ error: 'Choose a category matching the transaction type.' });
      return;
    }

    const [result] = await pool.execute(
      'INSERT INTO transactions (type, amount, category_id, description, transaction_date) VALUES (?, ?, ?, ?, ?)',
      [payload.type, amount, payload.categoryId, payload.description, payload.transactionDate]
    );
    const insertId = (result as { insertId: number }).insertId;
    const [rows] = await pool.query(
      `SELECT t.id, t.type, t.amount, t.category_id AS categoryId,
              c.name AS categoryName, c.color AS categoryColor,
              t.description, DATE_FORMAT(t.transaction_date, '%Y-%m-%d') AS transactionDate
       FROM transactions t JOIN categories c ON c.id = t.category_id WHERE t.id = ?`,
      [insertId]
    );
    res.status(201).json((rows as unknown[])[0]);
  } catch (error) {
    next(error);
  }
});

transactionsRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const [result] = await pool.execute('DELETE FROM transactions WHERE id = ?', [id]);
    if ((result as { affectedRows: number }).affectedRows === 0) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
