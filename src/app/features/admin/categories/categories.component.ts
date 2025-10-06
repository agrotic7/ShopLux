import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { ToastService } from '../../../core/services/toast.service';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentId: string | null;
  image: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
}

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class AdminCategoriesComponent implements OnInit {
  categories: Category[] = [];
  isLoading = true;
  showModal = false;
  editMode = false;
  
  currentCategory = {
    id: '',
    name: '',
    slug: '',
    description: '',
    parent_id: null as string | null,
    image: '',
    order: 0,
    is_active: true
  };

  constructor(private supabase: SupabaseService,
    private toastService: ToastService
  ) {}

  async ngOnInit() {
    await this.loadCategories();
  }

  async loadCategories() {
    try {
      this.isLoading = true;
      const { data, error } = await this.supabase.client
        .from('categories')
        .select('*')
        .order('order', { ascending: true });

      if (error) throw error;

      this.categories = (data || []).map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        parentId: cat.parent_id,
        image: cat.image,
        order: cat.order,
        isActive: cat.is_active,
        createdAt: new Date(cat.created_at)
      }));
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      this.isLoading = false;
    }
  }

  openCreateModal() {
    this.editMode = false;
    this.currentCategory = {
      id: '',
      name: '',
      slug: '',
      description: '',
      parent_id: null,
      image: '',
      order: 0,
      is_active: true
    };
    this.showModal = true;
  }

  openEditModal(category: Category) {
    this.editMode = true;
    this.currentCategory = {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      parent_id: category.parentId,
      image: category.image,
      order: category.order,
      is_active: category.isActive
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  async saveCategory() {
    try {
      if (!this.currentCategory.name) {
        this.toastService.warning('Le nom est requis');
        return;
      }

      // Generate slug from name
      this.currentCategory.slug = this.currentCategory.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      if (this.editMode) {
        const { error } = await this.supabase.client
          .from('categories')
          .update({
            name: this.currentCategory.name,
            slug: this.currentCategory.slug,
            description: this.currentCategory.description,
            parent_id: this.currentCategory.parent_id,
            image: this.currentCategory.image,
            order: this.currentCategory.order,
            is_active: this.currentCategory.is_active
          })
          .eq('id', this.currentCategory.id);

        if (error) throw error;
        this.toastService.success('Catégorie mise à jour avec succès!');
      } else {
        const { error } = await this.supabase.client
          .from('categories')
          .insert([this.currentCategory]);

        if (error) throw error;
        this.toastService.success('Catégorie créée avec succès!');
      }

      this.closeModal();
      await this.loadCategories();
    } catch (error: any) {
      console.error('Error saving category:', error);
      this.toastService.info('Erreur: ' + error.message);
    }
  }

  async deleteCategory(category: Category) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${category.name}" ?`)) {
      return;
    }

    try {
      const { error } = await this.supabase.client
        .from('categories')
        .delete()
        .eq('id', category.id);

      if (error) throw error;

      this.toastService.success('Catégorie supprimée avec succès!');
      await this.loadCategories();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      this.toastService.info('Erreur: ' + error.message);
    }
  }

  async toggleCategoryStatus(category: Category) {
    try {
      const { error } = await this.supabase.client
        .from('categories')
        .update({ is_active: !category.isActive })
        .eq('id', category.id);

      if (error) throw error;

      await this.loadCategories();
    } catch (error: any) {
      console.error('Error updating status:', error);
      this.toastService.info('Erreur: ' + error.message);
    }
  }

  getParentCategoryName(parentId: string | null): string {
    if (!parentId) return '-';
    const parent = this.categories.find(c => c.id === parentId);
    return parent ? parent.name : '-';
  }
}

