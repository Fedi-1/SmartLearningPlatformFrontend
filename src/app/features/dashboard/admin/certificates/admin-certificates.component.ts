// src/app/features/dashboard/admin/certificates/admin-certificates.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AdminService,
  AdminCertificateItem,
  CertificateVerifyResponse
} from '../../../../core/services/admin.service';

type StatusFilter = 'PENDING' | 'APPROVED' | 'REVOKED' | 'ALL';

interface Toast {
  message: string;
  type: 'success' | 'error';
  id: number;
}

interface PendingAction {
  certId: number;
  action: 'approve' | 'revoke';
}

@Component({
  selector: 'app-admin-certificates',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-certificates.component.html',
  styleUrl: './admin-certificates.component.scss'
})
export class AdminCertificatesComponent implements OnInit {

  loading = true;
  certificates: AdminCertificateItem[] = [];

  searchQuery = '';
  activeFilter: StatusFilter = 'PENDING';

  // Inline confirm state: certId → action
  pendingAction: PendingAction | null = null;
  processingId: number | null = null;

  // Toast queue
  toasts: Toast[] = [];
  private toastCounter = 0;

  // Verify modal
  verifyModalOpen = false;
  verifyUuid = '';
  verifyLoading = false;
  verifyResult: CertificateVerifyResponse | null = null;

  readonly AVATAR_COLORS = [
    '#6366f1', '#8b5cf6', '#06b6d4', '#22c55e',
    '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'
  ];

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.adminService.getAllCertificates().subscribe(list => {
      this.certificates = list;
      this.loading = false;
    });
  }

  // ── Filtering ──────────────────────────────────────────────────────────────

  get filtered(): AdminCertificateItem[] {
    const q = this.searchQuery.toLowerCase().trim();
    return this.certificates.filter(c => {
      const matchesTab = this.activeFilter === 'ALL' || c.status === this.activeFilter;
      const matchesSearch = !q ||
        c.studentName.toLowerCase().includes(q) ||
        c.courseTitle.toLowerCase().includes(q) ||
        c.studentEmail.toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }

  countFor(status: StatusFilter): number {
    if (status === 'ALL') return this.certificates.length;
    return this.certificates.filter(c => c.status === status).length;
  }

  setFilter(f: StatusFilter): void {
    this.activeFilter = f;
    this.pendingAction = null;
  }

  // ── Inline confirm ─────────────────────────────────────────────────────────

  requestAction(certId: number, action: 'approve' | 'revoke'): void {
    this.pendingAction = { certId, action };
  }

  cancelAction(): void {
    this.pendingAction = null;
  }

  confirmAction(): void {
    if (!this.pendingAction) return;
    const { certId, action } = this.pendingAction;
    this.pendingAction = null;
    this.processingId = certId;

    const call$ = action === 'approve'
      ? this.adminService.approveCertificate(certId)
      : this.adminService.revokeCertificate(certId);

    call$.subscribe({
      next: () => {
        const cert = this.certificates.find(c => c.id === certId);
        if (cert) {
          cert.status = action === 'approve' ? 'APPROVED' : 'REVOKED';
        }
        this.processingId = null;
        if (action === 'approve') {
          this.showToast('Certificate approved. Student notified.', 'success');
        } else {
          this.showToast('Certificate revoked. Student notified.', 'error');
        }
      },
      error: () => {
        this.processingId = null;
        this.showToast('Action failed. Please try again.', 'error');
      }
    });
  }

  // ── Toast ──────────────────────────────────────────────────────────────────

  showToast(message: string, type: 'success' | 'error'): void {
    const id = ++this.toastCounter;
    this.toasts.push({ message, type, id });
    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t.id !== id);
    }, 3000);
  }

  // ── Verify modal ───────────────────────────────────────────────────────────

  openVerifyModal(): void {
    this.verifyModalOpen = true;
    this.verifyUuid = '';
    this.verifyResult = null;
  }

  closeVerifyModal(): void {
    this.verifyModalOpen = false;
    this.verifyUuid = '';
    this.verifyResult = null;
    this.verifyLoading = false;
  }

  verify(): void {
    const uuid = this.verifyUuid.trim();
    if (!uuid) return;
    this.verifyLoading = true;
    this.verifyResult = null;
    this.adminService.verifyCertificate(uuid).subscribe(res => {
      this.verifyResult = res;
      this.verifyLoading = false;
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  avatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return this.AVATAR_COLORS[Math.abs(hash) % this.AVATAR_COLORS.length];
  }

  initials(name: string): string {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  scoreBadgeClass(score: number): string {
    if (score >= 80) return 'score-badge--high';
    if (score >= 60) return 'score-badge--mid';
    return 'score-badge--low';
  }

  isPending(cert: AdminCertificateItem): boolean {
    return this.pendingAction?.certId === cert.id;
  }
}
