import { z } from "zod"

// ─── Champs réutilisables ──────────────────────────────────────────────────────
const tel = z
  .string()
  .regex(/^\+?[\d\s\-().]{8,15}$/, "Numéro de téléphone invalide (8 à 15 chiffres)")
  .optional()
  .or(z.literal(""))

const email = z
  .string()
  .email("Adresse email invalide")
  .optional()
  .or(z.literal(""))

const nom = z
  .string()
  .min(3, "Le nom est obligatoire")
  .max(100, "Le nom ne doit pas dépasser 100 caractères")

const prenom = z
  .string()
  .max(100, "Le prénom ne doit pas dépasser 100 caractères")
  .optional()
  .or(z.literal(""))

const adresse = z
  .string()
  .min(3, "L'adresse est obligatoire")
  .max(255, "L'adresse ne doit pas dépasser 255 caractères")

// ─── Client ────────────────────────────────────────────────────────────────────
export const clientSchema = z.object({ nom, prenom, email, tel, adresse })
export type ClientFormValues = z.infer<typeof clientSchema>

// ─── Fournisseur ───────────────────────────────────────────────────────────────
export const fournisseurSchema = z.object({ nom, prenom, email, tel, adresse })
export type FournisseurFormValues = z.infer<typeof fournisseurSchema>

// ─── Employé ───────────────────────────────────────────────────────────────────
export const employeSchema = z
  .object({
    nom,
    prenom,
    email,
    tel,
    adresse,
    password: z
      .string()
      .optional()
      .refine((v) => !v || v.length >= 6, {
        message: "Le mot de passe doit contenir au moins 6 caractères",
      }),
    roleId: z.string().optional(),
    salaire: z.coerce
      .number({ invalid_type_error: "Le salaire est obligatoire" })
      .positive("Le salaire doit être supérieur à 0"),
    dateEmbauche: z.string().min(1, "La date d'embauche est obligatoire"),
  })
  .refine((d) => (d.email && d.email !== "") || (d.tel && d.tel !== ""), {
    message: "Un email ou un numéro de téléphone est requis",
    path: ["tel"],
  })
export type EmployeFormValues = z.infer<typeof employeSchema>

// ─── Produit ───────────────────────────────────────────────────────────────────
export const produitSchema = z.object({
  libelle: z
    .string()
    .min(1, "Le nom est obligatoire")
    .max(200, "Le nom ne doit pas dépasser 200 caractères"),
  description: z
    .string()
    .max(1000, "La description ne doit pas dépasser 1000 caractères")
    .optional()
    .or(z.literal("")),
  prixDeVenteUnitaire: z.coerce
    .number({ invalid_type_error: "Le prix est obligatoire" })
    .min(0, "Le prix doit être positif ou nul"),
  seuilAlerteMagasin: z.coerce
    .number()
    .min(0, "Le seuil doit être positif ou nul")
    .optional(),
  seuilAlerteBoutique: z.coerce
    .number()
    .min(0, "Le seuil doit être positif ou nul")
    .optional(),
})
export type ProduitFormValues = z.infer<typeof produitSchema>

// ─── Matière Première ──────────────────────────────────────────────────────────
export const matierePremiereSchema = z.object({
  nom: z
    .string()
    .min(3, "Le nom est obligatoire")
    .max(200, "Le nom ne doit pas dépasser 200 caractères"),
  categorie: z
    .string()
    .max(100, "La catégorie ne doit pas dépasser 100 caractères")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .max(1000, "La description ne doit pas dépasser 1000 caractères")
    .optional()
    .or(z.literal("")),
  unite: z.string().min(1, "L'unité est requise"),
})
export type MatierePremiereFormValues = z.infer<typeof matierePremiereSchema>

// ─── Production ────────────────────────────────────────────────────────────────
export const productionSchema = z.object({
  produitId: z.string().min(3, "Le produit est obligatoire"),
  quantiteFabriquee: z.coerce
    .number({ invalid_type_error: "La quantité est obligatoire" })
    .int("La quantité doit être un entier")
    .positive("La quantité doit être supérieure à 0"),
  employeId: z.string().min(1, "L'employé responsable est obligatoire"),
  dateProduction: z.string().min(1, "La date de production est obligatoire"),
  lot: z
    .string()
    .max(100, "Le numéro de lot ne doit pas dépasser 100 caractères")
    .optional()
    .or(z.literal("")),
})
export type ProductionFormValues = z.infer<typeof productionSchema>

// ─── Ligne Commande ────────────────────────────────────────────────────────────
export const ligneCommandeSchema = z.object({
  produitId: z.number().positive(),
  quantite: z.coerce.number().int().positive("La quantité doit être supérieure à 0"),
  prixUnitaire: z.number().positive(),
  reduction: z.coerce.number().min(0, "La réduction doit être positive ou nulle"),
})

// ─── Commande (Vente) ──────────────────────────────────────────────────────────
export const commandeSchema = z.object({
  dateCommande: z.string().min(1, "La date est obligatoire"),
  clientId: z.coerce
    .number({ invalid_type_error: "Le client est obligatoire" })
    .positive("Le client est obligatoire"),
  reductionGlobale: z.coerce.number().min(0, "La réduction doit être positive ou nulle"),
  lignes: z.array(ligneCommandeSchema).min(1, "Au moins un produit est requis"),
})
export type CommandeFormValues = z.infer<typeof commandeSchema>

// ─── Ligne Approvisionnement ───────────────────────────────────────────────────
export const ligneApprovisionnementSchema = z.object({
  produitId: z.coerce.number().positive("Le produit est obligatoire"),
  quantite: z.coerce.number().int().positive("La quantité doit être supérieure à 0"),
  prixUnitaire: z.coerce.number().positive("Le prix unitaire doit être supérieur à 0"),
  montant: z.coerce.number(),
  dateFabrication: z.string().optional().or(z.literal("")),
  datePeremption: z.string().optional().or(z.literal("")),
})

// ─── Approvisionnement ────────────────────────────────────────────────────────
// lignes est géré par useState dans le formulaire, pas par react-hook-form
export const approvisionnementSchema = z.object({
  fournisseurId: z.coerce
    .number({ invalid_type_error: "Le fournisseur est obligatoire" })
    .positive("Le fournisseur est obligatoire"),
})
export type ApprovisionnementFormValues = z.infer<typeof approvisionnementSchema>

// ─── Absence ──────────────────────────────────────────────────────────────────
export const absenceSchema = z.object({
  employeId: z.coerce.number({ invalid_type_error: "L'employé est obligatoire" }).positive("L'employé est obligatoire"),
  date: z.string().min(1, "La date est obligatoire"),
  motif: z.string().max(500, "Le motif ne doit pas dépasser 500 caractères").optional().or(z.literal("")),
})
export type AbsenceFormValues = z.infer<typeof absenceSchema>

// ─── Congé ────────────────────────────────────────────────────────────────────
export const congeSchema = z.object({
  employeId: z.coerce.number({ invalid_type_error: "L'employé est obligatoire" }).positive("L'employé est obligatoire").optional(),
  dateDebut: z.string().min(1, "La date de début est obligatoire"),
  dateFin: z.string().min(1, "La date de fin est obligatoire"),
  type: z.string().min(1, "Le type de congé est obligatoire"),
  description: z.string().min(1, "La description est obligatoire").max(1000, "La description ne doit pas dépasser 1000 caractères"),
}).refine((d) => new Date(d.dateDebut) <= new Date(d.dateFin), {
  message: "La date de début doit être antérieure ou égale à la date de fin",
  path: ["dateFin"],
})
export type CongeFormValues = z.infer<typeof congeSchema>

// ─── Paiement Salaire ─────────────────────────────────────────────────────────
export const paiementSalaireSchema = z.object({
  employeId: z.coerce.number({ invalid_type_error: "L'employé est obligatoire" }).positive("L'employé est obligatoire"),
  salaireBase: z.coerce.number({ invalid_type_error: "Le salaire de base est obligatoire" }).positive("Le salaire de base doit être supérieur à 0"),
  avantage: z.coerce.number().min(0, "Les avantages doivent être positifs ou nuls").default(0),
  indemnite: z.coerce.number().min(0, "Les indemnités doivent être positives ou nulles").default(0),
  mois: z.coerce.number().int().min(1, "Le mois doit être entre 1 et 12").max(12, "Le mois doit être entre 1 et 12"),
  annee: z.coerce.number().int().min(2020, "L'année doit être supérieure à 2020").max(2100, "L'année invalide"),
  modePaiement: z.enum(["ESPECES", "VIREMENT", "MOBILE_MONEY"], { errorMap: () => ({ message: "Mode de paiement invalide" }) }),
})
export type PaiementSalaireFormValues = z.infer<typeof paiementSalaireSchema>

// ─── Ligne Approvisionnement Matière Première ──────────────────────────────────
export const ligneApproMatiereSchema = z.object({
  matierePremiereId: z.coerce.number().positive("La matière première est obligatoire"),
  quantite: z.coerce.number().positive("La quantité doit être supérieure à 0"),
  montant: z.coerce.number(),
})

// ─── Approvisionnement Matière Première ───────────────────────────────────────
// lignes est géré par useState dans le formulaire, pas par react-hook-form
export const approvisionnementMatiereSchema = z.object({
  fournisseurId: z.coerce
    .number({ invalid_type_error: "Le fournisseur est obligatoire" })
    .positive("Le fournisseur est obligatoire"),
})
export type ApprovisionnementMatiereFormValues = z.infer<typeof approvisionnementMatiereSchema>
