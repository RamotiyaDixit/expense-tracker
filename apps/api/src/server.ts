import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { categoriesRouter } from './routes/categories.js';
import { transactionsRouter } from './routes/transactions.js';
import { dashboardRouter } from './routes/dashboard.js';
import { errorHandler, notFound } from './middleware/errors.js';

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.disable('x-powered-by');
app.use(cors({
  origin: (process.env.CORS_ORIGIN ?? 'http://localhost:3000').split(',').map((s) => s.trim()),
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json({ limit: '32kb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/categories', categoriesRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Expense Tracker API listening on http://localhost:${port}`);
});
