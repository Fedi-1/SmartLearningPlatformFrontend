// src/app/features/dashboard/leaderboard/leaderboard.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import {
  GamificationService,
  StudentProfileDTO,
  getRankColor
} from '../../../core/services/gamification.service';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.scss'
})
export class LeaderboardComponent implements OnInit {

  private readonly gamificationService = inject(GamificationService);
  private readonly router = inject(Router);

  leaderboard = signal<StudentProfileDTO[]>([]);
  loading = signal(true);
  myProfile = signal<StudentProfileDTO | null>(null);

  myPosition = computed(() => {
    const me = this.myProfile();
    if (!me) return -1;
    return this.leaderboard().findIndex(s => s.id === me.id) + 1;
  });

  ngOnInit(): void {
    forkJoin({
      leaderboard: this.gamificationService.getLeaderboard(20).pipe(
        catchError(() => of([]))
      ),
      myProfile: this.gamificationService.getMyProfile().pipe(
        catchError(() => of(null))
      )
    }).subscribe({
      next: ({ leaderboard, myProfile }) => {
        this.leaderboard.set(leaderboard);
        this.myProfile.set(myProfile);
        this.loading.set(false);
      }
    });
  }

  viewProfile(studentId: number): void {
    this.router.navigate(['/dashboard/profile', studentId]);
  }

  rankColor(rank: string): string {
    return getRankColor(rank);
  }
}
