import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { ReviewService, Review, ReviewStats } from '../../../core/services/review.service';
import { AuthService } from '../../../core/services/auth.service';
import { Product } from '../../../core/models/product.model';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  selectedImage = 0;
  quantity = 1;
  isLoading = true;
  relatedProducts: Product[] = [];
  isInWishlist = false;
  activeTab: 'description' | 'specifications' | 'reviews' | 'shipping' = 'description';
  Math = Math;
  Object = Object;

  // Reviews
  reviews: Review[] = [];
  reviewStats: ReviewStats | null = null;
  showReviewForm = false;
  canReview = false;
  reviewFormData = {
    rating: 5,
    title: '',
    comment: ''
  };

  tabs = [
    { id: 'description' as const, label: 'Description' },
    { id: 'specifications' as const, label: 'Spécifications' },
    { id: 'reviews' as const, label: 'Avis clients' },
    { id: 'shipping' as const, label: 'Livraison & Retours' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private wishlistService: WishlistService,
    public currencyService: CurrencyService,
    private reviewService: ReviewService,
    public authService: AuthService
  ,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const slug = params['slug'];
      this.loadProduct(slug);
    });
  }

  async loadProduct(slug: string) {
    try {
      this.isLoading = true;
      this.product = await this.productService.getProductBySlug(slug);
      
      if (this.product) {
        // Load related products from same category
        const products = await this.productService.getProducts({
          categoryId: this.product.categoryId,
          limit: 4
        });
        this.relatedProducts = products.filter(p => p.id !== this.product!.id).slice(0, 4);

        // Check if product is in wishlist
        this.isInWishlist = await this.wishlistService.isInWishlist(this.product.id);

        // Load reviews
        await this.loadReviews();
        await this.checkCanReview();
      }
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      this.isLoading = false;
    }
  }

  selectImage(index: number) {
    this.selectedImage = index;
  }

  nextImage() {
    if (this.product && this.product.images.length > 0) {
      this.selectedImage = (this.selectedImage + 1) % this.product.images.length;
    }
  }

  previousImage() {
    if (this.product && this.product.images.length > 0) {
      this.selectedImage = this.selectedImage === 0 
        ? this.product.images.length - 1 
        : this.selectedImage - 1;
    }
  }

  increaseQuantity() {
    if (this.product && this.quantity < this.product.stock) {
      this.quantity++;
    }
  }

  decreaseQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  async addToCart() {
    if (this.product) {
      await this.cartService.addToCart(this.product, this.quantity);
      // Show success notification
      this.toastService.info(`✅ ${this.quantity} × ${this.product.name} ajouté au panier !`);
    }
  }

  async buyNow() {
    if (this.product) {
      await this.cartService.addToCart(this.product, this.quantity);
      this.router.navigate(['/checkout']);
    }
  }

  async toggleWishlist() {
    if (!this.product) return;

    if (this.isInWishlist) {
      const result = await this.wishlistService.removeFromWishlist(this.product.id);
      if (result.success) {
        this.isInWishlist = false;
      }
    } else {
      const result = await this.wishlistService.addToWishlist(this.product.id);
      if (result.success) {
        this.isInWishlist = true;
      }
    }
  }

  getDiscountPercentage(): number {
    if (!this.product?.compareAtPrice || this.product.compareAtPrice <= this.product.price) return 0;
    return Math.round(((this.product.compareAtPrice - this.product.price) / this.product.compareAtPrice) * 100);
  }

  getProductImage(product: Product, index: number = 0): string {
    if (product.images && product.images.length > index) {
      const image = product.images[index];
      if (typeof image === 'string') {
        return image;
      }
      return image?.url || '/assets/logo.png';
    }
    return '/assets/logo.png';
  }

  // Review methods
  async loadReviews() {
    if (!this.product) return;
    try {
      this.reviews = await this.reviewService.getProductReviews(this.product.id);
      this.reviewStats = await this.reviewService.getProductReviewStats(this.product.id);
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  }

  async checkCanReview() {
    if (!this.product) return;
    const result = await this.reviewService.canUserReview(this.product.id);
    this.canReview = result.canReview;
  }

  toggleReviewForm() {
    if (!this.authService.currentUser) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    this.showReviewForm = !this.showReviewForm;
  }

  async submitReview() {
    if (!this.product) return;

    if (!this.reviewFormData.title || !this.reviewFormData.comment) {
      this.toastService.warning('Veuillez remplir tous les champs');
      return;
    }

    const result = await this.reviewService.createReview({
      productId: this.product.id,
      rating: this.reviewFormData.rating,
      title: this.reviewFormData.title,
      comment: this.reviewFormData.comment
    });

    if (result.success) {
      this.showReviewForm = false;
      this.reviewFormData = { rating: 5, title: '', comment: '' };
      await this.loadReviews();
      await this.checkCanReview();
      this.toastService.success('Votre avis a été publié avec succès !');
    } else {
      this.toastService.info('Erreur: ' + result.error);
    }
  }

  getRatingArray(rating: number): boolean[] {
    return Array(5).fill(false).map((_, i) => i < rating);
  }

  getRatingPercentage(rating: number): number {
    if (!this.reviewStats || this.reviewStats.totalReviews === 0) return 0;
    return (this.reviewStats.ratingDistribution[rating] / this.reviewStats.totalReviews) * 100;
  }
}
