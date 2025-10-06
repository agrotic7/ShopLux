import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { ToastService } from '../../../core/services/toast.service';

interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase: number | null;
  maxDiscount: number | null;
  expiresAt: Date | null;
  usageLimit: number | null;
  usageCount: number;
  isActive: boolean;
  createdAt: Date;
}

@Component({
  selector: 'app-admin-coupons',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './coupons.component.html',
  styleUrls: ['./coupons.component.scss']
})
export class AdminCouponsComponent implements OnInit {
  coupons: Coupon[] = [];
  isLoading = true;
  showModal = false;
  editMode = false;
  
  currentCoupon = {
    id: '',
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: 0,
    min_purchase: null as number | null,
    max_discount: null as number | null,
    expires_at: null as string | null,
    usage_limit: null as number | null,
    is_active: true
  };

  constructor(
    private supabase: SupabaseService,
    public currencyService: CurrencyService
  ,
    private toastService: ToastService
  ) {}

  async ngOnInit() {
    await this.loadCoupons();
  }

  async loadCoupons() {
    try {
      this.isLoading = true;
      const { data, error } = await this.supabase.client
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.coupons = (data || []).map(coupon => ({
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        minPurchase: coupon.min_purchase,
        maxDiscount: coupon.max_discount,
        expiresAt: coupon.expires_at ? new Date(coupon.expires_at) : null,
        usageLimit: coupon.usage_limit,
        usageCount: coupon.usage_count,
        isActive: coupon.is_active,
        createdAt: new Date(coupon.created_at)
      }));
    } catch (error) {
      console.error('Error loading coupons:', error);
    } finally {
      this.isLoading = false;
    }
  }

  openCreateModal() {
    this.editMode = false;
    this.currentCoupon = {
      id: '',
      code: '',
      type: 'percentage',
      value: 0,
      min_purchase: null,
      max_discount: null,
      expires_at: null,
      usage_limit: null,
      is_active: true
    };
    this.showModal = true;
  }

  openEditModal(coupon: Coupon) {
    this.editMode = true;
    this.currentCoupon = {
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      min_purchase: coupon.minPurchase,
      max_discount: coupon.maxDiscount,
      expires_at: coupon.expiresAt ? coupon.expiresAt.toISOString().split('T')[0] : null,
      usage_limit: coupon.usageLimit,
      is_active: coupon.isActive
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  async saveCoupon() {
    try {
      if (!this.currentCoupon.code || this.currentCoupon.value <= 0) {
        this.toastService.warning('Le code et la valeur sont requis');
        return;
      }

      // Convert code to uppercase
      this.currentCoupon.code = this.currentCoupon.code.toUpperCase();

      const couponData = {
        code: this.currentCoupon.code,
        type: this.currentCoupon.type,
        value: this.currentCoupon.value,
        min_purchase: this.currentCoupon.min_purchase,
        max_discount: this.currentCoupon.max_discount,
        expires_at: this.currentCoupon.expires_at,
        usage_limit: this.currentCoupon.usage_limit,
        is_active: this.currentCoupon.is_active
      };

      if (this.editMode) {
        const { error } = await this.supabase.client
          .from('coupons')
          .update(couponData)
          .eq('id', this.currentCoupon.id);

        if (error) throw error;
        this.toastService.success('Coupon mis à jour avec succès!');
      } else {
        const { error } = await this.supabase.client
          .from('coupons')
          .insert([couponData]);

        if (error) throw error;
        this.toastService.success('Coupon créé avec succès!');
      }

      this.closeModal();
      await this.loadCoupons();
    } catch (error: any) {
      console.error('Error saving coupon:', error);
      this.toastService.info('Erreur: ' + error.message);
    }
  }

  async deleteCoupon(coupon: Coupon) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le coupon "${coupon.code}" ?`)) {
      return;
    }

    try {
      const { error } = await this.supabase.client
        .from('coupons')
        .delete()
        .eq('id', coupon.id);

      if (error) throw error;

      this.toastService.success('Coupon supprimé avec succès!');
      await this.loadCoupons();
    } catch (error: any) {
      console.error('Error deleting coupon:', error);
      this.toastService.info('Erreur: ' + error.message);
    }
  }

  async toggleCouponStatus(coupon: Coupon) {
    try {
      const { error } = await this.supabase.client
        .from('coupons')
        .update({ is_active: !coupon.isActive })
        .eq('id', coupon.id);

      if (error) throw error;

      await this.loadCoupons();
    } catch (error: any) {
      console.error('Error updating status:', error);
      this.toastService.info('Erreur: ' + error.message);
    }
  }

  getDiscountDisplay(coupon: Coupon): string {
    if (coupon.type === 'percentage') {
      return `${coupon.value}%`;
    } else {
      return this.currencyService.formatPrice(coupon.value);
    }
  }

  isExpired(coupon: Coupon): boolean {
    if (!coupon.expiresAt) return false;
    return new Date(coupon.expiresAt) < new Date();
  }

  isLimitReached(coupon: Coupon): boolean {
    if (!coupon.usageLimit) return false;
    return coupon.usageCount >= coupon.usageLimit;
  }
}

