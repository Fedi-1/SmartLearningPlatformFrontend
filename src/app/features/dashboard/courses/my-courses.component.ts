import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { DashboardService, DashboardCourse } from '../../../core/services/dashboard.service';
import { DocumentService } from '../../../core/services/document.service';

@Component({
  selector: 'app-my-courses',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './my-courses.component.html',
  styleUrl: './my-courses.component.scss'
})
export class MyCoursesComponent implements OnInit, OnDestroy {

  loading = true;
  courses: DashboardCourse[] = [];
  groupedCourses: Array<{ category: string; courses: DashboardCourse[] }> = [];
  selectedCategory = '';
  searchTerm = '';
  error = false;

  private deleteSub?: Subscription;

  constructor(
    private dashboardService: DashboardService,
    private documentService: DocumentService,
    private router: Router
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
      next: (res) => {
        this.courses = res.courses;
        this.groupedCourses = this.buildGroupedCourses(res.courses);
        this.selectedCategory = this.resolveSelectedCategory(this.selectedCategory, this.groupedCourses);
        this.loading = false;
      },
      error: ()    => { this.error = true; this.loading = false; }
    });
  }

  get selectedGroup(): { category: string; courses: DashboardCourse[] } | null {
    return this.groupedCourses.find(g => g.category === this.selectedCategory) ?? null;
  }

  onCategoryChange(category: string): void {
    this.selectedCategory = category;
  }

  get filteredSelectedCourses(): DashboardCourse[] {
    const selectedCourses = this.selectedGroup?.courses ?? [];
    const query = this.searchTerm.trim().toLowerCase();

    if (!query) {
      return selectedCourses;
    }

    return selectedCourses.filter((course) =>
      course.title.toLowerCase().includes(query)
    );
  }

  private buildGroupedCourses(courses: DashboardCourse[]): Array<{ category: string; courses: DashboardCourse[] }> {
    const grouped = new Map<string, DashboardCourse[]>();

    for (const course of courses) {
      const rawCategory = course.category?.trim();
      const category = rawCategory && rawCategory.length > 0 ? rawCategory : 'Uncategorized';
      const list = grouped.get(category) ?? [];
      list.push(course);
      grouped.set(category, list);
    }

    return Array.from(grouped.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([category, groupedList]) => ({
        category,
        courses: groupedList.sort((a, b) => a.title.localeCompare(b.title))
      }));
  }

  private resolveSelectedCategory(
    current: string,
    groups: Array<{ category: string; courses: DashboardCourse[] }>
  ): string {
    if (!groups.length) return '';
    const exists = groups.some(g => g.category === current);
    return exists ? current : groups[0].category;
  }

  canTakeExam(course: DashboardCourse): boolean {
    return course.totalLessons > 0
      && course.completedLessons === course.totalLessons
      && course.quizzesPassed === course.totalQuizzes
      && !course.examPassed;
  }

  goToExam(courseId: number): void {
    this.router.navigate(['/dashboard/courses', courseId], { queryParams: { tab: 'exam' } });
  }
}
