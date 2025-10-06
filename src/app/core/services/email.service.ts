import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  variables: string[];
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class EmailService {

  constructor(private supabase: SupabaseService) {}

  /**
   * Envoyer un email (nécessite un service backend comme SendGrid, Mailgun, etc.)
   * Cette fonction prépare les données pour l'envoi
   */
  async sendEmail(
    to: string,
    templateName: string,
    variables: { [key: string]: any }
  ): Promise<boolean> {
    try {
      // Récupérer le template
      const template = await this.getTemplate(templateName);
      if (!template || !template.isActive) {
        console.error(`Template "${templateName}" not found or inactive`);
        return false;
      }

      // Remplacer les variables dans le template
      let subject = template.subject;
      let bodyHtml = template.bodyHtml;
      let bodyText = template.bodyText || '';

      for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{{${key}}}`;
        subject = subject.replace(new RegExp(placeholder, 'g'), value);
        bodyHtml = bodyHtml.replace(new RegExp(placeholder, 'g'), value);
        bodyText = bodyText.replace(new RegExp(placeholder, 'g'), value);
      }

      // TODO: En production, utiliser un service email réel
      // Par exemple avec Supabase Edge Functions:
      /*
      const { data, error } = await this.supabase.client.functions.invoke('send-email', {
        body: { to, subject, bodyHtml, bodyText }
      });
      */

      console.log('📧 Email simulé:', { to, subject, templateName });
      console.log('📧 Contenu:', bodyHtml.substring(0, 200) + '...');

      // Simulation d'envoi réussi
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Envoyer email de confirmation de commande
   */
  async sendOrderConfirmation(
    userEmail: string,
    orderNumber: string,
    totalAmount: number,
    items: any[]
  ): Promise<boolean> {
    return await this.sendEmail(userEmail, 'order_confirmation', {
      order_number: orderNumber,
      total: `${totalAmount.toFixed(0)} FCFA`, // Format FCFA sans décimales
      items: items.map(item => `${item.quantity}x ${item.name}`).join(', ')
    });
  }

  /**
   * Envoyer email de notification d'expédition
   */
  async sendShippingNotification(
    userEmail: string,
    orderNumber: string,
    trackingNumber: string
  ): Promise<boolean> {
    return await this.sendEmail(userEmail, 'shipping_notification', {
      order_number: orderNumber,
      tracking_number: trackingNumber
    });
  }

  /**
   * Envoyer email de réinitialisation de mot de passe
   */
  async sendPasswordReset(userEmail: string, resetLink: string): Promise<boolean> {
    return await this.sendEmail(userEmail, 'password_reset', {
      reset_link: resetLink
    });
  }

  /**
   * Récupérer un template email
   */
  private async getTemplate(name: string): Promise<EmailTemplate | null> {
    try {
      const { data, error } = await this.supabase.client
        .from('email_templates')
        .select('*')
        .eq('name', name)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching email template:', error);
        return null;
      }

      return data ? this.mapTemplate(data) : null;
    } catch (error) {
      console.error('Error fetching email template:', error);
      return null;
    }
  }

  /**
   * Mapper les données Supabase vers le modèle EmailTemplate
   */
  private mapTemplate(data: any): EmailTemplate {
    return {
      id: data.id,
      name: data.name,
      subject: data.subject,
      bodyHtml: data.body_html,
      bodyText: data.body_text,
      variables: data.variables || [],
      isActive: data.is_active
    };
  }
}

