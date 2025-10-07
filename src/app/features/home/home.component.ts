import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { Product } from '../../core/models/product.model';
import { LazyImageComponent } from '../../shared/components/lazy-image/lazy-image.component';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';
import { AnalyticsService } from '../../core/services/analytics.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, LazyImageComponent, LoadingSkeletonComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  featuredProducts: Product[] = [];
  newArrivals: Product[] = [];
  bestSellers: Product[] = [];
  isLoading = true;
  Math = Math;

  banners = [
    {
      title: 'Collection Été 2025',
      subtitle: 'Découvrez nos nouveautés',
      discount: '30',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200',
      link: '/products?category=summer'
    },
    {
      title: 'Offres Spéciales',
      subtitle: 'Jusqu\'à -50% sur une sélection',
      discount: '50',
      image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200',
      link: '/products?sale=true'
    }
  ];

  categories = [
    {
      name: 'Électronique',
      image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400',
      link: '/products?category=electronics'
    },
    {
      name: 'Mode',
      image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400',
      link: '/products?category=fashion'
    },
    {
      name: 'Maison',
      image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400',
      link: '/products?category=home'
    },
    {
      name: 'Sport',
      image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400',
      link: '/products?category=sport'
    }
  ];

  currentBannerIndex = 0;

  constructor(
    private productService: ProductService,
    private analyticsService: AnalyticsService
  ) {}

  ngOnInit() {
    this.loadProducts();
    this.startBannerRotation();
    
    // Track page view
    this.analyticsService.trackCustomEvent('page_view', {
      page_title: 'Accueil',
      page_location: window.location.href,
      content_group: 'home'
    });
  }

  async loadProducts() {
    try {
      this.isLoading = true;
      const [featured, newArrivals, bestSellers] = await Promise.all([
        this.productService.getFeaturedProducts(),
        this.productService.getNewArrivals(),
        this.productService.getBestSellers()
      ]);

      this.featuredProducts = featured;
      this.newArrivals = newArrivals;
      this.bestSellers = bestSellers;
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      this.isLoading = false;
    }
  }

  startBannerRotation() {
    setInterval(() => {
      this.currentBannerIndex = (this.currentBannerIndex + 1) % this.banners.length;
    }, 5000);
  }

  nextBanner() {
    this.currentBannerIndex = (this.currentBannerIndex + 1) % this.banners.length;
  }

  prevBanner() {
    this.currentBannerIndex = (this.currentBannerIndex - 1 + this.banners.length) % this.banners.length;
  }

  getProductImage(product: Product): string {
    if (!product.images || product.images.length === 0) {
      return '/assets/logo.png';
    }
    
    const firstImage = product.images[0];
    
    // Handle both string URLs and objects with url property
    if (typeof firstImage === 'string') {
      return firstImage;
    }
    
    return firstImage?.url || '/assets/logo.png';
  }

  getDiscountPercentage(product: Product): number {
    if (!product.compareAtPrice) return 0;
    return Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100);
  }

  onProductClick(product: Product) {
    // Track product view
    this.analyticsService.trackViewItem({
      item_id: product.id.toString(),
      item_name: product.name,
      category: product.category?.name || 'Général',
      price: product.price,
      currency: 'XOF',
      item_brand: 'ShopLux',
      item_variant: product.variants?.[0]?.name
    });
  }

  onExploreClick() {
    this.analyticsService.trackLinkClick('Explorer', '/products', 'cta');
  }

  onLearnMoreClick() {
    this.analyticsService.trackLinkClick('En savoir plus', '#about', 'cta');
  }
}

