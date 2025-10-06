import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50">
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">Connexion en cours...</h2>
        <p class="text-gray-600">Veuillez patienter pendant que nous vous connectons.</p>
      </div>
    </div>
  `
})
export class AuthCallbackComponent implements OnInit {
  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {}

  async ngOnInit() {
    try {
      // Attendre que la session soit initialisée
      await this.supabase.waitForSessionInit();
      
      // Vérifier si l'utilisateur est connecté
      const user = this.supabase.currentUser;
      
      if (user) {
        // Rediriger vers le dashboard
        this.router.navigate(['/account/dashboard']);
      } else {
        // Rediriger vers la page de connexion en cas d'erreur
        this.router.navigate(['/auth/login']);
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      this.router.navigate(['/auth/login']);
    }
  }
}
