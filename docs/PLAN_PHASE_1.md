# Orchelio — Analyse et plan de la Phase 1

Ce document répond aux six points demandés dans le cahier des charges avant l'écriture du code
(§44). Il est conservé dans le dépôt pour que les décisions prises restent traçables.

---

## 1. Compréhension du projet, en dix lignes

1. Orchelio est un SaaS configurable pour cabinets d'avocats : un seul code, une seule application,
   plusieurs cabinets.
2. Un questionnaire d'onboarding en sept étapes produit une **configuration** propre au cabinet ;
   il ne duplique jamais le code et n'appelle jamais un développeur.
3. Cette configuration détermine les types de dossiers, les workflows, les champs, les fonctions
   IA, les validations humaines, le vocabulaire et le dashboard.
4. Deux cabinets fictifs servent de démonstration : Dupont Immigration Law (Immigration Law) et
   Carter Employment & Labor Law (Employment & Labor Law).
5. L'isolation entre cabinets est la propriété centrale à démontrer : aucune requête ne doit jamais
   franchir la frontière d'un cabinet.
6. L'IA est simulée dans cette version : deux rôles distincts, Claude Analyst et Claude Reviewer,
   derrière une interface `AIProvider` qui accueillera plus tard l'API Anthropic.
7. Aucun résultat IA n'est final : tout passe par une validation humaine explicite, et certaines
   protections sont verrouillées et non désactivables.
8. Toutes les données sont fictives, l'application affiche en permanence un avertissement de
   démonstration, et rien ne sort de la machine.
9. La version initiale doit fonctionner localement et gratuitement : Next.js, SQLite, Prisma,
   aucun service payant, aucune clé d'API.
10. Le travail est découpé en neuf phases ; seule la Phase 1 (initialisation) est réalisée ici.

---

## 2. Arborescence technique

```
orchelio/
├── prisma/
│   ├── schema.prisma              Modèle de données (Phase 1 : le cabinet uniquement)
│   ├── migrations/                Migrations versionnées
│   └── seed.ts                    Données fictives
├── prisma.config.ts               Configuration Prisma 7
├── src/
│   ├── app/                       Pages (App Router)
│   │   ├── layout.tsx             Coque commune, métadonnées Orchelio
│   │   ├── page.tsx               Accueil, état plateforme en direct
│   │   ├── loading.tsx            Écran de chargement
│   │   ├── error.tsx              Écran d'erreur
│   │   ├── not-found.tsx          Écran 404
│   │   └── globals.css            Jetons de design, thèmes clair et sombre
│   ├── components/
│   │   ├── brand.tsx              Logo et signature Orchelio
│   │   ├── demo-banner.tsx        Avertissement de démonstration
│   │   └── ui.tsx                 Cartes, badges, encadrés, lignes de données
│   ├── lib/
│   │   ├── app-config.ts          Identité produit (client + serveur)
│   │   ├── env.ts                 Variables d'environnement, validées
│   │   ├── prisma.ts              Client Prisma, serveur uniquement
│   │   ├── system-status.ts       Vérification de l'état réel du système
│   │   ├── practice-areas.ts      Catalogue des domaines de droit
│   │   └── roadmap.ts             Les neuf phases et leur état
│   └── generated/prisma/          Client Prisma généré (non versionné)
├── tests/
│   ├── setup.ts
│   ├── unit/                      Vitest
│   └── e2e/                       Playwright
├── docs/
│   ├── ARCHITECTURE.md
│   ├── ROADMAP.md
│   ├── PRODUCTION_READINESS.md
│   └── PLAN_PHASE_1.md
├── .env.example
└── README.md
```

Les phases suivantes ajouteront `src/app/(firm)/`, `src/app/(admin)/`, `src/lib/ai/`,
`src/lib/auth/`, `src/lib/data/` et `prompts/` — sans réorganiser ce qui précède.

---

## 3. Dépendances

**Exécution**

| Paquet | Rôle |
| ------ | ---- |
| `next` 16 | Framework, App Router, rendu serveur |
| `react`, `react-dom` 19 | Interface |
| `@prisma/client` 7 | Accès à la base |
| `@prisma/adapter-better-sqlite3` | Pilote SQLite requis par Prisma 7 |
| `server-only` | Garde-fou : empêche le code serveur d'atteindre le navigateur |

**Développement**

| Paquet | Rôle |
| ------ | ---- |
| `typescript`, `@types/*` | Typage strict |
| `tailwindcss` 4, `@tailwindcss/postcss` | Styles |
| `eslint`, `eslint-config-next` | Qualité du code |
| `prisma` 7 | Migrations, génération du client, Studio |
| `tsx`, `dotenv` | Exécution du seed |
| `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/*` | Tests unitaires et de composants |
| `@playwright/test` | Tests navigateur |

Aucune bibliothèque de composants tierce : les primitives sont écrites directement sur les jetons
de design, ce qui évite une dépendance lourde et garde la maîtrise de l'accessibilité.

---

## 4. Décisions importantes

| Décision | Choix retenu | Raison |
| -------- | ------------ | ------ |
| Nom du produit centralisé | Un seul module `app-config.ts`, verrouillé par un test | Le cahier des charges interdit toute appellation générique ; un test empêche la dérive. |
| Lecture des variables d'environnement | Uniquement dans `env.ts`, avec validation | Rend la liste des variables découvrable et empêche une clé de fuir côté navigateur. |
| `AI_PROVIDER=anthropic` sans clé | Erreur au démarrage, pas de repli silencieux | Un repli silencieux laisserait croire à une vraie analyse. |
| Accès base de données | `server-only` sur `prisma.ts` | Le build échoue si le code serveur est importé côté client. |
| Page d'accueil | État réel lu en base à chaque requête | Le cahier des charges interdit une maquette statique ; une installation cassée doit se voir. |
| Modèle de données Phase 1 | Le seul modèle `Firm` | Le modèle complet appartient à la Phase 2 ; livrer moins mais réellement fonctionnel. |
| `npm run seed` dès la Phase 1 | Oui, limité aux deux cabinets | Les commandes documentées dans le README doivent toutes fonctionner. |
| Thème sombre | Livré dès la Phase 1 | Ajouter deux thèmes après coup coûte beaucoup plus cher que de les prévoir. |
| Polices | Pile système, pas de Google Fonts | Aucune dépendance réseau, fonctionne hors ligne, conforme à la contrainte de gratuité. |
| TypeScript | `strict` plus `noUncheckedIndexedAccess` | Un produit piloté par configuration manipule constamment des accès indexés. |

---

## 5. Risques principaux

| Risque | Gravité | Traitement |
| ------ | ------- | ---------- |
| **Fuite entre cabinets** — une requête sans `firmId` renvoie les données d'un autre cabinet | Critique | Fonctions d'accès scopées, tests d'isolation automatisés (Phase 3), et une documentation qui dit clairement que la démo ne prouve pas encore l'isolation. |
| **Confusion démo / production** — quelqu'un dépose un vrai document | Élevée | Avertissement permanent, données fictives uniquement, avertissement en tête de README et de PRODUCTION_READINESS. |
| **Injection de prompt** — un document contient des instructions | Élevée | Les prompts traiteront les documents comme des preuves non fiables ; tests d'injection exigés avant tout usage réel (Phase 6/9). |
| **Confiance excessive dans l'IA** — un résultat simulé pris pour un avis juridique | Élevée | Aucune conclusion juridique, provenance affichée sur chaque énoncé, validation humaine obligatoire, protections verrouillées. |
| **Surdéveloppement** — construire neuf phases d'un coup et ne rien finir | Moyenne | Une phase à la fois, chacune close par des tests, un commit et une explication. |
| **SQLite en usage concurrent** | Moyenne | Suffisant pour une démonstration locale ; migration PostgreSQL documentée. |
| **Avis de sécurité npm dans les dépendances de Next.js** | Faible en démo | Non corrigeables sans revenir à une version obsolète de Next.js ; consignés et à revérifier à chaque mise à jour. |

---

## 6. Plan d'implémentation de la Phase 1

1. Initialiser Next.js 16 (App Router, `src/`, alias `@/*`), TypeScript strict, Tailwind 4, ESLint.
2. Installer et configurer Prisma 7 + SQLite ; écrire le modèle `Firm` ; créer la première
   migration ; générer le client.
3. Écrire la couche de configuration : `env.ts` (validée) et `app-config.ts` (identité produit).
4. Écrire les jetons de design et les thèmes clair et sombre.
5. Écrire les composants de base : marque, avertissement de démonstration, cartes, badges.
6. Écrire la page d'accueil, alimentée par une vraie requête base de données, plus les écrans de
   chargement, d'erreur et 404.
7. Écrire le seed des deux cabinets fictifs et les scripts npm documentés.
8. Écrire les tests : unitaires et composants sous Vitest, navigateur sous Playwright.
9. Écrire la documentation : README, architecture, feuille de route, préparation à la production.
10. Exécuter lint, typecheck, tests unitaires, build et tests end-to-end ; corriger ; committer.

**Ce qui est volontairement exclu de la Phase 1 :** authentification, espaces cabinets, onboarding,
dossiers, documents, IA, validations, journal d'audit, écrans de coûts.
