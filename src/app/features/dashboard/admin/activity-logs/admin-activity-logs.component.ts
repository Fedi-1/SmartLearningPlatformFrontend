// src/app/features/dashboard/admin/activity-logs/admin-activity-logs.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AdminService,
  ActivityLogItem,
  ActivityLogPageResponse
} from '../../../../core/services/admin.service';

type ActionFilter =
  | ''
  | 'UPLOAD_DOCUMENT'
  | 'GENERATE_COURSE'
  | 'PASS_EXAM'
  | 'FAIL_EXAM'
  | 'DOWNLOAD_CERTIFICATE';

@Component({
  selector: 'app-admin-activity-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-activity-logs.component.html',
  styleUrl: './admin-activity-logs.component.scss'
})
export class AdminActivityLogsComponent implements OnInit {

  loading = true;
  logs: ActivityLogItem[] = [];
  totalElements = 0;
  totalPages = 0;
  currentPage = 0;
  readonly pageSize = 20;

  actionFilter: ActionFilter = '';
  studentNameFilter = '';

  // For student name → id matching (loaded lazily from the already-fetched logs)
  private studentIdByName: Map<string, number> = new Map();

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
    const studentId = this.resolveStudentId();
    this.adminService.getActivityLogs(this.currentPage, this.pageSize, this.actionFilter, studentId)
      .subscribe((resp: ActivityLogPageResponse) => {
        this.logs = resp.content;
        this.totalElements = resp.totalElements;
        this.totalPages = resp.totalPages;
        this.currentPage = resp.currentPage;
        // Build name → id map for future filter calls
        resp.content.forEach(l => this.studentIdByName.set(l.studentName.toLowerCase(), l.studentId));
        this.loading = false;
      });
  }

  onActionChange(): void {
    this.currentPage = 0;
    this.load();
  }

  onStudentFilterChange(): void {
    this.currentPage = 0;
    this.load();
  }

  clearFilters(): void {
    this.actionFilter = '';
    this.studentNameFilter = '';
    this.currentPage = 0;
    this.load();
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.load();
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  get showingFrom(): number {
    if (this.totalElements === 0) return 0;
    return this.currentPage * this.pageSize + 1;
  }

  get showingTo(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private resolveStudentId(): number | null {
    if (!this.studentNameFilter.trim()) return null;
    const key = this.studentNameFilter.trim().toLowerCase();
    return this.studentIdByName.get(key) ?? null;
  }

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

  formatTimestamp(ts: string): string {
    if (!ts) return '—';
    const d = new Date(ts);
    const day   = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const time  = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return `${day} at ${time}`;
  }

  actionLabel(action: string): string {
    const map: Record<string, string> = {
      UPLOAD_DOCUMENT:      'Upload Document',
      GENERATE_COURSE:      'Generate Course',
      PASS_EXAM:            'Pass Exam',
      FAIL_EXAM:            'Fail Exam',
      DOWNLOAD_CERTIFICATE: 'Download Certificate'
    };
    return map[action] ?? action;
  }

  actionBadgeClass(action: string): string {
    const map: Record<string, string> = {
      GENERATE_COURSE:      'action-badge--course',
      UPLOAD_DOCUMENT:      'action-badge--upload',
      PASS_EXAM:            'action-badge--pass',
      FAIL_EXAM:            'action-badge--fail',
      DOWNLOAD_CERTIFICATE: 'action-badge--cert'
    };
    return map[action] ?? '';
  }

  entityLabel(type: string, id: number): string {
    if (!type) return '—';
    return `${type} #${id}`;
  }
}
