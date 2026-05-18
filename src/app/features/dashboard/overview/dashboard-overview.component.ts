import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  DashboardService,
  DashboardResponse,
  DashboardCourse,
  DashboardActivity,
  DashboardFlashcardsDue
} from '../../../core/services/dashboard.service';

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-overview.component.html',
  styleUrl: './dashboard-overview.component.scss'
})
export class DashboardOverviewComponent implements OnInit {

  loading = true;
  data: DashboardResponse | null = null;
  error = false;

  constructor(
    private dashboardService: DashboardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.dashboardService.getDashboard().subscribe({
      next: (res) => { this.data = res; this.loading = false; },
      error: ()    => { this.error = true; this.loading = false; }
    });
  }

  goToReview(courseId: number): void {
    this.router.navigate(['/dashboard/flashcards', courseId, 'review']);
  }

  activityIconClass(action: string): string {
    const map: Record<string, string> = {
      UPLOAD_DOCUMENT:      'activity-item__icon--document',
      GENERATE_COURSE:      'activity-item__icon--course',
      TAKE_QUIZ:            'activity-item__icon--quiz',
      TAKE_EXAM:            'activity-item__icon--exam',
      PASS_EXAM:            'activity-item__icon--award',
      FAIL_EXAM:            'activity-item__icon--error',
      REVIEW_FLASHCARD:     'activity-item__icon--cards',
      DOWNLOAD_CERTIFICATE: 'activity-item__icon--certificate'
    };
    return map[action] ?? 'activity-item__icon--default';
  }

  relativeTime(ts: string): string {
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  formatDate(ts: string | null): string {
    if (!ts) return '';
    return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }
}
