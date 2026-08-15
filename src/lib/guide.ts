/**
 * Orchelio — the guided demonstration.
 *
 * Twenty-one steps that walk somebody through the whole product in order, each
 * naming the account to use, the screen to open, and — the part that matters —
 * what to *look* for once there.
 *
 * The steps are data rather than prose in a page for two reasons. A test can
 * check that every step points at a route that exists and names an account that
 * exists, which is the way a walkthrough stops rotting the moment a screen
 * moves. And the same list can be rendered publicly, before sign-in, so a
 * visitor knows what they are about to see.
 *
 * Several steps deliberately ask the reader to notice a *refusal* or an
 * *absence*: what Orchelio declines to do is the substance of the product, not
 * a gap in it.
 */

import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/demo-accounts";

export type GuideStep = {
  number: number;
  title: string;
  /** The account to be signed in as. `null` means it does not matter. */
  account: string | null;
  /** Where to go. A path inside this application. */
  href: string;
  /** What to do there, in one instruction. */
  action: string;
  /** What to look for. Usually the point of the step. */
  notice: string;
};

export const GUIDE_STEP_COUNT = 21;

export const GUIDE_STEPS: readonly GuideStep[] = [
  {
    number: 1,
    title: "Se connecter comme avocat en droit des étrangers",
    account: "immigration.attorney@demo.local",
    href: "/login",
    action: `Connectez-vous avec le mot de passe ${DEMO_PASSWORD}. Tous les comptes de la page de connexion l’utilisent.`,
    notice:
      "Le mot de passe est affiché sur la page. Il est écrit dans un dépôt public : le cacher relèverait du théâtre plutôt que de la sécurité.",
  },
  {
    number: 2,
    title: "Le tableau de bord n’est pas un gabarit",
    account: "immigration.attorney@demo.local",
    href: "/dashboard",
    action: "Lisez les cartes en haut de l’écran.",
    notice:
      "Ce sont des questions de droit des étrangers — expirations de statut, dates de priorité. Rien dans le code ne le dit ; elles viennent de la configuration de ce cabinet.",
  },
  {
    number: 3,
    title: "La liste des dossiers",
    account: "immigration.attorney@demo.local",
    href: "/matters",
    action: "Ouvrez la liste, puis un dossier.",
    notice:
      "Trois dossiers, tous fictifs. Chacun a été écrit pour démontrer une chose : un dossier complet, une contradiction, et un dossier incomplet.",
  },
  {
    number: 4,
    title: "Un dossier montre les champs de son domaine",
    account: "immigration.attorney@demo.local",
    href: "/matters",
    action: "Regardez les champs du dossier que vous avez ouvert.",
    notice:
      "Date de priorité, expiration du statut, pays de naissance. Un dossier de droit du travail n’en a aucun — les champs suivent le type de dossier, pas le code.",
  },
  {
    number: 5,
    title: "Les documents, et ceux qui manquent",
    account: "immigration.paralegal@demo.local",
    href: "/documents",
    action: "Ouvrez l’onglet Documents d’un dossier et lisez le panneau des documents attendus.",
    notice:
      "Orchelio liste ce dont un dossier de ce type a d’habitude besoin, et ce qui n’est pas arrivé. Il n’ouvre jamais un fichier : seul le nom est lu.",
  },
  {
    number: 6,
    title: "Le questionnaire client",
    account: "immigration.paralegal@demo.local",
    href: "/intake",
    action: "Regardez un questionnaire client rempli.",
    notice:
      "Les réponses sont ce que le cabinet a noté au sujet du client. Orchelio les répète ; il ne les juge pas.",
  },
  {
    number: 7,
    title: "Lancer une analyse",
    account: "immigration.attorney@demo.local",
    href: "/ai",
    action: "Ouvrez l’onglet Analyse d’un dossier et lancez-en une.",
    notice:
      "Cela prend environ une seconde et ne coûte rien : le fournisseur est une simulation, et le résultat le dit.",
  },
  {
    number: 8,
    title: "Lire ce que l’analyse ne dit pas",
    account: "immigration.attorney@demo.local",
    href: "/ai",
    action: "Lisez le résultat attentivement, en cherchant une conclusion.",
    notice:
      "Il n’y en a aucune, et il n’y a pas non plus d’emplacement vide où elle irait. Une analyse n’a pas de champ pour une conclusion, une recommandation ou une appréciation d’éligibilité.",
  },
  {
    number: 9,
    title: "Une seconde lecture vérifie la première",
    account: "immigration.attorney@demo.local",
    href: "/ai",
    action: "Lisez la relecture sous l’analyse.",
    notice:
      "Elle indique si l’analyse est en état d’être lue par une personne — jamais si elle est juste. Elle ne peut rien valider.",
  },
  {
    number: 10,
    title: "Rien ne prend effet sans une personne",
    account: "immigration.attorney@demo.local",
    href: "/approvals",
    action: "Trouvez l’analyse qui attend une décision.",
    notice:
      "L’analyse existe mais n’est pas utilisable tant que personne n’a décidé. C’est la décision, pas l’analyse, qui change quoi que ce soit.",
  },
  {
    number: 11,
    title: "En refuser une, et dire pourquoi",
    account: "immigration.attorney@demo.local",
    href: "/approvals",
    action: "Refusez une demande. Orchelio exigera un motif écrit.",
    notice:
      "Un refus sans motif est une décision que personne ne peut vérifier. La note est obligatoire, et elle devient une tâche.",
  },
  {
    number: 12,
    title: "Un brouillon qui ne peut pas être envoyé",
    account: "immigration.attorney@demo.local",
    href: "/matters",
    action: "Préparez un courrier depuis l’onglet Courriers d’un dossier.",
    notice:
      "Il n’y a aucun bouton d’envoi nulle part dans Orchelio, et aucun statut « envoyé » dans la base. Valider un brouillon signifie qu’une personne accepte que ces mots quittent le cabinet ; c’est ensuite elle qui les envoie.",
  },
  {
    number: 13,
    title: "Les tâches",
    account: "immigration.paralegal@demo.local",
    href: "/tasks",
    action: "Regardez la liste des tâches.",
    notice: "Le refus de l’étape 11 est ici, sous forme de tâche pour qu’une personne agisse.",
  },
  {
    number: 14,
    title: "Le journal d’activité consigne aussi les refus",
    account: "immigration.attorney@demo.local",
    href: "/activity",
    action: "Lisez le journal, et cherchez une entrée dont l’issue n’est pas un succès.",
    notice:
      "Les connexions, les décisions, et chaque tentative refusée d’atteindre quelque chose. Un journal qui ne consigne que les succès consigne la mauvaise moitié.",
  },
  {
    number: 15,
    title: "Ce que cela aurait coûté",
    account: "immigration.attorney@demo.local",
    href: "/usage",
    action: "Lisez l’écran Consommation et coûts.",
    notice:
      "Qu’un chiffre soit un vrai débit est porté par l’enregistrement lui-même, non ajouté comme étiquette par l’écran. Cette démonstration fait tourner le fournisseur simulé : rien ici n’est facturé — et chaque ligne est étiquetée par ce qui l’a produite plutôt que par le réglage du jour, de sorte qu’un cabinet ayant plus tard installé un modèle sur sa propre machine verrait les deux sortes décrites correctement.",
  },
  {
    number: 16,
    title: "Désactiver une fonction d’IA",
    account: "immigration.attorney@demo.local",
    href: "/settings?section=ai",
    action: "Désactivez « Repérer les documents manquants », enregistrez, puis revenez au tableau de bord.",
    notice:
      "La carte qui en dépendait a disparu, elle n’affiche pas zéro. Un zéro se lirait comme « rien à faire », ce que personne n’a établi.",
  },
  {
    number: 17,
    title: "Neuf règles que vous ne pouvez pas désactiver",
    account: "immigration.attorney@demo.local",
    href: "/settings?section=approvals",
    action: "Essayez de désactiver une règle portant un cadenas.",
    notice:
      "Il n’y a aucun contrôle à désactiver. Ces neuf-là sont des propriétés de sûreté, pas des préférences : aucun dépôt automatique, aucune suppression définitive, aucune proposition transactionnelle, aucune échéance définitive sans une personne.",
  },
  {
    number: 18,
    title: "Le même code, un produit différent",
    account: "reviewer@demo.local",
    href: "/dashboard",
    action: "Connectez-vous comme lecteur — il appartient aux deux cabinets — et basculez vers le cabinet de droit du travail.",
    notice:
      "Des cartes différentes, des champs de dossier différents, un vocabulaire différent — « collecte des preuves » plutôt que « collecte des documents ». Un seul code ; c’est la configuration qui fait la différence.",
  },
  {
    number: 19,
    title: "Essayer d’atteindre le dossier de l’autre cabinet",
    account: "reviewer@demo.local",
    href: "/matters",
    action:
      "Copiez le lien d’un dossier depuis un cabinet, basculez vers l’autre, et collez-le dans la barre d’adresse.",
    notice:
      "Le refus est formulé exactement comme il le serait pour un dossier qui n’existe pas. Un refus qui dirait « interdit » confirmerait que l’enregistrement est réel.",
  },
  {
    number: 20,
    title: "Créer un troisième cabinet",
    account: "platform.admin@demo.local",
    href: "/admin/firms",
    action: "Connectez-vous comme administrateur de la plateforme et créez un cabinet.",
    notice:
      "L’administrateur peut voir que des cabinets existent et à quel point ils utilisent la plateforme — et ne peut ouvrir aucun de leurs dossiers.",
  },
  {
    number: 21,
    title: "Le configurer, et le voir devenir un produit différent",
    account: null,
    href: "/onboarding",
    action:
      "Connectez-vous comme administrateur du nouveau cabinet et répondez aux sept questions. Ouvrez ensuite son tableau de bord.",
    notice:
      "Un troisième cabinet existe désormais, avec ses propres écrans, son propre vocabulaire et ses propres règles. Aucun code n’a été modifié pour cela.",
  },
] as const;

/** Every account the walkthrough asks a reader to sign in as. */
export function guideAccounts(): readonly string[] {
  return [...new Set(GUIDE_STEPS.map((step) => step.account).filter((email): email is string => email !== null))];
}

/** True when every named account is one the demonstration actually seeds. */
export function guideAccountsExist(): boolean {
  const seeded = new Set(DEMO_ACCOUNTS.map((account) => account.email));
  return guideAccounts().every((email) => seeded.has(email));
}
