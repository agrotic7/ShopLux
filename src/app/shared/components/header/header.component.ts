import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { ProductService } from '../../../core/services/product.service';
import { User } from '../../../core/models/user.model';
import { Category } from '../../../core/models/product.model';
import { NotificationsComponent } from '../notifications/notifications.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NotificationsComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  isAuthenticated = false;
  currentUser: User | null = null;
  cartItemCount = 0;
  categories: Category[] = [];
  searchQuery = '';
  showMobileMenu = false;
  showUserMenu = false;
  showSearchBar = false;

  constructor(
    public authService: AuthService,
    public cartService: CartService,
    private productService: ProductService,
    private router: Router,
    private elementRef: ElementRef
  ) {}

  ngOnInit() {
    this.authService.isAuthenticated$.subscribe(
      isAuth => this.isAuthenticated = isAuth
    );

    this.authService.currentUser$.subscribe(
      user => {
        this.currentUser = user;
      }
    );

    this.cartService.cart$.subscribe(
      cart => this.cartItemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0)
    );

    this.productService.categories$.subscribe(
      categories => this.categories = categories.filter(c => !c.parentId).slice(0, 6)
    );
  }

  onSearch() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/products'], { 
        queryParams: { search: this.searchQuery } 
      });
      this.searchQuery = '';
      this.showSearchBar = false;
    }
  }

  async logout() {
    await this.authService.signOut();
    this.showUserMenu = false;
  }

  toggleMobileMenu() {
    this.showMobileMenu = !this.showMobileMenu;
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }

  toggleSearchBar() {
    this.showSearchBar = !this.showSearchBar;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    // Fermer le menu utilisateur si on clique en dehors
    if (this.showUserMenu && !this.elementRef.nativeElement.contains(event.target)) {
      this.showUserMenu = false;
    }
    
    // Fermer le menu mobile si on clique en dehors
    if (this.showMobileMenu && !this.elementRef.nativeElement.contains(event.target)) {
      this.showMobileMenu = false;
    }
    
    // Fermer la barre de recherche si on clique en dehors
    if (this.showSearchBar && !this.elementRef.nativeElement.contains(event.target)) {
      this.showSearchBar = false;
    }
  }

}

