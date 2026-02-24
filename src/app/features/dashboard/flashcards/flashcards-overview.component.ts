import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DashboardService, DashboardFlashcardsDue } from '../../../core/services/dashboard.service';

@Component({
  selector: 'app-flashcards-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './flashcards-overview.component.html',
  styleUrl: './flashcards-overview.component.scss'
})
export class FlashcardsOverviewComponent implements OnInit {

  loading = true;
  dueList: DashboardFlashcardsDue[] = [];
  error = false;
  nextReview: string | null = null;

  constructor(
    private dashboardService: DashboardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.dashboardService.getDashboard().subscribe({
      next: (res) => {
        this.dueList = res.flashcardsDue;
        this.loading = false;
      },
      error: () => { this.error = true; this.loading = false; }
    });
  }

  get allCaughtUp(): boolean {
    return this.dueList.every(f => f.dueCount === 0);
  }

  startReview(courseId: number): void {
    this.router.navigate(['/dashboard/flashcards', courseId, 'review']);
  }
}
