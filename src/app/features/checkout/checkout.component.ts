import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { ShippingService, ShippingMethod } from '../../core/services/shipping.service';
import { CurrencyService } from '../../core/services/currency.service';
import { PaymentService } from '../../core/services/payment.service';
import { EmailService } from '../../core/services/email.service';
import { NotificationService } from '../../core/services/notification.service';
import { ToastService } from '../../core/services/toast.service';
import { CartItem } from '../../core/models/cart.model';
import { Address } from '../../core/models/user.model';

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon?: string;
  icons?: string[];
  provider?: string;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {
  currentStep = 1;
  cartItems: CartItem[] = [];
  isProcessing = false;
  sameAsShipping = true;
  acceptTerms = false;
  saveShippingAddress = false;
  saveBillingAddress = false;
  couponCode = '';
  appliedCoupon: any = null;

  checkoutForm = {
    email: '',
    subscribeNewsletter: false,
    shippingAddress: {
      type: 'shipping' as 'shipping' | 'billing',
      firstName: '',
      lastName: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'France',
      phone: ''
    },
    billingAddress: {
      type: 'billing' as 'shipping' | 'billing',
      firstName: '',
      lastName: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'France',
      phone: ''
    },
    notes: ''
  };

  paymentForm = {
    mobileNumber: '' // Pour Wave et Orange Money
  };

  shippingMethods: ShippingMethod[] = [];
  isLoadingShipping = true;
  paymentMethods: PaymentMethod[] = [];
  selectedShippingMethod: ShippingMethod | null = null;
  selectedPaymentMethod: PaymentMethod | null = null;
  paymentError = '';
  paymentSuccess = false;

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private authService: AuthService,
    private shippingService: ShippingService,
    public currencyService: CurrencyService,
    private router: Router,
    private paymentService: PaymentService,
    private emailService: EmailService,
    private notificationService: NotificationService,
    private toastService: ToastService
  ) {}

  async ngOnInit(): Promise<void> {
    this.loadCartItems();
    await this.loadUserInfo();
    await this.loadShippingMethods();
    this.loadPaymentMethods(); // Charger les méthodes de paiement
  }

  async loadShippingMethods(): Promise<void> {
    try {
      this.isLoadingShipping = true;
      const country = this.checkoutForm.shippingAddress.country || 'Sénégal';
      // Map country name to code
      const countryCode = country === 'Sénégal' ? 'SN' : 'SN';
      const allMethods = await this.shippingService.loadShippingMethods(countryCode);
      
      // Filter shipping methods based on cart total
      const subtotal = this.getSubtotal();
      this.shippingMethods = allMethods.filter(method => {
        // If method has a free shipping threshold, only show if subtotal meets it
        if (method.freeShippingThreshold && method.price === 0) {
          return subtotal >= method.freeShippingThreshold;
        }
        // Always show paid methods
        return true;
      });
      
      // Set default shipping method
      if (this.shippingMethods.length > 0) {
        this.selectedShippingMethod = this.shippingMethods[0];
      }
    } catch (error) {
      console.error('Error loading shipping methods:', error);
    } finally {
      this.isLoadingShipping = false;
    }
  }

  loadPaymentMethods(): void {
    this.paymentMethods = this.paymentService.getAvailablePaymentMethods();
  }

  private loadCartItems(): void {
    this.cartService.cart$.subscribe(cart => {
      this.cartItems = cart.items;
      
      // Redirect to cart if empty
      if (this.cartItems.length === 0) {
        this.router.navigate(['/cart']);
      }
    });
  }

  private async loadUserInfo(): Promise<void> {
    this.authService.currentUser$.subscribe(async user => {
      if (user) {
        this.checkoutForm.email = user.email;
        this.checkoutForm.shippingAddress.firstName = user.firstName || '';
        this.checkoutForm.shippingAddress.lastName = user.lastName || '';
        this.checkoutForm.shippingAddress.phone = user.phone || '';

        // Load default shipping address
        await this.loadDefaultAddresses();
      }
    });
  }

  private async loadDefaultAddresses(): Promise<void> {
    try {
      // Load default shipping address
      const shippingAddress = await this.authService.getDefaultAddress('shipping');
      if (shippingAddress) {
        this.checkoutForm.shippingAddress = {
          type: 'shipping',
          firstName: shippingAddress.first_name,
          lastName: shippingAddress.last_name,
          street: shippingAddress.street,
          city: shippingAddress.city,
          state: shippingAddress.state,
          zipCode: shippingAddress.zip_code,
          country: shippingAddress.country,
          phone: shippingAddress.phone
        };
      }

      // Load default billing address
      const billingAddress = await this.authService.getDefaultAddress('billing');
      if (billingAddress) {
        this.checkoutForm.billingAddress = {
          type: 'billing',
          firstName: billingAddress.first_name,
          lastName: billingAddress.last_name,
          street: billingAddress.street,
          city: billingAddress.city,
          state: billingAddress.state,
          zipCode: billingAddress.zip_code,
          country: billingAddress.country,
          phone: billingAddress.phone
        };
        this.sameAsShipping = false;
      } else if (shippingAddress) {
        // If no billing address, use shipping as billing by default
        this.sameAsShipping = true;
        this.toggleBillingAddress();
      }
    } catch (error) {
      console.error('Error loading default addresses:', error);
    }
  }

  toggleBillingAddress(): void {
    if (this.sameAsShipping) {
      this.checkoutForm.billingAddress = { ...this.checkoutForm.shippingAddress };
      this.checkoutForm.billingAddress.type = 'billing';
    }
  }

  selectShippingMethod(method: ShippingMethod): void {
    this.selectedShippingMethod = method;
  }

  selectPaymentMethod(method: PaymentMethod): void {
    this.selectedPaymentMethod = method;
  }

  nextStep(): void {
    if (this.validateCurrentStep()) {
      if (this.currentStep < 3) {
        this.currentStep++;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  private validateCurrentStep(): boolean {
    if (this.currentStep === 1) {
      // Validate contact and shipping address
      if (!this.checkoutForm.email) {
        this.toastService.warning('Veuillez saisir votre email');
        return false;
      }
      
      const shipping = this.checkoutForm.shippingAddress;
      if (!shipping.firstName || !shipping.lastName || !shipping.street || 
          !shipping.city || !shipping.zipCode || !shipping.state || !shipping.phone) {
        this.toastService.warning('Veuillez remplir tous les champs de l\'adresse de livraison');
        return false;
      }
      
      // Copy to billing if same as shipping
      if (this.sameAsShipping) {
        this.checkoutForm.billingAddress = { ...shipping };
        this.checkoutForm.billingAddress.type = 'billing';
      } else {
        const billing = this.checkoutForm.billingAddress;
        if (!billing.firstName || !billing.lastName || !billing.street || 
            !billing.city || !billing.zipCode || !billing.state || !billing.phone) {
          this.toastService.warning('Veuillez remplir tous les champs de l\'adresse de facturation');
          return false;
        }
      }
    }
    
    if (this.currentStep === 2) {
      // Validate shipping method
      if (!this.selectedShippingMethod) {
        this.toastService.warning('Veuillez sélectionner une méthode de livraison');
        return false;
      }
    }
    
    return true;
  }

  applyCoupon(): void {
    if (!this.couponCode) return;
    
    // Simple mock coupon validation
    const validCoupons: any = {
      'BIENVENUE10': { code: 'BIENVENUE10', discount: 10, type: 'percentage' },
      'PROMO20': { code: 'PROMO20', discount: 20, type: 'percentage' },
      'FIXE5': { code: 'FIXE5', discount: 5, type: 'fixed' }
    };
    
    const coupon = validCoupons[this.couponCode.toUpperCase()];
    
    if (coupon) {
      this.appliedCoupon = coupon;
      this.toastService.success('Code promo appliqué avec succès !');
    } else {
      this.toastService.error('Code promo invalide');
    }
  }

  getSubtotal(): number {
    return this.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  getDiscount(): number {
    if (!this.appliedCoupon) return 0;
    
    const subtotal = this.getSubtotal();
    
    if (this.appliedCoupon.type === 'percentage') {
      return (subtotal * this.appliedCoupon.discount) / 100;
    } else {
      return this.appliedCoupon.discount;
    }
  }

  getTax(): number {
    const subtotal = this.getSubtotal();
    const discount = this.getDiscount();
    return (subtotal - discount) * 0.2; // 20% TVA
  }

  getShipping(): number {
    // Simply return the price of the selected shipping method
    return this.selectedShippingMethod?.price || 0;
  }

  getFinalTotal(): number {
    const subtotal = this.getSubtotal();
    const discount = this.getDiscount();
    const tax = this.getTax();
    const shipping = this.getShipping();
    
    return Number((subtotal - discount + tax + shipping).toFixed(2));
  }

  async placeOrder(): Promise<void> {
    if (!this.validateCurrentStep()) return;
    
    if (!this.selectedPaymentMethod) {
      this.toastService.warning('Veuillez sélectionner une méthode de paiement');
      return;
    }
    
    if (!this.acceptTerms) {
      this.toastService.warning('Veuillez accepter les conditions générales de vente');
      return;
    }
    
    // Validate payment method specific fields
    if (this.selectedPaymentMethod.id === 'wave' || this.selectedPaymentMethod.id === 'orange_money') {
      if (!this.paymentForm.mobileNumber) {
        this.toastService.warning('Veuillez entrer votre numéro de téléphone mobile');
        return;
      }
    }
    
    this.isProcessing = true;
    this.paymentError = '';
    
    try {
      // Convert form addresses to Address type
      const shippingAddress: Address = {
        id: '',
        userId: '',
        type: 'shipping',
        firstName: this.checkoutForm.shippingAddress.firstName,
        lastName: this.checkoutForm.shippingAddress.lastName,
        street: this.checkoutForm.shippingAddress.street,
        city: this.checkoutForm.shippingAddress.city,
        state: this.checkoutForm.shippingAddress.state,
        zipCode: this.checkoutForm.shippingAddress.zipCode,
        country: this.checkoutForm.shippingAddress.country,
        phone: this.checkoutForm.shippingAddress.phone,
        isDefault: false
      };
      
      const billingAddress: Address = {
        id: '',
        userId: '',
        type: 'billing',
        firstName: this.checkoutForm.billingAddress.firstName,
        lastName: this.checkoutForm.billingAddress.lastName,
        street: this.checkoutForm.billingAddress.street,
        city: this.checkoutForm.billingAddress.city,
        state: this.checkoutForm.billingAddress.state,
        zipCode: this.checkoutForm.billingAddress.zipCode,
        country: this.checkoutForm.billingAddress.country,
        phone: this.checkoutForm.billingAddress.phone,
        isDefault: false
      };
      
      // Create order
      const result = await this.orderService.createOrder(
        shippingAddress,
        billingAddress,
        this.selectedPaymentMethod.name,
        this.checkoutForm.notes
      );
      
      if (result.success && result.orderId) {
        // Traiter le paiement selon la méthode choisie
        const paymentResult = await this.processPayment(result.orderId, this.getFinalTotal());

        // Pour Wave et Orange Money, le paiement est en attente
        if (paymentResult.requiresExternalAction) {
          const user = this.authService.currentUser;
          if (user) {
            // Notification pour paiement en attente
            await this.notificationService.createNotification(
              user.id,
              'Commande en attente de paiement ⏳',
              `Veuillez compléter le paiement de ${this.getFinalTotal().toFixed(0)} FCFA pour finaliser votre commande.`,
              'order',
              `/account/orders/${result.orderId}`
            );
          }

          // Save addresses if requested
          if (this.saveShippingAddress) {
            await this.authService.saveAddress({
              type: 'shipping',
              firstName: this.checkoutForm.shippingAddress.firstName,
              lastName: this.checkoutForm.shippingAddress.lastName,
              street: this.checkoutForm.shippingAddress.street,
              city: this.checkoutForm.shippingAddress.city,
              state: this.checkoutForm.shippingAddress.state,
              zipCode: this.checkoutForm.shippingAddress.zipCode,
              country: this.checkoutForm.shippingAddress.country,
              phone: this.checkoutForm.shippingAddress.phone,
              isDefault: true
            });
          }

          if (this.saveBillingAddress && !this.sameAsShipping) {
            await this.authService.saveAddress({
              type: 'billing',
              firstName: this.checkoutForm.billingAddress.firstName,
              lastName: this.checkoutForm.billingAddress.lastName,
              street: this.checkoutForm.billingAddress.street,
              city: this.checkoutForm.billingAddress.city,
              state: this.checkoutForm.billingAddress.state,
              zipCode: this.checkoutForm.billingAddress.zipCode,
              country: this.checkoutForm.billingAddress.country,
              phone: this.checkoutForm.billingAddress.phone,
              isDefault: true
            });
          }

          // NE PAS vider le panier - l'utilisateur n'a pas encore payé
          this.toastService.info('Commande créée ! Veuillez compléter le paiement via le lien qui s\'est ouvert.', 5000);
          
          // Rediriger vers la page de la commande (pas de confirmation)
          this.router.navigate(['/account/orders', result.orderId]);
        } else if (paymentResult.success) {
          // Paiement immédiat réussi (Cash on Delivery)
          const user = this.authService.currentUser;
          if (user) {
            const orderNumber = result.orderId.substring(0, 8).toUpperCase();
            await this.emailService.sendOrderConfirmation(
              user.email,
              orderNumber,
              this.getFinalTotal(),
              this.cartItems
            );

            // Créer une notification
            await this.notificationService.createNotification(
              user.id,
              'Commande confirmée ! 🎉',
              `Votre commande a été validée avec succès. Montant: ${this.getFinalTotal().toFixed(0)} FCFA`,
              'order',
              `/account/orders/${result.orderId}`
            );
          }

          // Save addresses if requested
          if (this.saveShippingAddress) {
            await this.authService.saveAddress({
              type: 'shipping',
              firstName: this.checkoutForm.shippingAddress.firstName,
              lastName: this.checkoutForm.shippingAddress.lastName,
              street: this.checkoutForm.shippingAddress.street,
              city: this.checkoutForm.shippingAddress.city,
              state: this.checkoutForm.shippingAddress.state,
              zipCode: this.checkoutForm.shippingAddress.zipCode,
              country: this.checkoutForm.shippingAddress.country,
              phone: this.checkoutForm.shippingAddress.phone,
              isDefault: true
            });
          }

          if (this.saveBillingAddress && !this.sameAsShipping) {
            await this.authService.saveAddress({
              type: 'billing',
              firstName: this.checkoutForm.billingAddress.firstName,
              lastName: this.checkoutForm.billingAddress.lastName,
              street: this.checkoutForm.billingAddress.street,
              city: this.checkoutForm.billingAddress.city,
              state: this.checkoutForm.billingAddress.state,
              zipCode: this.checkoutForm.billingAddress.zipCode,
              country: this.checkoutForm.billingAddress.country,
              phone: this.checkoutForm.billingAddress.phone,
              isDefault: true
            });
          }

          // Vider le panier seulement si paiement confirmé
          await this.cartService.clearCart();

          // Redirect to success page
          this.paymentSuccess = true;
          this.toastService.success('Commande validée avec succès ! Vous allez être redirigé...', 3000);
          this.router.navigate(['/account/orders', result.orderId]);
        } else {
          // Paiement échoué
          this.paymentError = 'Le paiement a échoué. Veuillez réessayer.';
          this.toastService.error(this.paymentError);
        }
      } else {
        this.paymentError = result.error || 'Erreur lors de la création de la commande';
        this.toastService.error('Erreur lors de la création de la commande: ' + this.paymentError);
      }
    } catch (error: any) {
      console.error('Error placing order:', error);
      this.paymentError = error.message || 'Erreur inconnue';
      this.toastService.error('Erreur lors de la création de la commande: ' + this.paymentError);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Traiter le paiement selon la méthode choisie
   */
  private async processPayment(orderId: string, amount: number): Promise<{ success: boolean; requiresExternalAction: boolean }> {
    try {
      const method = this.selectedPaymentMethod;
      if (!method) return { success: false, requiresExternalAction: false };

      switch (method.id) {
        case 'wave':
          // Paiement Wave Money - nécessite une action externe
          const waveSuccess = await this.paymentService.processWavePayment(
            amount,
            this.paymentForm.mobileNumber,
            orderId
          );
          return { success: waveSuccess, requiresExternalAction: true };

        case 'orange_money':
          // Paiement Orange Money - nécessite une action externe
          const omSuccess = await this.paymentService.processOrangeMoneyPayment(
            amount,
            this.paymentForm.mobileNumber,
            orderId
          );
          return { success: omSuccess, requiresExternalAction: true };

        case 'cash_on_delivery':
          // Paiement à la livraison - validation immédiate
          await this.paymentService.createPaymentTransaction(
            orderId,
            `cod_${Date.now()}`,
            'cod', // Provider Cash on Delivery
            amount,
            'XOF',
            'pending'
          );
          return { success: true, requiresExternalAction: false };

        default:
          console.error('Unknown payment method:', method.id);
          return { success: false, requiresExternalAction: false };
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      return { success: false, requiresExternalAction: false };
    }
  }
}
