CREATE DATABASE IF NOT EXISTS expense_tracker;
USE expense_tracker;

CREATE TABLE IF NOT EXISTS categories (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  type ENUM('income', 'expense') NOT NULL,
  color VARCHAR(7) NOT NULL DEFAULT '#64748b',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_categories_name_type (name, type)
);

CREATE TABLE IF NOT EXISTS transactions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  type ENUM('income', 'expense') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  category_id INT UNSIGNED NOT NULL,
  description VARCHAR(255) NOT NULL DEFAULT '',
  transaction_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_transactions_category FOREIGN KEY (category_id)
    REFERENCES categories(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX idx_transactions_date (transaction_date),
  INDEX idx_transactions_type_date (type, transaction_date),
  INDEX idx_transactions_category (category_id)
);

INSERT IGNORE INTO categories (name, type, color) VALUES
  ('Salary', 'income', '#16a34a'),
  ('Freelance', 'income', '#0d9488'),
  ('Investments', 'income', '#2563eb'),
  ('Other income', 'income', '#64748b'),
  ('Food & dining', 'expense', '#f97316'),
  ('Shopping', 'expense', '#db2777'),
  ('Transport', 'expense', '#7c3aed'),
  ('Bills & utilities', 'expense', '#0891b2'),
  ('Health', 'expense', '#dc2626'),
  ('Entertainment', 'expense', '#ca8a04'),
  ('Housing', 'expense', '#475569'),
  ('Other expense', 'expense', '#64748b');
