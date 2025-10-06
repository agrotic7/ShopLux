import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-customers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss']
})
export class AdminCustomersComponent implements OnInit {
  customers: any[] = [];
  isLoading = true;
  searchQuery = '';

  constructor(
    private supabase: SupabaseService,
    public currencyService: CurrencyService
  ,
    private toastService: ToastService
  ) {}

  async ngOnInit() {
    await this.loadCustomers();
  }

  async loadCustomers() {
    try {
      this.isLoading = true;
      const { data, error } = await this.supabase.client
        .from('users')
        .select('*')
        .eq('role', 'customer')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get order count for each customer
      const customersWithOrders = await Promise.all(
        (data || []).map(async (customer) => {
          const { count } = await this.supabase.client
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', customer.id);

          return {
            ...customer,
            orderCount: count || 0
          };
        })
      );

      this.customers = customersWithOrders;
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      this.isLoading = false;
    }
  }

  get filteredCustomers() {
    return this.customers.filter(customer => {
      const searchLower = this.searchQuery.toLowerCase();
      return !this.searchQuery || 
        customer.email.toLowerCase().includes(searchLower) ||
        (customer.first_name && customer.first_name.toLowerCase().includes(searchLower)) ||
        (customer.last_name && customer.last_name.toLowerCase().includes(searchLower));
    });
  }

  async toggleCustomerRole(customer: any) {
    const newRole = customer.role === 'customer' ? 'admin' : 'customer';
    
    if (!confirm(`Voulez-vous vraiment changer le rôle de ${customer.email} en ${newRole} ?`)) {
      return;
    }

    try {
      const { error } = await this.supabase.client
        .from('users')
        .update({ role: newRole })
        .eq('id', customer.id);

      if (error) throw error;

      await this.loadCustomers();
      this.toastService.success('Rôle mis à jour avec succès!');
    } catch (error: any) {
      console.error('Error updating role:', error);
      this.toastService.info('Erreur: ' + error.message);
    }
  }
}
