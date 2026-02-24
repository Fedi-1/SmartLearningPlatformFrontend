import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CourseDetail } from '../models/document.model';

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

  startQuizAttempt(quizId: number): Observable<QuizAttemptResponse> {
    return this.http.post<QuizAttemptResponse>(`${QUIZZES_API}/${quizId}/start`, {});
  }

  submitQuizAttempt(attemptId: number, answers: AnswerRequest[]): Observable<SubmitQuizResponse> {
    return this.http.post<SubmitQuizResponse>(`${ATTEMPTS_API}/${attemptId}/submit`, { answers });
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
}
