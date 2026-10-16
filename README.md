# Expense Tracker

A full-stack expense tracker built with **Next.js**, **Node.js**, **Express**, and **MySQL**.

## Features

- Dashboard with current balance, income, expenses, and monthly overview
- Create and delete income/expense transactions
- Search and filter transactions by type, category, and date range
- Export transactions to CSV
- REST API built with Express and MySQL
- Docker Compose setup for MySQL
- Example environment configuration

## Project structure

```text
expense-tracker/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # Express API and database scripts
├── .github/workflows/ci.yml
├── docker-compose.yml
└── .env.example
```

## Requirements

- Node.js 20+
- npm
- Docker Desktop (recommended for running MySQL)

## Getting started

1. Clone the repository.

   ```bash
   git clone https://github.com/dixit2812/expense-tracker.git
   cd expense-tracker
   ```

2. Copy the sample environment file and update values as needed.

   ```bash
   cp .env.example .env
   ```

3. Start MySQL with Docker Compose.

   ```bash
   docker compose up -d db
   ```

4. Install dependencies for the API and frontend in separate terminals.

   ```bash
   cd apps/api
   npm install
   npm run db:setup
   npm run dev
   ```

   ```bash
   cd apps/web
   npm install
   npm run dev
   ```

5. Open http://localhost:3000. The API runs on http://localhost:4000 by default.

> Check the package scripts and `.env.example` for the exact local configuration. Ensure the API URL configured in the frontend matches the API server.

## API overview

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/transactions` | List transactions, with optional filters |
| POST | `/api/transactions` | Create a transaction |
| DELETE | `/api/transactions/:id` | Delete a transaction |
| GET | `/api/categories` | List categories |
| GET | `/api/dashboard/summary` | Current totals and overview |
| GET | `/api/dashboard/monthly` | Monthly report data |

## Configuration

See `.env.example` for database, API, and frontend configuration. Never commit real secrets or production credentials.

## Security note

This starter project does not include user authentication or per-user data isolation. Before exposing it publicly or deploying it for real personal financial data, add authentication, authorization, input/rate limiting, production secret management, and suitable database access controls.

## License

MIT. See [LICENSE](./LICENSE).
