import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private profileLoadPromise: Promise<void> | null = null;

  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {
    // Initialize profile from session immediately
    this.initializeProfile();
    
    this.supabase.currentUser$.subscribe(async user => {
      this.isAuthenticatedSubject.next(!!user);
      if (user) {
        // Charger le profil utilisateur complet depuis la base de données
        this.profileLoadPromise = this.loadUserProfile(user.id);
        await this.profileLoadPromise;
        this.profileLoadPromise = null;
      } else {
        this.currentUserSubject.next(null);
      }
    });
  }
  
  private async initializeProfile() {
    await this.supabase.waitForSessionInit();
    const user = this.supabase.currentUser;
    if (user) {
      await this.loadUserProfile(user.id);
    }
  }

  async checkAuthStatus(): Promise<boolean> {
    // Wait for session to be initialized
    await this.supabase.waitForSessionInit();
    
    // If profile is currently being loaded, wait for it
    if (this.profileLoadPromise) {
      await this.profileLoadPromise;
    }
    
    const user = this.supabase.currentUser;
    if (user && !this.currentUser) {
      // Si l'utilisateur Supabase existe mais pas le profil complet, le charger
      await this.loadUserProfile(user.id);
    }
    
    return this.isAuthenticated;
  }

  async signUp(email: string, password: string, userData: any) {
    try {
      const { user } = await this.supabase.signUp(email, password, userData);
      // Le profil utilisateur est créé automatiquement via un trigger Supabase
      // Attendre un peu pour que le trigger s'exécute
      if (user) {
        await new Promise(resolve => setTimeout(resolve, 500));
        await this.loadUserProfile(user.id);
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async signIn(email: string, password: string) {
    try {
      await this.supabase.signIn(email, password);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async signOut() {
    try {
      await this.supabase.signOut();
      this.router.navigate(['/']);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async resetPassword(email: string) {
    try {
      await this.supabase.resetPassword(email);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Connexion avec Google OAuth
   */
  async signInWithGoogle() {
    try {
      const { data, error } = await this.supabase.client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      return { success: false, error: error.message };
    }
  }

  async loadUserProfile(userId: string) {
    const { data, error } = await this.supabase.client
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error loading user profile:', error);
      return;
    }

      if (data) {
        const user: User = {
        id: data.id,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        phone: data.phone,
        avatar: data.avatar_url, // Mapping correct depuis la BD
        role: data.role,
        loyaltyPoints: data.loyalty_points,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
      
      this.currentUserSubject.next(user);
    }
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  async getUserAddresses(type?: 'billing' | 'shipping') {
    const user = this.currentUser;
    if (!user) return [];

    let query = this.supabase.client
      .from('addresses')
      .select('*')
      .eq('user_id', user.id);

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query.order('is_default', { ascending: false });

    if (error) {
      console.error('Error loading addresses:', error);
      return [];
    }

    return data || [];
  }

  async getDefaultAddress(type: 'billing' | 'shipping') {
    const user = this.currentUser;
    if (!user) return null;

    const { data, error } = await this.supabase.client
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', type)
      .eq('is_default', true)
      .maybeSingle();

    if (error) {
      console.error('Error loading default address:', error);
      return null;
    }

    return data;
  }

  async saveAddress(address: any) {
    const user = this.currentUser;
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const addressData = {
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
        is_default: address.isDefault || false
      };

      const { data, error } = await this.supabase.client
        .from('addresses')
        .insert([addressData])
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

