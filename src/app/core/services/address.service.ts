import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { Address } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private addressesSubject = new BehaviorSubject<Address[]>([]);
  public addresses$ = this.addressesSubject.asObservable();

  constructor(
    private supabase: SupabaseService,
    private authService: AuthService
  ) {}

  async loadAddresses(): Promise<Address[]> {
    const user = this.authService.currentUser;
    if (!user) return [];

    const { data, error } = await this.supabase.client
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading addresses:', error);
      throw error;
    }

    const addresses = (data || []).map(this.mapAddress);
    this.addressesSubject.next(addresses);
    return addresses;
  }

  async getAddress(id: string): Promise<Address | null> {
    const { data, error } = await this.supabase.client
      .from('addresses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error getting address:', error);
      return null;
    }

    return this.mapAddress(data);
  }

  async createAddress(address: Omit<Address, 'id' | 'userId'>): Promise<{ success: boolean; error?: string; address?: Address }> {
    const user = this.authService.currentUser;
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      // If this is set as default, unset other defaults first
      if (address.isDefault) {
        await this.unsetAllDefaults(address.type);
      }

      const { data, error } = await this.supabase.client
        .from('addresses')
        .insert({
          user_id: user.id,
          type: address.type,
          first_name: address.firstName,
          last_name: address.lastName,
          street: address.street,
          city: address.city,
          state: address.state,
          zip_code: address.zipCode,
          country: address.country,
          phone: address.phone,
          is_default: address.isDefault
        })
        .select()
        .single();

      if (error) throw error;

      const newAddress = this.mapAddress(data);
      await this.loadAddresses(); // Refresh list
      return { success: true, address: newAddress };
    } catch (error: any) {
      console.error('Error creating address:', error);
      return { success: false, error: error.message };
    }
  }

  async updateAddress(id: string, address: Partial<Address>): Promise<{ success: boolean; error?: string }> {
    try {
      // If this is set as default, unset other defaults first
      if (address.isDefault && address.type) {
        await this.unsetAllDefaults(address.type);
      }

      const updateData: any = {};
      if (address.type) updateData.type = address.type;
      if (address.firstName) updateData.first_name = address.firstName;
      if (address.lastName) updateData.last_name = address.lastName;
      if (address.street) updateData.street = address.street;
      if (address.city) updateData.city = address.city;
      if (address.state) updateData.state = address.state;
      if (address.zipCode) updateData.zip_code = address.zipCode;
      if (address.country) updateData.country = address.country;
      if (address.phone) updateData.phone = address.phone;
      if (address.isDefault !== undefined) updateData.is_default = address.isDefault;

      const { error } = await this.supabase.client
        .from('addresses')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      await this.loadAddresses(); // Refresh list
      return { success: true };
    } catch (error: any) {
      console.error('Error updating address:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteAddress(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase.client
        .from('addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await this.loadAddresses(); // Refresh list
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting address:', error);
      return { success: false, error: error.message };
    }
  }

  async setDefaultAddress(id: string, type: 'billing' | 'shipping'): Promise<{ success: boolean; error?: string }> {
    try {
      // Unset all defaults for this type
      await this.unsetAllDefaults(type);

      // Set this one as default
      const { error } = await this.supabase.client
        .from('addresses')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;

      await this.loadAddresses(); // Refresh list
      return { success: true };
    } catch (error: any) {
      console.error('Error setting default address:', error);
      return { success: false, error: error.message };
    }
  }

  private async unsetAllDefaults(type: 'billing' | 'shipping'): Promise<void> {
    const user = this.authService.currentUser;
    if (!user) return;

    await this.supabase.client
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', user.id)
      .eq('type', type)
      .eq('is_default', true);
  }

  private mapAddress(data: any): Address {
    return {
      id: data.id,
      userId: data.user_id,
      type: data.type,
      firstName: data.first_name,
      lastName: data.last_name,
      street: data.street,
      city: data.city,
      state: data.state,
      zipCode: data.zip_code,
      country: data.country,
      phone: data.phone,
      isDefault: data.is_default
    };
  }

  get addresses(): Address[] {
    return this.addressesSubject.value;
  }
}

