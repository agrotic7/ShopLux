import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { ToastService } from '../../../core/services/toast.service';

interface Review {
  id: string;
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: Date;
  productName: string;
  productImage: string;
  userName: string;
  userEmail: string;
}

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reviews.component.html',
  styleUrls: ['./reviews.component.scss']
})
export class AdminReviewsComponent implements OnInit {
  reviews: Review[] = [];
  filteredReviews: Review[] = [];
  isLoading = true;
  showModal = false;
  selectedReview: Review | null = null;
  
  // Filters
  searchQuery = '';
  ratingFilter = '';
  verifiedFilter = '';

  constructor(private supabase: SupabaseService,
    private toastService: ToastService
  ) {}

  async ngOnInit() {
    await this.loadReviews();
  }

  async loadReviews() {
    try {
      this.isLoading = true;
      const { data, error } = await this.supabase.client
        .from('reviews')
        .select(`
          id,
          rating,
          title,
          comment,
          verified_purchase,
          helpful_count,
          created_at,
          products!inner(name, images),
          users!inner(email, first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.reviews = (data || []).map((review: any) => ({
        id: review.id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        verifiedPurchase: review.verified_purchase,
        helpfulCount: review.helpful_count,
        createdAt: new Date(review.created_at),
        productName: review.products?.name || '',
        productImage: review.products?.images?.[0]?.url || '',
        userName: `${review.users?.first_name || ''} ${review.users?.last_name || ''}`,
        userEmail: review.users?.email || ''
      }));

      this.filteredReviews = [...this.reviews];
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      this.isLoading = false;
    }
  }

  filterReviews() {
    this.filteredReviews = this.reviews.filter(review => {
      const matchesSearch = !this.searchQuery || 
        review.productName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        review.userName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        review.comment.toLowerCase().includes(this.searchQuery.toLowerCase());
      
      const matchesRating = !this.ratingFilter || review.rating === parseInt(this.ratingFilter);
      
      const matchesVerified = !this.verifiedFilter || 
        (this.verifiedFilter === 'true' && review.verifiedPurchase) ||
        (this.verifiedFilter === 'false' && !review.verifiedPurchase);
      
      return matchesSearch && matchesRating && matchesVerified;
    });
  }

  onSearchChange() {
    this.filterReviews();
  }

  onRatingFilterChange() {
    this.filterReviews();
  }

  onVerifiedFilterChange() {
    this.filterReviews();
  }

  openReviewModal(review: Review) {
    this.selectedReview = review;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedReview = null;
  }

  async deleteReview(review: Review) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer cet avis de "${review.userName}" ?`)) {
      return;
    }

    try {
      const { error } = await this.supabase.client
        .from('reviews')
        .delete()
        .eq('id', review.id);

      if (error) throw error;

      this.toastService.success('Avis supprimé avec succès!');
      await this.loadReviews();
    } catch (error: any) {
      console.error('Error deleting review:', error);
      this.toastService.info('Erreur: ' + error.message);
    }
  }

  async toggleVerifiedPurchase(review: Review) {
    try {
      const { error } = await this.supabase.client
        .from('reviews')
        .update({ verified_purchase: !review.verifiedPurchase })
        .eq('id', review.id);

      if (error) throw error;

      await this.loadReviews();
    } catch (error: any) {
      console.error('Error updating review:', error);
      this.toastService.info('Erreur: ' + error.message);
    }
  }

  getRatingStars(rating: number): string[] {
    return Array(5).fill('').map((_, i) => i < rating ? 'full' : 'empty');
  }

  getRatingColor(rating: number): string {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  }

  getAverageRating(): number {
    if (this.reviews.length === 0) return 0;
    return this.reviews.reduce((sum, r) => sum + r.rating, 0) / this.reviews.length;
  }

  getRatingDistribution(): { rating: number; count: number; percentage: number }[] {
    const distribution = [5, 4, 3, 2, 1].map(rating => {
      const count = this.reviews.filter(r => r.rating === rating).length;
      const percentage = this.reviews.length > 0 ? (count / this.reviews.length) * 100 : 0;
      return { rating, count, percentage };
    });
    return distribution;
  }

  getVerifiedPercentage(): number {
    if (this.reviews.length === 0) return 0;
    const verifiedCount = this.reviews.filter(r => r.verifiedPurchase).length;
    return (verifiedCount / this.reviews.length) * 100;
  }

  getFiveStarPercentage(): number {
    if (this.reviews.length === 0) return 0;
    const fiveStarCount = this.reviews.filter(r => r.rating === 5).length;
    return (fiveStarCount / this.reviews.length) * 100;
  }
}

