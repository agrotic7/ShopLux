import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export interface ProductView {
  id: string;
  productId: string;
  userId?: string;
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  viewedAt: Date;
}

export interface AbandonedCart {
  id: string;
  userId?: string;
  email?: string;
  cartData: any;
  totalAmount: number;
  reminderSent: boolean;
  reminderSentAt?: Date;
  convertedToOrderId?: string;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private sessionId: string;

  constructor(
    private supabase: SupabaseService,
    private authService: AuthService
  ) {
    // Générer un ID de session unique
    this.sessionId = this.generateSessionId();
  }

  /**
   * Tracker une vue de produit
   */
  async trackProductView(productId: string, referrer?: string): Promise<void> {
    try {
      const user = this.supabase.currentUser;
      
      const { error } = await this.supabase.client
        .from('product_views')
        .insert({
          product_id: productId,
          user_id: user?.id || null,
          session_id: this.sessionId,
          user_agent: navigator.userAgent,
          referrer: referrer || document.referrer,
          viewed_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error tracking product view:', error);
      }
    } catch (error) {
      console.error('Error tracking product view:', error);
    }
  }

  /**
   * Sauvegarder un panier abandonné
   */
  async saveAbandonedCart(
    cartData: any,
    totalAmount: number,
    email?: string
  ): Promise<boolean> {
    try {
      const user = this.supabase.currentUser;
      
      const { error } = await this.supabase.client
        .from('abandoned_carts')
        .insert({
          user_id: user?.id || null,
          email: email || user?.email || null,
          cart_data: cartData,
          total_amount: totalAmount,
          reminder_sent: false
        });

      if (error) {
        console.error('Error saving abandoned cart:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error saving abandoned cart:', error);
      return false;
    }
  }

  /**
   * Récupérer les statistiques de vues de produits (admin)
   */
  async getProductViewsStats(productId?: string, days: number = 30): Promise<any> {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      let query = this.supabase.client
        .from('product_views')
        .select('*')
        .gte('viewed_at', since.toISOString());

      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching product views:', error);
        return null;
      }

      // Compter les vues par produit
      const viewsByProduct: { [key: string]: number } = {};
      const uniqueVisitors = new Set<string>();

      data?.forEach(view => {
        viewsByProduct[view.product_id] = (viewsByProduct[view.product_id] || 0) + 1;
        if (view.user_id) {
          uniqueVisitors.add(view.user_id);
        } else {
          uniqueVisitors.add(view.session_id);
        }
      });

      return {
        totalViews: data?.length || 0,
        uniqueVisitors: uniqueVisitors.size,
        viewsByProduct,
        rawData: data
      };
    } catch (error) {
      console.error('Error fetching product views stats:', error);
      return null;
    }
  }

  /**
   * Récupérer les paniers abandonnés (admin)
   */
  async getAbandonedCarts(
    includeConverted: boolean = false
  ): Promise<AbandonedCart[]> {
    try {
      let query = this.supabase.client
        .from('abandoned_carts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!includeConverted) {
        query = query.is('converted_to_order_id', null);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching abandoned carts:', error);
        return [];
      }

      return data ? data.map(c => this.mapAbandonedCart(c)) : [];
    } catch (error) {
      console.error('Error fetching abandoned carts:', error);
      return [];
    }
  }

  /**
   * Marquer un panier comme converti
   */
  async markCartAsConverted(cartId: string, orderId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.client
        .from('abandoned_carts')
        .update({
          converted_to_order_id: orderId
        })
        .eq('id', cartId);

      if (error) {
        console.error('Error marking cart as converted:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error marking cart as converted:', error);
      return false;
    }
  }

  /**
   * Récupérer les produits les plus vus
   */
  async getMostViewedProducts(limit: number = 10, days: number = 30): Promise<any[]> {
    try {
      const stats = await this.getProductViewsStats(undefined, days);
      
      if (!stats) return [];

      // Trier par nombre de vues
      const sorted = Object.entries(stats.viewsByProduct)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, limit);

      return sorted.map(([productId, views]) => ({
        productId,
        views
      }));
    } catch (error) {
      console.error('Error getting most viewed products:', error);
      return [];
    }
  }

  /**
   * Générer un ID de session unique
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Mapper les données Supabase vers le modèle AbandonedCart
   */
  private mapAbandonedCart(data: any): AbandonedCart {
    return {
      id: data.id,
      userId: data.user_id,
      email: data.email,
      cartData: data.cart_data,
      totalAmount: parseFloat(data.total_amount),
      reminderSent: data.reminder_sent,
      reminderSentAt: data.reminder_sent_at ? new Date(data.reminder_sent_at) : undefined,
      convertedToOrderId: data.converted_to_order_id,
      createdAt: new Date(data.created_at)
    };
  }
}

