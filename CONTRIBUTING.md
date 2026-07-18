# Contribution et livraison

## Branches

- `master` reste publiable en permanence et reçoit les changements par pull request.
- `feature/<sujet>` porte une fonctionnalité.
- `fix/<sujet>` porte une correction.
- `chore/<sujet>` porte l'outillage, la documentation ou la maintenance.
- Une branche est supprimée après sa fusion dans `master`.

Les commits suivent de préférence Conventional Commits (`feat:`, `fix:`, `chore:`,
`docs:`). Avant d'ouvrir une pull request, exécuter `npm run check`.

## Versionnement

Le projet suit Semantic Versioning :

- `MAJOR` pour une rupture de compatibilité ;
- `MINOR` pour une fonctionnalité compatible ;
- `PATCH` pour une correction compatible.

Les versions du dépôt racine et des workspaces doivent rester alignées. La commande
`npm run version:check` le vérifie dans la CI locale.

## Publication

1. Fusionner la pull request validée dans `master`.
2. Mettre à jour les versions et `CHANGELOG.md` dans une pull request de livraison.
3. Depuis `master`, créer puis pousser le tag annoté `vX.Y.Z`.
4. La pipeline `Release` revalide le projet et crée la GitHub Release.

La branche `master` peut être protégée dans GitHub en exigeant la vérification
`Tests, lint, types and build` et au moins une revue avant fusion.
