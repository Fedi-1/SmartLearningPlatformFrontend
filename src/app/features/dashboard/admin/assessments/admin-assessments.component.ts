// src/app/features/dashboard/admin/assessments/admin-assessments.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  AdminService,
  AdminExamAttemptItem
} from '../../../../core/services/admin.service';

type StatusFilter = 'ALL' | 'PASSED' | 'FAILED';

@Component({
  selector: 'app-admin-assessments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-assessments.component.html',
  styleUrl: './admin-assessments.component.scss'
})
export class AdminAssessmentsComponent implements OnInit {

  loading = true;
  attempts: AdminExamAttemptItem[] = [];
  searchQuery = '';
  activeFilter: StatusFilter = 'ALL';

  readonly AVATAR_COLORS = [
    '#6366f1', '#8b5cf6', '#06b6d4', '#22c55e',
    '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'
  ];

  constructor(
    private adminService: AdminService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.adminService.getAllExamAttempts().subscribe(list => {
      this.attempts = list;
      this.loading = false;
    });
  }

  // ── Filters ────────────────────────────────────────────────────────────────

  get filtered(): AdminExamAttemptItem[] {
    const q = this.searchQuery.toLowerCase().trim();
    return this.attempts.filter(a => {
      const matchesTab =
        this.activeFilter === 'ALL' ||
        (this.activeFilter === 'PASSED' && a.isPassed) ||
        (this.activeFilter === 'FAILED' && !a.isPassed);
      const matchesSearch =
        !q ||
        a.studentName.toLowerCase().includes(q) ||
        a.courseTitle.toLowerCase().includes(q) ||
        a.studentEmail.toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }

  countFor(f: StatusFilter): number {
    if (f === 'ALL') return this.attempts.length;
    if (f === 'PASSED') return this.attempts.filter(a => a.isPassed).length;
    return this.attempts.filter(a => !a.isPassed).length;
  }

  setFilter(f: StatusFilter): void {
    this.activeFilter = f;
  }

  // ── Summary stats ──────────────────────────────────────────────────────────

  get totalAttempts(): number {
    return this.attempts.length;
  }

  get passRate(): string {
    if (this.attempts.length === 0) return '0%';
    const passed = this.attempts.filter(a => a.isPassed).length;
    return Math.round((passed / this.attempts.length) * 100) + '%';
  }

  get flaggedCount(): number {
    return this.attempts.filter(a => a.hasSuspiciousActivity).length;
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  goToAntiCheat(attemptId: number): void {
    this.router.navigate(['/dashboard/admin/activity'], {
      queryParams: { attemptId }
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

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  scoreBadgeClass(score: number | null): string {
    if (score === null || score === undefined) return 'score-badge--low';
    if (score >= 80) return 'score-badge--high';
    if (score >= 60) return 'score-badge--mid';
    return 'score-badge--low';
  }
}
