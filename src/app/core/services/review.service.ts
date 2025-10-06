import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: Date;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { [key: number]: number };
  verifiedPurchasePercentage: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {

  constructor(
    private supabase: SupabaseService,
    private authService: AuthService
  ) {}

  async getProductReviews(productId: string): Promise<Review[]> {
    const { data, error } = await this.supabase.client
      .from('reviews')
      .select(`
        *,
        users:user_id (
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading reviews:', error);
      throw error;
    }

    return (data || []).map(r => ({
      id: r.id,
      productId: r.product_id,
      userId: r.user_id,
      userName: r.users ? `${r.users.first_name || ''} ${r.users.last_name || ''}`.trim() || 'Anonyme' : 'Anonyme',
      userAvatar: r.users?.avatar_url,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      verifiedPurchase: r.verified_purchase,
      helpfulCount: r.helpful_count,
      createdAt: new Date(r.created_at)
    }));
  }

  async getProductReviewStats(productId: string): Promise<ReviewStats> {
    const reviews = await this.getProductReviews(productId);
    
    const totalReviews = reviews.length;
    if (totalReviews === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        verifiedPurchasePercentage: 0
      };
    }

    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
    
    const ratingDistribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(r => {
      ratingDistribution[r.rating]++;
    });

    const verifiedCount = reviews.filter(r => r.verifiedPurchase).length;
    const verifiedPurchasePercentage = (verifiedCount / totalReviews) * 100;

    return {
      averageRating,
      totalReviews,
      ratingDistribution,
      verifiedPurchasePercentage
    };
  }

  async canUserReview(productId: string): Promise<{ canReview: boolean; reason?: string }> {
    const user = this.authService.currentUser;
    if (!user) {
      return { canReview: false, reason: 'Vous devez être connecté pour laisser un avis' };
    }

    // Check if user already reviewed this product
    const { data: existingReview, error } = await this.supabase.client
      .from('reviews')
      .select('id')
      .eq('product_id', productId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error checking existing review:', error);
    }

    if (existingReview) {
      return { canReview: false, reason: 'Vous avez déjà laissé un avis pour ce produit' };
    }

    // Check if user purchased this product
    const { data: orders } = await this.supabase.client
      .from('orders')
      .select('items')
      .eq('user_id', user.id)
      .eq('status', 'delivered');

    const hasPurchased = orders?.some(order => {
      const items = order.items as any[];
      return items.some((item: any) => item.productId === productId);
    });

    return {
      canReview: true,
      reason: hasPurchased ? undefined : 'Achat non vérifié'
    };
  }

  async createReview(review: {
    productId: string;
    rating: number;
    title: string;
    comment: string;
  }): Promise<{ success: boolean; error?: string }> {
    const user = this.authService.currentUser;
    if (!user) {
      return { success: false, error: 'Vous devez être connecté' };
    }

    try {
      // Check if user can review
      const canReview = await this.canUserReview(review.productId);
      if (!canReview.canReview) {
        return { success: false, error: canReview.reason };
      }

      // Check if user purchased this product
      const { data: orders } = await this.supabase.client
        .from('orders')
        .select('items')
        .eq('user_id', user.id)
        .eq('status', 'delivered');

      const hasPurchased = orders?.some(order => {
        const items = order.items as any[];
        return items.some((item: any) => item.productId === review.productId);
      });

      const { error } = await this.supabase.client
        .from('reviews')
        .insert({
          product_id: review.productId,
          user_id: user.id,
          rating: review.rating,
          title: review.title,
          comment: review.comment,
          verified_purchase: hasPurchased || false
        });

      if (error) throw error;

      // Update product rating
      await this.updateProductRating(review.productId);

      return { success: true };
    } catch (error: any) {
      console.error('Error creating review:', error);
      return { success: false, error: error.message };
    }
  }

  async updateReview(reviewId: string, updates: {
    rating?: number;
    title?: string;
    comment?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {};
      if (updates.rating) updateData.rating = updates.rating;
      if (updates.title) updateData.title = updates.title;
      if (updates.comment) updateData.comment = updates.comment;

      const { data, error } = await this.supabase.client
        .from('reviews')
        .update(updateData)
        .eq('id', reviewId)
        .select('product_id')
        .single();

      if (error) throw error;

      // Update product rating
      if (data) {
        await this.updateProductRating(data.product_id);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error updating review:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteReview(reviewId: string, productId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase.client
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      // Update product rating
      await this.updateProductRating(productId);

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting review:', error);
      return { success: false, error: error.message };
    }
  }

  private async updateProductRating(productId: string): Promise<void> {
    const stats = await this.getProductReviewStats(productId);
    
    await this.supabase.client
      .from('products')
      .update({
        rating: stats.averageRating,
        review_count: stats.totalReviews
      })
      .eq('id', productId);
  }
}

