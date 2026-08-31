import fs from "fs"
import path from "path"
import multer from "multer"


// Définition du chemin de stockage : 
// Cette ligne définit le chemin du dossier où les fichiers téléchargés seront stockés.


const uploadDir = path.join('uploads');

// Création du dossier uploads : 
// Cette condition vérifie si le dossier uploads existe déjà. Si ce n'est pas le cas, il le crée en utilisant fs.mkdirSync()
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}


// Configuration de Multer pour le stockage : 
// Cette ligne commence la configuration de multer pour utiliser un stockage personnalisé.
const storage = multer.diskStorage({

    //Définition de la destination : Cette fonction détermine où le fichier téléchargé sera stocké. 
    //Elle appelle le callback cb avec null (pas d'erreur) et le chemin du dossier uploads
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname); // Obtenir l'extension du fichier

        // Générer un nom de fichier unique
        const baseName = path.basename(file.originalname, ext); // Nom de fichier sans extension
        
        // Générer 2 chiffres aléatoires
        let caractAlea = Math.floor(Math.random() * 200) + 2;
        const uniqueName = `${baseName}${caractAlea}${ext}`; // Générer un nom de fichier unique avec l'extension
        console.log(uniqueName);
        
        cb(null, uniqueName);
    },
    
    
});

const upload = multer({ storage });


  

export {upload }
