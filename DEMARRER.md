# Démarrer Orchelio sur votre ordinateur

Ce fichier est en français et s'adresse à quelqu'un qui n'est pas développeur.
La documentation technique du projet est en anglais et commence par
[`README.md`](README.md).

L'application elle-même est en anglais : les écrans, les messages et les comptes
de démonstration. Ce guide traduit ce qu'il faut taper et ce qui doit s'afficher,
pas l'interface.

---

## Ce qu'il faut avant de commencer

**Node.js, version 20.9 ou plus récente.** C'est le seul prérequis. Téléchargez
la version **LTS** sur <https://nodejs.org>, installez-la, puis rouvrez votre
terminal (l'installation ne prend effet que dans une fenêtre ouverte après).

Pas de compte, pas de clé d'API, pas de carte bancaire, pas d'hébergement. Tout
tourne sur votre machine et ne coûte rien.

Pour vérifier que Node.js est installé, tapez `node --version` : la réponse doit
commencer par `v20.`, `v22.` ou plus.

---

## La façon la plus simple : un fichier à lancer

Une fois le projet téléchargé sur votre ordinateur (voir plus bas si ce n'est pas
encore le cas) :

- **Windows** — double-cliquez sur `start-orchelio.bat`.
- **macOS ou Linux** — dans un terminal ouvert dans le dossier du projet, tapez
  `./start-orchelio.sh`.

Le script fait les cinq étapes tout seul, dans l'ordre, en annonçant chacune :

1. il vérifie Node.js ;
2. il crée le fichier `.env` à partir de `.env.example` ;
3. il installe les dépendances (une à trois minutes la première fois) ;
4. il crée la base de données ;
5. il charge les données fictives ;

puis il démarre l'application et ouvre <http://localhost:3000> dans votre
navigateur.

**Vous pouvez le relancer autant de fois que vous voulez.** Rien n'est effacé :
le `.env` existant n'est pas écrasé, les données fictives sont mises à jour
plutôt que remplacées.

Sous Windows, une fenêtre bleue « Windows a protégé votre ordinateur » peut
apparaître : cliquez sur **Informations complémentaires**, puis **Exécuter quand
même**. C'est le réflexe habituel de Windows devant un fichier `.bat`, pas le
signe d'un problème.

Pour arrêter l'application : `Ctrl` + `C` dans la fenêtre du terminal.

### Si vous préférez le terminal

Le lanceur ne fait qu'appeler ceci, qui marche à l'identique sur les trois
systèmes :

```bash
npm run setup
```

Et si vous voulez tout préparer sans démarrer le serveur :

```bash
npm run setup -- --no-start
```

---

## Si le projet n'est pas encore sur votre ordinateur

Ouvrez un terminal, placez-vous où vous voulez ranger le projet, puis :

```bash
git clone https://github.com/CorentinSG/Orchelio.git
cd Orchelio
```

Si vous n'avez pas `git` : allez sur la page du dépôt, bouton vert **Code** →
**Download ZIP**, décompressez l'archive, et ouvrez un terminal dans le dossier
obtenu.

Ensuite, lancez le fichier décrit ci-dessus.

### En une seule ligne, à coller

**macOS / Linux**

```bash
git clone https://github.com/CorentinSG/Orchelio.git && cd Orchelio && npm run setup
```

**Windows PowerShell**

```powershell
git clone https://github.com/CorentinSG/Orchelio.git; cd Orchelio; npm run setup
```

---

## Une fois l'application ouverte

Connectez-vous sur <http://localhost:3000/login>. Les comptes sont listés sur la
page : cliquez sur l'un d'eux pour remplir le formulaire.

**Le mot de passe est `orchelio-demo` pour tous les comptes.**

| Compte | Rôle |
| ------ | ---- |
| `immigration.attorney@demo.local` | Avocat et administrateur, cabinet d'immigration |
| `immigration.paralegal@demo.local` | Assistante juridique, cabinet d'immigration |
| `employment.attorney@demo.local` | Avocat et administrateur, droit du travail |
| `employment.paralegal@demo.local` | Assistant juridique, droit du travail |
| `reviewer@demo.local` | Lecture seule, membre des **deux** cabinets |
| `platform.admin@demo.local` | Administrateur de la plateforme — voit les cabinets, **aucun** dossier |

Puis suivez <http://localhost:3000/guide> : vingt et une étapes numérotées,
chacune indiquant le compte à utiliser et ce qu'il faut remarquer.

Toutes les données sont fictives. Le domaine `.local` des adresses ne peut pas
exister sur l'internet réel.

---

## Si quelque chose ne va pas

```bash
npm run harness:doctor
```

Cette commande contrôle chaque point — Node.js, dépendances, `.env`, base de
données, données de démonstration — et affiche, pour ce qui manque, la commande
exacte à taper. C'est le premier réflexe, avant de chercher ailleurs.

Quelques messages fréquents :

| Ce que vous voyez | Ce que ça veut dire |
| ----------------- | ------------------- |
| `node : command not found` ou `n'est pas reconnu` | Node.js n'est pas installé, ou le terminal a été ouvert avant l'installation. Installez-le, fermez le terminal, rouvrez-en un. |
| `EADDRINUSE` ou `port 3000 is already in use` | Une autre copie de l'application tourne déjà. Fermez-la, ou ouvrez simplement <http://localhost:3000>. |
| `Your database is now in sync with your schema` | Tout va bien, c'est le message de succès de l'étape 4. |
| La page de connexion refuse un compte listé | La base existe mais elle est vide : `npm run seed`. |

Si vous restez bloqué, copiez **toute** la sortie du terminal — c'est elle qui
dit ce qui s'est passé.

---

## La seule commande destructrice

```bash
npm run reset-demo
```

Elle **efface la base de données** et la reconstruit vide, puis rechargée. Elle
n'existe qu'en ligne de commande, jamais sous forme de bouton, et c'est
délibéré : deux tests de navigateur vérifient qu'aucun bouton de ce genre
n'apparaît dans l'interface. Rien d'autre dans ce guide n'efface quoi que ce
soit.

---

## Pourquoi il n'y a pas simplement un lien à cliquer

Orchelio range ses données dans un fichier local (SQLite), et sa spécification
interdit l'hébergement payant comme la base de données distante. Les
hébergements gratuits effacent les fichiers à chaque redémarrage : la base
disparaîtrait en quelques minutes.

Mettre le projet en ligne demanderait donc une vraie base de données hébergée —
ce qui a un coût et contredit la règle « ne rien coûter à faire tourner »
inscrite dans la spécification. C'est faisable, mais c'est une décision à
prendre, pas un détail technique. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
décrit la procédure de passage à PostgreSQL.

---

## Ce que ce guide ne dit pas

Il fait démarrer l'application, rien de plus. Ce qu'Orchelio est, ce qu'il ne
fait pas, et ce qui manquerait avant un usage réel se lisent dans
[`README.md`](README.md) — en particulier la section *Known limitations*, écrite
pour être honnête plutôt que rassurante.

**Ne saisissez jamais de données réelles de client.** C'est un environnement de
démonstration : les mots de passe sont publiés dans ce dépôt, l'IA est simulée,
et rien n'a fait l'objet d'un audit de sécurité.
