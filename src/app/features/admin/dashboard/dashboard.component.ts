import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartConfiguration } from 'chart.js';

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
  monthlyRevenue: number;
  weeklyRevenue: number;
  dailyRevenue: number;
  revenueGrowth: number;
  orderGrowth: number;
  recentOrders: any[];
  topProducts: any[];
  topCustomers: any[];
  orderStatusDistribution: any[];
  revenueByMonth: any[];
  lowStockProducts: any[];
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ChartComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  stats: Stats = {
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    totalProducts: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    averageOrderValue: 0,
    monthlyRevenue: 0,
    weeklyRevenue: 0,
    dailyRevenue: 0,
    revenueGrowth: 0,
    orderGrowth: 0,
    recentOrders: [],
    topProducts: [],
    topCustomers: [],
    orderStatusDistribution: [],
    revenueByMonth: [],
    lowStockProducts: []
  };
  
  isLoading = true;
  
  // Chart configurations
  revenueChartConfig?: ChartConfiguration;
  ordersChartConfig?: ChartConfiguration;
  categoryChartConfig?: ChartConfiguration;

  constructor(
    private supabase: SupabaseService,
    public currencyService: CurrencyService
  ) {}

  async ngOnInit() {
    await this.loadStats();
  }

  async loadStats() {
    try {
      this.isLoading = true;

      // Get orders with more details
      const { data: orders } = await this.supabase.client
        .from('orders')
        .select(`
          total, status, created_at, order_number, user_id,
          users!inner(first_name, last_name, email)
        `);

      if (orders) {
        this.stats.totalOrders = orders.length;
        this.stats.totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
        this.stats.pendingOrders = orders.filter(o => o.status === 'pending').length;
        this.stats.completedOrders = orders.filter(o => o.status === 'delivered').length;
        this.stats.cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
        this.stats.averageOrderValue = this.stats.totalOrders > 0 ? this.stats.totalRevenue / this.stats.totalOrders : 0;
        
        // Recent orders
        this.stats.recentOrders = orders
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);

        // Order status distribution
        this.stats.orderStatusDistribution = this.calculateOrderStatusDistribution(orders);

        // Revenue calculations
        this.calculateRevenueStats(orders);

        // Top customers
        this.stats.topCustomers = this.calculateTopCustomers(orders);
        
        // Initialize charts
        this.initializeCharts(orders);
      }

      // Get customers
      const { data: customers, count: customerCount } = await this.supabase.client
        .from('users')
        .select('*', { count: 'exact' })
        .eq('role', 'customer');

      this.stats.totalCustomers = customerCount || 0;

      // Get products with stock info
      const { data: products, count: productCount } = await this.supabase.client
        .from('products')
        .select('*, category:categories(name)')
        .eq('status', 'active');

      this.stats.totalProducts = productCount || 0;
      this.stats.lowStockProducts = products?.filter(p => p.stock < 10) || [];
      
      // Category chart
      if (products) {
        this.initializeCategoryChart(products);
      }

      // Get top products
      await this.loadTopProducts();

    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private calculateOrderStatusDistribution(orders: any[]) {
    const distribution = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(distribution).map(([status, count]) => ({
      status,
      count: count as number,
      percentage: ((count as number) / orders.length) * 100
    }));
  }

  private calculateRevenueStats(orders: any[]) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    this.stats.monthlyRevenue = orders
      .filter(o => new Date(o.created_at) >= startOfMonth)
      .reduce((sum, order) => sum + order.total, 0);

    this.stats.weeklyRevenue = orders
      .filter(o => new Date(o.created_at) >= startOfWeek)
      .reduce((sum, order) => sum + order.total, 0);

    this.stats.dailyRevenue = orders
      .filter(o => new Date(o.created_at) >= startOfDay)
      .reduce((sum, order) => sum + order.total, 0);

    // Calculate growth (simplified - comparing with previous period)
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthRevenue = orders
      .filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate >= previousMonth && orderDate < startOfMonth;
      })
      .reduce((sum, order) => sum + order.total, 0);

    this.stats.revenueGrowth = previousMonthRevenue > 0 
      ? ((this.stats.monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
      : 0;
  }

  private calculateTopCustomers(orders: any[]) {
    const customerStats = orders.reduce((acc, order) => {
      const userId = order.user_id;
      if (!acc[userId]) {
        acc[userId] = {
          user: order.users,
          totalSpent: 0,
          orderCount: 0
        };
      }
      acc[userId].totalSpent += order.total;
      acc[userId].orderCount += 1;
      return acc;
    }, {});

    return Object.values(customerStats)
      .sort((a: any, b: any) => b.totalSpent - a.totalSpent)
      .slice(0, 5);
  }

  private async loadTopProducts() {
    try {
      const { data: orderItems } = await this.supabase.client
        .from('order_items')
        .select(`
          quantity, price,
          products(name, id)
        `);

      if (orderItems) {
        const productStats: Record<string, any> = orderItems.reduce((acc: any, item: any) => {
          const productId = item.products?.id;
          if (productId) {
            if (!acc[productId]) {
              acc[productId] = {
                product: item.products,
                totalSold: 0,
                totalRevenue: 0
              };
            }
            acc[productId].totalSold += item.quantity;
            acc[productId].totalRevenue += item.quantity * item.price;
          }
          return acc;
        }, {});

        this.stats.topProducts = Object.values(productStats)
          .sort((a: any, b: any) => b.totalSold - a.totalSold)
          .slice(0, 5);
      }
    } catch (error) {
      console.error('Error loading top products:', error);
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

  private initializeCharts(orders: any[]) {
    // Revenue chart (last 7 days)
    const last7Days = this.getLast7Days();
    const revenueData = last7Days.map(date => {
      return orders
        .filter(o => this.isSameDay(new Date(o.created_at), date))
        .reduce((sum, order) => sum + order.total, 0);
    });

    this.revenueChartConfig = {
      type: 'line',
      data: {
        labels: last7Days.map(d => d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })),
        datasets: [{
          label: 'Revenus (FCFA)',
          data: revenueData,
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => this.currencyService.formatPrice(context.parsed.y)
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => this.currencyService.formatPrice(value as number)
            }
          }
        }
      }
    };

    // Orders chart (last 7 days)
    const ordersData = last7Days.map(date => {
      return orders.filter(o => this.isSameDay(new Date(o.created_at), date)).length;
    });

    this.ordersChartConfig = {
      type: 'bar',
      data: {
        labels: last7Days.map(d => d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })),
        datasets: [{
          label: 'Commandes',
          data: ordersData,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    };
  }

  private initializeCategoryChart(products: any[]) {
    // Group products by category
    const categoryStats = products.reduce((acc: any, product) => {
      const categoryName = product.category?.name || 'Sans catégorie';
      if (!acc[categoryName]) {
        acc[categoryName] = 0;
      }
      acc[categoryName] += 1;
      return acc;
    }, {});

    const labels = Object.keys(categoryStats);
    const data = Object.values(categoryStats) as number[];
    const colors = [
      'rgba(99, 102, 241, 0.8)',
      'rgba(236, 72, 153, 0.8)',
      'rgba(34, 197, 94, 0.8)',
      'rgba(249, 115, 22, 0.8)',
      'rgba(139, 92, 246, 0.8)',
      'rgba(6, 182, 212, 0.8)'
    ];

    this.categoryChartConfig = {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors.slice(0, labels.length),
          borderColor: colors.slice(0, labels.length).map(c => c.replace('0.8', '1')),
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    };
  }

  private getLast7Days(): Date[] {
    const days: Date[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      days.push(date);
    }
    return days;
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }
}
