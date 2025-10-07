import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { Product, ProductFilter, Category } from '../../../core/models/product.model';
import { CartService } from '../../../core/services/cart.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { ToastService } from '../../../core/services/toast.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { LazyImageComponent } from '../../../shared/components/lazy-image/lazy-image.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LazyImageComponent, LoadingSkeletonComponent],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  isLoading = true;
  
  filter: ProductFilter = {
    page: 1,
    limit: 12,
    sort: 'newest'
  };

  // Pagination
  totalProducts = 0;
  currentPage = 1;
  itemsPerPage = 12;
  totalPages = 1;
  Math = Math; // Expose Math to template

  // Filter UI state
  selectedCategory: string = '';
  priceRange = { min: 0, max: 1000 };
  selectedBrands: string[] = [];
  availableBrands: string[] = [];
  showFilters = false;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private route: ActivatedRoute,
    public currencyService: CurrencyService,
    private toastService: ToastService,
    private analyticsService: AnalyticsService
  ) {}

  async ngOnInit() {
    // Load categories first
    await this.loadCategories();
    
    // Then listen to query params
    this.route.queryParams.subscribe(params => {
      this.filter.search = params['search'] || undefined;
      
      // Handle category from query params
      const categoryParam = params['category'];
      if (categoryParam) {
        // Try to find category by slug or id
        const category = this.categories.find(c => c.slug === categoryParam || c.id === categoryParam);
        if (category) {
          this.selectedCategory = category.slug;
          this.filter.categoryId = category.id;
        }
      } else {
        this.selectedCategory = '';
        this.filter.categoryId = undefined;
      }
      
      this.filter.sort = params['sort'] || 'newest';
      
      this.loadProducts();
    });
  }

  async loadCategories() {
    // Wait for categories to be loaded
    this.categories = await this.productService.getCategories();
  }

  async loadProducts() {
    try {
      this.isLoading = true;
      
      // Get total count first
      await this.loadTotalCount();
      
      // Load products for current page
      this.filter.page = this.currentPage;
      this.products = await this.productService.getProducts(this.filter);
      
      // Extract unique brands
      this.availableBrands = [...new Set(this.products
        .map(p => p.brand)
        .filter(b => b) as string[])];
        
      // Scroll to top when changing pages
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async loadTotalCount() {
    try {
      this.totalProducts = await this.productService.getProductCount(this.filter);
      this.totalPages = Math.ceil(this.totalProducts / this.itemsPerPage);
    } catch (error) {
      console.error('Error loading total count:', error);
      this.totalProducts = this.products.length;
      this.totalPages = 1;
    }
  }

  onCategoryChange() {
    if (this.selectedCategory) {
      const category = this.categories.find(c => c.slug === this.selectedCategory);
      this.filter.categoryId = category?.id;
    } else {
      this.filter.categoryId = undefined;
    }
    
    this.currentPage = 1;
    this.filter.page = 1;
    this.loadProducts();
  }

  onSortChange() {
    this.currentPage = 1;
    this.filter.page = 1;
    this.loadProducts();
  }

  onPriceRangeChange() {
    this.filter.minPrice = this.priceRange.min;
    this.filter.maxPrice = this.priceRange.max;
    this.currentPage = 1;
    this.filter.page = 1;
    this.loadProducts();
  }

  onBrandChange(brand: string, checked: boolean) {
    if (checked) {
      this.selectedBrands.push(brand);
    } else {
      this.selectedBrands = this.selectedBrands.filter(b => b !== brand);
    }
    this.filter.brand = this.selectedBrands.length > 0 ? this.selectedBrands : undefined;
    this.currentPage = 1;
    this.filter.page = 1;
    this.loadProducts();
  }

  clearFilters() {
    this.selectedCategory = '';
    this.priceRange = { min: 0, max: 1000 };
    this.selectedBrands = [];
    this.currentPage = 1;
    this.filter = {
      page: 1,
      limit: 12,
      sort: 'newest'
    };
    this.loadProducts();
  }

  async addToCart(product: Product, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    await this.cartService.addToCart(product, 1);
    this.toastService.success('Produit ajouté au panier!');
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

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadProducts();
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    
    if (this.totalPages <= maxPagesToShow) {
      // Show all pages if total is small
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show smart pagination
      const leftBound = Math.max(1, this.currentPage - 2);
      const rightBound = Math.min(this.totalPages, this.currentPage + 2);
      
      if (leftBound > 1) {
        pages.push(1);
        if (leftBound > 2) {
          pages.push(-1); // Ellipsis
        }
      }
      
      for (let i = leftBound; i <= rightBound; i++) {
        pages.push(i);
      }
      
      if (rightBound < this.totalPages) {
        if (rightBound < this.totalPages - 1) {
          pages.push(-1); // Ellipsis
        }
        pages.push(this.totalPages);
      }
    }
    
    return pages;
  }

  onProductClick(product: Product) {
    // Track product view
    this.analyticsService.trackViewItem({
      item_id: product.id.toString(),
      item_name: product.name,
      category: product.category?.name || 'Général',
      price: product.price,
      currency: 'XOF',
      item_brand: 'ShopLux'
    });
  }

  onSearch(searchTerm: string) {
    if (searchTerm.trim()) {
      this.analyticsService.trackSearch(searchTerm, this.products.length);
    }
  }
}

