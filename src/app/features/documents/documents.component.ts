import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DocumentService } from '../../core/services/document.service';
import { CourseService } from '../../core/services/course.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { DocumentItem, FileType, CertificateInfo } from '../../core/models/document.model';

const ALLOWED_TYPES = ['application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_EXT   = ['pdf','docx','pptx','jpg','jpeg','png','webp'];
const MAX_SIZE      = 10 * 1024 * 1024;

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './documents.component.html',
  styleUrl:    './documents.component.scss'
})
export class DocumentsComponent implements OnInit {

  documents: DocumentItem[] = [];
  loadingDocs  = true;
  uploading    = false;
  dragOver     = false;

  selectedFile: File | null = null;

  showDeleteModal  = false;
  deletingId: number | null = null;

  selectedCategory: string | null = null;

  // Track which courseIds are currently fetching a certificate
  certLoading = new Set<number>();

  // Map of courseId → CertificateInfo (loaded on init)
  certificateMap = new Map<number, CertificateInfo>();

  getCertStatus(courseId: number): 'PENDING' | 'APPROVED' | 'REVOKED' | null {
    return this.certificateMap.get(courseId)?.status ?? null;
  }

  get availableCategories(): string[] {
    const cats = this.documents
      .map(d => d.category)
      .filter((c): c is string => !!c);
    return [...new Set(cats)].sort();
  }

  get filteredDocuments(): DocumentItem[] {
    if (!this.selectedCategory) return this.documents;
    return this.documents.filter(d => d.category === this.selectedCategory);
  }

  setCategory(cat: string | null): void {
    this.selectedCategory = cat;
  }

  constructor(
    private documentService: DocumentService,
    private courseService: CourseService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDocuments();
    this.loadCertificates();
  }

  loadCertificates(): void {
    this.courseService.getMyCertificates().subscribe({
      next: (certs) => {
        this.certificateMap = new Map(certs.map(c => [c.courseId, c]));
      },
      error: () => {} // silently ignore — button stays disabled
    });
  }

  loadDocuments(): void {
    this.loadingDocs = true;
    this.documentService.getMyDocuments().subscribe({
      next:  (docs: DocumentItem[]) => { this.documents = docs; this.loadingDocs = false; },
      error: ()   => { this.loadingDocs = false; }
    });
  }

  // ─── Drag & Drop ────────────────────────────────────────────────────────────
  @HostListener('dragover', ['$event'])
  onDragOver(e: DragEvent): void { e.preventDefault(); }

  onZoneDragOver(e: DragEvent): void  { e.preventDefault(); this.dragOver = true; }
  onZoneDragLeave(e: DragEvent): void { this.dragOver = false; }

  onZoneDrop(e: DragEvent): void {
    e.preventDefault();
    this.dragOver = false;
    const file = e.dataTransfer?.files?.[0];
    if (file) this.validateAndSetFile(file);
  }

  onFilePicked(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (file) this.validateAndSetFile(file);
    input.value = '';
  }

  private validateAndSetFile(file: File): void {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_EXT.includes(ext)) {
      this.toastService.error('Unsupported file type. Allowed: PDF, DOCX, PPTX, JPG, PNG, WEBP.');
      return;
    }
    if (file.size > MAX_SIZE) {
      this.toastService.error('File is too large. Maximum size is 10 MB.');
      return;
    }
    this.selectedFile = file;
  }

  clearFile(): void { this.selectedFile = null; }

  confirmUpload(): void {
    if (!this.selectedFile) return;
    this.uploading = true;
    this.documentService.upload(this.selectedFile).subscribe({
      next: (res: { courseId: number }) => {
        this.uploading    = false;
        this.selectedFile = null;
        this.toastService.success('Course generated successfully 🎉');
        this.loadDocuments();
        this.loadCertificates();
        this.router.navigate(['/dashboard/courses', res.courseId]);
      },
      error: (err: { error?: { message?: string } }) => {
        this.uploading = false;
        const msg = err?.error?.message ?? 'Upload failed. Please try again.';
        this.toastService.error(msg);
      }
    });
  }

  // ─── Delete ─────────────────────────────────────────────────────────────────
  openDeleteModal(id: number): void  { this.deletingId = id; this.showDeleteModal = true; }
  closeDeleteModal(): void           { this.deletingId = null; this.showDeleteModal = false; }

  confirmDelete(): void {
    if (!this.deletingId) return;
    this.documentService.deleteDocument(this.deletingId).subscribe({
      next: () => {
        this.toastService.success('Document deleted.');
        this.closeDeleteModal();
        this.loadDocuments();
      },
      error: () => {
        this.toastService.error('Failed to delete document.');
        this.closeDeleteModal();
      }
    });
  }

  viewCourse(courseId: number): void {
    this.router.navigate(['/dashboard/courses', courseId]);
  }

  downloadCertificate(courseId: number): void {
    if (this.certLoading.has(courseId)) return;
    const status = this.getCertStatus(courseId);
    if (status !== 'APPROVED') return;
    this.certLoading.add(courseId);
    this.courseService.getCourseCertificate(courseId).subscribe({
      next: (cert) => {
        this.certLoading.delete(courseId);
        window.open(this.courseService.downloadCertificateUrl(cert.id), '_blank');
      },
      error: () => {
        this.certLoading.delete(courseId);
        this.toastService.error('No certificate found for this course.');
      }
    });
  }

  // ─── Formatters ─────────────────────────────────────────────────────────────
  formatSize(bytes: number): string {
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / 1024).toFixed(0) + ' KB';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  fileTypeBadgeClass(type: FileType): string {
    const map: Record<FileType, string> = { PDF: 'badge--red', DOCX: 'badge--blue', PPTX: 'badge--orange', IMAGE: 'badge--purple' };
    return map[type] ?? '';
  }

  statusBadgeClass(status: string): string {
    const map: Record<string, string> = { PROCESSING: 'badge--yellow', COMPLETED: 'badge--green', FAILED: 'badge--red', UPLOADED: 'badge--grey' };
    return map[status] ?? '';
  }

  categoryBadgeColor(category: string | null): string {
    if (!category) return '';
    const palette = [
      '#6366f1', '#22c55e', '#f59e0b', '#3b82f6',
      '#ec4899', '#14b8a6', '#f97316', '#a855f7',
      '#ef4444', '#06b6d4', '#84cc16', '#e11d48'
    ];
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
      hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }
    return palette[Math.abs(hash) % palette.length];
  }
}
