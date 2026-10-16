import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PocketLedger — Expense Tracker',
  description: 'Track your income, expenses, and monthly cash flow in one place.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
