---
title: Plan V1 — le cockpit connecté
tags: [reference, planning, v1]
---

# Orchelio V1 — Plan de construction

*Validé par le propriétaire du projet le 6 août 2026. Ce document est la
référence de la Version 1 ; la feuille de route ([Roadmap](ROADMAP.md)) en
suit l'avancement phase par phase. Il est rédigé en français parce que le
produit change de langue avec lui.*

---

## Ce qui change, et pourquoi

La démonstration livrée en neuf phases était **fermée par construction** :
données fictives, IA simulée, aucun octet ne sortait de la machine, aucun
document jamais lu, coût nul. La Version 1 en fait un **cockpit connecté**
pour petits cabinets d'avocats, conformément au cahier des charges du
propriétaire : le cabinet branche ses sources, ouvre un dossier et le
comprend en trente secondes — chaque information reliée à sa source.

Quatre interdits fondateurs sont levés **par des décisions écrites**, jamais
contournés :

| Interdit d'origine | Ce qu'il devient | Décision |
| ------------------ | ---------------- | -------- |
| Rien ne sort de la machine | Rien ne sort qui ne soit listé, justifié et journalisé | ADR-0025 |
| Aucun document n'est lu | Un pipeline lit, extrait, océrise — et cite page et passage | ADR-0026 |
| L'IA est simulée | IA réelle routée par coût ; le simulateur reste le moteur des tests | ADR-0027 |
| Coût nul, fichier local | Trajectoire d'hébergement européen, rien à jeter en route | ADR-0028 |

Ce qui ne change pas : **rien ne part jamais seul** (aucun envoi autonome,
structurellement), les neuf règles verrouillées, l'étanchéité entre cabinets,
le journal qui enregistre tout — refus compris —, et une interface qui dit
moins qu'elle ne sait, jamais plus. Données fictives uniquement jusqu'à
validation juridique spécialisée.

## Les grands choix

- **Une seule clé d'IA : Mistral** (France, traitement en Union européenne,
  engagement contractuel de non-entraînement en offre payante). Une clé donne
  toute la gamme — modèles minuscules pour classer, moyens pour résumer,
  grand pour les analyses difficiles — donc le routage par coût sans
  multiplier les fournisseurs. La passerelle reste multi-fournisseurs
  (adaptateurs local et Anthropic conservés) : changer de moteur ne touche ni
  les écrans ni les données.
- **Le différenciateur est une structure de données** : toute information
  affichée est une *assertion* typée — fait (source obligatoire,
  structurellement), inférence (marquée), recommandation, manque,
  contradiction. Un fait sans source ne peut pas être enregistré comme un
  fait.
- **Les connecteurs par étages** : boîte de courriels fictive réaliste pour
  la V1 (tout le circuit fonctionne), Gmail en mode test si le propriétaire
  le souhaite, Microsoft 365 après la V1 — il exige des comptes à son nom.
- **Design refait, en français** : minimaliste, une action principale par
  écran, gros boutons, vocabulaire du métier, zéro jargon d'IA. Le français
  d'abord ; l'anglais suivra.

## Les huit phases

Chaque phase se termine par une démonstration visible, des tests verts et un
commit — jamais par une promesse.

| # | Phase | Livre | Preuve |
| - | ----- | ----- | ------ |
| V1-1 | Fondations | ADR 0025–0028, bascule française, nouveau design, passerelle IA v2 (routage par classe, comptage, adaptateur Mistral) | Le produit existant fonctionne en français sous son nouveau visage ; une tâche est routée et comptée |
| V1-2 | Les documents, enfin lus | Extraction, OCR local, classification, dédoublonnage, index cloisonné par cabinet | Vingt PDF sales ressortent classés, dédoublonnés, recherchables, chaque extrait cliquable jusqu'à sa page |
| V1-3 | Le dossier compris | Assertions typées, résumé sourcé, chronologie avec certitude, incohérences de contenu | Ouvrir un dossier riche, tout vérifier en un clic jusqu'au passage surligné |
| V1-4 | Les courriels | Rattachement scoré, boîte de tri, corrections journalisées et apprises par cabinet | Trois courriels : deux se rattachent seuls, un attend dans le tri ; correction en deux clics |
| V1-5 | Les actions guidées | Cinq boutons métier, brouillons sous validation, modèles adaptables | Chaque action, du clic au résultat sourcé, sans prompt ni jargon |
| V1-6 | L'installation en cliquant | Onboarding adaptatif, précision libre interprétée, aperçu avant validation, premier résultat avant la fin | Cabinet neuf configuré en dix minutes, à 80 % sans clavier |
| V1-7 | Les coûts sous contrôle | Centimes réels par cabinet/dossier/action, plafonds, comparaison des modèles | Une démo affiche son coût exact ; un plafond l'arrête proprement |
| V1-8 | La V1 assemblée | Scénario de démonstration complet, données fictives riches, guide réécrit, vérification totale | Le propriétaire déroule la démonstration seul |

## Après la V1 — les pilotes

Microsoft 365/Outlook (comptes au nom du propriétaire), hébergement européen
(France recommandée — Scaleway ou OVH — la Suisse reste possible ; PostgreSQL,
stockage chiffré, MFA, sauvegardes), validation RGPD et déontologie par un
spécialiste **avant tout client réel**, facturation du SaaS, agents pilotés
par événements (niveaux d'autonomie 3–4), application mobile si les pilotes
la réclament.

## Actions du propriétaire

| Quand | Quoi |
| ----- | ---- |
| Avant V1-2 | Créer le compte Mistral (offre payante) et fournir la clé — fait le 6 août 2026 ; autoriser `api.mistral.ai` dans la politique réseau de l'environnement de développement, ou tester depuis sa machine |
| V1-4 (facultatif) | Autoriser son Gmail en mode test pour une démo sur vraie boîte |
| Après V1 | Compte Microsoft 365 ; choix de l'hébergeur ; validation spécialisée ; entretiens cabinets |

## Réussite de la V1

Un dossier fictif riche compris en moins de trente secondes ; chaque fait
ouvert en un clic jusqu'au passage d'origine, toute affirmation non sourcée
marquée comme inférence ; courriels rattachés seuls quand la confiance est
haute, en tri sinon, corrigés en deux clics ; installation en clics en moins
de dix minutes avec un premier résultat avant la fin ; aucun envoi ni action
sensible sans validation — prouvé par des tests ; le coût au centime, arrêté
par un plafond ; le tout en français, compréhensible sans formation.
