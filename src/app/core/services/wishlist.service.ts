import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { Product } from '../models/product.model';

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  product?: Product;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private wishlistSubject = new BehaviorSubject<WishlistItem[]>([]);
  public wishlist$ = this.wishlistSubject.asObservable();

  constructor(private supabase: SupabaseService) {
    this.loadWishlist();
  }

  private async loadWishlist(): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('wishlists')
      .select(`
        *,
        product:products(*)
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const wishlistItems: WishlistItem[] = data.map((item: any) => ({
        id: item.id,
        userId: item.user_id,
        productId: item.product_id,
        product: item.product ? {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          description: item.product.description,
          shortDescription: item.product.short_description,
          price: item.product.price,
          compareAtPrice: item.product.compare_at_price,
          sku: item.product.sku,
          stock: item.product.stock,
          categoryId: item.product.category_id,
          images: item.product.images || [],
          isFeatured: item.product.is_featured,
          isNewArrival: item.product.is_new_arrival || false,
          isBestSeller: item.product.is_best_seller || false,
          status: item.product.status || 'active',
          rating: item.product.average_rating || 0,
          reviewCount: item.product.review_count || 0,
          createdAt: new Date(item.product.created_at),
          updatedAt: new Date(item.product.updated_at)
        } : undefined,
        createdAt: new Date(item.created_at)
      }));
      this.wishlistSubject.next(wishlistItems);
    }
  }

  async getWishlist(): Promise<WishlistItem[]> {
    await this.loadWishlist();
    return this.wishlistSubject.value;
  }

  async addToWishlist(productId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = this.supabase.currentUser;
      if (!user) {
        return { success: false, error: 'Utilisateur non connecté' };
      }

      // Vérifier si le produit est déjà dans la wishlist
      const { data: existing, error: checkError } = await this.supabase.client
        .from('wishlists')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .maybeSingle();

      if (existing) {
        return { success: false, error: 'Produit déjà dans la wishlist' };
      }

      const { error } = await this.supabase.client
        .from('wishlists')
        .insert([
          {
            user_id: user.id,
            product_id: productId
          }
        ]);

      if (error) throw error;

      await this.loadWishlist();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async removeFromWishlist(productId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = this.supabase.currentUser;
      if (!user) {
        return { success: false, error: 'Utilisateur non connecté' };
      }

      const { error } = await this.supabase.client
        .from('wishlists')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;

      await this.loadWishlist();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async isInWishlist(productId: string): Promise<boolean> {
    const wishlist = this.wishlistSubject.value;
    return wishlist.some(item => item.productId === productId);
  }

  async clearWishlist(): Promise<{ success: boolean; error?: string }> {
    try {
      const user = this.supabase.currentUser;
      if (!user) {
        return { success: false, error: 'Utilisateur non connecté' };
      }

      const { error } = await this.supabase.client
        .from('wishlists')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      this.wishlistSubject.next([]);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  get wishlistCount(): number {
    return this.wishlistSubject.value.length;
  }
}

