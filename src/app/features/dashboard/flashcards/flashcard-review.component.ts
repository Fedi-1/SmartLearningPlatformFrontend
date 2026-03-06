import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CourseService,
  FlashcardDueResponse,
  FlashcardRating
} from '../../../core/services/course.service';
import { ToastService } from '../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-flashcard-review',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './flashcard-review.component.html',
  styleUrl: './flashcard-review.component.scss'
})
export class FlashcardReviewComponent implements OnInit {

  courseId!: number;

  loading = true;
  sessionQueue: FlashcardDueResponse[] = [];
  totalInitial = 0;
  currentCard: FlashcardDueResponse | null = null;
  cardFlipped = false;
  ratingSubmitting = false;
  sessionComplete = false;
  nextUpcomingDate: string | null = null;
  summary = { again: 0, good: 0, easy: 0 };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.courseId = Number(this.route.snapshot.paramMap.get('courseId'));
    this.loadSession();
  }

  loadSession(): void {
    this.loading = true;
    this.courseService.getFlashcardSession(this.courseId).subscribe({
      next: (session) => {
        this.sessionQueue    = [...session.flashcards];
        this.totalInitial    = session.flashcards.length;
        this.nextUpcomingDate = session.nextUpcomingReviewDate;
        this.currentCard     = this.sessionQueue[0] ?? null;
        this.cardFlipped     = false;
        this.sessionComplete = this.sessionQueue.length === 0;
        this.summary         = { again: 0, good: 0, easy: 0 };
        this.loading         = false;
      },
      error: () => {
        this.toastService.error('Failed to load flashcard session.');
        this.loading = false;
      }
    });
  }

  get totalCards(): number { return this.sessionQueue.length; }

  get progressPct(): number {
    if (!this.totalInitial) return 0;
    return Math.round(((this.totalInitial - this.sessionQueue.length) / this.totalInitial) * 100);
  }

  flipCard(): void {
    if (!this.cardFlipped) this.cardFlipped = true;
  }

  rateCard(rating: FlashcardRating): void {
    const card = this.currentCard;
    if (!card || this.ratingSubmitting) return;
    this.ratingSubmitting = true;

    this.courseService.reviewFlashcard(card.id, rating).subscribe({
      next: (result) => {
        this.ratingSubmitting = false;
        this.summary[rating.toLowerCase() as 'again' | 'good' | 'easy']++;

        this.sessionQueue = this.sessionQueue.filter(c => c.id !== card.id);

        if (result.nextCard) {
          this.currentCard = result.nextCard;
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

  goBack(): void {
    this.router.navigate(['/dashboard/flashcards']);
  }
}
