import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminContentItem, AdminService } from '../../../../core/services/admin.service';

type ContentStatus = 'ALL' | 'COMPLETED' | 'PROCESSING' | 'FAILED' | 'UPLOADED';

@Component({
  selector: 'app-admin-content',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-content.component.html',
  styleUrl: './admin-content.component.scss'
})
export class AdminContentComponent implements OnInit {

  loading = true;
  deletingId: number | null = null;
  items: AdminContentItem[] = [];
  searchQuery = '';
  statusFilter: ContentStatus = 'ALL';
  errorMessage = '';
  successMessage = '';
  pendingDelete: AdminContentItem | null = null;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.load();
  }

  get filtered(): AdminContentItem[] {
    const q = this.searchQuery.trim().toLowerCase();
    return this.items.filter(item => {
      const matchesStatus = this.statusFilter === 'ALL' || item.documentStatus === this.statusFilter;
      const matchesSearch = !q ||
        item.documentFileName.toLowerCase().includes(q) ||
        (item.courseTitle ?? '').toLowerCase().includes(q) ||
        item.studentName.toLowerCase().includes(q) ||
        item.studentEmail.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }

  get generatedCount(): number {
    return this.items.filter(item => item.courseId !== null).length;
  }

  get documentsCount(): number {
    return this.items.length;
  }

  get failedCount(): number {
    return this.items.filter(item => item.documentStatus === 'FAILED').length;
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.adminService.getContentItems().subscribe({
      next: items => {
        this.items = items;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load platform content.';
        this.loading = false;
      }
    });
  }

  download(item: AdminContentItem): void {
    this.errorMessage = '';
    this.adminService.downloadDocument(item.documentId).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = item.documentFileName || `document-${item.documentId}`;
        link.click();
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.errorMessage = 'Could not download this document.';
      }
    });
  }

  deleteDocument(item: AdminContentItem): void {
    this.pendingDelete = item;
    this.errorMessage = '';
    this.successMessage = '';
  }

  closeDeleteModal(): void {
    if (this.deletingId !== null) return;
    this.pendingDelete = null;
  }

  confirmDelete(): void {
    const item = this.pendingDelete;
    if (!item || this.deletingId !== null) return;

    this.deletingId = item.documentId;
    this.errorMessage = '';
    this.successMessage = '';
    this.adminService.deleteDocument(item.documentId).subscribe({
      next: () => {
        this.items = this.items.filter(existing => existing.documentId !== item.documentId);
        this.successMessage = 'Document and related generated content deleted.';
        this.deletingId = null;
        this.pendingDelete = null;
      },
      error: err => {
        this.errorMessage = err?.error?.message ?? 'Failed to delete document.';
        this.deletingId = null;
      }
    });
  }

  formatDate(iso: string | null): string {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  formatSize(bytes: number): string {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
  }

  statusClass(status: string): string {
    return `status-badge--${status.toLowerCase()}`;
  }
}
