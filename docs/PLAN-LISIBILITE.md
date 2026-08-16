---
title: Plan Lisibilité — six phases
tags: [plan, v1, lisibilite]
---

# Chantier Lisibilité

*Rendre le produit plus rapide à lire et plus rapide à utiliser, sans retirer
une seule des phrases qui le rendent honnête. Établi le 16 août 2026, après la
fin de la phase V1-1 ; lancement de L-0 approuvé par le propriétaire le même
jour (« lance L-0 »). Comme le [plan V1](PLAN-V1.md) et le
[glossaire](GLOSSAIRE.md), ce document appartient au propriétaire et s'écrit
en français.*

Les chiffres qui fondent ce plan — les mots et les contrôles que chaque écran
impose réellement à son lecteur, mesurés au navigateur — sont consignés dans
[ADR-0029](decisions/ADR-0029-reading-budgets-and-journey-ceilings.md), avec
les budgets décidés et le cliquet qui les tient.

---

## Le diagnostic, en cinq constats

1. **Les files ne tiennent pas la charge.** L'écran Validations affichait
   11 136 mots et 201 boutons — toutes les demandes, chacune avec sa carte
   complète et son formulaire. La liste des dossiers, 162 liens sans pages ni
   tri. À six dossiers tout va bien ; au volume d'un vrai cabinet, l'écran
   devient un mur.
2. **Le tableau de bord annonce, mais ne conduit pas.** Zéro lien dans les
   tuiles : on lit « 3 validations en attente », puis on cherche soi-même.
3. **L'écran explique avant de servir.** Les phrases d'honnêteté restent —
   c'est un engagement — mais leur pleine longueur à chaque visite pèse. Une
   ligne visible, le détail au dépliage.
4. **Aucun chemin rapide.** Ni recherche globale, ni raccourcis clavier, ni
   dossiers récents.
5. **La fiche dossier disperse son état.** Statut, prochaine date, dernière
   analyse et décision en attente sont répartis entre les onglets.

## Ce qui ne bougera pas

- Aucune mise en garde supprimée — repliée n'est pas retirée, et la première
  ligne reste visible.
- Un tiret n'est jamais remplacé par un zéro ; un refus ne confirme jamais
  qu'un dossier existe.
- Le bandeau de démonstration reste sur chaque écran principal.
- Rien de destructif ne gagne un bouton.

---

## Les six phases

| # | Phase | L'essentiel | Preuve | Statut |
| - | ----- | ----------- | ------ | ------ |
| L-0 | Mesurer, fixer les budgets | Les six parcours fréquents comptés en actions et épinglés comme tests ; budgets de mots décidés (ADR-0029) | `tests/e2e/efficiency.spec.ts`, dix tests verts | ✅ Livrée |
| L-1 | Des files qui tiennent la charge | Validations regroupées par dossier, une carte dépliée à la fois, formulaires au dépliage ; liste des dossiers paginée et triable ; recherche côté serveur | L'écran Validations passe sous son budget de mots *avec la base chargée d'aujourd'hui* ; les plafonds de parcours ne se dégradent pas | Planifiée |
| L-2 | Un tableau de bord qui conduit | Chaque tuile chiffrée devient un lien vers la vue déjà filtrée ; file « À faire aujourd'hui » en tête | Le parcours « du chiffre à l'action » tombe à un clic, mesuré | Planifiée |
| L-3 | La fiche dossier porte son état | En-tête permanent (statut, date non confirmée, dernière analyse et sa relecture, validation en attente) ; onglets réordonnés ; vérification de documents en série | « Où en est ce dossier ? » a sa réponse depuis chaque onglet, testé | Planifiée |
| L-4 | Le poids juste des explications | Encadrés repliables (première phrase visible) ; le budget de 600 mots devient un test sur chaque écran de travail ; intitulés stabilisés au glossaire | Le test de budget en place et vert ; l'audit d'accessibilité re-prouvé dans les deux thèmes | Planifiée |
| L-5 | La main au clavier | Palette Ctrl K (aller à un dossier, actions fréquentes) ; dossiers récents ; navigation clavier dans les files | « Trouver un dossier par son client » passe de quatre actions à trois touches, mesuré | Planifiée |

---

## Comment ce chantier croise le plan V1

- **L-1 et L-2 avant V1-4 (les courriels)** : la boîte de tri des courriels
  sera une file de plus — autant qu'elle naisse dans des files qui savent
  déjà tenir la charge.
- **L-3 avant V1-3 (le dossier compris)** : le résumé sourcé et la
  chronologie de V1-3 s'accrocheront à l'en-tête permanent.
- **V1-6 (l'installation en cliquant) n'est pas touchée** : le questionnaire
  a son propre chantier au plan V1.
- L-4 et L-5 s'intercalent quand elles arrangent — elles ne bloquent rien.

## Ce que L-0 a trouvé en chemin

Mesurer a fait ce que mesurer fait : la passe a révélé trois surfaces que la
bascule française avait manquées — la carte de validation et ses quatre
boutons de décision, le corps de la page Validations, et le journal
d'activité entier. Les trois avaient un titre français au-dessus d'un contenu
anglais, et la bascule avait vérifié les écrans par leurs titres. Corrigées
avant la livraison de L-0, avec la leçon consignée dans ADR-0029.
