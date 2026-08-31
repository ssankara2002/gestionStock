import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { 
  createProduit, 
  getAllProduits, 
  getProduitById, 
  updateProduit, 
  deleteProduit 
} from '../Controllers/produit.controller';
import { checkPermission } from '../middlewares/permissionMiddleware'; // Assurez-vous que le chemin est correct

const router = Router();

// 1. Configuration du stockage pour Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Le dossier où les images seront sauvegardées.
    // Assurez-vous que ce dossier 'uploads' existe à la racine de votre projet API.
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Crée un nom de fichier unique pour éviter les conflits
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// 2. Initialisation de Multer avec la configuration de stockage
const upload = multer({ storage: storage });

// 3. Définition des routes
// La route GET pour tous les produits
router.get('/', getAllProduits);

// La route POST pour créer un produit. `upload.single('image')` est le middleware clé.
// Il doit être placé avant le contrôleur `createProduit`.
router.post('/', checkPermission('produit.create'), upload.single('image'), createProduit);

router.get('/:id', getProduitById);
router.put('/:id', checkPermission('produit.update'), upload.single('image'), updateProduit);
router.delete('/:id', checkPermission('produit.delete'), deleteProduit);

export default router;