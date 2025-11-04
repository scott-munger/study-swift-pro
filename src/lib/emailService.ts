import { Resend } from 'resend';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY || '');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BASE_URL = process.env.FRONTEND_URL?.replace(/^http:\/\/localhost:\d+$/, 'https://tyala.online') || 'https://tyala.online';
const LOGO_URL = `${BASE_URL}/Asset%202Tyala%20copie.png`;

// Template d'email moderne et épuré
const getEmailTemplate = (content: string, unsubscribeUrl?: string) => {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <title>TYALA - Plateforme Éducative</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); overflow: hidden;">
          <!-- Header minimaliste avec Logo -->
          <tr>
            <td style="padding: 50px 40px 40px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); text-align: center;">
              <img src="${LOGO_URL}" alt="TYALA" width="140" height="auto" style="max-width: 140px; height: auto; display: block; margin: 0 auto; filter: brightness(1.1);" />
            </td>
          </tr>
          <!-- Contenu principal -->
          <tr>
            <td style="padding: 50px 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer épuré -->
          <tr>
            <td style="padding: 40px; background-color: #fafbfc; border-top: 1px solid #e8eaed; text-align: center;">
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #5f6368; font-weight: 500;">
                <strong style="color: #667eea;">TYALA</strong> - Excellence dans la préparation aux examens
              </p>
              <p style="margin: 0 0 20px 0; font-size: 13px; color: #80868b;">
                <a href="${BASE_URL}" style="color: #667eea; text-decoration: none; font-weight: 500;">tyala.online</a> | Haïti
              </p>
              ${unsubscribeUrl ? `
              <p style="margin: 0 0 20px 0; font-size: 12px;">
                <a href="${unsubscribeUrl}" style="color: #80868b; text-decoration: underline;">Se désabonner</a>
              </p>
              ` : `
              <p style="margin: 0 0 20px 0; font-size: 12px; color: #80868b; line-height: 1.5;">
                Cet email vous a été envoyé car vous avez un compte sur TYALA.<br>
                Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.
              </p>
              `}
              <p style="margin: 20px 0 0 0; font-size: 11px; color: #bdc1c6;">
                © ${new Date().getFullYear()} TYALA. Tous droits réservés.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

// Email de bienvenue pour les nouveaux inscrits
export async function sendWelcomeEmail(email: string, firstName: string) {
  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'mail@tyala.online';
    
    const emailContent = `
      <div style="color: #202124;">
        <div style="text-align: center; margin-bottom: 40px;">
          <div style="display: inline-block; width: 64px; height: 64px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; margin-bottom: 24px; display: flex; align-items: center; justify-content: center; font-size: 32px;">
            ✨
          </div>
        </div>
        <h1 style="color: #202124; margin: 0 0 16px 0; font-size: 28px; font-weight: 600; line-height: 1.3; text-align: center;">
          Bienvenue sur TYALA, ${firstName} !
        </h1>
        <p style="color: #5f6368; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0; text-align: center;">
          Nous sommes ravis de vous accueillir dans notre communauté éducative.
        </p>
        
        <div style="background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%); border-radius: 12px; padding: 32px; margin: 32px 0; border-left: 4px solid #667eea;">
          <h3 style="color: #202124; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">
            🎯 Découvrez ce que TYALA vous offre :
          </h3>
          <ul style="margin: 0; padding-left: 24px; color: #5f6368; font-size: 15px; line-height: 1.8;">
            <li style="margin-bottom: 12px;"><strong style="color: #667eea;">Flashcards intelligentes</strong> pour réviser efficacement</li>
            <li style="margin-bottom: 12px;"><strong style="color: #667eea;">Tests de connaissances</strong> pour évaluer votre niveau</li>
            <li style="margin-bottom: 12px;"><strong style="color: #667eea;">Tuteurs experts</strong> pour vous accompagner</li>
            <li style="margin-bottom: 12px;"><strong style="color: #667eea;">Forum communautaire</strong> pour échanger avec d'autres étudiants</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${BASE_URL}/login" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
            Commencer maintenant →
          </a>
        </div>
        
        <p style="color: #80868b; font-size: 14px; line-height: 1.6; margin: 32px 0 0 0; text-align: center;">
          Vous avez des questions ? Notre équipe est là pour vous aider à <a href="mailto:mail@tyala.online" style="color: #667eea; text-decoration: none; font-weight: 500;">mail@tyala.online</a>
        </p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Bienvenue sur TYALA ! 🎓',
      html: getEmailTemplate(emailContent),
      headers: {
        'X-Entity-Ref-ID': crypto.randomUUID(),
        'List-Unsubscribe': `<${BASE_URL}/unsubscribe?email=${encodeURIComponent(email)}>`,
      },
    });

    if (error) {
      console.error('Erreur Resend:', error);
      return { success: false, error };
    }

    console.log('Email de bienvenue envoyé:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de bienvenue:', error);
    return { success: false, error };
  }
}

export async function sendVerificationEmail(email: string, token: string, firstName: string) {
  try {
    const verificationUrl = `${FRONTEND_URL}/verify-email?token=${token}`;
    
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'mail@tyala.online';
    
    const emailContent = `
      <div style="color: #202124;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; width: 56px; height: 56px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; font-size: 28px;">
            ✉️
          </div>
        </div>
        <h1 style="color: #202124; margin: 0 0 16px 0; font-size: 26px; font-weight: 600; line-height: 1.3; text-align: center;">
          Vérifiez votre email
        </h1>
        <p style="color: #5f6368; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0; text-align: center;">
          Bonjour ${firstName}, merci de vous être inscrit sur TYALA.<br>
          Cliquez sur le bouton ci-dessous pour activer votre compte.
        </p>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${verificationUrl}" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
            Vérifier mon email →
          </a>
        </div>
        
        <div style="background-color: #fff9e6; border: 1px solid #ffe066; border-radius: 8px; padding: 16px; margin: 32px 0;">
          <p style="margin: 0; color: #856404; font-size: 13px; line-height: 1.6;">
            <strong>⏰ Important :</strong> Ce lien expire dans 24 heures. Si vous n'avez pas créé de compte, ignorez cet email.
          </p>
        </div>
        
        <p style="color: #80868b; font-size: 13px; line-height: 1.6; margin: 24px 0 0 0; text-align: center;">
          Le bouton ne fonctionne pas ? Copiez ce lien :<br>
          <a href="${verificationUrl}" style="color: #667eea; word-break: break-all; text-decoration: none;">${verificationUrl}</a>
        </p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Vérifiez votre email - TYALA',
      html: getEmailTemplate(emailContent),
      headers: {
        'X-Entity-Ref-ID': crypto.randomUUID(),
        'List-Unsubscribe': `<${BASE_URL}/unsubscribe?email=${encodeURIComponent(email)}>`,
      },
    });

    if (error) {
      console.error('Erreur Resend:', error);
      return { success: false, error };
    }

    console.log('Email de vérification envoyé:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de vérification:', error);
    return { success: false, error };
  }
}

export async function sendPasswordResetEmail(email: string, token: string, firstName: string) {
  try {
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;
    
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'mail@tyala.online';
    
    const emailContent = `
      <div style="color: #202124;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; width: 56px; height: 56px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 12px; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; font-size: 28px;">
            🔒
          </div>
        </div>
        <h1 style="color: #202124; margin: 0 0 16px 0; font-size: 26px; font-weight: 600; line-height: 1.3; text-align: center;">
          Réinitialisation de mot de passe
        </h1>
        <p style="color: #5f6368; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0; text-align: center;">
          Bonjour ${firstName}, vous avez demandé à réinitialiser votre mot de passe.<br>
          Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe.
        </p>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${resetUrl}" 
             style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(245, 87, 108, 0.4);">
            Réinitialiser mon mot de passe →
          </a>
        </div>
        
        <div style="background-color: #ffebee; border: 1px solid #ffcdd2; border-radius: 8px; padding: 16px; margin: 32px 0;">
          <p style="margin: 0; color: #c62828; font-size: 13px; line-height: 1.6;">
            <strong>⏰ Important :</strong> Ce lien expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. Votre mot de passe ne sera pas modifié.
          </p>
        </div>
        
        <p style="color: #80868b; font-size: 13px; line-height: 1.6; margin: 24px 0 0 0; text-align: center;">
          Le bouton ne fonctionne pas ? Copiez ce lien :<br>
          <a href="${resetUrl}" style="color: #f5576c; word-break: break-all; text-decoration: none;">${resetUrl}</a>
        </p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Réinitialisation de mot de passe - TYALA',
      html: getEmailTemplate(emailContent),
      headers: {
        'X-Entity-Ref-ID': crypto.randomUUID(),
        'List-Unsubscribe': `<${BASE_URL}/unsubscribe?email=${encodeURIComponent(email)}>`,
      },
    });

    if (error) {
      console.error('Erreur Resend:', error);
      return { success: false, error };
    }

    console.log('Email de réinitialisation envoyé:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de réinitialisation:', error);
    return { success: false, error };
  }
}

export async function sendSupportEmail(userEmail: string, userName: string, subject: string, message: string) {
  try {
    // Toujours envoyer à mail@tyala.online
    const supportEmail = 'mail@tyala.online';
    
    // Utiliser mail@tyala.online pour l'adresse "from" une fois le domaine vérifié
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'mail@tyala.online';
    
    console.log(`📧 Envoi email support: De ${userEmail} vers ${supportEmail} via ${fromEmail}`);
    
    const emailContent = `
      <div style="color: #333;">
        <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Nouveau message de support</h2>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #667eea;">
          <p style="margin: 0 0 10px 0; color: #555;"><strong>De :</strong> ${userName} (${userEmail})</p>
          <p style="margin: 0 0 10px 0; color: #555;"><strong>Sujet :</strong> ${subject}</p>
          <p style="margin: 0; color: #555;"><strong>Date :</strong> ${new Date().toLocaleString('fr-FR', { timeZone: 'America/Port-au-Prince' })}</p>
        </div>
        <div style="background-color: #ffffff; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px;">
          <p style="white-space: pre-wrap; line-height: 1.8; color: #333; margin: 0;">${message.replace(/\n/g, '<br>')}</p>
        </div>
        <div style="background-color: #e7f3ff; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="color: #004085; font-size: 13px; margin: 0; line-height: 1.6;">
            <strong>💡 Pour répondre :</strong> Cliquez sur "Répondre" dans votre client email. 
            L'email de réponse sera automatiquement envoyé à <strong>${userEmail}</strong>
          </p>
        </div>
        <p style="margin-top: 20px; color: #6c757d; font-size: 12px; font-style: italic;">
          Ce message a été envoyé depuis le chatbot TYALA.
        </p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: supportEmail,
      replyTo: userEmail,
      subject: `[Support TYALA] ${subject}`,
      html: getEmailTemplate(emailContent),
      headers: {
        'X-Entity-Ref-ID': crypto.randomUUID(),
      },
    });

    if (error) {
      console.error('❌ Erreur Resend:', error);
      return { success: false, error };
    }

    console.log('✅ Email de support envoyé avec succès:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email de support:', error);
    return { success: false, error };
  }
}

