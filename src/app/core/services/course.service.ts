import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CourseDetail,
  ExamInfo,
  ExamAttemptInfo,
  SubmitExamResponse,
  CertificateInfo,
} from '../models/document.model';

export interface LessonProgressResponse {
  id: number;
  lessonId: number;
  isCompleted: boolean;
  isLocked: boolean;
  quizPassed: boolean;
}

export interface LessonProgressItem {
  lessonId: number;
  isCompleted: boolean;
  isLocked: boolean;
  quizPassed: boolean;
}

export interface QuizAttemptResponse {
  id: number;
  quizId: number;
  attemptNumber: number;
  score: number;
  isPassed: boolean;
  startedAt: string;
  submittedAt: string | null;
  finishReason: string | null;
  attemptsUsed: number;
  maxAttempts: number;
  timeLimitMinutes: number | null;
  questions: import('../models/document.model').QuizQuestionItem[] | null;
}

export interface AnswerRequest {
  questionId: number;
  studentAnswer: string;
}

export interface SubmitQuizResponse {
  attemptId: number;
  score: number;
  isPassed: boolean;
  attemptsUsed: number;
  maxAttempts: number;
  attemptsExhausted: boolean;
  lessonProgress: LessonProgressResponse | null;
}

export type FlashcardRating = 'AGAIN' | 'GOOD' | 'EASY';

export interface FlashcardReviewResponse {
  id: number;
  flashcardId: number;
  term: string;
  definition: string;
  difficulty: string;
  easeFactor: number;
  interval: number;
  repetitionCount: number;
  consecutiveCorrectReviews: number;
  nextReviewDate: string;
  lastReviewedAt: string | null;
  lastRating: string;
  qualityScore: number;
  nextCard: FlashcardDueResponse | null;
  remainingDue: number;
}

export interface FlashcardDueResponse {
  id: number;
  term: string;
  definition: string;
  difficulty: string;
  nextReviewDate: string;
  easeFactor: number;
  interval: number;
  repetitionCount: number;
}

export interface FlashcardSessionResponse {
  due: number;
  flashcards: FlashcardDueResponse[];
  nextUpcomingReviewDate: string | null;
}

const COURSES_API    = 'http://localhost:8069/api/courses';
const QUIZZES_API    = 'http://localhost:8069/api/quizzes';
const ATTEMPTS_API   = 'http://localhost:8069/api/quiz-attempts';
const FLASHCARDS_API = 'http://localhost:8069/api/flashcards';
const EXAMS_API      = 'http://localhost:8069/api/exams';
const EXAM_ATTEMPTS_API  = 'http://localhost:8069/api/exam-attempts';
const CERTIFICATES_API   = 'http://localhost:8069/api/certificates';
const ADMIN_API          = 'http://localhost:8069/api/admin';

export interface SuspiciousActivityDTO {
  id: number;
  examAttemptId: number;
  activityType: string;
  count: number;
  detectedAt: string;
  totalCount: number;
}

@Injectable({ providedIn: 'root' })
export class CourseService {

  constructor(private http: HttpClient) {}

  getCourse(courseId: number): Observable<CourseDetail> {
    return this.http.get<CourseDetail>(`${COURSES_API}/${courseId}`);
  }

  getMyCourses(): Observable<CourseDetail[]> {
    return this.http.get<CourseDetail[]>(COURSES_API);
  }

  getCourseProgress(courseId: number): Observable<LessonProgressItem[]> {
    return this.http.get<LessonProgressItem[]>(`${COURSES_API}/${courseId}/my-progress`);
  }

  trackLessonAccess(lessonId: number): Observable<void> {
    return this.http.post<void>(`http://localhost:8069/api/lessons/${lessonId}/access`, {});
  }

  startQuizAttempt(quizId: number): Observable<QuizAttemptResponse> {
    return this.http.post<QuizAttemptResponse>(`${QUIZZES_API}/${quizId}/start`, {});
  }

  submitQuizAttempt(attemptId: number, answers: AnswerRequest[], finishReason: string = 'SUBMITTED'): Observable<SubmitQuizResponse> {
    return this.http.post<SubmitQuizResponse>(`${ATTEMPTS_API}/${attemptId}/submit`, { answers, finishReason });
  }

  abandonQuizAttempt(attemptId: number): Observable<QuizAttemptResponse> {
    return this.http.post<QuizAttemptResponse>(`${ATTEMPTS_API}/${attemptId}/abandon`, {});
  }

  getMyAttempts(quizId: number): Observable<QuizAttemptResponse[]> {
    return this.http.get<QuizAttemptResponse[]>(`${QUIZZES_API}/${quizId}/my-attempts`);
  }

  reviewFlashcard(flashcardId: number, rating: FlashcardRating): Observable<FlashcardReviewResponse> {
    return this.http.post<FlashcardReviewResponse>(
      `${FLASHCARDS_API}/${flashcardId}/review`,
      { rating }
    );
  }

  getFlashcardSession(courseId: number): Observable<FlashcardSessionResponse> {
    return this.http.get<FlashcardSessionResponse>(`${COURSES_API}/${courseId}/flashcards/session`);
  }

  getDueFlashcards(courseId: number): Observable<FlashcardDueResponse[]> {
    return this.http.get<FlashcardDueResponse[]>(`${COURSES_API}/${courseId}/flashcards/due`);
  }

  // ─── Exam methods ──────────────────────────────────────────────────────────

  generateExam(courseId: number): Observable<ExamInfo> {
    return this.http.post<ExamInfo>(`${COURSES_API}/${courseId}/generate-exam`, {});
  }

  getExam(courseId: number): Observable<ExamInfo> {
    return this.http.get<ExamInfo>(`${COURSES_API}/${courseId}/exam`);
  }

  startExamAttempt(examId: number): Observable<ExamAttemptInfo> {
    return this.http.post<ExamAttemptInfo>(`${EXAMS_API}/${examId}/start`, {});
  }

  submitExamAttempt(
    attemptId: number,
    answers: { questionId: number; studentAnswer: string }[],
    finishReason: string = 'SUBMITTED'
  ): Observable<SubmitExamResponse> {
    return this.http.post<SubmitExamResponse>(
      `${EXAM_ATTEMPTS_API}/${attemptId}/submit`,
      { answers, finishReason }
    );
  }

  abandonExamAttempt(attemptId: number): Observable<ExamAttemptInfo> {
    return this.http.post<ExamAttemptInfo>(`${EXAM_ATTEMPTS_API}/${attemptId}/abandon`, {});
  }

  getMyExamAttempts(examId: number): Observable<ExamAttemptInfo[]> {
    return this.http.get<ExamAttemptInfo[]>(`${EXAMS_API}/${examId}/my-attempts`);
  }

  // ─── Lesson recap ──────────────────────────────────────────────────────────

  generateLessonRecap(lessonId: number): Observable<{ recapVideoPath: string }> {
    return this.http.post<{ recapVideoPath: string }>(
      `http://localhost:8069/api/lessons/${lessonId}/generate-recap`,
      {}
    );
  }

  // ─── Certificates ──────────────────────────────────────────────────────────

  getMyCertificates(): Observable<CertificateInfo[]> {
    return this.http.get<CertificateInfo[]>(`${CERTIFICATES_API}/my-certificates`);
  }

  getCourseCertificate(courseId: number): Observable<CertificateInfo> {
    return this.http.get<CertificateInfo>(`${CERTIFICATES_API}/course/${courseId}`);
  }

  generateCertificatePdf(certificateId: number): Observable<CertificateInfo> {
    return this.http.post<CertificateInfo>(`${CERTIFICATES_API}/${certificateId}/generate`, {});
  }

  downloadCertificateUrl(certificateUuid: string): string {
    return `${CERTIFICATES_API}/${certificateUuid}/download`;
  }

  // ─── Admin: Suspicious Activity ───────────────────────────────────────────

  getAdminSuspiciousActivity(attemptId: number): Observable<SuspiciousActivityDTO[]> {
    return this.http.get<SuspiciousActivityDTO[]>(
      `${ADMIN_API}/exam-attempts/${attemptId}/suspicious-activity`
    );
  }

  getAdminFlaggedAttemptIds(): Observable<number[]> {
    return this.http.get<number[]>(`${ADMIN_API}/flagged-attempts`);
  }
}
