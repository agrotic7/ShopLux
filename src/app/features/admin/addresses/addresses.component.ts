import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { ToastService } from '../../../core/services/toast.service';

interface AddressWithUser {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  type: 'billing' | 'shipping';
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
  createdAt: Date;
}

@Component({
  selector: 'app-admin-addresses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './addresses.component.html',
  styleUrls: ['./addresses.component.scss']
})
export class AdminAddressesComponent implements OnInit {
  addresses: AddressWithUser[] = [];
  filteredAddresses: AddressWithUser[] = [];
  isLoading = true;
  searchQuery = '';
  filterType: 'all' | 'shipping' | 'billing' = 'all';

  constructor(private supabase: SupabaseService,
    private toastService: ToastService
  ) {}

  async ngOnInit() {
    await this.loadAddresses();
  }

  async loadAddresses() {
    try {
      this.isLoading = true;
      const { data, error } = await this.supabase.client
        .from('addresses')
        .select(`
          *,
          users:user_id (
            email,
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.addresses = (data || []).map((a: any) => ({
        id: a.id,
        userId: a.user_id,
        userEmail: a.users?.email || 'N/A',
        userName: a.users ? `${a.users.first_name || ''} ${a.users.last_name || ''}`.trim() : 'N/A',
        type: a.type,
        firstName: a.first_name,
        lastName: a.last_name,
        street: a.street,
        city: a.city,
        state: a.state,
        zipCode: a.zip_code,
        country: a.country,
        phone: a.phone,
        isDefault: a.is_default,
        createdAt: new Date(a.created_at)
      }));

      this.applyFilters();
    } catch (error) {
      console.error('Error loading addresses:', error);
    } finally {
      this.isLoading = false;
    }
  }

  applyFilters() {
    let filtered = [...this.addresses];

    // Filter by type
    if (this.filterType !== 'all') {
      filtered = filtered.filter(a => a.type === this.filterType);
    }

    // Filter by search query
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.userEmail.toLowerCase().includes(query) ||
        a.userName.toLowerCase().includes(query) ||
        a.city.toLowerCase().includes(query) ||
        a.country.toLowerCase().includes(query)
      );
    }

    this.filteredAddresses = filtered;
  }

  onSearchChange() {
    this.applyFilters();
  }

  onFilterChange() {
    this.applyFilters();
  }

  async deleteAddress(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette adresse ?')) {
      return;
    }

    try {
      const { error } = await this.supabase.client
        .from('addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await this.loadAddresses();
      this.toastService.success('Adresse supprimée avec succès');
    } catch (error) {
      console.error('Error deleting address:', error);
      this.toastService.error('Erreur lors de la suppression');
    }
  }

  getTypeLabel(type: string): string {
    return type === 'shipping' ? 'Livraison' : 'Facturation';
  }

  getTypeBadgeClass(type: string): string {
    return type === 'shipping' 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-green-100 text-green-800';
  }
}

