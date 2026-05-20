// src/app/core/services/admin.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

const API = 'http://localhost:8069/api/admin';

export interface AdminStats {
  totalStudents: number;
  totalCourses: number;
  totalCertificates: number;
  totalDocuments: number;
  examPassRate: number;
}

export interface ActivityChartPoint {
  date: string;
  count: number;
}

export interface CategoryDistributionPoint {
  category: string;
  count: number;
}

export interface RecentActivityEntry {
  studentName: string;
  action: string;
  timestamp: string;
}

export interface StudentSummary {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  lastLogin: string | null;
  coursesCount: number;
  engagementScore: number;
  engagementLevel: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface StudentCourseItem {
  id: number;
  title: string;
  category: string;
  lessonsCompleted: number;
  totalLessons: number;
  examPassed: boolean | null;
  examScore: number | null;
}

export interface StudentCertificateItem {
  id: number;
  courseTitle: string;
  score: number;
  issuedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REVOKED';
}

export interface AdminCertificateItem {
  id: number;
  certificateUUID: string;
  studentName: string;
  studentEmail: string;
  studentId: number;
  courseTitle: string;
  courseId: number;
  category: string;
  score: number;
  issuedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REVOKED';
}

export interface AdminExamAttemptItem {
  attemptId: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  category: string;
  score: number;
  isPassed: boolean;
  attemptNumber: number;
  submittedAt: string;
  hasSuspiciousActivity: boolean;
  suspiciousEventsCount: number;
}

export interface ActivityLogItem {
  id: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  action: string;
  entityType: string;
  entityId: number;
  timestamp: string;
}

export interface ActivityLogPageResponse {
  content: ActivityLogItem[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

export interface AdminContentItem {
  documentId: number;
  documentFileName: string;
  documentFileType: string;
  documentStatus: string;
  documentFileSize: number;
  documentUploadedAt: string | null;
  documentCategory: string | null;
  studentId: number;
  studentName: string;
  studentEmail: string;
  courseId: number | null;
  courseTitle: string | null;
  courseCategory: string | null;
  totalLessons: number;
}

export interface StudentDetail {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  dateOfBirth: string | null;
  isActive: boolean;
  createdAt: string;
  lastLogin: string | null;
  engagementScore: number;
  engagementLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  courses: StudentCourseItem[];
  certificates: StudentCertificateItem[];
}

export interface StudentExamAttemptItem {
  id: number;
  courseTitle: string;
  score: number;
  isPassed: boolean;
  attemptNumber: number;
  submittedAt: string | null;
}

export interface UpdateStudentProfileRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  dateOfBirth: string | null;
}

@Injectable({ providedIn: 'root' })
export class AdminService {

  constructor(private http: HttpClient) {}

  getStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${API}/stats`).pipe(
      catchError(() => of({ totalStudents: 0, totalCourses: 0, totalCertificates: 0, totalDocuments: 0, examPassRate: 0 }))
    );
  }

  getActivityChart(days = 30): Observable<ActivityChartPoint[]> {
    return this.http.get<ActivityChartPoint[]>(`${API}/activity-chart`, { params: { days } }).pipe(
      catchError(() => of([]))
    );
  }

  getCategoryDistribution(): Observable<CategoryDistributionPoint[]> {
    return this.http.get<CategoryDistributionPoint[]>(`${API}/category-distribution`).pipe(
      catchError(() => of([]))
    );
  }

  getContentItems(): Observable<AdminContentItem[]> {
    return this.http.get<AdminContentItem[]>(`${API}/content`).pipe(
      catchError(() => of([]))
    );
  }

  downloadDocument(documentId: number): Observable<Blob> {
    return this.http.get(`${API}/documents/${documentId}/download`, { responseType: 'blob' });
  }

  deleteDocument(documentId: number): Observable<void> {
    return this.http.delete<void>(`${API}/documents/${documentId}`);
  }

  getRecentActivity(limit = 5): Observable<RecentActivityEntry[]> {
    return this.http.get<RecentActivityEntry[]>(`${API}/recent-activity`, { params: { limit } }).pipe(
      catchError(() => of([]))
    );
  }

  getAllStudents(): Observable<StudentSummary[]> {
    return this.http.get<StudentSummary[]>(`${API}/students`).pipe(
      catchError(() => of([]))
    );
  }

  getStudentDetail(studentId: number): Observable<StudentDetail> {
    return this.http.get<StudentDetail>(`${API}/students/${studentId}/detail`);
  }

  getStudentExamAttempts(studentId: number): Observable<StudentExamAttemptItem[]> {
    return this.http.get<StudentExamAttemptItem[]>(`${API}/students/${studentId}/exam-attempts`).pipe(
      catchError(() => of([]))
    );
  }

  toggleStudentStatus(studentId: number): Observable<boolean> {
    return this.http.patch<boolean>(`${API}/students/${studentId}/toggle-status`, {});
  }

  updateStudentProfile(studentId: number, request: UpdateStudentProfileRequest): Observable<StudentDetail> {
    return this.http.put<StudentDetail>(`${API}/students/${studentId}/profile`, request);
  }

  getAllCertificates(): Observable<AdminCertificateItem[]> {
    return this.http.get<AdminCertificateItem[]>(`${API}/certificates`).pipe(
      catchError(() => of([]))
    );
  }

  approveCertificate(id: number): Observable<void> {
    return this.http.patch<void>(`${API}/certificates/${id}/approve`, {});
  }

  revokeCertificate(id: number): Observable<void> {
    return this.http.patch<void>(`${API}/certificates/${id}/revoke`, {});
  }

  getAllExamAttempts(): Observable<AdminExamAttemptItem[]> {
    return this.http.get<AdminExamAttemptItem[]>(`${API}/exam-attempts`).pipe(
      catchError(() => of([]))
    );
  }

  getActivityLogs(
    page: number,
    size: number,
    action: string,
    studentId: number | null,
    startDate?: string,
    endDate?: string
  ): Observable<ActivityLogPageResponse> {
    let params: Record<string, string | number> = { page, size };
    if (action) params['action'] = action;
    if (studentId !== null) params['studentId'] = studentId;
    if (startDate) params['startDate'] = startDate;
    if (endDate) params['endDate'] = endDate;
    return this.http.get<ActivityLogPageResponse>(`${API}/activity-logs`, { params }).pipe(
      catchError(() => of({ content: [], totalElements: 0, totalPages: 0, currentPage: 0 }))
    );
  }
}
