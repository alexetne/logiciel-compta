import { useEffect, useMemo, useState } from 'react';

import { getDashboard, getTransactions, reconcileTransaction, type DashboardData, type Transaction } from './api';

type Props = { search: string };

const statusLabel = { reconciled: 'Validé', pending: 'En attente', needs_review: 'Reçu manquant' } as const;
const statusTone = { reconciled: 'success', pending: 'warning', needs_review: 'critical' } as const;

function Icon({ children }: { children: string }) { return <span className="material-symbols-outlined" aria-hidden="true">{children}</span>; }

export default function Ledger({ search }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [kind, setKind] = useState<'' | 'income' | 'expense'>('');
  const [status, setStatus] = useState<'' | Transaction['status']>('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const limit = 5;

  useEffect(() => {
    let active = true;
    Promise.all([getTransactions({ page, limit, kind, status, search }), getDashboard()])
      .then(([ledger, summary]) => { if (active) { setTransactions(ledger.items); setTotal(ledger.total); setDashboard(summary); } })
      .catch(() => { if (active) { setTransactions([]); setTotal(0); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, kind, status, search]);

  const euro = (cents: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
  const categoryExpenses = useMemo(() => {
    const values = new Map<string, number>();
    transactions.filter((item) => item.kind === 'expense').forEach((item) => values.set(item.categoryName ?? 'Divers', (values.get(item.categoryName ?? 'Divers') ?? 0) + item.amountCents));
    return [...values.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [transactions]);
  const maxExpense = Math.max(...categoryExpenses.map((entry) => entry[1]), 1);

  const exportCsv = () => {
    const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const lines = [['date','designation','categorie','type','montant_euros','statut'].join(';'), ...transactions.map((item) => [item.transactionDate, escape(item.label), escape(item.categoryName ?? ''), item.kind, (item.amountCents / 100).toFixed(2), item.status].join(';'))];
    const url = URL.createObjectURL(new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `registre-comptable-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url);
  };

  const validate = async (transaction: Transaction) => {
    await reconcileTransaction(transaction.id, 'reconciled');
    setTransactions((items) => items.map((item) => item.id === transaction.id ? { ...item, status: 'reconciled' } : item));
  };

  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return <main className="ledger-page">
    <div className="ledger-heading"><div><h1>Suivi comptable</h1><p>Grand livre des recettes et dépenses professionnelles de l’année {new Date().getFullYear()}.</p></div><div className="ledger-actions"><button className={showFilters ? 'active' : ''} onClick={() => setShowFilters((value) => !value)}><Icon>filter_list</Icon>Filtrer</button><button onClick={exportCsv} disabled={!transactions.length}><Icon>download</Icon>Exporter (CSV)</button></div></div>
    {showFilters && <section className="filter-bar" aria-label="Filtres du registre"><label>Type<select value={kind} onChange={(event) => { setKind(event.target.value as typeof kind); setPage(1); }}><option value="">Tous</option><option value="income">Recettes</option><option value="expense">Dépenses</option></select></label><label>Statut<select value={status} onChange={(event) => { setStatus(event.target.value as typeof status); setPage(1); }}><option value="">Tous</option><option value="reconciled">Validé</option><option value="pending">En attente</option><option value="needs_review">À vérifier</option></select></label><button onClick={() => { setKind(''); setStatus(''); setPage(1); }}>Réinitialiser</button></section>}

    <div className="ledger-grid">
      <div className="ledger-main">
        <section className="card ledger-table-card"><div className="card-heading"><div><h2>Transactions récentes</h2><p>{loading ? 'Chargement des écritures…' : `${total} écriture${total > 1 ? 's' : ''} trouvée${total > 1 ? 's' : ''}`}</p></div><span className="view-mode">Vue standard</span></div>
          <div className="table-scroll"><table><thead><tr><th>Date</th><th>Désignation</th><th>Catégorie</th><th>Montant</th><th>Statut</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
            {!loading && transactions.length === 0 && <tr><td className="empty-row" colSpan={6}>Aucune transaction ne correspond aux filtres.</td></tr>}
            {transactions.map((item) => <tr key={item.id}><td>{new Intl.DateTimeFormat('fr-FR').format(new Date(`${item.transactionDate}T12:00:00`))}</td><td className="entity">{item.label}</td><td><span className="ledger-category"><Icon>{item.kind === 'income' ? 'payments' : 'receipt_long'}</Icon>{item.categoryName ?? 'Non classée'}</span></td><td className={`amount ${item.kind === 'expense' ? 'negative' : 'positive'}`}>{item.kind === 'expense' ? '− ' : '+ '}{euro(item.amountCents)}</td><td><span className={`status ${statusTone[item.status]}`}>{statusLabel[item.status]}</span></td><td>{item.status !== 'reconciled' && <button className="row-action" onClick={() => void validate(item)} title="Marquer comme validé"><Icon>check_circle</Icon></button>}</td></tr>)}
          </tbody></table></div>
          <div className="ledger-pagination"><span>Affichage de {start}–{end} sur {total} transactions</span><div><button disabled={page === 1} onClick={() => setPage((value) => value - 1)} aria-label="Page précédente"><Icon>chevron_left</Icon></button><button disabled={end >= total} onClick={() => setPage((value) => value + 1)} aria-label="Page suivante"><Icon>chevron_right</Icon></button></div></div>
        </section>
        <section className="ledger-summaries"><article><p><i className="dot blue" />Honoraires du mois</p><strong>{euro(dashboard?.summary.incomeCents ?? 0)}</strong><small>Recettes comptabilisées</small></article><article><p><i className="dot slate" />Dépenses du mois</p><strong>{euro(dashboard?.summary.expenseCents ?? 0)}</strong><small>{dashboard?.summary.pendingCount ?? 0} éléments à traiter</small></article><article><p><i className="dot red" />Résultat estimé</p><strong>{euro(dashboard?.summary.netCents ?? 0)}</strong><small>Avant cotisations et impôts</small></article></section>
      </div>
      <aside className="ledger-side">
        <section className="card tax-card"><div className="side-title"><h2>Préparation fiscale</h2><Icon>calculate</Icon></div>{[['Déclaration 2035-A',85,'Recettes rapprochées.'],['Déclaration 2035-B',dashboard?.summary.pendingCount ? 42 : 100,'Justificatifs et dépenses.'],['2042-C Pro',15,'Calcul annuel indicatif.']].map(([label,value,help]) => <div className="tax-progress" key={String(label)}><div><b>{label}</b><span>{value}%</span></div><progress max="100" value={Number(value)} /><small>{help}</small></div>)}<button><Icon>history_edu</Icon>Générer le brouillon</button></section>
        <section className="card expense-chart"><h2>Répartition des charges</h2><div className="expense-bars">{categoryExpenses.length === 0 && <p>Aucune dépense sur cette page.</p>}{categoryExpenses.map(([name, amount]) => <div key={name}><span style={{ height: `${Math.max(amount / maxExpense * 100, 5)}%` }} title={euro(amount)} /><small>{name}</small></div>)}</div></section>
        <section className="tax-tip"><Icon>lightbulb</Icon><div><b>Conseil comptable</b><p>Ajoutez vos justificatifs au fil de l’eau pour simplifier le rapprochement et la préparation annuelle.</p></div></section>
      </aside>
    </div>
  </main>;
}
