import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { Product, ProductFilter, Category } from '../../../core/models/product.model';
import { CartService } from '../../../core/services/cart.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
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
    public currencyService: CurrencyService
  ,
    private toastService: ToastService
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
      this.products = await this.productService.getProducts(this.filter);
      
      // Extract unique brands
      this.availableBrands = [...new Set(this.products
        .map(p => p.brand)
        .filter(b => b) as string[])];
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      this.isLoading = false;
    }
  }

  onCategoryChange() {
    if (this.selectedCategory) {
      const category = this.categories.find(c => c.slug === this.selectedCategory);
      this.filter.categoryId = category?.id;
    } else {
      this.filter.categoryId = undefined;
    }
    
    this.filter.page = 1;
    this.loadProducts();
  }

  onSortChange() {
    this.filter.page = 1;
    this.loadProducts();
  }

  onPriceRangeChange() {
    this.filter.minPrice = this.priceRange.min;
    this.filter.maxPrice = this.priceRange.max;
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
    this.filter.page = 1;
    this.loadProducts();
  }

  clearFilters() {
    this.selectedCategory = '';
    this.priceRange = { min: 0, max: 1000 };
    this.selectedBrands = [];
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

  loadMore() {
    this.filter.page = (this.filter.page || 1) + 1;
    this.loadProducts();
  }
}

