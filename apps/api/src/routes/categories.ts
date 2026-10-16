import { Router } from 'express';
import { pool } from '../config/db.js';

export const categoriesRouter = Router();

categoriesRouter.get('/', async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, type, color FROM categories ORDER BY type, name'
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});
