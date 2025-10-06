import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  estimatedDays: string; // For display
  freeShippingThreshold: number | null;
  countries: string[];
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ShippingService {
  private shippingMethods: ShippingMethod[] = [];

  constructor(private supabase: SupabaseService) {}

  async loadShippingMethods(country: string = 'SN'): Promise<ShippingMethod[]> {
    try {
      const { data, error } = await this.supabase.client
        .from('shipping_methods')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;

      this.shippingMethods = (data || [])
        .filter(method => method.countries.includes(country))
        .map(method => ({
          id: method.id,
          name: method.name,
          description: method.description,
          price: method.price,
          estimatedDaysMin: method.estimated_days_min,
          estimatedDaysMax: method.estimated_days_max,
          estimatedDays: this.formatEstimatedDays(method.estimated_days_min, method.estimated_days_max),
          freeShippingThreshold: method.free_shipping_threshold,
          countries: method.countries,
          isActive: method.is_active
        }));

      return this.shippingMethods;
    } catch (error) {
      console.error('Error loading shipping methods:', error);
      return [];
    }
  }

  getShippingMethods(): ShippingMethod[] {
    return this.shippingMethods;
  }

  getShippingMethodById(id: string): ShippingMethod | undefined {
    return this.shippingMethods.find(method => method.id === id);
  }

  calculateShippingCost(methodId: string, subtotal: number): number {
    const method = this.getShippingMethodById(methodId);
    if (!method) return 0;

    // Check if free shipping threshold is met
    if (method.freeShippingThreshold && subtotal >= method.freeShippingThreshold) {
      return 0;
    }

    return method.price;
  }

  private formatEstimatedDays(min: number, max: number): string {
    if (min === max) {
      return `Livraison en ${min} jour${min > 1 ? 's' : ''}`;
    }
    return `Livraison en ${min}-${max} jours`;
  }

  async getAvailableCountries(): Promise<string[]> {
    try {
      const { data, error } = await this.supabase.client
        .from('shipping_methods')
        .select('countries')
        .eq('is_active', true);

      if (error) throw error;

      const allCountries = new Set<string>();
      (data || []).forEach(method => {
        method.countries.forEach((country: string) => allCountries.add(country));
      });

      return Array.from(allCountries);
    } catch (error) {
      console.error('Error loading available countries:', error);
      return ['SN'];
    }
  }
}

