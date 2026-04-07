import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, DashboardResponse } from '../../../core/services/dashboard.service';
import { ProgressChartsComponent } from './progress-charts.component';

interface ProgressStatsViewModel {
  totalCourses: number;
  completedCourses: number;
  totalQuizzes: number;
  averageQuizScore: number;
  flashcardsReviewed: number;
  studyMinutes: number;
}

interface QuizHistoryItem {
  name: string;
  score: number;
}

export interface CourseBreakdownItem {
  name: string;
  value: number;
  color: string;
}

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule, ProgressChartsComponent],
  templateUrl: './progress.component.html',
  styleUrl: './progress.component.scss'
})
export class ProgressComponent implements OnInit {

  loading = true;
  error = false;
  data: DashboardResponse | null = null;
  stats: ProgressStatsViewModel = {
    totalCourses: 0,
    completedCourses: 0,
    totalQuizzes: 0,
    averageQuizScore: 0,
    flashcardsReviewed: 0,
    studyMinutes: 0
  };

  quizHistory: QuizHistoryItem[] = [];
  courseBreakdown: CourseBreakdownItem[] = [];

  private readonly chartColors = ['#6366f1', '#10b981', '#f59e0b'];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.dashboardService.getDashboard().subscribe({
      next: (res) => {
        this.data = res;
        this.mapViewData(res);
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      }
    });
  }

  get quizzesAverageText(): string {
    return this.stats.averageQuizScore > 0 ? `Avg: ${this.stats.averageQuizScore}%` : 'Avg: N/A';
  }

  get formattedStudyTime(): string {
    if (this.stats.studyMinutes >= 60) {
      return `${Math.round(this.stats.studyMinutes / 60)}h`;
    }
    return `${this.stats.studyMinutes}m`;
  }

  private mapViewData(res: DashboardResponse): void {
    const completed = res.courses.filter((course) => course.progressPercentage === 100).length;
    const inProgress = res.courses.filter(
      (course) => course.progressPercentage > 0 && course.progressPercentage < 100
    ).length;
    const notStarted = res.courses.filter((course) => course.progressPercentage === 0).length;

    this.stats = {
      totalCourses: res.stats.totalCourses,
      completedCourses: res.stats.completedCourses,
      totalQuizzes: res.stats.totalQuizAttempts,
      averageQuizScore: Math.round(res.stats.averageQuizScore || 0),
      flashcardsReviewed: res.stats.totalFlashcards,
      studyMinutes: res.stats.totalStudyMinutes || 0
    };

    this.quizHistory = res.courses
      .filter((course) => course.totalQuizzes > 0)
      .slice(0, 10)
      .map((course, index) => {
        const score = course.totalQuizzes > 0
          ? Math.round((course.quizzesPassed / course.totalQuizzes) * 100)
          : 0;
        return {
          name: `Quiz ${index + 1}`,
          score
        };
      });

    this.courseBreakdown = [
      { name: 'Completed', value: completed, color: this.chartColors[0] },
      { name: 'In Progress', value: inProgress, color: this.chartColors[1] },
      { name: 'Not Started', value: notStarted, color: this.chartColors[2] }
    ].filter((item) => item.value > 0);
  }
}
