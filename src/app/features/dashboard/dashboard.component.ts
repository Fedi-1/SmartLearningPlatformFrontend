import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  DashboardService,
  DashboardResponse,
  DashboardCourse,
  DashboardActivity,
  DashboardFlashcardsDue
} from '../../core/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

  loading = true;
  data: DashboardResponse | null = null;
  error = false;

  constructor(
    private dashboardService: DashboardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.dashboardService.getDashboard().subscribe({
      next: (res) => {
        this.data    = res;
        this.loading = false;
      },
      error: () => {
        this.error   = true;
        this.loading = false;
      }
    });
  }

  goToFlashcardSession(courseId: number): void {
    this.router.navigate(['/courses', courseId], { queryParams: { tab: 'flashcards' } });
  }

  activityIcon(action: string): string {
    const icons: Record<string, string> = {
      UPLOAD_DOCUMENT:      '📄',
      GENERATE_COURSE:      '🧠',
      COMPLETE_LESSON:      '✅',
      TAKE_QUIZ:            '🎯',
      TAKE_EXAM:            '📝',
      PASS_EXAM:            '🏆',
      FAIL_EXAM:            '❌',
      REVIEW_FLASHCARD:     '🃏',
      DOWNLOAD_CERTIFICATE: '🎓'
    };
    return icons[action] ?? '📌';
  }

  formatDate(ts: string | null): string {
    if (!ts) return '';
    return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatDateTime(ts: string | null): string {
    if (!ts) return '';
    return new Date(ts).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
}
