---
title: Glossaire — le français du produit
tags: [reference, v1, i18n]
---

# Le français d'Orchelio

*Décidé une fois, avant le premier écran traduit (V1-1), pour que vingt
écrans ne produisent pas vingt vocabulaires. Toute traduction d'écran suit ce
tableau ; en changer un terme, c'est changer ce document dans le même commit,
puis les écrans déjà traduits.*

Le registre est celui d'un cabinet français : le mot du métier quand il
existe, jamais le calque de l'anglais, jamais le jargon d'IA. Vouvoiement
partout. Les dates s'écrivent en toutes lettres (`11 février 2024`), au
fuseau du cabinet, comme l'exige ADR-0021 — à une exception près, dite ici
pour qu'elle reste une décision : le journal d'activité garde l'horodatage
technique `AAAA-MM-JJ HH:MM:SS`, parce qu'un registre se balaie et se
compare plus qu'il ne se lit, et que deux entrées à une minute d'écart
doivent se voir à une minute d'écart.

## Navigation et objets

| Anglais (actuel) | Français (V1) | Pourquoi |
| ---------------- | ------------- | -------- |
| Matter | **Dossier** | Le mot du métier. « Affaire » sonne contentieux ; un dossier d'immigration n'est pas une affaire. |
| Matters | **Dossiers** | |
| Open a matter | **Ouvrir un dossier** | Le geste, pas la fiche : c'est l'entrée « raccourci » (ADR-0022). |
| Dashboard | **Tableau de bord** | |
| Intake | **Questionnaire client** | « Intake » ne se dit pas ; « accueil » se confondrait avec la page d'accueil. |
| Documents | **Documents** | |
| Tasks | **Tâches** | |
| AI Workspace | **Assistant** | Le mot « IA » recule partout où le métier suffit ; l'espace est celui de l'assistant du cabinet. |
| Approvals | **Validations** | « Approbation » est correct mais administratif ; le cahier des charges parle de valider. |
| Activity Log | **Journal d'activité** | |
| Firm Settings | **Réglages du cabinet** | |
| Usage and Costs | **Consommation et coûts** | |
| Setup Questionnaire | **Questionnaire d'installation** | |
| Client | **Client** | |
| Draft communication | **Projet de courrier** | « Brouillon » pour l'état ; l'objet est un projet de courrier. |
| Analysis | **Analyse** | |
| Review (the second pass) | **Relecture** | Une relecture indépendante, pas une « revue ». |
| Firm | **Cabinet** | |
| Platform administrator | **Administrateur de la plateforme** | |
| Workflow | **Déroulé** — « le déroulé d'un dossier » | « Flux de travail » est un calque ; « processus » sonne qualité-ISO. |
| Onboarding | **Installation** | Le questionnaire *installe* le cabinet dans le produit ; « embarquement » ne se dit pas. |
| Branding | **Identité visuelle** | |
| Retainer agreement | **Convention d'honoraires** | Le terme du métier, pas « accord de mandat ». |
| Filing | **Dépôt** — et « déposer » | Jamais « classer », qui en français veut dire l'inverse. |
| Privileged (classe de données) | **Couvert par le secret professionnel** | Le concept français correspondant ; « privilégié » ne veut rien dire ici. |
| Client-confidential | **Confidentiel client** | |
| Egress | **Sortie** — « ce qui quitte la machine » | |
| Lead | **Premier contact** | « Lead » est du vocabulaire commercial anglais ; un cabinet parle d'un premier contact. |

## Rôles

| Anglais | Français |
| ------- | -------- |
| Firm Administrator | **Administrateur du cabinet** |
| Attorney | **Avocat** — et « avocate » quand la personne est connue et se déclare ainsi ; le rôle générique reste au masculin grammatical, comme dans les textes du métier. |
| Paralegal | **Assistant juridique** / **Assistante juridique** (même règle) |
| Read-only reviewer | **Lecteur** — lecture seule, dit par le badge « lecture seule ». |

## États et actions

| Anglais | Français |
| ------- | -------- |
| Pending | **En attente** |
| Approved | **Validé(e)** |
| Rejected | **Refusé(e)** |
| Superseded | **Remplacé(e)** — remplacé par une analyse plus récente ; personne n'a décidé (ADR-0020). |
| Draft / Approved for use | **Brouillon** / **Validé pour usage** |
| Open / Closed | **Ouvert** / **Clos** |
| Sign in / Sign out | **Se connecter** / **Se déconnecter** |
| Run analysis | **Lancer l'analyse** |
| Verified (document) | **Vérifié par une personne** — jamais « vérifié » seul : dire *par qui* est le point. |
| Not verified | **Non vérifié** |

## Les phrases qui portent des garanties

Celles-ci sont des engagements, pas du texte d'interface ; leur traduction
est fixée ici pour que chaque écran dise exactement la même chose.

| Garantie | Formulation française |
| -------- | --------------------- |
| Demonstration warning | **« Environnement de démonstration — n'y saisissez jamais d'informations réelles sur un client. »** |
| Nothing sends itself | **« Rien ne part jamais seul : un courrier validé est copié et envoyé par une personne. »** |
| The analysis concludes nothing | **« Cette analyse décrit le dossier. Elle ne conclut rien, ne recommande rien, et aucune date n'y est confirmée. »** |
| Human review required | **« À lire par une personne — obligatoire. »** |
| A refusal that must not confirm existence | **« Ce dossier n'existe pas, ou vous n'y avez pas accès. »** — une seule phrase pour les deux cas, indistinguable à dessein. |
| Simulated figures | **« Chiffres simulés — aucun frais n'a été engagé. »** |
| Estimated cost (Mistral) | **« Coût estimé d'après le barème du {date} — la facture de Mistral fait foi. »** |

## Ce qui ne se traduit pas

- **Orchelio** — le nom du produit (règle n°6 de CLAUDE.md).
- **Les références de dossier** (`IMM-2026-002`) — des identifiants, pas des mots.
- **Les clés techniques** (`firmId`, noms de modèles Mistral) — invisibles pour l'utilisateur de toute façon.
- **La documentation du dépôt et les messages de commit** — en anglais, pour
  qui maintient le code ; ce glossaire et le plan V1 sont les deux exceptions,
  parce qu'ils appartiennent au propriétaire.

## Le réglage de langue

Jusqu'ici, l'interface était en anglais et le réglage « langue » disait
honnêtement qu'il ne changeait rien (ADR-0021). La bascule V1 inverse la
situation : le produit est en français, et le réglage continue de dire la
vérité — « L'interface est en français. Ce choix est enregistré, et rien ne le
lit encore — l'anglais n'est pas disponible. » L'anglais reviendra comme une
vraie option quand un cabinet le demandera, extrait de ces écrans vers un
catalogue de traductions.

Deux choses ont bougé avec la bascule, parce que ne pas les bouger aurait été
mentir : la valeur par défaut d'un nouveau cabinet est `fr` et non plus `en`,
et la page déclare `<html lang="fr">`. Ce dernier point n'est pas cosmétique —
un lecteur d'écran prononçait jusqu'ici du français avec des phonèmes anglais.
