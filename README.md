# ParaméCompta

Application web de comptabilité simplifiée et de gestion des rétrocessions destinée aux professionnels paramédicaux libéraux, remplaçants, titulaires et cabinets de groupe.

> **État du projet :** version `0.2.0`. Le tableau de bord et le suivi comptable des transactions sont opérationnels. Les autres modules métier décrits ci-dessous constituent le périmètre produit à construire progressivement et ne doivent pas être considérés comme déjà implémentés.

La stratégie de branches, le versionnement et la procédure de publication sont décrits dans [CONTRIBUTING.md](CONTRIBUTING.md).

## Sommaire

- [Objectif](#objectif)
- [Public concerné](#public-concerné)
- [Fonctionnalités prévues](#fonctionnalités-prévues)
- [Règles de rétrocession](#règles-de-rétrocession)
- [Parcours principaux](#parcours-principaux)
- [Architecture](#architecture)
- [Installation et commandes](#installation-et-commandes)
- [Configuration](#configuration)
- [API actuelle et cible](#api-actuelle-et-cible)
- [Modèle de données cible](#modèle-de-données-cible)
- [Sécurité, RGPD et données de santé](#sécurité-rgpd-et-données-de-santé)
- [Qualité et tests](#qualité-et-tests)
- [Feuille de route](#feuille-de-route)

## Objectif

ParaméCompta doit réduire le temps administratif des cabinets paramédicaux en regroupant :

- le suivi quotidien des recettes et des dépenses ;
- l’import et le rapprochement des mouvements bancaires ;
- la collecte et le classement des justificatifs ;
- le calcul transparent des rétrocessions entre titulaires et remplaçants/collaborateurs ;
- la préparation des éléments utiles à la déclaration contrôlée et au comptable ;
- le pilotage de l’activité par professionnel, cabinet, période et type d’acte ;
- un historique vérifiable des calculs, validations et paiements.

Le produit vise en priorité une comptabilité de trésorerie adaptée aux bénéfices non commerciaux (BNC). Il ne remplace ni le conseil d’un expert-comptable, ni les obligations propres à chaque profession, convention ou régime fiscal.

## Public concerné

- infirmiers diplômés d’État libéraux (IDEL) ;
- masseurs-kinésithérapeutes ;
- orthophonistes et orthoptistes ;
- pédicures-podologues ;
- ergothérapeutes, psychomotriciens, diététiciens et autres professions paramédicales ;
- titulaires de cabinet, collaborateurs et remplaçants ;
- secrétaires et gestionnaires disposant de droits limités ;
- experts-comptables ou associations de gestion disposant d’un accès en lecture/export.

## Fonctionnalités prévues

### 1. Comptes, cabinets et droits d’accès

- création d’un compte par e-mail avec vérification de l’adresse ;
- authentification forte et récupération sécurisée du compte ;
- gestion de plusieurs cabinets et structures par utilisateur ;
- fiche professionnelle : identité, profession, ADELI/RPPS le cas échéant, SIRET, régime fiscal, exercice comptable et coordonnées bancaires ;
- invitation d’un titulaire, remplaçant, collaborateur, secrétaire ou comptable ;
- rôles configurables : propriétaire, administrateur, praticien, gestionnaire et lecteur ;
- séparation stricte des données entre cabinets ;
- journal des connexions, invitations, changements de droits et actions sensibles ;
- archivage d’un membre sans suppression de l’historique comptable.

### 2. Tableau de bord

- recettes, dépenses et résultat estimé sur la période ;
- trésorerie disponible et évolution mensuelle ;
- montant des rétrocessions à calculer, valider, payer ou recevoir ;
- transactions non rapprochées et justificatifs manquants ;
- échéances sociales, fiscales, contractuelles et comptables ;
- comparaison avec la période précédente ;
- filtres par cabinet, praticien, compte bancaire et exercice ;
- alertes sur les doublons, écarts de calcul ou opérations inhabituelles.

### 3. Recettes et encaissements

- saisie d’une recette avec date d’acte, date d’encaissement, montant, mode de paiement et praticien ;
- distinction honoraires, remboursements de frais, apports et autres recettes ;
- ventilation d’un encaissement entre plusieurs actes ou professionnels ;
- suivi des paiements par carte, chèque, espèces et virement ;
- gestion des remises de chèques et dépôts d’espèces ;
- import CSV provenant d’un logiciel métier ou d’un relevé bancaire ;
- prévention et fusion guidée des doublons ;
- annulation/correction par écriture compensatrice afin de conserver la traçabilité ;
- rattachement facultatif à un payeur pseudonymisé, sans stocker de donnée médicale inutile ;
- pièces jointes et commentaires internes.

### 4. Dépenses professionnelles

- saisie ou import des dépenses avec fournisseur, date, montant et mode de paiement ;
- catégories adaptées au plan comptable BNC : loyer, matériel, véhicule, assurances, cotisations, honoraires, télécoms, formation, etc. ;
- ventilation d’une dépense sur plusieurs catégories ou professionnels ;
- dépenses mixtes avec quote-part professionnelle ;
- règles récurrentes de catégorisation par libellé, fournisseur ou compte ;
- gestion des frais kilométriques et barème applicable à l’exercice ;
- immobilisations et suivi indicatif des amortissements ;
- dépenses personnelles, prélèvements de l’exploitant et apports exclus du résultat ;
- recherche des justificatifs absents et relances ;
- détection des factures ou mouvements importés en double.

### 5. Banque et rapprochement

- plusieurs comptes bancaires par cabinet ou praticien ;
- import manuel CSV/OFX/QIF dans un premier temps ;
- synchronisation bancaire via un prestataire réglementé dans une version ultérieure ;
- association d’un mouvement à une recette, une dépense ou une rétrocession ;
- association d’un paiement global à plusieurs opérations ;
- création d’une opération depuis un mouvement non reconnu ;
- statut : à traiter, rapproché, ignoré ou à vérifier ;
- solde calculé et contrôle des écarts avec le relevé ;
- règles automatiques proposées, toujours modifiables par l’utilisateur ;
- conservation de la source, de la date d’import et de l’auteur du rapprochement.

### 6. Justificatifs et documents

- dépôt de PDF, JPEG, PNG et documents bureautiques autorisés ;
- capture depuis mobile ;
- extraction OCR du fournisseur, de la date, du total et de la TVA lorsque pertinente ;
- suggestion de rapprochement entre document et transaction ;
- classement par exercice, catégorie et professionnel ;
- recherche plein texte et filtres ;
- aperçu, téléchargement et export groupé ;
- contrôle d’intégrité du fichier et historique des versions ;
- règles de conservation configurables selon les obligations applicables ;
- aucune altération silencieuse d’un justificatif validé.

### 7. Rétrocessions d’honoraires

- contrats entre cabinet/titulaire et remplaçant ou collaborateur ;
- date de début, date de fin, période d’essai et pièces contractuelles ;
- taux global ou taux différent selon acte, catégorie, lieu, tournée ou praticien ;
- montant fixe, pourcentage ou formule mixte ;
- base de calcul configurable : honoraires facturés ou réellement encaissés ;
- exclusion configurable des indemnités, majorations, frais de déplacement ou actes spécifiques ;
- minimum garanti, plafond, franchise ou palier ;
- périodicité hebdomadaire, bimensuelle, mensuelle ou personnalisée ;
- calcul détaillé ligne par ligne avec règle appliquée et source de chaque montant ;
- ajustements motivés, avoirs et reports sur la période suivante ;
- circuit brouillon → à vérifier → validé → payé ;
- validation par une ou deux parties selon le contrat ;
- génération d’un relevé de rétrocession PDF et d’un export CSV ;
- suivi des règlements partiels, trop-perçus et soldes restant dus ;
- rapprochement bancaire du paiement ;
- notifications d’ouverture de période, validation et retard ;
- verrouillage d’une période validée, avec réouverture tracée et réservée aux personnes autorisées ;
- historique immuable des versions du calcul.

### 8. Comptabilité et fiscalité

- livre chronologique des recettes et dépenses ;
- classement et totaux par catégories comptables ;
- registre des immobilisations et amortissements indicatifs ;
- rapprochement des totaux avec les comptes bancaires ;
- clôture d’une période puis d’un exercice ;
- balance/synthèse annuelle orientée déclaration 2035 ;
- estimation indicative du résultat BNC ;
- suivi des cotisations sociales et provisions configurables ;
- exports CSV/XLSX/PDF pour l’expert-comptable ;
- export FEC uniquement si le périmètre et les règles applicables le justifient ;
- dossier annuel contenant journaux, pièces et états de contrôle ;
- conservation d’une piste d’audit des créations, corrections et suppressions logiques.

### 9. Rapports et indicateurs

- chiffre d’affaires encaissé par mois, cabinet et praticien ;
- répartition des dépenses et évolution ;
- résultat estimé et taux de charges ;
- rétrocessions versées et reçues ;
- ventilation de l’activité par catégorie d’acte si cette donnée est réellement nécessaire ;
- délai moyen d’encaissement et impayés signalés ;
- comparaison année N / N-1 ;
- exports filtrés avec date, auteur et périmètre de génération ;
- indicateurs clairement étiquetés comme comptables, estimatifs ou incomplets.

### 10. Notifications et tâches

- centre de notifications dans l’application ;
- rappels de justificatifs manquants, validations et paiements ;
- liste de tâches par membre du cabinet ;
- échéances personnalisables et récurrences ;
- récapitulatif périodique facultatif par e-mail ;
- préférences individuelles et possibilité de désabonnement des alertes non essentielles.

### 11. Administration et assistance

- personnalisation des catégories et règles de calcul ;
- modèles d’import avec correspondance des colonnes ;
- gestion des exercices et périodes verrouillées ;
- export complet des données du cabinet ;
- procédure de fermeture de compte et de restitution des données ;
- aide contextuelle, glossaire métier et diagnostic des imports ;
- journal technique exploitable par le support sans exposer le contenu sensible.

## Règles de rétrocession

Le moteur de calcul doit privilégier l’explicabilité à l’automatisation opaque.

### Exemple simple

Pour une période où un remplaçant a encaissé **8 000 €** d’honoraires éligibles et où le contrat prévoit une rétrocession de **20 % au titulaire** :

```text
Base éligible                         8 000,00 €
Taux de rétrocession                      20 %
Rétrocession due au titulaire         1 600,00 €
Solde revenant au remplaçant           6 400,00 €
```

Le relevé doit également afficher les encaissements exclus, les ajustements, les paiements déjà réalisés et le solde restant.

### Principes de calcul

1. sélectionner le contrat actif à la date de l’acte ou de l’encaissement selon sa configuration ;
2. sélectionner les recettes comprises dans la période ;
3. appliquer les critères d’éligibilité du contrat ;
4. déterminer la base après exclusions et ajustements ;
5. appliquer taux, paliers, minimums et plafonds dans un ordre explicite ;
6. arrondir en euros au niveau défini par la règle, sans cumul silencieux d’écarts ;
7. générer des lignes de calcul détaillées ;
8. figer la version des règles lors de la validation ;
9. enregistrer séparément le paiement afin de ne jamais confondre dette calculée et règlement bancaire.

### Cas particuliers à couvrir

- recette encaissée après la fin du remplacement ;
- acte réalisé avant le contrat mais encaissé pendant celui-ci ;
- rejet, remboursement, annulation ou impayé ;
- paiement partiel ;
- recette répartie entre deux praticiens ;
- changement de taux au milieu d’une période ;
- remplacement chevauchant deux mois ou deux exercices ;
- frais avancés par une partie puis refacturés ;
- rétrocession calculée sur un montant comprenant ou excluant certains compléments ;
- correction d’une période déjà payée avec report explicite sur la suivante.

## Parcours principaux

### Démarrage d’un cabinet

1. Le propriétaire crée son compte et son cabinet.
2. Il renseigne son exercice, ses informations professionnelles et ses comptes bancaires.
3. Il importe ses catégories ou conserve les catégories proposées.
4. Il invite les autres praticiens et attribue leurs droits.
5. Il importe les transactions existantes et vérifie le solde initial.
6. Il crée les contrats de remplacement/collaboration actifs.

### Traitement mensuel

1. Importer ou synchroniser les mouvements bancaires.
2. Catégoriser les nouvelles recettes et dépenses.
3. Rapprocher les mouvements et ajouter les justificatifs manquants.
4. Contrôler les anomalies proposées.
5. Calculer les rétrocessions de la période.
6. Faire vérifier puis valider les relevés.
7. Enregistrer et rapprocher les paiements.
8. Verrouiller le mois après contrôle.

### Préparation de l’exercice

1. Vérifier les périodes non clôturées et transactions non rapprochées.
2. Compléter les justificatifs et informations obligatoires.
3. Contrôler les immobilisations, apports et prélèvements personnels.
4. Générer la synthèse annuelle et les journaux.
5. Exporter le dossier destiné au comptable.
6. Corriger les éventuelles anomalies via des écritures traçables.
7. Clôturer l’exercice et conserver l’archive.

## Architecture

Le dépôt utilise les **workspaces npm** :

La charte graphique adoptée et ses règles d'implémentation sont documentées dans [`docs/DESIGN.md`](docs/DESIGN.md).

```text
.
├── apps/
│   ├── api/                 API REST Express + TypeScript
│   │   └── src/
│   │       ├── app.ts       Middleware et routes
│   │       ├── config.ts    Validation de l'environnement
│   │       └── server.ts    Démarrage et arrêt propre
│   └── web/                 Interface React + Vite + TypeScript
│       └── src/
│           ├── App.tsx
│           ├── main.tsx
│           └── styles.css
├── .env.example
├── package.json
└── README.md
```

### Choix techniques actuels

- **Node.js 22+** : environnement d’exécution commun ;
- **TypeScript strict** : détection précoce des incohérences ;
- **Express 5** : API légère, explicite et modulaire ;
- **Zod** : validation future des entrées et actuelle de la configuration ;
- **Helmet + CORS** : protections HTTP de base ;
- **React 19 + Vite 7** : interface réactive avec démarrage rapide ;
- **Vitest** : infrastructure de tests unitaires côté API ;
- **ESLint** : règles de qualité homogènes.

### Architecture cible

Les prochains modules du back devront être organisés par domaine (`auth`, `organizations`, `transactions`, `banking`, `documents`, `contracts`, `retrocessions`, `reports`, `audit`) avec, pour chacun, routes, schémas de validation, service métier et accès aux données. PostgreSQL est recommandé pour garantir transactions, contraintes et historisation. Un ORM/migrationnaire devra être choisi avant d’introduire le schéma persistant.

## Installation et commandes

### Prérequis

- Node.js `22` ou supérieur ;
- npm `10` ou supérieur ;
- Docker Desktop ou Docker Engine avec le plugin Compose pour PostgreSQL ;
- PostgreSQL local n'est pas requis si le conteneur fourni est utilisé.

### Installation

```bash
cp .env.example .env
npm install
npm run db:up
npm run db:setup
npm run dev
```

Le front est alors accessible sur [http://localhost:5173](http://localhost:5173) et l’API sur [http://localhost:3000](http://localhost:3000).

PostgreSQL écoute sur `localhost:5432`. Au premier lancement, Compose crée automatiquement :

- la base `compta_paramedicale` ;
- l'utilisateur local `postgres` ;
- le volume persistant `compta-paramedicale-postgres-data` ;
- le schéma métier `app` ;
- l'extension PostgreSQL `pgcrypto`.

Les valeurs peuvent être modifiées dans `.env` avant le premier démarrage. Le script d'initialisation situé dans `docker/postgres/init/001-init.sql` n'est exécuté que lorsque le volume est vide.

### Scripts disponibles

| Commande | Effet |
|---|---|
| `npm run dev` | Lance le back et le front simultanément |
| `npm run dev:api` | Lance uniquement l’API avec rechargement automatique |
| `npm run dev:web` | Lance uniquement Vite |
| `npm run db:up` | Crée et démarre PostgreSQL en arrière-plan |
| `npm run db:status` | Affiche l'état et la santé du conteneur PostgreSQL |
| `npm run db:logs` | Suit les journaux PostgreSQL |
| `npm run db:down` | Arrête PostgreSQL en conservant les données |
| `npm run db:migrate` | Applique les migrations SQL manquantes |
| `npm run db:seed` | Crée ou actualise les données de démonstration |
| `npm run db:setup` | Enchaîne migration et seed |
| `npm run build` | Compile tous les workspaces |
| `npm run typecheck` | Vérifie les types sans générer de fichiers |
| `npm run lint` | Analyse la qualité du code |
| `npm test` | Exécute les tests disponibles |
| `npm run start -w @compta/api` | Lance l’API compilée |

## Configuration

| Variable | Défaut | Description |
|---|---:|---|
| `NODE_ENV` | `development` | Environnement : development, test ou production |
| `API_PORT` | `3000` | Port d’écoute de l’API |
| `WEB_URL` | `http://localhost:5173` | Origine autorisée par CORS |
| `VITE_API_URL` | `http://localhost:3000/api` | URL de l’API utilisée par le navigateur |
| `POSTGRES_DB` | `compta_paramedicale` | Base créée par le conteneur au premier lancement |
| `POSTGRES_USER` | `postgres` | Utilisateur propriétaire de la base locale |
| `POSTGRES_PASSWORD` | `postgres` | Mot de passe local, à changer hors développement |
| `POSTGRES_PORT` | `5432` | Port PostgreSQL exposé sur la machine |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/compta_paramedicale` | Connexion utilisée par l'API lorsqu'un ORM sera ajouté |

Ne jamais committer le fichier `.env` ou un secret. En production, les secrets doivent provenir d’un gestionnaire de secrets et être renouvelables.

### Réinitialisation locale de PostgreSQL

`npm run db:down` conserve les données. Pour recréer volontairement une base vide, arrêter Compose puis supprimer son volume avec `docker compose down --volumes`. Cette commande détruit toutes les données PostgreSQL locales et ne doit pas être utilisée sur un environnement partagé ou de production.

## API actuelle et cible

### Route disponible

`GET /api/health`

```json
{
  "status": "ok",
  "service": "compta-paramedicale-api",
  "timestamp": "2026-07-14T12:00:00.000Z"
}
```

### Ressources cibles

| Préfixe | Responsabilité |
|---|---|
| `/api/auth` | Sessions, MFA et récupération de compte |
| `/api/users` | Profil et préférences |
| `/api/organizations` | Cabinets, membres et rôles |
| `/api/accounts` | Comptes bancaires et soldes |
| `/api/transactions` | Recettes, dépenses et ventilations |
| `/api/imports` | Imports bancaires/métier et dédoublonnage |
| `/api/documents` | Justificatifs, métadonnées et rattachements |
| `/api/contracts` | Contrats et version des règles |
| `/api/retrocessions` | Calculs, validations et règlements |
| `/api/reports` | Journaux, tableaux de bord et exports |
| `/api/audit-events` | Consultation autorisée de la piste d’audit |

Toutes les entrées devront être validées. Les listes devront utiliser pagination, tri et filtres bornés. Les erreurs devront retourner un identifiant stable, un message non sensible et un identifiant de corrélation.

### API disponible en phase 1

- `POST /api/auth/register` et `POST /api/auth/login` ;
- `GET /api/me` et gestion des membres/rôles du cabinet ;
- `GET/POST /api/categories` ;
- `GET/POST /api/transactions` avec filtres, pagination et rapprochement manuel ;
- `POST /api/imports/csv` pour les colonnes `date;label;amount;kind;category` ;
- `GET/POST /api/documents` pour les justificatifs PDF, JPEG et PNG ;
- `GET /api/dashboard` pour les agrégats et mouvements récents ;
- `GET /api/audit-events` pour la piste d'audit du cabinet.

Après `npm run db:setup`, le compte local est `demo@paramecompta.fr` avec le mot de passe `Demo123!`. Il est réservé au développement et ne doit jamais être reproduit en production.

## Modèle de données cible

- **User** : identité de connexion et préférences ;
- **Organization** : cabinet ou structure d’exercice ;
- **Membership** : relation utilisateur/cabinet et rôle ;
- **ProfessionalProfile** : informations professionnelles propres à un membre ;
- **FiscalYear** : exercice, statut et dates de verrouillage ;
- **BankAccount** et **BankMovement** : compte, import et rapprochement ;
- **Transaction** : recette, dépense, apport, prélèvement ou transfert ;
- **TransactionSplit** : ventilation comptable et analytique ;
- **Category** : catégorie BNC et règles de classement ;
- **Document** : justificatif, stockage, empreinte et métadonnées ;
- **Contract** et **ContractRuleVersion** : relation professionnelle et règles historisées ;
- **RetrocessionPeriod** : périmètre temporel du calcul ;
- **RetrocessionStatement** et **RetrocessionLine** : résultat et détail explicatif ;
- **Payment** : règlement d’une ou plusieurs dettes ;
- **Task** et **Notification** : suivi opérationnel ;
- **AuditEvent** : auteur, action, date, cible et contexte non sensible.

Les montants doivent être stockés dans la plus petite unité monétaire (centimes) ou dans un type décimal exact, jamais en nombre flottant binaire. Chaque table métier doit porter l’identifiant du cabinet pour imposer l’isolation des données.

## Sécurité, RGPD et données de santé

Une application destinée aux paramédicaux peut manipuler des informations particulièrement sensibles. Le périmètre fonctionnel doit appliquer la minimisation : **aucune donnée clinique n’est nécessaire au calcul comptable d’une rétrocession**. Si des données permettant d’identifier un patient devenaient indispensables, une analyse juridique et technique préalable serait requise, notamment sur l’hébergement adapté et les obligations applicables.

Exigences minimales avant mise en production :

- chiffrement TLS en transit et chiffrement des données/sauvegardes au repos ;
- mots de passe hachés avec un algorithme moderne ou délégation à un fournisseur d’identité fiable ;
- authentification multifacteur pour les comptes sensibles ;
- sessions courtes, révocables, cookies `HttpOnly`, `Secure` et `SameSite` ;
- contrôle d’accès côté serveur sur chaque ressource ;
- isolation multi-tenant testée automatiquement ;
- validation des fichiers, limitation de taille et analyse antimalware ;
- protection contre injections, CSRF, XSS, brute force et abus d’API ;
- secrets hors du code, rotation et séparation des environnements ;
- sauvegardes chiffrées avec tests de restauration ;
- journal d’audit non modifiable par les utilisateurs ordinaires ;
- politique de conservation, suppression et export des données ;
- registre des traitements, contrats de sous-traitance et procédure d’incident ;
- surveillance sans journaliser les justificatifs, coordonnées bancaires complètes ou données personnelles inutiles ;
- revue de sécurité et test d’intrusion avant ouverture publique.

Le consentement n’est pas l’unique base légale possible : la base légale, les durées de conservation, les responsabilités et les droits des personnes doivent être définis avec un professionnel compétent avant le lancement.

## Qualité et tests

La stratégie attendue comprend :

- tests unitaires des formules, arrondis, exclusions, paliers et changements de contrat ;
- tests par tables de décision pour les cas de rétrocession ;
- tests d’intégration API/base de données ;
- tests d’autorisation et d’isolation entre cabinets ;
- tests de contrat entre API et front ;
- tests end-to-end des parcours mensuels et de clôture ;
- tests d’accessibilité clavier, lecteur d’écran, contrastes et formulaires ;
- tests d’import sur des fichiers réels anonymisés et cas d’erreur ;
- tests de charge sur imports, rapports et pièces jointes ;
- restauration périodique d’une sauvegarde en environnement isolé.

Chaque calcul validé doit être reproductible avec les mêmes données et la même version de règle.

## Feuille de route

### Phase 0 — Socle (actuelle)

- [x] Monorepo npm back/front
- [x] API Express TypeScript et route de santé
- [x] Interface React/Vite responsive initiale
- [x] Validation de la configuration, lint et typecheck
- [ ] Intégration continue
- [ ] Conteneurs de développement

### Phase 1 — MVP comptable

- [x] PostgreSQL, migrations et jeux de données de développement
- [x] Authentification, cabinets, membres et rôles
- [x] Recettes, dépenses, catégories et filtres
- [x] Import CSV et rapprochement manuel
- [x] Dépôt et rattachement des justificatifs
- [x] Tableau de bord alimenté par les données réelles
- [x] Journal d’audit minimal

### Phase 2 — Rétrocessions

- [ ] Contrats et versions de règles
- [ ] Moteur de calcul testé sur les cas limites
- [ ] Relevés détaillés et workflow de validation
- [ ] Paiements, rapprochement et reports
- [ ] Exports PDF/CSV et notifications

### Phase 3 — Clôture et collaboration comptable

- [ ] Exercices, périodes verrouillées et contrôles
- [ ] Livre recettes/dépenses et immobilisations
- [ ] Synthèses annuelles et exports comptables
- [ ] Accès lecteur pour l’expert-comptable
- [ ] Dossier annuel archivable

### Phase 4 — Automatisation maîtrisée

- [ ] Connexion bancaire via prestataire agréé
- [ ] OCR et suggestions de catégorisation
- [ ] Règles récurrentes et détection d’anomalies
- [ ] Application web progressive/mobile
- [ ] Observabilité, plan de reprise et audit de sécurité

## Principes de contribution

- une modification métier doit inclure ses tests et expliquer la règle couverte ;
- aucune valeur monétaire ne doit utiliser un flottant imprécis ;
- aucune donnée sensible ne doit apparaître dans les fixtures, captures ou logs ;
- les changements de schéma doivent passer par une migration versionnée ;
- l’API reste responsable des autorisations et validations ;
- toute action affectant un calcul validé doit laisser une trace d’audit ;
- les libellés visibles sont rédigés en français clair et les composants restent accessibles.

## Licence

Aucune licence n’est encore définie. Le code est privé par défaut jusqu’au choix explicite d’une licence et d’un mode de distribution.
