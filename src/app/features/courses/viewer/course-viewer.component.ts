import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin, Subscription } from 'rxjs';
import {
  CourseService,
  QuizAttemptResponse,
  SubmitQuizResponse,
  LessonProgressItem,
  FlashcardRating,
  FlashcardDueResponse
} from '../../../core/services/course.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import {
  CourseDetail,
  LessonItem,
  QuizQuestionItem,
  ExamInfo,
  ExamAttemptInfo,
  ExamQuestionItem,
  SubmitExamResponse,
  CertificateInfo,
} from '../../../core/models/document.model';
import { AntiCheatService, SuspiciousActivityType } from '../../../core/services/anti-cheat.service';
import { AntiCheatModalComponent } from '../../../shared/components/anti-cheat-modal/anti-cheat-modal.component';
import { ChatWidgetComponent } from '../../../shared/components/chat-widget/chat-widget.component';
import { PageTitleService } from '../../../core/services/page-title.service';

type TabId = 'content' | 'quiz' | 'flashcards' | 'exam';

@Component({
  selector: 'app-course-viewer',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, AntiCheatModalComponent, ChatWidgetComponent],
  templateUrl: './course-viewer.component.html',
  styleUrl:    './course-viewer.component.scss'
})
export class CourseViewerComponent implements OnInit, OnDestroy {

  course: CourseDetail | null = null;
  loading = true;

  selectedLesson: LessonItem | null = null;
  activeTab: TabId = 'content';

  // ─── Quiz state ──────────────────────────────────────────────────────────────
  selectedAnswers: Map<number, string> = new Map();
  quizSubmitting = false;
  quizSubmitted  = false;
  quizScore      = 0;
  quizPassed     = false;

  currentAttemptId: number | null = null;
  currentAttemptQuestions: QuizQuestionItem[] = [];
  pastAttempts: QuizAttemptResponse[] = [];
  attemptsLoading = false;
  maxAttempts = 3;

  // ─── Quiz timer state ─────────────────────────────────────────────────────
  quizTimeLimit: number | null = null;   // total seconds
  quizSecondsLeft: number = 0;
  private quizTimerInterval: ReturnType<typeof setInterval> | null = null;
  quizTimedOut = false;

  // ─── Flashcard state ─────────────────────────────────────────────────────────
  // Session queue (due cards ordered by nextReviewDate ASC)
  sessionQueue: FlashcardDueResponse[] = [];
  sessionLoading   = false;
  sessionLoaded    = false;
  currentCard: FlashcardDueResponse | null = null;
  cardFlipped      = false;
  ratingSubmitting = false;
  nextUpcomingDate: string | null = null;

  // Session complete summary
  sessionComplete  = false;
  sessionSummary   = { again: 0, good: 0, easy: 0 };

  // Legacy: keep reviewedCards for dot indicators
  reviewedCards: Set<number> = new Set();

  // ─── Recap card state ────────────────────────────────────────────────────────
  videoExpanded   = false;
  recapGenerating = false;

  // ─── Exam state ──────────────────────────────────────────────────────────────
  examInfo: ExamInfo | null = null;
  examLoading = false;
  examGenerating = false;

  // Active attempt (taking the exam)
  examAttemptId: number | null = null;
  examQuestions: ExamQuestionItem[] = [];
  examAnswers: Map<number, string> = new Map();
  examSubmitting = false;

  // Results (after submit)
  examResult: SubmitExamResponse | null = null;

  // Past attempts
  examPastAttempts: ExamAttemptInfo[] = [];
  examAttemptsLoading = false;

  // ─── Exam timer state ────────────────────────────────────────────────────────
  examTimeLimit: number | null = null;     // total seconds
  examSecondsLeft: number = 0;
  private examTimerInterval: ReturnType<typeof setInterval> | null = null;
  examTimedOut = false;
  examTimeExpiredModalVisible = false;

  // ─── Anti-cheat state ─────────────────────────────────────────────────────────
  antiCheatModalVisible = false;
  antiCheatLastType: SuspiciousActivityType | null = null;
  antiCheatTotalCount = 0;
  private antiCheatSub: Subscription | null = null;
  /** Show warning modal after this many total events. */
  private readonly WARN_THRESHOLD = 3;

  // ─── Progress (from DB) ──────────────────────────────────────────────────────
  progressMap: Map<number, LessonProgressItem> = new Map();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private courseService: CourseService,
    private toastService: ToastService,
    private antiCheat: AntiCheatService,
    private pageTitleService: PageTitleService
  ) {}

  ngOnDestroy(): void {
    this.stopTimer();
    this.stopExamTimer();
    this.antiCheat.detach();
    this.antiCheatSub?.unsubscribe();
    this.pageTitleService.clear();
    // Abandon active quiz attempt when navigating away
    if (this.currentAttemptId && !this.quizSubmitted) {
      this.courseService.abandonQuizAttempt(this.currentAttemptId).subscribe({ error: () => {} });
    }
    // Abandon active exam attempt when navigating away
    if (this.examAttemptId && !this.examResult) {
      this.courseService.abandonExamAttempt(this.examAttemptId).subscribe({ error: () => {} });
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.currentAttemptId && !this.quizSubmitted) {
      this.courseService.abandonQuizAttempt(this.currentAttemptId).subscribe({ error: () => {} });
      event.preventDefault();
      event.returnValue = 'Your quiz attempt will be abandoned if you leave. Are you sure?';
    }
    if (this.examAttemptId && !this.examResult) {
      this.courseService.abandonExamAttempt(this.examAttemptId).subscribe({ error: () => {} });
      event.preventDefault();
      event.returnValue = 'If you leave now your exam attempt will be marked as abandoned and your answers will not be scored.';
    }
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('courseId'));
    if (!id) { this.router.navigate(['/documents']); return; }

    this.pageTitleService.set('Loading…');

    forkJoin({
      course:   this.courseService.getCourse(id),
      progress: this.courseService.getCourseProgress(id)
    }).subscribe({
      next: ({ course, progress }) => {
        this.progressMap = new Map(progress.map(p => [p.lessonId, p]));
        course.lessons.forEach(l => {
          const p = this.progressMap.get(l.id);
          if (p) l.isLocked = p.isLocked;
        });
        this.course  = course;
        this.pageTitleService.set(course.title);
        this.loading = false;
        const first = course.lessons.find(l => !l.isLocked) ?? course.lessons[0];
        if (first) this.selectLesson(first);
      },
      error: () => {
        this.loading = false;
        this.toastService.error('Failed to load course.');
        this.router.navigate(['/documents']);
      }
    });
  }

  // ─── Navigation ──────────────────────────────────────────────────────────────

  selectLesson(lesson: LessonItem): void {
    if (lesson.isLocked) {
      this.toastService.error('🔒 Complete the previous lesson\'s quiz to unlock this lesson.');
      return;
    }
    if (this.isSessionActive) {
      const what = (this.currentAttemptId && !this.quizSubmitted) ? 'quiz' : 'exam';
      this.toastService.error(`⚠️ Finish or exit your active ${what} before switching lessons.`);
      return;
    }
    this.selectedLesson = lesson;
    this.activeTab      = 'content';
    this.videoExpanded  = false;
    this.recapGenerating = false;
    this.resetQuiz();
    this.resetFlashcards();
    if (lesson.quizId) {
      this.loadPastAttempts(lesson.quizId);
    } else {
      this.attemptsLoading = false;
    }
    this.courseService.trackLessonAccess(lesson.id).subscribe({ error: () => {} });
  }

  /** True while a quiz or exam attempt is actively in progress (not yet submitted). */
  get isSessionActive(): boolean {
    return (!!this.currentAttemptId && !this.quizSubmitted) ||
           (!!this.examAttemptId   && !this.examResult);
  }

  setTab(tab: TabId): void {
    if (this.isSessionActive && tab !== this.activeTab) {
      const what = (this.currentAttemptId && !this.quizSubmitted) ? 'quiz' : 'exam';
      this.toastService.error(`⚠️ Finish or exit your active ${what} before switching tabs.`);
      return;
    }
    this.activeTab = tab;
    if (tab === 'flashcards' && !this.sessionLoaded && !this.sessionLoading) {
      this.loadSession();
    }
    if (tab === 'exam' && !this.examInfo && !this.examLoading) {
      this.loadExam();
    }
  }

  /** Called after past attempts finish loading to auto-start if eligible. */
  private _maybeAutoStart(): void {
    if (this.activeTab === 'quiz' && !this.currentAttemptId
        && !this.quizSubmitted && this.selectedLesson?.quizId
        && !this.noAttemptsLeft && !this.alreadyPassed) {
      this.startQuiz();
    }
  }

  goBack(): void { this.location.back(); }

  // ─── Quiz: start ─────────────────────────────────────────────────────────────

  startQuiz(): void {
    if (!this.selectedLesson?.quizId) {
      console.error('[Quiz] Cannot start — quizId is null. Lesson:', this.selectedLesson);
      return;
    }
    console.log('[Quiz] Starting attempt for quizId:', this.selectedLesson.quizId);
    this.courseService.startQuizAttempt(this.selectedLesson.quizId).subscribe({
      next: (attempt) => {
        console.log('[Quiz] Attempt started:', attempt);
        this.currentAttemptId        = attempt.id;
        this.maxAttempts             = attempt.maxAttempts;
        this.currentAttemptQuestions = attempt.questions ?? [];
        this.quizTimedOut            = false;

        // Start countdown timer if a time limit is provided
        if (attempt.timeLimitMinutes && attempt.timeLimitMinutes > 0) {
          this.quizTimeLimit    = attempt.timeLimitMinutes * 60;
          this.quizSecondsLeft  = this.quizTimeLimit;
          this.startTimer();
        } else {
          this.quizTimeLimit   = null;
          this.quizSecondsLeft = 0;
        }
      },
      error: (err) => {
        console.error('[Quiz] Start failed:', err);
        const msg = err?.error?.message ?? err?.message ?? 'Could not start quiz.';
        this.toastService.error(msg);
      }
    });
  }

  // ─── Quiz: answers ───────────────────────────────────────────────────────────

  get totalQuestions(): number {
    return this.currentAttemptQuestions.length;
  }

  selectAnswer(questionId: number, answer: string): void {
    if (!this.quizSubmitted) this.selectedAnswers.set(questionId, answer);
  }

  isSelected(questionId: number, option: string): boolean {
    return this.selectedAnswers.get(questionId) === option;
  }

  isCorrect(questionId: number, option: string): boolean {
    const q = this.currentAttemptQuestions.find(qq => qq.id === questionId);
    return q?.correctAnswer === option;
  }

  /** For FILL_BLANK: case-insensitive match between typed answer and correctAnswer. */
  fillBlankCorrect(questionId: number): boolean {
    const q = this.currentAttemptQuestions.find(qq => qq.id === questionId);
    const typed = this.selectedAnswers.get(questionId) ?? '';
    return (q?.correctAnswer ?? '').toLowerCase().trim() === typed.toLowerCase().trim();
  }

  allQuestionsAnswered(): boolean {
    return this.currentAttemptQuestions.length > 0 &&
      this.currentAttemptQuestions.every(q => this.selectedAnswers.has(q.id));
  }

  // ─── Quiz: submit ─────────────────────────────────────────────────────────────

  submitQuiz(finishReason: string = 'SUBMITTED'): void {
    if (!this.currentAttemptId || !this.currentAttemptQuestions.length) return;

    const answers = this.currentAttemptQuestions.map(q => ({
      questionId:    q.id,
      studentAnswer: this.selectedAnswers.get(q.id) ?? ''
    }));

    console.log('[Quiz] Submitting attemptId:', this.currentAttemptId, 'reason:', finishReason);
    this.quizSubmitting = true;
    this.stopTimer();

    this.courseService.submitQuizAttempt(this.currentAttemptId, answers, finishReason).subscribe({
      next: (result: SubmitQuizResponse) => {
        this.quizScore      = result.score;
        this.quizPassed     = result.isPassed;
        this.quizSubmitted  = true;
        this.quizSubmitting = false;
        this.maxAttempts    = result.maxAttempts;

        if (this.selectedLesson?.quizId) this.loadPastAttempts(this.selectedLesson.quizId);

        if (this.course) {
          const idx = this.course.lessons.findIndex(l => l.id === this.selectedLesson!.id);
          if ((result.isPassed || result.attemptsExhausted) &&
              idx !== -1 && idx + 1 < this.course.lessons.length) {
            this.course.lessons[idx + 1].isLocked = false;
          }
          if (result.lessonProgress) {
            const lp = result.lessonProgress;
            this.progressMap.set(lp.lessonId, {
              lessonId: lp.lessonId, isCompleted: lp.isCompleted,
              isLocked: lp.isLocked, quizPassed: lp.quizPassed
            });
          }
        }
      },
      error: (err) => {
        this.quizSubmitting = false;
        console.error('[Quiz] Submit failed:', err);
        this.toastService.error(err?.error?.message ?? 'Failed to submit quiz.');
      }
    });
  }

  private loadPastAttempts(quizId: number): void {
    this.attemptsLoading = true;
    this.courseService.getMyAttempts(quizId).subscribe({
      next: (attempts) => {
        this.pastAttempts    = attempts;
        this.attemptsLoading = false;
        if (attempts.length > 0) this.maxAttempts = attempts[0].maxAttempts;
        this._maybeAutoStart();   // ← auto-start now that we know the state
      },
      error: () => {
        this.attemptsLoading = false;
        this._maybeAutoStart();   // ← still try to start even if history failed
      }
    });
  }

  get attemptsUsed(): number  { return this.pastAttempts.length; }
  get attemptsRemaining(): number { return Math.max(0, this.maxAttempts - this.attemptsUsed); }
  get alreadyPassed(): boolean    { return this.pastAttempts.some(a => a.isPassed); }
  get noAttemptsLeft(): boolean   { return this.attemptsRemaining === 0 && !this.quizSubmitted; }

  resetQuiz(): void {
    this.stopTimer();
    this.selectedAnswers         = new Map();
    this.quizSubmitted           = false;
    this.quizSubmitting          = false;
    this.quizScore               = 0;
    this.quizPassed              = false;
    this.currentAttemptId        = null;
    this.currentAttemptQuestions = [];
    this.pastAttempts            = [];
    this.attemptsLoading         = true;   // will be set to false by loadPastAttempts
    this.quizTimedOut            = false;
    this.quizTimeLimit           = null;
    this.quizSecondsLeft         = 0;
  }

  retryQuiz(): void {
    this.stopTimer();
    this.selectedAnswers         = new Map();
    this.quizSubmitted           = false;
    this.quizSubmitting          = false;
    this.quizScore               = 0;
    this.quizPassed              = false;
    this.currentAttemptId        = null;
    this.currentAttemptQuestions = [];
    this.quizTimedOut            = false;
    this.quizTimeLimit           = null;
    this.quizSecondsLeft         = 0;
    this.startQuiz();
  }

  // ─── Quiz: timer helpers ──────────────────────────────────────────────────

  get quizTimerDisplay(): string {
    const s = this.quizSecondsLeft;
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }

  get quizTimerWarning(): boolean {
    return this.quizTimeLimit !== null && this.quizSecondsLeft < 120;
  }

  private startTimer(): void {
    this.stopTimer();
    this.quizTimerInterval = setInterval(() => {
      if (this.quizSecondsLeft > 0) {
        this.quizSecondsLeft--;
      } else {
        // Time's up — auto-submit with TIME_EXPIRED
        this.stopTimer();
        this.quizTimedOut = true;
        this.submitQuiz('TIME_EXPIRED');
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.quizTimerInterval !== null) {
      clearInterval(this.quizTimerInterval);
      this.quizTimerInterval = null;
    }
  }

  // ─── Flashcard logic ─────────────────────────────────────────────────────────

  get totalCards(): number {
    return this.sessionQueue.length;
  }

  loadSession(): void {
    if (!this.course) return;
    this.sessionLoading = true;
    this.sessionLoaded  = false;
    this.courseService.getFlashcardSession(this.course.id).subscribe({
      next: (session) => {
        this.sessionQueue        = [...session.flashcards];
        this.nextUpcomingDate    = session.nextUpcomingReviewDate;
        this.currentCard         = this.sessionQueue.length > 0 ? this.sessionQueue[0] : null;
        this.sessionLoading      = false;
        this.sessionLoaded       = true;
        this.cardFlipped         = false;
        this.sessionComplete     = false;
        this.sessionSummary      = { again: 0, good: 0, easy: 0 };
        this.reviewedCards       = new Set();
      },
      error: () => {
        this.sessionLoading = false;
        this.toastService.error('Failed to load flashcard session.');
      }
    });
  }

  flipCard(): void {
    if (!this.cardFlipped) {
      this.cardFlipped = true;
      if (this.currentCard) this.reviewedCards.add(this.currentCard.id);
    }
  }

  rateCard(rating: FlashcardRating): void {
    const card = this.currentCard;
    if (!card || this.ratingSubmitting) return;
    this.ratingSubmitting = true;

    this.courseService.reviewFlashcard(card.id, rating).subscribe({
      next: (result) => {
        this.ratingSubmitting = false;

        // Update local summary
        this.sessionSummary[rating.toLowerCase() as 'again' | 'good' | 'easy']++;

        // Remove the rated card from the queue
        this.sessionQueue = this.sessionQueue.filter(c => c.id !== card.id);

        // Use server's nextCard if provided, else take from local queue
        if (result.nextCard) {
          this.currentCard = result.nextCard;
          // Sync queue: ensure this card is at the front if not already present
          if (!this.sessionQueue.find(c => c.id === result.nextCard!.id)) {
            this.sessionQueue = [result.nextCard, ...this.sessionQueue];
          }
        } else if (this.sessionQueue.length > 0) {
          this.currentCard = this.sessionQueue[0];
        } else {
          this.currentCard    = null;
          this.sessionComplete = true;
        }

        this.cardFlipped = false;
      },
      error: () => {
        this.ratingSubmitting = false;
        this.toastService.error('Failed to save rating.');
      }
    });
  }

  resetFlashcards(): void {
    this.sessionQueue        = [];
    this.currentCard         = null;
    this.cardFlipped         = false;
    this.reviewedCards       = new Set();
    this.ratingSubmitting    = false;
    this.sessionLoaded       = false;
    this.sessionComplete     = false;
    this.sessionSummary      = { again: 0, good: 0, easy: 0 };
    this.nextUpcomingDate    = null;
  }

  // ─── Progress ────────────────────────────────────────────────────────────────

  get completedCount(): number {
    let count = 0;
    this.progressMap.forEach(p => { if (p.isCompleted) count++; });
    return count;
  }

  get progressPercent(): number {
    if (!this.course?.lessons?.length) return 0;
    return Math.round((this.completedCount / this.course.lessons.length) * 100);
  }

  get ringDashOffset(): number {
    const halfCirc = Math.PI * 50; // r=50, half circumference ≈ 157.08
    return halfCirc * (1 - this.progressPercent / 100);
  }

  isLessonCompleted(lessonId: number): boolean {
    return this.progressMap.get(lessonId)?.isCompleted ?? false;
  }

  // ─── Recap video ─────────────────────────────────────────────────────────────

  get recapVideoUrl(): string | null {
    const p = this.selectedLesson?.recapVideoPath;
    if (!p) return null;
    return `http://localhost:8069/api/lessons/recap-video?path=${encodeURIComponent(p)}`;
  }

  generateRecap(): void {
    if (!this.selectedLesson || this.recapGenerating) return;

    // If already generated, just expand the player
    if (this.selectedLesson.recapVideoPath) {
      this.videoExpanded = true;
      return;
    }

    this.recapGenerating = true;
    this.courseService.generateLessonRecap(this.selectedLesson.id).subscribe({
      next: (res) => {
        this.recapGenerating = false;
        if (res.recapVideoPath && this.selectedLesson) {
          this.selectedLesson.recapVideoPath = res.recapVideoPath;
          this.videoExpanded = true;
        } else {
          this.toastService.error('Recap video could not be generated.');
        }
      },
      error: (err) => {
        this.recapGenerating = false;
        const msg = err?.error?.detail ?? err?.error?.message ?? 'Failed to generate recap video.';
        this.toastService.error(msg);
      }
    });
  }

  // ─── Exam logic ──────────────────────────────────────────────────────────────

  get allLessonsCompleted(): boolean {
    if (!this.course?.lessons?.length) return false;
    return this.course.lessons.every(l => this.progressMap.get(l.id)?.isCompleted === true);
  }

  loadExam(): void {
    if (!this.course) return;
    this.examLoading = true;
    this.courseService.getExam(this.course.id).subscribe({
      next: (exam) => {
        this.examInfo = exam;
        this.examLoading = false;
        this.loadExamPastAttempts();
      },
      error: (err) => {
        this.examLoading = false;
        // 404 means no exam yet — that's fine
        if (err?.status !== 404) {
          this.toastService.error('Failed to load exam info.');
        }
      }
    });
  }

  generateExam(): void {
    if (!this.course) return;
    this.examGenerating = true;
    this.courseService.generateExam(this.course.id).subscribe({
      next: (exam) => {
        this.examInfo = exam;
        this.examGenerating = false;
        this.toastService.success('✅ Exam generated successfully!');
        this.loadExamPastAttempts();
      },
      error: (err) => {
        this.examGenerating = false;
        this.toastService.error(err?.error?.message ?? 'Failed to generate exam.');
      }
    });
  }

  startExam(): void {
    if (!this.examInfo) return;
    this.courseService.startExamAttempt(this.examInfo.id).subscribe({
      next: (attempt) => {
        this.examAttemptId = attempt.id;
        this.examQuestions = attempt.questions ?? [];
        this.examAnswers   = new Map();
        this.examResult    = null;
        this.examTimedOut  = false;
        this.examTimeExpiredModalVisible = false;

        // Start anti-cheat monitoring
        this.antiCheat.attach(attempt.id);
        this.antiCheatSub = this.antiCheat.event$.subscribe(evt => {
          this.antiCheatTotalCount = evt.totalCount;
          this.antiCheatLastType   = evt.type;
          if (evt.totalCount >= this.WARN_THRESHOLD) {
            this.antiCheatModalVisible = true;
          }
        });

        // Start exam countdown timer if time limit present
        if (attempt.timeLimitMinutes && attempt.timeLimitMinutes > 0) {
          this.examTimeLimit   = attempt.timeLimitMinutes * 60;
          this.examSecondsLeft = this.examTimeLimit;
          this.startExamTimer();
        } else {
          this.examTimeLimit   = null;
          this.examSecondsLeft = 0;
        }
      },
      error: (err) => {
        this.toastService.error(err?.error?.message ?? 'Could not start exam.');
      }
    });
  }

  selectExamAnswer(questionId: number, answer: string): void {
    if (!this.examResult) this.examAnswers.set(questionId, answer);
  }

  isExamAnswerSelected(questionId: number, option: string): boolean {
    return this.examAnswers.get(questionId) === option;
  }

  allExamQuestionsAnswered(): boolean {
    return this.examQuestions.length > 0 &&
      this.examQuestions.every(q => this.examAnswers.has(q.id));
  }

  get examSection1Questions(): ExamQuestionItem[] {
    return this.examQuestions.filter(q => q.sectionNumber === 1);
  }
  get examSection2Questions(): ExamQuestionItem[] {
    return this.examQuestions.filter(q => q.sectionNumber === 2);
  }
  get examSection3Questions(): ExamQuestionItem[] {
    return this.examQuestions.filter(q => q.sectionNumber === 3);
  }

  submitExam(finishReason: string = 'SUBMITTED'): void {
    if (!this.examAttemptId || !this.examQuestions.length) return;
    this.examSubmitting = true;
    this.stopExamTimer();
    const answers = this.examQuestions.map(q => ({
      questionId:    q.id,
      studentAnswer: this.examAnswers.get(q.id) ?? ''
    }));
    this.courseService.submitExamAttempt(this.examAttemptId, answers, finishReason).subscribe({
      next: (result) => {
        this.examResult    = result;
        this.examSubmitting = false;
        this.examAttemptId = null;
        // Stop anti-cheat monitoring
        this.antiCheat.detach();
        this.antiCheatSub?.unsubscribe();
        this.antiCheatSub = null;
        this.antiCheatModalVisible = false;
        this.loadExamPastAttempts();
        // Load certificate info if passed
        if (result.isPassed && result.certificateId) {
          this.courseService.getCourseCertificate(this.course!.id).subscribe({
            next: (cert) => { this.certInfo = cert; },
            error: () => {}
          });
        }
      },
      error: (err) => {
        this.examSubmitting = false;
        this.toastService.error(err?.error?.message ?? 'Failed to submit exam.');
      }
    });
  }

  retryExam(): void {
    this.stopExamTimer();
    // Reset anti-cheat state
    this.antiCheat.detach();
    this.antiCheatSub?.unsubscribe();
    this.antiCheatSub = null;
    this.antiCheatModalVisible = false;
    this.antiCheatTotalCount = 0;
    this.antiCheatLastType = null;
    this.examResult    = null;
    this.examAttemptId = null;
    this.examQuestions = [];
    this.examAnswers   = new Map();
    this.examTimedOut  = false;
    this.examTimeExpiredModalVisible = false;
    this.examTimeLimit   = null;
    this.examSecondsLeft = 0;
    this.startExam();
  }

  // ─── Exam: timer helpers ──────────────────────────────────────────────────

  get examTimerDisplay(): string {
    const total = this.examSecondsLeft;
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  get examTimerOrange(): boolean {
    return this.examTimeLimit !== null && this.examSecondsLeft < 600 && this.examSecondsLeft >= 300;
  }

  get examTimerRed(): boolean {
    return this.examTimeLimit !== null && this.examSecondsLeft < 300;
  }

  private startExamTimer(): void {
    this.stopExamTimer();
    this.examTimerInterval = setInterval(() => {
      if (this.examSecondsLeft > 0) {
        this.examSecondsLeft--;
      } else {
        // Time's up — auto-submit with TIME_EXPIRED
        this.stopExamTimer();
        this.examTimedOut = true;
        this.examTimeExpiredModalVisible = true;
        this.submitExam('TIME_EXPIRED');
      }
    }, 1000);
  }

  private stopExamTimer(): void {
    if (this.examTimerInterval !== null) {
      clearInterval(this.examTimerInterval);
      this.examTimerInterval = null;
    }
  }

  dismissTimeExpiredModal(): void {
    this.examTimeExpiredModalVisible = false;
  }

  private loadExamPastAttempts(): void {
    if (!this.examInfo) return;
    this.examAttemptsLoading = true;
    this.courseService.getMyExamAttempts(this.examInfo.id).subscribe({
      next: (attempts) => {
        this.examPastAttempts    = attempts;
        this.examAttemptsLoading = false;
      },
      error: () => { this.examAttemptsLoading = false; }
    });
  }

  get examAttemptsUsed(): number { return this.examPastAttempts.length; }
  get examAttemptsRemaining(): number {
    return Math.max(0, (this.examInfo?.maxAttempts ?? 3) - this.examAttemptsUsed);
  }
  get examAlreadyPassed(): boolean { return this.examPastAttempts.some(a => a.isPassed); }
  get examNoAttemptsLeft(): boolean {
    return !this.examResult && this.examAttemptsRemaining === 0 && !this.examAttemptId;
  }

  // ─── Certificate state ───────────────────────────────────────────────────────
  certInfo: CertificateInfo | null = null;
  certLoading = false;
  certGenerating = false;

  loadCourseCertificate(): void {
    if (!this.course || this.certLoading) return;
    this.certLoading = true;
    this.courseService.getCourseCertificate(this.course.id).subscribe({
      next: (cert) => {
        this.certInfo    = cert;
        this.certLoading = false;
      },
      error: () => { this.certLoading = false; }
    });
  }

  generateCertPdf(): void {
    if (!this.certInfo || this.certGenerating) return;
    this.certGenerating = true;
    this.courseService.generateCertificatePdf(this.certInfo.id).subscribe({
      next: (cert) => {
        this.certInfo       = cert;
        this.certGenerating = false;
        this.toastService.success('✅ Certificate PDF generated!');
      },
      error: (err) => {
        this.certGenerating = false;
        this.toastService.error(err?.error?.message ?? 'Failed to generate PDF.');
      }
    });
  }

  downloadCert(): void {
    if (!this.certInfo) return;
    window.open(this.courseService.downloadCertificateUrl(this.certInfo.id), '_blank');
  }
}
