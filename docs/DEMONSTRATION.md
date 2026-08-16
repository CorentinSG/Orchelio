---
title: Donner une démonstration
tags: [reference, guide]
---

# Orchelio — donner une démonstration

Comment montrer Orchelio à quelqu'un, d'une machine vierge jusqu'au cabinet
qu'il aura créé lui-même. Écrit pour la personne qui **donne** la
démonstration — comme le [plan V1](PLAN-V1.md) et le
[glossaire](GLOSSAIRE.md), ce document appartient au propriétaire et s'écrit
donc en français. La personne qui **regarde** la démonstration, elle, veut la
visite intégrée à [`/guide`](http://localhost:3000/guide) : les mêmes
vingt-et-une étapes, avec un lien sur chacune.

---

## 1. Avant que quiconque regarde

```bash
npm install
cp .env.example .env
npx prisma migrate deploy
npm run seed
npm run harness:doctor     # dit ce qui manque, et la commande qui répare
npm run dev                # http://localhost:3000
```

Cinq minutes sur une machine vierge, dont l'essentiel est `npm install`. Rien
n'a besoin du réseau ensuite : ni clé d'API, ni compte, ni service en nuage,
ni argent. (Le fournisseur Mistral existe depuis la V1, mais la démonstration
tourne sous la simulation — c'est le réglage par défaut, et c'est dit à
l'écran.)

**Vérifiez l'état d'où vous partez.** La suite de tests navigateur crée des
cabinets et des dossiers en s'exécutant : une machine qui a lancé
`npm run test:e2e` a plus de cabinets que les deux installés par
`npm run seed`. Ce n'est pas un problème à cacher — c'est visible dans
Administration de la plateforme → Cabinets — mais décidez avant de commencer
si vous en voulez. Pour revenir exactement à l'état d'origine :

```bash
npm run reset-demo    # efface tout et réinstalle. Irréversible.
```

Dites-vous la dernière partie à voix haute avant d'appuyer sur Entrée. Cela
efface tous les cabinets de l'instance.

---

## 2. La version en dix minutes

Si vous avez dix minutes, montrez la promesse plutôt que les fonctions. La
promesse est : *un seul code, et chaque cabinet reçoit un produit différent.*

1. **Connectez-vous** comme `immigration.attorney@demo.local` (mot de passe
   `orchelio-demo`, affiché sur la page). Lisez le tableau de bord : titres
   arrivant à expiration, pièces de séjour manquantes.
2. **Ouvrez un dossier.** Les champs sont ceux du droit des étrangers —
   titre de séjour, préfecture, OQTF.
3. **Lancez une analyse** depuis l'onglet Analyse. Environ une seconde.
4. **Lisez ce qu'elle ne dit pas.** Aucune conclusion, et aucun emplacement
   vide où elle irait.
5. **Allez dans Validations.** L'analyse attend une personne. Refusez-la, et
   regardez Orchelio exiger un motif écrit.
6. **Connectez-vous comme `reviewer@demo.local`**, qui appartient aux deux
   cabinets, et basculez vers Cabinet Carter. D'autres cartes, d'autres
   champs, d'autres mots — « collecte des preuves » plutôt que « collecte des
   documents ».
7. **Collez dans la barre d'adresse le lien d'un dossier du premier
   cabinet.** Le refus est formulé exactement comme pour un dossier qui
   n'existe pas.

Les étapes 6 et 7 *sont* la démonstration. Le reste est leur contexte.

---

## 3. La version complète

Suivez [`/guide`](http://localhost:3000/guide) — vingt-et-une étapes, une
vingtaine de minutes, qui se terminent par la création d'un troisième cabinet
par le spectateur lui-même. Cette dernière partie vaut son temps : une
affirmation sur la configurabilité convainc beaucoup moins que le spectacle
de quelqu'un produisant un cabinet qui fonctionne, en quatre minutes, sans
que personne touche au code.

La visite nomme le compte de chaque étape : on peut donc la confier à
quelqu'un qui la suivra seul.

---

## 4. Les limites : quoi dire, et quand

Dites-les tôt plutôt qu'en réponse à une question. Une démonstration qu'il
faut corriger sous les questions a déjà perdu la discussion.

| Quand | Quoi dire |
| ----- | --------- |
| Avant la connexion | Tout ici est inventé. Aucun client, dossier, personne ou document réel n'existe dans cette version. |
| Avant la première analyse | L'IA est **simulée**. Pas de clé, pas de requête, pas de frais, et rien ne quitte cette machine. La simulation dérive son résultat des champs de chaque dossier, des réponses au questionnaire et des *noms* des documents. |
| Au premier résultat d'analyse | Elle n'ouvre jamais un document. Il n'y a pas d'OCR : Orchelio conserve un nom de fichier, un type et une taille. |
| À l'écran des validations | Neuf règles ne peuvent être désactivées par personne, depuis aucun écran. Quatre des dix-huit règles sont réellement déclenchées dans cette version, et l'écran dit lesquelles. |
| Devant un projet de courrier | Orchelio n'a aucun moyen d'envoyer quoi que ce soit. Il n'y a pas de statut « envoyé » dans la base et pas de transport dans le code. Valider un brouillon signifie qu'une personne accepte que ces mots quittent le cabinet ; c'est ensuite elle qui les envoie. |
| Sur le vocabulaire juridique | Les dossiers fictifs parlent la procédure française — titres de séjour, prud'hommes — mais ce vocabulaire est **plausible, pas vérifié** : aucun praticien ne l'a relu. C'est une exigence déjà inscrite avant tout usage réel. |
| Si l'on demande la production | Ce n'est pas prêt pour la production, et les manques sont écrits plutôt que résumés. Voir [Production readiness](PRODUCTION_READINESS.md). Le plus grand : l'isolement entre cabinets est appliqué par l'application, pas par la base de données. |

---

## 5. Les questions qui reviennent, avec les réponses honnêtes

**« C'est vraiment un seul code ? »**
Oui. `src/lib/roadmap.ts`, les cartes du tableau de bord et les champs de
dossier sont tous choisis d'après la configuration enregistrée du cabinet.
Montrez Réglages → Fonctions d'IA, désactivez-en une, et regardez la carte du
tableau de bord disparaître plutôt qu'afficher zéro.

**« Il peut faire mon domaine de droit ? »**
Deux domaines disposent d'un modèle complet : le droit des étrangers, et le
droit du travail. Le questionnaire propose les autres avec « Modèle bientôt
disponible » à côté, et refuse de laisser un cabinet terminer son
installation dans l'un d'eux. Ajouter un domaine est un changement de
données plus une table de champs — voir [Architecture §8.1](ARCHITECTURE.md).

**« Ça coûterait combien en vrai ? »**
Cette version ne peut pas vous le dire, et l'écran de consommation le dit.
Ses comptes de jetons sont dérivés de la taille de chaque dossier, pas
mesurés sur un modèle. Ce qu'un déploiement réel coûte dépend du modèle, de
l'instruction et des documents réellement envoyés — rien de tout cela
n'existe ici. (Le barème Mistral de la V1 donne un ordre de grandeur :
quelques centimes par analyse, marqués « estimé » tant que la facture ne les
a pas confirmés.)

**« Un cabinet pourrait voir les données d'un autre ? »**
Trois couches indépendantes disent non, et des tests d'intégration font
tourner deux cabinets aux enregistrements délibérément semblables — même nom
de client, même nom de fichier, même intitulé de dossier — en vérifiant que
l'un n'atteint jamais la copie de l'autre. Les trois couches s'exécutent dans
l'application : elles protègent d'une erreur de programmation, pas d'un
processus compromis. C'est la réponse honnête, et c'est la même que dans
[Production readiness](PRODUCTION_READINESS.md).

**« Je peux l'avoir hébergé ? »**
Pas depuis cette version. Elle tourne en local sur SQLite par conception,
parce qu'une contrainte du cahier des charges était de ne rien coûter.
Passer à PostgreSQL est un changement de chaîne de connexion plus une
migration — voir [Architecture §8.5](ARCHITECTURE.md) — mais l'hébergement,
l'authentification et l'isolement demandent d'abord un vrai travail.
L'hébergement européen est au plan V1 (ADR-0028), pour les pilotes.

---

## 6. Si quelque chose casse en pleine démonstration

```bash
npm run harness:doctor
```

Il vérifie ce qui casse réellement — un `.env` absent, une base non migrée,
des données d'exemple vides, pas de navigateur — et imprime la commande
exacte pour chaque cas.

Un écran vide ou cassé affiche une page d'erreur au nom du produit avec un
code de référence, et le détail part dans le terminal plutôt que dans le
navigateur : un message d'erreur est l'un des endroits les plus faciles d'où
faire fuir les données d'un autre cabinet, alors l'écran en dit peu, exprès.

---

## Voir aussi

- [Roadmap](ROADMAP.md) — ce que chaque phase a livré
- [Acceptance criteria](ACCEPTANCE.md) — et les tests qui les prouvent
- [Production readiness](PRODUCTION_READINESS.md) — ce qui n'est délibérément pas fait
- [Plan V1](PLAN-V1.md) — le chantier en cours vers le cockpit connecté
