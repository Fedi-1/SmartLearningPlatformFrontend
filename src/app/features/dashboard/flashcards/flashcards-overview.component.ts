import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DashboardService, DashboardFlashcardsDue } from '../../../core/services/dashboard.service';

@Component({
  selector: 'app-flashcards-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './flashcards-overview.component.html',
  styleUrl: './flashcards-overview.component.scss'
})
export class FlashcardsOverviewComponent implements OnInit {

  loading = true;
  dueList: DashboardFlashcardsDue[] = [];
  error = false;
  nextReview: string | null = null;
  lowExpanded = false;

  constructor(
    private dashboardService: DashboardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.dashboardService.getDashboard().subscribe({
      next: (res) => {
        this.dueList = res.flashcardsDue;
        this.loading = false;
      },
      error: () => { this.error = true; this.loading = false; }
    });
  }

  get allCaughtUp(): boolean {
    return this.dueList.every(f => f.dueCount === 0);
  }

  get sortedDueList(): DashboardFlashcardsDue[] {
    return [...this.dueList]
      .filter(course => course.dueCount > 0)
      .sort((a, b) => b.dueCount - a.dueCount);
  }

  get urgentCourses(): DashboardFlashcardsDue[] {
    return this.sortedDueList.filter(course => course.dueCount >= 12);
  }

  get moderateCourses(): DashboardFlashcardsDue[] {
    return this.sortedDueList.filter(course => course.dueCount >= 7 && course.dueCount < 12);
  }

  get lowCourses(): DashboardFlashcardsDue[] {
    return this.sortedDueList.filter(course => course.dueCount < 7);
  }

  get totalDueCards(): number {
    return this.sortedDueList.reduce((sum, course) => sum + course.dueCount, 0);
  }

  get totalCourses(): number {
    return this.sortedDueList.length;
  }

  get urgentCoursesCount(): number {
    return this.urgentCourses.length;
  }

  get hasLowCourses(): boolean {
    return this.lowCourses.length > 0;
  }

  toggleLowPriority(): void {
    this.lowExpanded = !this.lowExpanded;
  }

  // Backend currently returns only dueCount per course for this widget.
  // Use dueCount as the known total to avoid changing data contracts.
  totalCards(course: DashboardFlashcardsDue): number {
    return Math.max(course.dueCount, 1);
  }

  progressPercent(course: DashboardFlashcardsDue): number {
    return Math.min(100, Math.round((course.dueCount / this.totalCards(course)) * 100));
  }

  startReview(courseId: number): void {
    this.router.navigate(['/dashboard/flashcards', courseId, 'review']);
  }
}
