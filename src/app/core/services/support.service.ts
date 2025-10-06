import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export interface SupportTicket {
  id: string;
  userId: string;
  orderId?: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  userId: string;
  message: string;
  isStaffReply: boolean;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class SupportService {
  private ticketsSubject = new BehaviorSubject<SupportTicket[]>([]);
  public tickets$ = this.ticketsSubject.asObservable();

  constructor(
    private supabase: SupabaseService,
    private authService: AuthService
  ) {}

  /**
   * Créer un nouveau ticket de support
   */
  async createTicket(
    subject: string,
    description: string,
    orderId?: string,
    priority: SupportTicket['priority'] = 'medium'
  ): Promise<SupportTicket | null> {
    try {
      const user = this.supabase.currentUser;
      if (!user) return null;

      const { data, error } = await this.supabase.client
        .from('support_tickets')
        .insert({
          user_id: user.id,
          order_id: orderId || null,
          subject,
          description,
          priority,
          status: 'open'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating ticket:', error);
        return null;
      }

      const ticket = this.mapTicket(data);
      
      // Mettre à jour la liste locale
      const currentTickets = this.ticketsSubject.value;
      this.ticketsSubject.next([ticket, ...currentTickets]);

      return ticket;
    } catch (error) {
      console.error('Error creating ticket:', error);
      return null;
    }
  }

  /**
   * Récupérer tous les tickets de l'utilisateur
   */
  async getUserTickets(): Promise<SupportTicket[]> {
    try {
      const user = this.supabase.currentUser;
      if (!user) return [];

      const { data, error } = await this.supabase.client
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user tickets:', error);
        return [];
      }

      const tickets = data ? data.map(t => this.mapTicket(t)) : [];
      this.ticketsSubject.next(tickets);
      return tickets;
    } catch (error) {
      console.error('Error fetching user tickets:', error);
      return [];
    }
  }

  /**
   * Récupérer tous les tickets (admin)
   */
  async getAllTickets(filter?: {
    status?: SupportTicket['status'];
    priority?: SupportTicket['priority'];
  }): Promise<SupportTicket[]> {
    try {
      let query = this.supabase.client
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter?.status) {
        query = query.eq('status', filter.status);
      }

      if (filter?.priority) {
        query = query.eq('priority', filter.priority);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching all tickets:', error);
        return [];
      }

      return data ? data.map(t => this.mapTicket(t)) : [];
    } catch (error) {
      console.error('Error fetching all tickets:', error);
      return [];
    }
  }

  /**
   * Récupérer un ticket par ID
   */
  async getTicket(ticketId: string): Promise<SupportTicket | null> {
    try {
      const { data, error } = await this.supabase.client
        .from('support_tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

      if (error) {
        console.error('Error fetching ticket:', error);
        return null;
      }

      return data ? this.mapTicket(data) : null;
    } catch (error) {
      console.error('Error fetching ticket:', error);
      return null;
    }
  }

  /**
   * Mettre à jour le statut d'un ticket (admin)
   */
  async updateTicketStatus(
    ticketId: string,
    status: SupportTicket['status']
  ): Promise<boolean> {
    try {
      const updateData: any = { status };
      
      if (status === 'resolved' || status === 'closed') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await this.supabase.client
        .from('support_tickets')
        .update(updateData)
        .eq('id', ticketId);

      if (error) {
        console.error('Error updating ticket status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating ticket status:', error);
      return false;
    }
  }

  /**
   * Assigner un ticket à un membre du staff (admin)
   */
  async assignTicket(ticketId: string, staffUserId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.client
        .from('support_tickets')
        .update({
          assigned_to: staffUserId,
          status: 'in_progress'
        })
        .eq('id', ticketId);

      if (error) {
        console.error('Error assigning ticket:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error assigning ticket:', error);
      return false;
    }
  }

  /**
   * Ajouter un message à un ticket
   */
  async addMessage(
    ticketId: string,
    message: string,
    isStaffReply: boolean = false
  ): Promise<TicketMessage | null> {
    try {
      const user = this.supabase.currentUser;
      if (!user) return null;

      const { data, error } = await this.supabase.client
        .from('ticket_messages')
        .insert({
          ticket_id: ticketId,
          user_id: user.id,
          message,
          is_staff_reply: isStaffReply
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding message:', error);
        return null;
      }

      return this.mapMessage(data);
    } catch (error) {
      console.error('Error adding message:', error);
      return null;
    }
  }

  /**
   * Récupérer les messages d'un ticket
   */
  async getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
    try {
      const { data, error } = await this.supabase.client
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching ticket messages:', error);
        return [];
      }

      return data ? data.map(m => this.mapMessage(m)) : [];
    } catch (error) {
      console.error('Error fetching ticket messages:', error);
      return [];
    }
  }

  /**
   * Mapper les données Supabase vers le modèle SupportTicket
   */
  private mapTicket(data: any): SupportTicket {
    return {
      id: data.id,
      userId: data.user_id,
      orderId: data.order_id,
      subject: data.subject,
      description: data.description,
      status: data.status,
      priority: data.priority,
      assignedTo: data.assigned_to,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      resolvedAt: data.resolved_at ? new Date(data.resolved_at) : undefined
    };
  }

  /**
   * Mapper les données Supabase vers le modèle TicketMessage
   */
  private mapMessage(data: any): TicketMessage {
    return {
      id: data.id,
      ticketId: data.ticket_id,
      userId: data.user_id,
      message: data.message,
      isStaffReply: data.is_staff_reply,
      createdAt: new Date(data.created_at)
    };
  }

  /**
   * Obtenir la couleur du badge selon le statut
   */
  getStatusColor(status: SupportTicket['status']): string {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-700';
      case 'in_progress': return 'bg-yellow-100 text-yellow-700';
      case 'resolved': return 'bg-green-100 text-green-700';
      case 'closed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  /**
   * Obtenir la couleur du badge selon la priorité
   */
  getPriorityColor(priority: SupportTicket['priority']): string {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-700';
      case 'medium': return 'bg-blue-100 text-blue-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'urgent': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }
}

