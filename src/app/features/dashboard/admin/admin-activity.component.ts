import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CourseService, SuspiciousActivityDTO } from '../../../core/services/course.service';

interface FlaggedAttempt {
  attemptId: number;
  activities: SuspiciousActivityDTO[];
  totalCount: number;
  loading: boolean;
  expanded: boolean;
}

@Component({
  selector: 'app-admin-activity',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-activity.component.html',
  styleUrl: './admin-activity.component.scss'
})
export class AdminActivityComponent implements OnInit {

  flaggedAttempts: FlaggedAttempt[] = [];
  loadingList = true;
  errorList   = false;

  // Manual lookup
  manualAttemptId: number | null = null;
  manualActivities: SuspiciousActivityDTO[] = [];
  manualLoading  = false;
  manualError    = '';
  manualSearched = false;

  constructor(
    private courseService: CourseService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['attemptId']) {
        this.manualAttemptId = +params['attemptId'];
        this.searchManual();
      }
    });

    this.courseService.getAdminFlaggedAttemptIds().subscribe({
      next: (ids) => {
        this.flaggedAttempts = ids.map(id => ({
          attemptId: id,
          activities: [],
          totalCount: 0,
          loading: false,
          expanded: false
        }));
        this.loadingList = false;
      },
      error: () => {
        this.errorList   = true;
        this.loadingList = false;
      }
    });
  }

  toggleAttempt(item: FlaggedAttempt): void {
    item.expanded = !item.expanded;
    if (item.expanded && item.activities.length === 0 && !item.loading) {
      item.loading = true;
      this.courseService.getAdminSuspiciousActivity(item.attemptId).subscribe({
        next: (activities) => {
          item.activities = activities;
          item.totalCount = activities[0]?.totalCount ?? 0;
          item.loading    = false;
        },
        error: () => { item.loading = false; }
      });
    }
  }

  searchManual(): void {
    if (!this.manualAttemptId) return;
    this.manualLoading  = true;
    this.manualError    = '';
    this.manualSearched = false;
    this.manualActivities = [];

    this.courseService.getAdminSuspiciousActivity(this.manualAttemptId).subscribe({
      next: (activities) => {
        this.manualActivities = activities;
        this.manualLoading    = false;
        this.manualSearched   = true;
        if (activities.length === 0) {
          this.manualError = 'Aucune activité suspecte trouvée pour cette tentative.';
        }
      },
      error: (err) => {
        this.manualLoading  = false;
        this.manualSearched = true;
        this.manualError    = err?.error?.message ?? 'Tentative introuvable ou accès refusé.';
      }
    });
  }

  activityLabel(type: string): string {
    const map: Record<string, string> = {
      TAB_SWITCH:      'Changement d\'onglet',
      RIGHT_CLICK:     'Clic droit',
      COPY_PASTE:      'Copier / Coller',
      UNUSUAL_TIMING:  'Timing suspect'
    };
    return map[type] ?? type;
  }

  activityIcon(type: string): string {
    const map: Record<string, string> = {
      TAB_SWITCH:     '🔀',
      RIGHT_CLICK:    '🖱️',
      COPY_PASTE:     '📋',
      UNUSUAL_TIMING: '⏱️'
    };
    return map[type] ?? '⚠️';
  }

  severityClass(count: number): string {
    if (count >= 10) return 'badge--red';
    if (count >= 5)  return 'badge--orange';
    return 'badge--yellow';
  }

  totalSeverityClass(total: number): string {
    if (total >= 15) return 'chip--red';
    if (total >= 8)  return 'chip--orange';
    return 'chip--yellow';
  }
}
