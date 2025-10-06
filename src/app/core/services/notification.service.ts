import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'promotion' | 'system' | 'review';
  isRead: boolean;
  link?: string;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  private realtimeChannel: any;

  constructor(
    private supabase: SupabaseService,
    private authService: AuthService
  ) {
    // Charger les notifications à l'initialisation si l'utilisateur est connecté
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.loadNotifications();
        this.subscribeToRealtimeNotifications();
      } else {
        this.cleanup();
      }
    });
  }

  /**
   * Charger toutes les notifications de l'utilisateur connecté
   */
  async loadNotifications(): Promise<void> {
    const user = this.supabase.currentUser;
    if (!user) return;

    const { data, error } = await this.supabase.client
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error loading notifications:', error);
      return;
    }

    if (data) {
      const notifications = this.mapNotifications(data);
      this.notificationsSubject.next(notifications);
      this.updateUnreadCount(notifications);
    }
  }

  /**
   * S'abonner aux notifications en temps réel
   */
  private async subscribeToRealtimeNotifications(): Promise<void> {
    const user = this.supabase.currentUser;
    if (!user) return;

    // Nettoyer l'ancien canal si existe
    if (this.realtimeChannel) {
      this.supabase.client.removeChannel(this.realtimeChannel);
    }

    // Créer un nouveau canal pour les notifications de l'utilisateur
    this.realtimeChannel = this.supabase.client
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload: any) => {
          const newNotification = this.mapNotification(payload.new);
          const currentNotifications = this.notificationsSubject.value;
          this.notificationsSubject.next([newNotification, ...currentNotifications]);
          this.updateUnreadCount([newNotification, ...currentNotifications]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload: any) => {
          const updatedNotification = this.mapNotification(payload.new);
          const currentNotifications = this.notificationsSubject.value;
          const index = currentNotifications.findIndex(n => n.id === updatedNotification.id);
          if (index !== -1) {
            currentNotifications[index] = updatedNotification;
            this.notificationsSubject.next([...currentNotifications]);
            this.updateUnreadCount(currentNotifications);
          }
        }
      )
      .subscribe();
  }

  /**
   * Marquer une notification comme lue
   */
  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      return;
    }

    // Mettre à jour localement
    const currentNotifications = this.notificationsSubject.value;
    const notification = currentNotifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
      this.notificationsSubject.next([...currentNotifications]);
      this.updateUnreadCount(currentNotifications);
    }
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  async markAllAsRead(): Promise<void> {
    const user = this.supabase.currentUser;
    if (!user) return;

    const { error } = await this.supabase.client
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return;
    }

    // Mettre à jour localement
    const currentNotifications = this.notificationsSubject.value;
    currentNotifications.forEach(n => n.isRead = true);
    this.notificationsSubject.next([...currentNotifications]);
    this.unreadCountSubject.next(0);
  }

  /**
   * Supprimer une notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Error deleting notification:', error);
      return;
    }

    // Mettre à jour localement
    const currentNotifications = this.notificationsSubject.value;
    const filtered = currentNotifications.filter(n => n.id !== notificationId);
    this.notificationsSubject.next(filtered);
    this.updateUnreadCount(filtered);
  }

  /**
   * Créer une notification (généralement côté serveur, mais peut être utilisé pour tests)
   */
  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: Notification['type'],
    link?: string
  ): Promise<void> {
    const { error } = await this.supabase.client
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        link,
        is_read: false
      });

    if (error) {
      console.error('Error creating notification:', error);
    }
  }

  /**
   * Mapper les données de Supabase vers le modèle Notification
   */
  private mapNotifications(data: any[]): Notification[] {
    return data.map(item => this.mapNotification(item));
  }

  private mapNotification(item: any): Notification {
    return {
      id: item.id,
      userId: item.user_id,
      title: item.title,
      message: item.message,
      type: item.type,
      isRead: item.is_read,
      link: item.link,
      createdAt: new Date(item.created_at)
    };
  }

  /**
   * Mettre à jour le compteur de notifications non lues
   */
  private updateUnreadCount(notifications: Notification[]): void {
    const unreadCount = notifications.filter(n => !n.isRead).length;
    this.unreadCountSubject.next(unreadCount);
  }

  /**
   * Nettoyer les abonnements
   */
  private cleanup(): void {
    if (this.realtimeChannel) {
      this.supabase.client.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
    this.notificationsSubject.next([]);
    this.unreadCountSubject.next(0);
  }

  /**
   * Obtenir l'icône selon le type de notification
   */
  getNotificationIcon(type: Notification['type']): string {
    switch (type) {
      case 'order':
        return '📦';
      case 'promotion':
        return '🎉';
      case 'system':
        return '⚙️';
      case 'review':
        return '⭐';
      default:
        return '🔔';
    }
  }

  /**
   * Obtenir la couleur selon le type
   */
  getNotificationColor(type: Notification['type']): string {
    switch (type) {
      case 'order':
        return 'text-blue-600';
      case 'promotion':
        return 'text-pink-600';
      case 'system':
        return 'text-gray-600';
      case 'review':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  }
}

