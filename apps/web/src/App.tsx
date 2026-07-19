import { useEffect, useState } from 'react';

import { getDashboard, type DashboardData } from './api';
import Ledger from './Ledger';

const navigation = [
  ['dashboard', 'Tableau de bord'], ['account_balance_wallet', 'Rétrocessions'],
  ['receipt_long', 'Registre'], ['calculate', 'Déclarations'], ['settings', 'Paramètres'],
];

const fallbackChart = [
  { month: 'Fév.', value: 28500 }, { month: 'Mars', value: 33200 }, { month: 'Avr.', value: 30800 },
  { month: 'Mai', value: 38600 }, { month: 'Juin', value: 36500 }, { month: 'Juil.', value: 42850 },
];

const fallbackTransactions = [
  { date: '16 juil. 2026', entity: 'Encaissements CPAM', type: 'Honoraires', amount: '2 840,00 €', status: 'Rapproché', tone: 'success' },
  { date: '15 juil. 2026', entity: 'Cabinet République', type: 'Rétrocession', amount: '− 1 250,00 €', status: 'En attente', tone: 'warning', negative: true },
  { date: '14 juil. 2026', entity: 'Mutuelle santé', type: 'Honoraires', amount: '960,00 €', status: 'Rapproché', tone: 'success' },
  { date: '12 juil. 2026', entity: 'Matériel de soins', type: 'Fournitures', amount: '− 184,20 €', status: 'À vérifier', tone: 'critical', negative: true },
];

function Icon({ children }: { children: string }) {
  return <span className="material-symbols-outlined" aria-hidden="true">{children}</span>;
}

function App() {
  const [period, setPeriod] = useState<'monthly' | 'quarterly'>('monthly');
  const [page, setPage] = useState<'dashboard' | 'ledger'>('dashboard');
  const [search, setSearch] = useState('');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [dataState, setDataState] = useState<'loading' | 'live' | 'demo'>('loading');

  useEffect(() => {
    getDashboard().then((data) => { setDashboard(data); setDataState('live'); }).catch(() => setDataState('demo'));
  }, []);

  const euro = (cents: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
  const summary = dashboard?.summary;
  const margin = summary?.incomeCents ? Math.round((summary.netCents / summary.incomeCents) * 100) : 0;
  const metrics = [
    { label: 'Recettes totales', value: summary ? euro(summary.incomeCents) : '42 850,00 €', icon: 'trending_up', tone: 'success', emphasis: dataState === 'live' ? 'Données réelles' : '+12,5 %', detail: dataState === 'live' ? 'ce mois-ci' : 'vs mois dernier' },
    { label: 'Dépenses à traiter', value: summary ? euro(summary.expenseCents) : '12 400,00 €', icon: 'payments', tone: 'warning', emphasis: `${summary?.pendingCount ?? 8} éléments`, detail: 'à vérifier ou rapprocher' },
    { label: 'Bénéfice net', value: summary ? euro(summary.netCents) : '30 450,00 €', icon: 'account_balance', tone: 'primary', emphasis: `${summary ? margin : 71} %`, detail: 'de marge opérationnelle' },
  ];
  const monthFormatter = new Intl.DateTimeFormat('fr-FR', { month: 'short' });
  const chartData = dashboard?.chart.map((item) => ({ month: monthFormatter.format(new Date(`${item.month}-02T12:00:00`)), value: item.value / 100 })) ?? fallbackChart;
  const transactions = dashboard?.recent.map((item) => ({ date: new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${item.transactionDate}T12:00:00`)), entity: item.label, type: item.categoryName ?? (item.kind === 'income' ? 'Recette' : 'Dépense'), amount: `${item.kind === 'expense' ? '− ' : ''}${euro(item.amountCents)}`, status: item.status === 'reconciled' ? 'Rapproché' : item.status === 'pending' ? 'En attente' : 'À vérifier', tone: item.status === 'reconciled' ? 'success' : item.status === 'pending' ? 'warning' : 'critical', negative: item.kind === 'expense' })) ?? fallbackTransactions;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><strong>ParaméCompta</strong><span>Gestion financière paramédicale</span></div>
        <nav aria-label="Navigation principale">
          {navigation.map(([icon, label], index) => <a className={(page === 'dashboard' && index === 0) || (page === 'ledger' && index === 2) ? 'active' : ''} href={`#${label}`} key={label} onClick={(event) => { if (index === 0 || index === 2) { event.preventDefault(); setPage(index === 0 ? 'dashboard' : 'ledger'); } }}><Icon>{icon}</Icon><span>{label}</span></a>)}
        </nav>
        <button className="add-transaction"><Icon>add</Icon>Nouvelle transaction</button>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <a className="product-name" href="#dashboard">ParaméCompta <b>Pro</b></a>
          <label className="search"><Icon>search</Icon><input type="search" placeholder="Rechercher une transaction…" aria-label="Rechercher" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
          <nav aria-label="Navigation secondaire"><a className={page === 'dashboard' ? 'active' : ''} href="#dashboard" onClick={(event) => { event.preventDefault(); setPage('dashboard'); }}>Vue générale</a><a className={page === 'ledger' ? 'active' : ''} href="#reports" onClick={(event) => { event.preventDefault(); setPage('ledger'); }}>Rapports</a><a href="#documents">Documents</a></nav>
          <div className="top-actions"><button aria-label="Notifications"><Icon>notifications</Icon><span className="notification-dot" /></button><button aria-label="Aide"><Icon>help_outline</Icon></button><span className="avatar">CM</span></div>
        </header>

        {page === 'dashboard' ? <main id="dashboard">
          <div className="page-heading"><div><h1>Tableau de bord financier</h1><p>Bonjour Camille. Voici l’état de votre cabinet ce mois-ci.</p></div><span className={`data-source ${dataState}`}>{dataState === 'live' ? 'API connectée' : dataState === 'loading' ? 'Connexion…' : 'Mode démonstration'}</span></div>

          <section className="metrics" aria-label="Indicateurs financiers">
            {metrics.map((metric) => <article className="metric-card" key={metric.label}>
              <div className="metric-top"><div><p>{metric.label}</p><strong>{metric.value}</strong></div><span className={`metric-icon ${metric.tone}`}><Icon>{metric.icon}</Icon></span></div>
              <div className="metric-detail"><b className={metric.tone}>{metric.emphasis}</b><span>{metric.detail}</span></div>
            </article>)}
          </section>

          <section className="dashboard-grid">
            <article className="card chart-card">
              <div className="card-heading"><div><h2>Évolution des recettes</h2><p>Six derniers mois</p></div><div className="period-toggle"><button className={period === 'monthly' ? 'active' : ''} onClick={() => setPeriod('monthly')}>Mensuel</button><button className={period === 'quarterly' ? 'active' : ''} onClick={() => setPeriod('quarterly')}>Trimestriel</button></div></div>
              <div className="chart" aria-label="Histogramme des recettes sur six mois">
                <div className="chart-scale"><span>45 k€</span><span>30 k€</span><span>15 k€</span><span>0</span></div>
                <div className="bars">{chartData.map((item, index) => {
                  const maximum = Math.max(...chartData.map((point) => point.value), 1);
                  const height = (item.value / maximum) * 92;
                  return <div className="bar-column" key={item.month}><span className="bar-value" style={{ bottom: `${height}%` }}>{Math.round(item.value / 100) / 10} k€</span><div className={`bar ${index === chartData.length - 1 ? 'current' : ''}`} style={{ height: `${height}%` }} /><small>{item.month}</small></div>;
                })}</div>
              </div>
            </article>

            <article className="card retrocession-card">
              <div className="card-heading"><div><h2>Configurateur de rétrocession</h2><p>{dashboard?.retrocession?.name ?? 'Aucune règle active'}</p></div><span className={`status ${dashboard?.retrocession ? 'success' : 'warning'}`}>{dashboard?.retrocession ? 'Active' : 'À configurer'}</span></div>
              {dashboard?.retrocession ? <div className="split-config">
                <div className="split-flow"><div><span>Honoraires éligibles</span><strong>{euro(dashboard.retrocession.eligibleAmountCents)}</strong></div><Icon>arrow_forward</Icon><div><span>Praticien · {100 - dashboard.retrocession.rate} %</span><strong>{euro(dashboard.retrocession.eligibleAmountCents - dashboard.retrocession.dueAmountCents)}</strong></div></div>
                <div className="clinic-share"><span>Part cabinet · {dashboard.retrocession.rate} %</span><strong>{euro(dashboard.retrocession.dueAmountCents)}</strong></div>
                <button className="secondary-button"><Icon>tune</Icon>Modifier les règles</button>
              </div> : <div className="split-config"><p>Créez et activez une règle via l’API pour calculer automatiquement la part du cabinet.</p></div>}
            </article>
          </section>

          <section className="card transactions-card">
            <div className="card-heading"><div><h2>Transactions récentes</h2><p>Derniers mouvements enregistrés</p></div><a href="#ledger">Voir tout le registre</a></div>
            <div className="table-scroll"><table><thead><tr><th>Date</th><th>Origine / bénéficiaire</th><th>Type</th><th>Montant</th><th>Statut</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>{transactions.map((transaction) => <tr key={`${transaction.date}-${transaction.entity}`}><td>{transaction.date}</td><td className="entity">{transaction.entity}</td><td>{transaction.type}</td><td className={`amount ${transaction.negative ? 'negative' : ''}`}>{transaction.amount}</td><td><span className={`status ${transaction.tone}`}>{transaction.status}</span></td><td><button className="view-button" aria-label={`Voir ${transaction.entity}`}><Icon>visibility</Icon></button></td></tr>)}</tbody>
            </table></div>
          </section>
        </main> : <Ledger search={search} />}
      </div>
    </div>
  );
}

export default App;
