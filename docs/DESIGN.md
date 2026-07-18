---
name: Clinical Ledger
status: adopted
source: user-provided design charter
---

# Clinical Ledger — charte graphique

Cette application adopte une esthétique **Corporate / Modern** conçue pour la précision, la confiance et l'efficacité dans le secteur financier médical.

## Principes

- Interface claire, clinique et structurée, privilégiant la lisibilité des données.
- Grille fluide sur 12 colonnes avec gouttières de 24 px.
- Espacements basés sur une unité de 4 px.
- Chiffres tabulaires pour tous les montants financiers.
- Profondeur créée par superposition tonale et contours discrets.
- Navigation latérale sur ordinateur et navigation basse sur mobile.

## Couleurs principales

| Jeton | Valeur | Usage |
|---|---|---|
| Primary | `#0052CC` | Actions, sélection, marque |
| Primary dark | `#003D9B` | Contraste et survol |
| Background | `#F8F9FB` | Fond général |
| Surface | `#FFFFFF` | Cartes, tableaux, formulaires |
| Surface low | `#F3F4F6` | Sections secondaires |
| On surface | `#191C1E` | Texte principal |
| Secondary | `#535F73` | Texte et icônes secondaires |
| Outline | `#DFE1E6` | Bordures fonctionnelles |
| Error | `#BA1A1A` | Erreurs et actions critiques |

## Typographie

La police utilisée est **Inter**. Les titres sont compacts avec une légère approche négative. Les valeurs monétaires utilisent `font-variant-numeric: tabular-nums`.

- Headline XL : 36/44 px, graisse 700.
- Headline LG : 24/32 px, graisse 600.
- Title MD : 18/24 px, graisse 600.
- Body LG : 16/24 px, graisse 400.
- Body MD : 14/20 px, graisse 400.
- Label MD : 12/16 px, graisse 600, uppercase, approche 0,05 em.

## Formes et composants

- Boutons et champs : rayon de 4 px.
- Cartes et conteneurs : rayon de 8 px, bordure `#DFE1E6`.
- Badges : rayon complet, couleurs sémantiques à faible opacité.
- Tableaux : en-tête séparé, lignes alternées avec 4 % de bleu, montants alignés à droite.
- Focus : bleu primaire avec halo externe à 20 %.
- Survol : ombre ambiante `0 4px 8px` à 4 %.
- Configurateur de rétrocession : vue partagée honoraires / distribution avec lien directionnel.

La définition YAML exhaustive d'origine est conservée dans l'historique de la demande. Le front traduit ces règles en variables et composants CSS dans `apps/web/src/styles.css`.
