import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-order-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss']
})
export class AdminOrderDetailComponent implements OnInit {
  order: any = null;
  isLoading = true;
  orderId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supabase: SupabaseService,
    public currencyService: CurrencyService
  ,
    private toastService: ToastService
  ) {
    this.route.params.subscribe(params => {
      this.orderId = params['id'];
      if (this.orderId) {
        this.loadOrder();
      }
    });
  }

  async ngOnInit() {
    // L'ID est déjà récupéré dans le constructor
  }

  getProductImage(product: any): string | null {
    if (!product?.images) {
      return null;
    }
    
    if (!Array.isArray(product.images)) {
      return null;
    }
    
    if (product.images.length === 0) {
      return null;
    }
    
    const firstImage = product.images[0];
    
    // Handle both string URLs and object with url property
    if (typeof firstImage === 'string') {
      return firstImage;
    } else if (firstImage && typeof firstImage === 'object' && firstImage.url) {
      return firstImage.url;
    }
    
    return null;
  }

  async loadOrder() {
    try {
      this.isLoading = true;
      
      const { data: order, error: orderError } = await this.supabase.client
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            price,
            product:products (
              id,
              name,
              slug,
              images
            )
          ),
          user:users (
            id,
            email,
            first_name,
            last_name,
            phone
          )
        `)
        .eq('id', this.orderId)
        .single();

      if (orderError) throw orderError;

      // Les adresses sont stockées en JSONB, pas besoin de jointure
      this.order = order;
    } catch (error: any) {
      console.error('Error loading order:', error);
      this.toastService.info('Erreur lors du chargement de la commande: ' + error.message);
    } finally {
      this.isLoading = false;
    }
  }

  async updateOrderStatus(newStatus: string) {
    try {
      const { error } = await this.supabase.client
        .from('orders')
        .update({ status: newStatus })
        .eq('id', this.orderId);

      if (error) throw error;

      this.order.status = newStatus;
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

  getStatusText(status: string): string {
    const statuses: Record<string, string> = {
      'pending': 'En attente',
      'processing': 'En cours',
      'shipped': 'Expédiée',
      'delivered': 'Livrée',
      'cancelled': 'Annulée'
    };
    return statuses[status] || status;
  }

  goBack() {
    this.router.navigate(['/admin/orders']);
  }
}
