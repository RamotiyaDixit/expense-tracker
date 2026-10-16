'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownLeft, ArrowDownRight, ArrowUpRight, Bell, CalendarDays, Check,
  ChevronDown, CircleHelp, Download, Ellipsis, Filter, LayoutDashboard,
  LoaderCircle, Plus, Search, ShieldCheck, Sparkles, Wallet,
  X, Trash2, TrendingUp, ReceiptText
} from 'lucide-react';
import { api, type Category, type MonthlySummary, type Summary, type Transaction, type TransactionType } from '@/lib/api';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
const money = (value: number) => currency.format(Number(value) || 0);
const today = () => new Date().toISOString().slice(0, 10);

function monthLabel(value: string) {
  const date = new Date(`${value}-01T12:00:00`);
  return date.toLocaleDateString('en-US', { month: 'short' });
}

function DateLabel({ value }: { value: string }) {
  const date = new Date(`${value}T12:00:00`);
  return <>{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</>;
}

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [summary, setSummary] = useState<Summary>({ income: 0, expenses: 0, balance: 0 });
  const [monthly, setMonthly] = useState<MonthlySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    type: 'expense' as TransactionType,
    amount: '',
    categoryId: '',
    description: '',
    transactionDate: today()
  });

  const loadData = useCallback(async () => {
    setError('');
    try {
      const [tx, cats, summaryData, monthlyData] = await Promise.all([
        api.getTransactions('limit=500'),
        api.getCategories(),
        api.getSummary(),
        api.getMonthly()
      ]);
      setTransactions(tx);
      setCategories(cats);
      setSummary(summaryData);
      setMonthly(monthlyData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load data. Check the API and database.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const filtered = useMemo(() => transactions.filter((tx) => {
    const matchesSearch = `${tx.description} ${tx.categoryName}`.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || String(tx.categoryId) === categoryFilter;
    return matchesSearch && matchesType && matchesCategory;
  }), [transactions, search, typeFilter, categoryFilter]);

  const maxChart = Math.max(1, ...monthly.flatMap((item) => [Number(item.income), Number(item.expenses)]));

  async function submitTransaction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    if (!form.amount || Number(form.amount) <= 0 || !form.categoryId) {
      setFormError('Enter a positive amount and choose a category.');
      return;
    }
    setBusy(true);
    try {
      await api.createTransaction({
        type: form.type,
        amount: Number(form.amount),
        categoryId: Number(form.categoryId),
        description: form.description.trim(),
        transactionDate: form.transactionDate
      });
      setShowForm(false);
      setForm({ type: 'expense', amount: '', categoryId: '', description: '', transactionDate: today() });
      await loadData();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Could not save transaction.');
    } finally {
      setBusy(false);
    }
  }

  async function removeTransaction(id: number) {
    if (!window.confirm('Delete this transaction? This action cannot be undone.')) return;
    try {
      await api.deleteTransaction(id);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete transaction.');
    }
  }

  function exportCsv() {
    const rows = [
      ['Date', 'Description', 'Category', 'Type', 'Amount'],
      ...filtered.map((tx) => [tx.transactionDate, tx.description, tx.categoryName, tx.type, String(tx.amount)])
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'expense-transactions.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  const typeCategories = categories.filter((category) => category.type === form.type);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="PocketLedger home">
          <span className="brand-icon"><Wallet size={21} strokeWidth={2.4} /></span>
          <span>Pocket<span className="brand-light">Ledger</span></span>
        </a>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="main-nav">
          <a className="nav-link active" href="#overview"><LayoutDashboard size={18} /> <span>Overview</span></a>
          <a className="nav-link" href="#transactions"><ReceiptText size={18} /> <span>Transactions</span><span className="nav-count">{transactions.length}</span></a>
          <a className="nav-link" href="#reports"><TrendingUp size={18} /> <span>Reports</span></a>
          <button className="nav-link" type="button" onClick={() => { setShowForm(true); setForm((old) => ({ ...old, type: 'expense' })); }}><Wallet size={18} /> <span>Budgets</span><span className="soon-tag">Soon</span></button>
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon"><CircleHelp size={19} /></div>
            <strong>Need a hand?</strong>
            <p>Keep your money organized, one transaction at a time.</p>
            <a href="#how-it-works">Explore the guide <ArrowUpRight size={14} /></a>
          </div>
          <div className="profile-row">
            <div className="avatar">PL</div>
            <div className="profile-info"><strong>Personal workspace</strong><span>Free plan</span></div>
            <Ellipsis size={18} className="muted-icon" />
          </div>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> <strong>Overview</strong></div>
          <div className="top-actions">
            <span className="secure-label"><ShieldCheck size={14} /> Your finances, at a glance</span>
            <button className="icon-button" type="button" title="Notifications" aria-label="Notifications"><Bell size={18} /><i /></button>
            <div className="top-avatar">PL</div>
          </div>
        </header>

        <div className="page-content" id="overview">
          <div className="welcome-row">
            <div>
              <div className="eyebrow"><Sparkles size={14} /> YOUR MONEY OVERVIEW</div>
              <h1>Good morning<span className="title-dot">.</span></h1>
              <p className="page-subtitle">Here&apos;s what&apos;s happening with your money this month.</p>
            </div>
            <button className="primary-button" type="button" onClick={() => { setFormError(''); setShowForm(true); }}>
              <Plus size={18} strokeWidth={2.5} /> Add transaction
            </button>
          </div>

          {error && <div className="error-banner" role="alert"><span>{error}</span><button type="button" onClick={() => void loadData()}>Retry</button></div>}

          <div className="stats-grid">
            <article className="stat-card balance-card">
              <div className="stat-heading"><span>Net cash flow</span><span className="stat-icon balance-icon"><Wallet size={17} /></span></div>
              <div className="stat-value">{loading ? '—' : money(summary.balance)}</div>
              <div className="stat-foot"><span className="trend-pill"><TrendingUp size={13} /> This month</span><span className="stat-caption">Income minus expenses</span></div>
              <div className="balance-decoration"><span /><span /><span /><span /><span /><span /><span /><span /></div>
            </article>
            <article className="stat-card">
              <div className="stat-heading"><span>Total income</span><span className="stat-icon income-icon"><ArrowDownLeft size={18} /></span></div>
              <div className="stat-value">{loading ? '—' : money(summary.income)}</div>
              <div className="stat-foot"><span className="small-status positive"><ArrowDownRight size={13} /> Inflow</span><span className="stat-caption">Received this month</span></div>
              <div className="mini-line green-line"><svg viewBox="0 0 130 36" role="img" aria-label="Decorative rising line"><path d="M2 29 C15 26 18 18 30 23 S50 30 60 16 S79 23 90 12 S108 20 128 3" /></svg></div>
            </article>
            <article className="stat-card">
              <div className="stat-heading"><span>Total expenses</span><span className="stat-icon expense-icon"><ArrowUpRight size={18} /></span></div>
              <div className="stat-value">{loading ? '—' : money(summary.expenses)}</div>
              <div className="stat-foot"><span className="small-status negative"><ArrowUpRight size={13} /> Outflow</span><span className="stat-caption">Spent this month</span></div>
              <div className="mini-line coral-line"><svg viewBox="0 0 130 36" role="img" aria-label="Decorative expense line"><path d="M2 6 C14 12 16 4 28 15 S48 11 60 22 S80 9 90 19 S110 15 128 31" /></svg></div>
            </article>
          </div>

          <div className="content-grid">
            <section className="panel spending-panel" id="reports">
              <div className="panel-heading">
                <div><h2>Cash flow</h2><p>Income and expenses over the last 6 months</p></div>
                <button className="subtle-select" type="button" aria-label="Chart period">Last 6 months <ChevronDown size={15} /></button>
              </div>
              <div className="chart-legend"><span><i className="legend-income" /> Income</span><span><i className="legend-expense" /> Expenses</span></div>
              <div className="chart-wrap">
                <div className="y-axis"><span>$6k</span><span>$4k</span><span>$2k</span><span>$0</span></div>
                <div className="bars-area">
                  <div className="grid-line line-1" /><div className="grid-line line-2" /><div className="grid-line line-3" />
                  {loading ? <div className="chart-loading"><LoaderCircle className="spin" /> Loading report</div> : monthly.map((item) => (
                    <div className="month-column" key={item.month} title={`${item.month}: income ${money(Number(item.income))}, expenses ${money(Number(item.expenses))}`}>
                      <div className="bar-pair">
                        <div className="bar income-bar" style={{ height: `${Math.max(3, Number(item.income) / maxChart * 100)}%` }} />
                        <div className="bar expense-bar" style={{ height: `${Math.max(3, Number(item.expenses) / maxChart * 100)}%` }} />
                      </div>
                      <span>{monthLabel(item.month)}</span>
                    </div>
                  ))}
                  {!loading && monthly.length === 0 && <div className="empty-chart">Add transactions to see your cash flow.</div>}
                </div>
              </div>
            </section>

            <section className="panel quick-panel" id="how-it-works">
              <div className="panel-heading"><div><h2>Quick overview</h2><p>Your spending pulse</p></div><span className="pulse-tag"><span /> Live</span></div>
              <div className="quick-summary">
                <div className="quick-total-label">Income this month</div>
                <div className="quick-total">{loading ? '—' : money(summary.income)}</div>
                <div className="progress-track"><span className="progress-income" style={{ width: `${summary.income + summary.expenses ? Math.min(100, summary.income / (summary.income + summary.expenses) * 100) : 0}%` }} /></div>
                <div className="progress-labels"><span>Cash in</span><strong>{summary.income + summary.expenses ? Math.round(summary.income / (summary.income + summary.expenses) * 100) : 0}% of movement</strong></div>
              </div>
              <div className="quick-divider" />
              <div className="quick-row"><span className="quick-symbol income-symbol"><ArrowDownLeft size={17} /></span><span className="quick-name">Income</span><strong>{loading ? '—' : money(summary.income)}</strong></div>
              <div className="quick-row"><span className="quick-symbol expense-symbol"><ArrowUpRight size={17} /></span><span className="quick-name">Expenses</span><strong>{loading ? '—' : money(summary.expenses)}</strong></div>
              <div className="insight-note"><span className="insight-icon"><Sparkles size={15} /></span><span><strong>Small steps add up.</strong> A quick glance at your cash flow can help keep your goals on track.</span></div>
            </section>
          </div>

          <section className="panel transactions-panel" id="transactions">
            <div className="transactions-heading">
              <div><div className="table-title-row"><h2>Recent transactions</h2><span className="result-count">{filtered.length}</span></div><p>Keep an eye on where your money goes.</p></div>
              <div className="table-actions">
                <label className="search-field"><Search size={16} /><input aria-label="Search transactions" placeholder="Search transactions..." value={search} onChange={(e) => setSearch(e.target.value)} /></label>
                <label className="filter-field"><Filter size={15} /><select aria-label="Filter by type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}><option value="all">All types</option><option value="income">Income</option><option value="expense">Expenses</option></select></label>
                <label className="filter-field category-select"><select aria-label="Filter by category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}><option value="all">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
                <button className="export-button" type="button" onClick={exportCsv} title="Export visible transactions to CSV"><Download size={16} /><span>Export</span></button>
              </div>
            </div>
            <div className="table-scroll">
              <table>
                <thead><tr><th>TRANSACTION</th><th>CATEGORY</th><th>DATE</th><th>TYPE</th><th className="amount-head">AMOUNT</th><th><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>
                  {loading && <tr><td colSpan={6} className="table-message"><LoaderCircle className="spin" size={18} /> Loading transactions...</td></tr>}
                  {!loading && filtered.map((tx) => (
                    <tr key={tx.id}>
                      <td><div className="transaction-main"><span className={`transaction-symbol ${tx.type === 'income' ? 'tx-income' : 'tx-expense'}`}>{tx.type === 'income' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}</span><div className="transaction-description"><strong>{tx.description || tx.categoryName}</strong><span>{tx.description ? tx.categoryName : 'Transaction'}</span></div></div></td>
                      <td><span className="category-cell"><i style={{ backgroundColor: tx.categoryColor || '#94a3b8' }} />{tx.categoryName}</span></td>
                      <td className="date-cell"><CalendarDays size={14} /><DateLabel value={tx.transactionDate} /></td>
                      <td><span className={`type-badge ${tx.type}`}>{tx.type === 'income' ? 'Income' : 'Expense'}</span></td>
                      <td className={`amount-cell ${tx.type}`}>{tx.type === 'income' ? '+' : '−'}{money(Number(tx.amount))}</td>
                      <td className="row-action-cell"><button className="row-action" type="button" title="Delete transaction" aria-label={`Delete ${tx.description || tx.categoryName}`} onClick={() => void removeTransaction(tx.id)}><Trash2 size={15} /></button></td>
                    </tr>
                  ))}
                  {!loading && filtered.length === 0 && <tr><td colSpan={6} className="empty-state"><span className="empty-state-icon"><ReceiptText size={21} /></span><strong>No transactions found</strong><span>Try another search or add your first transaction.</span><button type="button" onClick={() => { setSearch(''); setTypeFilter('all'); setCategoryFilter('all'); setShowForm(true); }}>Add transaction</button></td></tr>}
                </tbody>
              </table>
            </div>
            <div className="table-footer"><span>Showing <strong>{filtered.length}</strong> of <strong>{transactions.length}</strong> transactions</span><span className="updated-label"><Check size={14} /> Up to date</span></div>
          </section>

          <footer className="page-footer"><span>© 2026 PocketLedger</span><span>Made for a little more financial clarity <span className="footer-heart">♥</span></span><a href="https://github.com/dixit2812/expense-tracker" target="_blank" rel="noreferrer">Open source project <ArrowUpRight size={13} /></a></footer>
        </div>
      </section>

      {showForm && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowForm(false); }}>
        <section className="transaction-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="modal-heading"><div><span className="modal-kicker">TRANSACTION DETAILS</span><h2 id="modal-title">Add a transaction</h2><p>Record money in or money out.</p></div><button type="button" className="modal-close" onClick={() => setShowForm(false)} aria-label="Close"><X size={20} /></button></div>
          <form onSubmit={submitTransaction}>
            <div className="type-toggle"><button type="button" className={form.type === 'expense' ? 'selected expense-choice' : ''} onClick={() => setForm((old) => ({ ...old, type: 'expense', categoryId: '' }))}><ArrowUpRight size={16} /> Expense</button><button type="button" className={form.type === 'income' ? 'selected income-choice' : ''} onClick={() => setForm((old) => ({ ...old, type: 'income', categoryId: '' }))}><ArrowDownLeft size={16} /> Income</button></div>
            <label className="form-label">Amount <span>*</span><div className="amount-input-wrap"><span>$</span><input required type="number" min="0.01" max="9999999999" step="0.01" placeholder="0.00" value={form.amount} onChange={(e) => setForm((old) => ({ ...old, amount: e.target.value }))} /></div></label>
            <label className="form-label">Category <span>*</span><select required value={form.categoryId} onChange={(e) => setForm((old) => ({ ...old, categoryId: e.target.value }))}><option value="">Choose a category</option>{typeCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
            <label className="form-label">Description<div className="description-input-wrap"><input maxLength={255} placeholder="e.g. Weekly groceries" value={form.description} onChange={(e) => setForm((old) => ({ ...old, description: e.target.value }))} /><span>{form.description.length}/255</span></div></label>
            <label className="form-label">Date <span>*</span><input required type="date" value={form.transactionDate} onChange={(e) => setForm((old) => ({ ...old, transactionDate: e.target.value }))} /></label>
            {formError && <div className="form-error" role="alert">{formError}</div>}
            <div className="modal-actions"><button type="button" className="cancel-button" onClick={() => setShowForm(false)}>Cancel</button><button disabled={busy} type="submit" className="primary-button">{busy ? <LoaderCircle className="spin" size={16} /> : <Plus size={17} />} {busy ? 'Saving...' : 'Save transaction'}</button></div>
            <div className="modal-safe"><ShieldCheck size={14} /> Your entry is saved to your configured database.</div>
          </form>
        </section>
      </div>}
    </main>
  );
}
