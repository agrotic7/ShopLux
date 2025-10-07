import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { CartService } from './cart.service';
import { Order, OrderStatus } from '../models/order.model';
import { Address } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private ordersSubject = new BehaviorSubject<Order[]>([]);
  public orders$ = this.ordersSubject.asObservable();

  constructor(
    private supabase: SupabaseService,
    private authService: AuthService,
    private cartService: CartService
  ) {}

  async createOrder(
    shippingAddress: Address,
    billingAddress: Address,
    paymentMethod: string,
    notes?: string
  ): Promise<{ success: boolean; orderId?: string; error?: string }> {
    try {
      const user = this.authService.currentUser;
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const cart = this.cartService.cart;
      if (cart.items.length === 0) {
        return { success: false, error: 'Cart is empty' };
      }

      // Vérifier le rate limit (max 5 commandes par minute)
      const { data: rateLimitOk, error: rateLimitError } = await this.supabase.client
        .rpc('check_order_rate_limit', { p_user_id: user.id });

      if (rateLimitError || !rateLimitOk) {
        return { success: false, error: 'Trop de tentatives. Veuillez patienter.' };
      }

      const orderNumber = this.generateOrderNumber();

      const orderData = {
        order_number: orderNumber,
        user_id: user.id,
        items: cart.items.map(item => ({
          product_id: item.productId,
          product_name: item.product.name,
          product_image: item.product.image,
          price: item.price,
          quantity: item.quantity,
          selected_variant: item.selectedVariant
        })),
        subtotal: cart.subtotal,
        discount: cart.discount,
        tax: cart.tax,
        shipping: cart.shipping,
        total: cart.total,
        status: 'pending',
        payment_status: 'pending',
        payment_method: paymentMethod,
        shipping_address: shippingAddress,
        billing_address: billingAddress,
        notes: notes
      };

      // Utiliser la fonction SQL sécurisée avec vérification atomique du stock
      const { data: result, error } = await this.supabase.client
        .rpc('create_order_with_stock_check', { p_order_data: orderData });

      if (error) {
        return { success: false, error: error.message };
      }

      // Vérifier le résultat
      if (!result || !result.success) {
        const errorMsg = result?.error || 'Erreur lors de la création';
        
        // Message spécifique pour stock insuffisant
        if (errorMsg.includes('Stock insuffisant')) {
          return { 
            success: false, 
            error: 'Un ou plusieurs produits ne sont plus disponibles en quantité suffisante.' 
          };
        }
        
        return { success: false, error: errorMsg };
      }

      // Clear cart after successful order
      await this.cartService.clearCart();

      return { success: true, orderId: result.order_id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getOrders(): Promise<Order[]> {
    const user = this.authService.currentUser;
    if (!user) return [];

    const { data, error } = await this.supabase.client
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const orders = (data || []).map(this.mapOrder);
    this.ordersSubject.next(orders);
    return orders;
  }

  async getOrderById(orderId: string): Promise<Order | null> {
    const { data, error } = await this.supabase.client
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error) throw error;
    return data ? this.mapOrder(data) : null;
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    const { data, error } = await this.supabase.client
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .single();

    if (error) throw error;
    return data ? this.mapOrder(data) : null;
  }

  async updateOrderStatus(orderId: string, status: OrderStatus) {
    const { data, error } = await this.supabase.client
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private mapOrder(data: any): Order {
    return {
      id: data.id,
      orderNumber: data.order_number,
      userId: data.user_id,
      items: (data.items || []).map((item: any) => ({
        id: item.id || '',
        productId: item.product_id,
        productName: item.product_name,
        productImage: item.product_image,
        price: item.price,
        quantity: item.quantity,
        selectedVariant: item.selected_variant
      })),
      subtotal: data.subtotal,
      discount: data.discount,
      tax: data.tax,
      shipping: data.shipping,
      total: data.total,
      status: data.status,
      paymentStatus: data.payment_status,
      paymentMethod: data.payment_method,
      shippingAddress: data.shipping_address,
      billingAddress: data.billing_address,
      trackingNumber: data.tracking_number,
      notes: data.notes,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  private generateOrderNumber(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `SL${year}${month}${day}${random}`;
  }
}

