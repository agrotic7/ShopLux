import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { Product, ProductFilter, Category } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private productsSubject = new BehaviorSubject<Product[]>([]);
  public products$ = this.productsSubject.asObservable();

  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  public categories$ = this.categoriesSubject.asObservable();

  constructor(private supabase: SupabaseService) {
    this.loadCategories().catch(err => console.error('Error loading categories:', err));
  }

  async getProductCount(filter?: ProductFilter): Promise<number> {
    let query = this.supabase.client
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Apply same filters as getProducts
    if (filter?.categoryId) {
      query = query.eq('category_id', filter.categoryId);
    }

    if (filter?.minPrice) {
      query = query.gte('price', filter.minPrice);
    }

    if (filter?.maxPrice) {
      query = query.lte('price', filter.maxPrice);
    }

    if (filter?.brand && filter.brand.length > 0) {
      query = query.in('brand', filter.brand);
    }

    if (filter?.inStock) {
      query = query.gt('stock', 0);
    }

    if (filter?.search) {
      query = query.or(`name.ilike.%${filter.search}%,description.ilike.%${filter.search}%`);
    }

    const { count, error } = await query;

    if (error) throw error;

    return count || 0;
  }

  async getProducts(filter?: ProductFilter): Promise<Product[]> {
    let query = this.supabase.client
      .from('products')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('status', 'active');

    // Apply filters
    if (filter?.categoryId) {
      query = query.eq('category_id', filter.categoryId);
    }

    if (filter?.minPrice) {
      query = query.gte('price', filter.minPrice);
    }

    if (filter?.maxPrice) {
      query = query.lte('price', filter.maxPrice);
    }

    if (filter?.brand && filter.brand.length > 0) {
      query = query.in('brand', filter.brand);
    }

    if (filter?.inStock) {
      query = query.gt('stock', 0);
    }

    if (filter?.search) {
      query = query.or(`name.ilike.%${filter.search}%,description.ilike.%${filter.search}%`);
    }

    // Apply sorting
    if (filter?.sort) {
      switch (filter.sort) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'price-asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price-desc':
          query = query.order('price', { ascending: false });
          break;
        case 'popular':
          query = query.order('review_count', { ascending: false });
          break;
        case 'rating':
          query = query.order('rating', { ascending: false });
          break;
      }
    }

    // Pagination
    const page = filter?.page || 1;
    const limit = filter?.limit || 12;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    const { data, error } = await query;

    if (error) throw error;

    const products = this.mapProducts(data || []);
    this.productsSubject.next(products);
    return products;
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    const { data, error } = await this.supabase.client
      .from('products')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('slug', slug)
      .single();

    if (error) throw error;
    return data ? this.mapProduct(data) : null;
  }

  async getProductById(id: string): Promise<Product | null> {
    const { data, error } = await this.supabase.client
      .from('products')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data ? this.mapProduct(data) : null;
  }

  async getFeaturedProducts(): Promise<Product[]> {
    const { data, error } = await this.supabase.client
      .from('products')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('is_featured', true)
      .eq('status', 'active')
      .limit(8);

    if (error) throw error;
    return this.mapProducts(data || []);
  }

  async getNewArrivals(): Promise<Product[]> {
    const { data, error } = await this.supabase.client
      .from('products')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('is_new_arrival', true)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(8);

    if (error) throw error;
    return this.mapProducts(data || []);
  }

  async getBestSellers(): Promise<Product[]> {
    const { data, error } = await this.supabase.client
      .from('products')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('is_best_seller', true)
      .eq('status', 'active')
      .limit(8);

    if (error) throw error;
    return this.mapProducts(data || []);
  }

  async loadCategories() {
    const { data, error } = await this.supabase.client
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('order', { ascending: true });

    if (error) {
      console.error('Error loading categories:', error);
      return;
    }

    if (data) {
      const categories = data.map((cat: any) => this.mapCategory(cat));
      this.categoriesSubject.next(categories);
    }
  }

  async getCategories(): Promise<Category[]> {
    await this.loadCategories();
    return this.categoriesSubject.value;
  }

  private mapProduct(data: any): Product {
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      shortDescription: data.short_description,
      price: data.price,
      compareAtPrice: data.compare_at_price,
      sku: data.sku,
      stock: data.stock,
      images: data.images || [],
      categoryId: data.category_id,
      category: data.category ? this.mapCategory(data.category) : undefined,
      brand: data.brand,
      tags: data.tags,
      variants: data.variants,
      specifications: data.specifications,
      rating: data.rating,
      reviewCount: data.review_count,
      isFeatured: data.is_featured,
      isNewArrival: data.is_new_arrival,
      isBestSeller: data.is_best_seller,
      status: data.status,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  private mapProducts(data: any[]): Product[] {
    return data.map(item => this.mapProduct(item));
  }

  private mapCategory(data: any): Category {
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      parentId: data.parent_id,
      image: data.image,
      order: data.order,
      isActive: data.is_active
    };
  }
}

