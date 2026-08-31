import { Resend } from 'resend';

let resend: Resend | null = null;

const getResendClient = () => {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
};

export const sendPasswordResetEmail = async (email: string, resetToken: string, name: string) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
  const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #b8960c; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background-color: white; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd; }
        .button { display: inline-block; padding: 12px 30px; background-color: #b8960c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 20px 0; }
        .footer { margin-top: 20px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header"><h1>Réinitialisation du mot de passe</h1></div>
      <div class="content">
        <p>Bonjour ${name},</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
        <div style="text-align: center;">
          <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
        </div>
        <p>Ou copiez ce lien dans votre navigateur :</p>
        <p style="word-break: break-all; color: #b8960c;">${resetUrl}</p>
        <div class="warning">
          <strong>⚠️ Important :</strong> Ce lien est valide pendant 1 heure seulement.
        </div>
        <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
        <p>Cordialement,<br>L'équipe EJOMI</p>
      </div>
      <div class="footer"><p>&copy; ${new Date().getFullYear()} EJOMI. Tous droits réservés.</p></div>
    </body>
    </html>
  `;

  const client = getResendClient();
  if (!client) {
    console.warn('⚠️ RESEND_API_KEY manquante. Email non envoyé. Lien de reset:', resetUrl);
    return;
  }

  const { error } = await client.emails.send({
    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
    to: [email],
    subject: 'Réinitialisation de votre mot de passe - EJOMI',
    html,
  });

  if (error) throw new Error(`Échec envoi email: ${error.message}`);
};
