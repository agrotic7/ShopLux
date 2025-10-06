import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { User, Address } from '../../../core/models/user.model';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  activeTab: 'profile' | 'addresses' | 'security' = 'profile';
  currentUser: User | null = null;
  isSaving = false;
  showAddressForm = false;
  isUploadingAvatar = false;
  avatarUrl: string | null = null;

  tabs = [
    { id: 'profile' as const, label: 'Profil' },
    { id: 'addresses' as const, label: 'Adresses' },
    { id: 'security' as const, label: 'Sécurité' }
  ];

  profileForm = {
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  };

  addressForm = {
    firstName: '',
    lastName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'France',
    type: 'shipping' as 'billing' | 'shipping',
    isDefault: false
  };

  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  addresses: Address[] = [];

  constructor(
    private authService: AuthService,
    private supabase: SupabaseService
  ,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadUserData();
  }

  private loadUserData(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUser = user;
        this.profileForm = {
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email,
          phone: user.phone || ''
        };
        this.avatarUrl = user.avatar || null;
      }
    });

    this.loadAddresses();
  }

  private async loadAddresses(): Promise<void> {
    try {
      const { data, error } = await this.supabase.client
        .from('addresses')
        .select('*')
        .order('is_default', { ascending: false });

      if (!error && data) {
        this.addresses = data.map((addr: any) => ({
          id: addr.id,
          userId: addr.user_id,
          type: addr.type,
          firstName: addr.first_name,
          lastName: addr.last_name,
          phone: addr.phone,
          street: addr.street,
          city: addr.city,
          state: addr.state,
          zipCode: addr.zip_code,
          country: addr.country,
          isDefault: addr.is_default
        }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des adresses:', error);
    }
  }

  async updateProfile(): Promise<void> {
    this.isSaving = true;
    try {
      if (!this.currentUser) return;

      const { error } = await this.supabase.client
        .from('users')
        .update({
          first_name: this.profileForm.firstName,
          last_name: this.profileForm.lastName,
          phone: this.profileForm.phone
        })
        .eq('id', this.currentUser.id);

      if (error) throw error;

      this.toastService.success('Profil mis à jour avec succès !');
    } catch (error: any) {
      this.toastService.info('Erreur lors de la mise à jour: ' + error.message);
    } finally {
      this.isSaving = false;
    }
  }

  async addAddress(): Promise<void> {
    try {
      if (!this.currentUser) return;

      // Si cette adresse est définie par défaut, retirer le flag des autres
      if (this.addressForm.isDefault) {
        await this.supabase.client
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', this.currentUser.id);
      }

      const { error } = await this.supabase.client
        .from('addresses')
        .insert([
          {
            user_id: this.currentUser.id,
            type: this.addressForm.type,
            first_name: this.addressForm.firstName,
            last_name: this.addressForm.lastName,
            phone: this.addressForm.phone,
            street: this.addressForm.street,
            city: this.addressForm.city,
            state: this.addressForm.state,
            zip_code: this.addressForm.zipCode,
            country: this.addressForm.country,
            is_default: this.addressForm.isDefault
          }
        ]);

      if (error) throw error;

      // Reset form
      this.addressForm = {
        firstName: '',
        lastName: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'France',
        type: 'shipping',
        isDefault: false
      };
      this.showAddressForm = false;

      // Recharger les adresses
      await this.loadAddresses();

      this.toastService.success('Adresse ajoutée avec succès !');
    } catch (error: any) {
      this.toastService.info('Erreur lors de l\'ajout de l\'adresse: ' + error.message);
    }
  }

  async updatePassword(): Promise<void> {
    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.toastService.warning('Les mots de passe ne correspondent pas');
      return;
    }

    if (this.passwordForm.newPassword.length < 6) {
      this.toastService.warning('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    this.isSaving = true;
    try {
      const { error } = await this.supabase.client.auth.updateUser({
        password: this.passwordForm.newPassword
      });

      if (error) throw error;

      // Reset form
      this.passwordForm = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      };

      this.toastService.success('Mot de passe mis à jour avec succès !');
    } catch (error: any) {
      this.toastService.info('Erreur lors de la mise à jour du mot de passe: ' + error.message);
    } finally {
      this.isSaving = false;
    }
  }

  async uploadAvatar(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (!file || !this.currentUser) {
      return;
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      this.toastService.warning('Veuillez sélectionner une image');
      return;
    }

    // Vérifier la taille (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      this.toastService.info('L\'image ne doit pas dépasser 2 MB');
      return;
    }

    this.isUploadingAvatar = true;

    try {
      // Créer un nom de fichier unique
      const fileExt = file.name.split('.').pop();
      const fileName = `${this.currentUser.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload vers Supabase Storage
      const { error: uploadError } = await this.supabase.client.storage
        .from('user-uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Obtenir l'URL publique
      const { data: publicUrlData } = this.supabase.client.storage
        .from('user-uploads')
        .getPublicUrl(filePath);

      const avatarUrl = publicUrlData.publicUrl;

      // Mettre à jour le profil utilisateur
      const { error: updateError } = await this.supabase.client
        .from('users')
        .update({ avatar_url: avatarUrl })
        .eq('id', this.currentUser.id);

      if (updateError) throw updateError;

      // Mettre à jour l'avatar local
      this.avatarUrl = avatarUrl;

      // Recharger les données utilisateur
      await this.authService.loadUserProfile(this.currentUser.id);

      this.toastService.success('Photo de profil mise à jour avec succès !');
    } catch (error: any) {
      console.error('Erreur upload avatar:', error);
      this.toastService.info('Erreur lors de l\'upload: ' + error.message);
    } finally {
      this.isUploadingAvatar = false;
      // Reset input
      target.value = '';
    }
  }

  triggerAvatarUpload(): void {
    const fileInput = document.getElementById('avatar-upload') as HTMLInputElement;
    fileInput?.click();
  }
}
