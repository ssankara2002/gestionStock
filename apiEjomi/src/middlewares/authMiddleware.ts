import jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'votre_clé_secrète';

const prisma = new PrismaClient();

// Étend l'objet Request pour inclure un utilisateur typé
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    email: string;
    roleId?: number;
    roleName?: string;
    role?: string;
    entrepriseId?: number;
  };
}

const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.split(' ')[1];

  console.log("Auth header:", authHeader);
  console.log("Token extrait:", token ? token.substring(0, 20) + "..." : "null");

  if (!token) {
    console.log("Token manquant - 401");
    res.status(401).json({ message: 'Accès non autorisé : token manquant.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    console.log("Token décodé avec succès:", decoded);

    // Accepter soit userId soit id dans le token
    const userId = decoded.userId || decoded.id;

    if (typeof decoded === 'object' && userId) {
      // Récupérer l'utilisateur depuis la base de données pour vérifier son statut actuel
      const userFromDb = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true }
      });

      if (!userFromDb) {
        console.log("Utilisateur non trouvé dans la BD pour userId:", userId);
        res.status(403).json({ message: 'Accès refusé : Utilisateur du token non trouvé.' });
        return;
      }

      console.log("User from DB:", { id: userFromDb.id, email: userFromDb.email, roleId: userFromDb.roleId, role: userFromDb.role });

      // entrepriseId vient du JWT (choix de l'utilisateur à la connexion),
      // pas de la BD (qui stocke l'entreprise principale uniquement).
      req.user = {
        userId: userFromDb.id,
        email: userFromDb.email || '',
        roleId: userFromDb.roleId || undefined,
        roleName: userFromDb.role?.name,
        role: userFromDb.role?.name,
        entrepriseId: (decoded.entrepriseId as number | undefined) ?? userFromDb.entrepriseId ?? undefined,
      };
      console.log("req.user défini:", req.user);
      next();
    } else {
      res.status(401).json({ message: 'Token invalide : contenu incorrect' });
    }
  } catch (err: any) {
    console.error("Erreur de vérification du token:", err.message);
    res.status(401).json({ message: 'Token invalide ou expiré', error: err.message });
  }
};

export default authenticateToken;