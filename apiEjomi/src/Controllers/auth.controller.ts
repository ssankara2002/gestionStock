import { Request, Response } from 'express';
import authService from '../Services/auth.service';


export const loginController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Vérification des champs requis
    if (!email || !password) {
      res.status(400).json({ error: 'Email et mot de passe sont requis' });
      return;
    }

    const { token, user } = await authService.login(email, password);

    if (!token || !user) {
      res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    } else {
      // Définir le token dans un cookie HttpOnly sécurisé
      res.cookie('auth_token', token, {
        httpOnly: false, // Permettre l'accès via JavaScript côté client pour localStorage
        secure: process.env.NODE_ENV === 'production', // Utiliser HTTPS en production
        sameSite: 'lax', // Protection contre les attaques CSRF
        maxAge: 24 * 60 * 60 * 1000, // 24 heures
      });
      res.status(200).json({ user, token }); // Renvoyer aussi le token pour localStorage
    }
  } catch (error: any) {
    console.log("Erreur dans loginController:", error);

    // Gestion spécifique des erreurs d'authentification
    if (error.message === 'Email ou mot de passe incorrect') {
      res.status(401).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erreur interne du serveur', details: error.message });
    }
  }
};

/**
 * Controller pour l'inscription d'un nouvel utilisateur
 * @param req - La requête HTTP
 * @param res - La réponse HTTP
 */
export const forgotPasswordController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) { res.status(400).json({ message: 'Email requis' }); return; }
    await authService.forgotPassword(email);
    res.status(200).json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
  } catch (error: any) {
    res.status(500).json({ message: 'Erreur lors de l\'envoi du lien', details: error.message });
  }
};

export const resetPasswordController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) { res.status(400).json({ message: 'Token et nouveau mot de passe requis' }); return; }
    await authService.resetPassword(token, newPassword);
    res.status(200).json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (error: any) {
    const status = error.message.includes('invalide ou expiré') ? 400 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const registerEntrepriseController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { entreprise, admin } = req.body;
    if (!entreprise || !admin) {
      res.status(400).json({ message: 'Données entreprise et admin requises' });
      return;
    }
    const result = await authService.registerEntreprise(entreprise, admin);
    res.cookie('auth_token', result.token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.status(201).json({ user: result.user, token: result.token });
  } catch (error: any) {
    const status = error.message.includes('existe déjà') ? 409 : 400;
    res.status(status).json({ message: error.message });
  }
};

export const registerController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, nom, prenom, adresse, tel, role } = req.body;
    console.log("registerController appelé avec:", req.body);

    // Vérification des champs requis
    if (!email || !password || !nom || !prenom) {
      res.status(400).json({ message: 'Email, mot de passe, nom et prénom sont requis.' });
      return;
    }

    // Appel au service pour créer un utilisateur
    await authService.register({ email, password, nom, prenom, adresse, tel, role });

    // Auto-connexion après inscription pour générer le token et le cookie
    const loginResult = await authService.login(email, password);

    // Définir le token dans un cookie HttpOnly sécurisé
    res.cookie('auth_token', loginResult.token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 heures
    });

    res.status(201).json({
      user: loginResult.user,
      token: loginResult.token,
    });
  } catch (error: any) {
    console.error("Erreur dans registerController:", error);

    // Gestion spécifique des erreurs de validation
    if (error.message.includes('email existe déjà') ||
        error.message.includes('email valide') ||
        error.message.includes('mot de passe') ||
        error.message.includes('nom doit contenir') ||
        error.message.includes('prénom doit contenir') ||
        error.message.includes('téléphone valide') ||
        error.message.includes('champs nom et prenom')) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Erreur interne du serveur lors de l\'enregistrement.', details: error.message });
    }
  }
};
