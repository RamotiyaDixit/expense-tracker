import { Router } from 'express';
import { pool } from '../config/db.js';

export const dashboardRouter = Router();

dashboardRouter.get('/summary', async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expenses,
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) AS balance
       FROM transactions
       WHERE transaction_date >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')
         AND transaction_date < DATE_FORMAT(CURRENT_DATE + INTERVAL 1 MONTH, '%Y-%m-01')`
    );
    res.json((rows as unknown[])[0] ?? { income: 0, expenses: 0, balance: 0 });
  } catch (error) {
    next(error);
  }
});

dashboardRouter.get('/monthly', async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT DATE_FORMAT(transaction_date, '%Y-%m') AS month,
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expenses
       FROM transactions
       WHERE transaction_date >= CURRENT_DATE - INTERVAL 5 MONTH
       GROUP BY DATE_FORMAT(transaction_date, '%Y-%m')
       ORDER BY month ASC`
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});
