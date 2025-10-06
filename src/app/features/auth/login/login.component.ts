import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  email = '';
  password = '';
  isLoading = false;
  error = '';
  showPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async onSubmit() {
    if (!this.email || !this.password) {
      this.error = 'Veuillez remplir tous les champs';
      return;
    }

    try {
      this.isLoading = true;
      this.error = '';
      
      const result = await this.authService.signIn(this.email, this.password);
      
      if (result.success) {
        this.router.navigate(['/account/dashboard']);
      } else {
        this.error = result.error || 'Erreur de connexion';
      }
    } catch (error: any) {
      this.error = error.message || 'Erreur de connexion';
    } finally {
      this.isLoading = false;
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async signInWithGoogle() {
    try {
      this.isLoading = true;
      this.error = '';
      
      const result = await this.authService.signInWithGoogle();
      
      if (result.success) {
        // La redirection se fait automatiquement via Supabase OAuth
        // L'utilisateur sera redirigé vers /auth/callback puis vers /account/dashboard
      } else {
        this.error = result.error || 'Erreur de connexion Google';
      }
    } catch (error: any) {
      this.error = error.message || 'Erreur de connexion Google';
    } finally {
      this.isLoading = false;
    }
  }
}

