import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { DashboardService, DashboardCourse } from '../../../core/services/dashboard.service';
import { DocumentService } from '../../../core/services/document.service';

@Component({
  selector: 'app-my-courses',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-courses.component.html',
  styleUrl: './my-courses.component.scss'
})
export class MyCoursesComponent implements OnInit, OnDestroy {

  loading = true;
  courses: DashboardCourse[] = [];
  error = false;

  private deleteSub?: Subscription;

  constructor(
    private dashboardService: DashboardService,
    private documentService: DocumentService
  ) {}

  ngOnInit(): void {
    this.loadCourses();

    // Reload whenever a document is deleted so the deleted course disappears
    this.deleteSub = this.documentService.documentDeleted$.subscribe(() => {
      this.loadCourses();
    });
  }

  ngOnDestroy(): void {
    this.deleteSub?.unsubscribe();
  }

  private loadCourses(): void {
    this.loading = true;
    this.dashboardService.getDashboard().subscribe({
      next: (res) => { this.courses = res.courses; this.loading = false; },
      error: ()    => { this.error = true; this.loading = false; }
    });
  }

  canTakeExam(course: DashboardCourse): boolean {
    return course.totalLessons > 0
      && course.completedLessons === course.totalLessons
      && course.quizzesPassed === course.totalQuizzes
      && !course.examPassed;
  }
}
