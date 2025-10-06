import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class AdminOrdersComponent implements OnInit {
  orders: any[] = [];
  isLoading = true;
  searchQuery = '';
  selectedStatus = '';

  constructor(
    private supabase: SupabaseService,
    public currencyService: CurrencyService
  ,
    private toastService: ToastService
  ) {}

  async ngOnInit() {
    await this.loadOrders();
  }

  async loadOrders() {
    try {
      this.isLoading = true;
      const { data, error } = await this.supabase.client
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.orders = data || [];
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      this.isLoading = false;
    }
  }

  get filteredOrders() {
    return this.orders.filter(order => {
      const matchesSearch = !this.searchQuery || 
        order.order_number.toLowerCase().includes(this.searchQuery.toLowerCase());
      
      const matchesStatus = !this.selectedStatus || 
        order.status === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }

  async updateOrderStatus(order: any, newStatus: string) {
    try {
      const { error } = await this.supabase.client
        .from('orders')
        .update({ status: newStatus })
        .eq('id', order.id);

      if (error) throw error;

      await this.loadOrders();
      this.toastService.success('Statut de la commande mis à jour!');
    } catch (error: any) {
      console.error('Error updating order:', error);
      this.toastService.info('Erreur: ' + error.message);
    }
  }

  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'processing': 'bg-blue-100 text-blue-800',
      'shipped': 'bg-purple-100 text-purple-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'pending': 'En attente',
      'processing': 'En cours',
      'shipped': 'Expédiée',
      'delivered': 'Livrée',
      'cancelled': 'Annulée'
    };
    return labels[status] || status;
  }
}
