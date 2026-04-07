import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardStats {
  totalCourses: number;
  completedCourses: number;
  totalLessons: number;
  completedLessons: number;
  totalQuizAttempts: number;
  passedQuizAttempts: number;
  averageQuizScore: number;
  flashcardsDueToday: number;
  totalFlashcards: number;
  totalStudyMinutes: number;
}

export interface DashboardCourse {
  courseId: number;
  title: string;
  category: string | null;
  progressPercentage: number;
  totalLessons: number;
  completedLessons: number;
  quizzesPassed: number;
  totalQuizzes: number;
  examPassed: boolean;
  lastAccessedAt: string | null;
}

export interface DashboardActivity {
  action: string;
  description: string;
  timestamp: string;
}

export interface DashboardFlashcardsDue {
  courseId: number;
  courseTitle: string;
  dueCount: number;
}

export interface DashboardResponse {
  stats: DashboardStats;
  courses: DashboardCourse[];
  recentActivity: DashboardActivity[];
  flashcardsDue: DashboardFlashcardsDue[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly API = 'http://localhost:8069/api/dashboard';

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(this.API);
  }
}
