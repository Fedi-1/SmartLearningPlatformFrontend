import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

// Redirect /courses/:courseId → /dashboard/courses/:courseId
function courseRedirectGuard() {
  const route  = inject(ActivatedRoute);
  const router = inject(Router);
  const id = route.snapshot.paramMap.get('courseId');
  router.navigate(['/dashboard/courses', id], { replaceUrl: true });
  return false;
}

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'verify-email',
    loadComponent: () => import('./features/auth/verify-email/verify-email.component').then(m => m.VerifyEmailComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'student/dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/student/dashboard/student-dashboard.component').then(m => m.StudentDashboardComponent)
  },
  {
    path: 'documents',
    canActivate: [authGuard],
    loadComponent: () => import('./features/documents/documents.component').then(m => m.DocumentsComponent)
  },
  {
    path: 'courses/:courseId',
    canActivate: [authGuard, courseRedirectGuard],
    loadComponent: () => import('./features/courses/viewer/course-viewer.component').then(m => m.CourseViewerComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/shell/dashboard-shell.component').then(m => m.DashboardShellComponent),
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () => import('./features/dashboard/overview/dashboard-overview.component').then(m => m.DashboardOverviewComponent)
      },
      {
        path: 'documents',
        loadComponent: () => import('./features/documents/documents.component').then(m => m.DocumentsComponent)
      },
      {
        path: 'courses',
        loadComponent: () => import('./features/dashboard/courses/my-courses.component').then(m => m.MyCoursesComponent)
      },
      {
        path: 'courses/:courseId',
        loadComponent: () => import('./features/courses/viewer/course-viewer.component').then(m => m.CourseViewerComponent)
      },
      {
        path: 'flashcards',
        loadComponent: () => import('./features/dashboard/flashcards/flashcards-overview.component').then(m => m.FlashcardsOverviewComponent)
      },
      {
        path: 'flashcards/:courseId/review',
        loadComponent: () => import('./features/dashboard/flashcards/flashcard-review.component').then(m => m.FlashcardReviewComponent)
      },
      {
        path: 'progress',
        loadComponent: () => import('./features/dashboard/progress/progress.component').then(m => m.ProgressComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/dashboard/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'admin/activity',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/dashboard/admin/admin-activity.component').then(m => m.AdminActivityComponent)
      },
      {
        path: 'admin/overview',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/dashboard/admin/overview/admin-overview.component').then(m => m.AdminOverviewComponent)
      },
      {
        path: 'admin/students',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/dashboard/admin/students/admin-students.component').then(m => m.AdminStudentsComponent)
      },
      {
        path: 'admin/certificates',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/dashboard/admin/certificates/admin-certificates.component').then(m => m.AdminCertificatesComponent)
      },
      {
        path: 'admin/assessments',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/dashboard/admin/assessments/admin-assessments.component').then(m => m.AdminAssessmentsComponent)
      },
      {
        path: 'admin/activity-logs',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/dashboard/admin/activity-logs/admin-activity-logs.component').then(m => m.AdminActivityLogsComponent)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
