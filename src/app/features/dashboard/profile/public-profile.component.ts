// src/app/features/dashboard/profile/public-profile.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import {
  GamificationService,
  StudentProfileDTO,
  getRankColor
} from '../../../core/services/gamification.service';
import { XpBarComponent } from '../../../shared/components/xp-bar/xp-bar.component';

@Component({
  selector: 'app-public-profile',
  standalone: true,
  imports: [CommonModule, XpBarComponent],
  templateUrl: './public-profile.component.html',
  styleUrl: './public-profile.component.scss'
})
export class PublicProfileComponent implements OnInit {

  private readonly gamificationService = inject(GamificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  profile = signal<StudentProfileDTO | null>(null);
  loading = signal(true);
  isMyProfile = signal(false);

  rankColor = computed(() => getRankColor(this.profile()?.rank ?? 'BEGINNER'));

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const studentId = Number(params.get('studentId'));

      if (!studentId || Number.isNaN(studentId)) {
        this.profile.set(null);
        this.loading.set(false);
        this.isMyProfile.set(false);
        return;
      }

      const currentUserId = this.authService.currentUser()?.id;
      this.isMyProfile.set(currentUserId === studentId);
      this.loading.set(true);

      this.gamificationService.getProfile(studentId).subscribe({
        next: (res) => {
          this.profile.set(res);
          this.loading.set(false);
        },
        error: () => {
          this.profile.set(null);
          this.loading.set(false);
        }
      });
    });
  }

  achievementLabel(action: string): string {
    const map: Record<string, string> = {
      COMPLETE_LESSON: 'Completed a lesson',
      PASS_QUIZ: 'Passed a quiz',
      PASS_EXAM: 'Passed final exam',
      GENERATE_COURSE: 'Generated a course',
      DOWNLOAD_CERTIFICATE: 'Downloaded certificate',
      DAILY_LOGIN: 'Daily login'
    };

    return map[action] ?? 'Achievement unlocked';
  }

  achievementIconClass(action: string): string {
    const map: Record<string, string> = {
      COMPLETE_LESSON: 'achievements__icon--success',
      PASS_QUIZ: 'achievements__icon--exam',
      PASS_EXAM: 'achievements__icon--target',
      GENERATE_COURSE: 'achievements__icon--course',
      DOWNLOAD_CERTIFICATE: 'achievements__icon--certificate',
      DAILY_LOGIN: 'achievements__icon--login'
    };

    return map[action] ?? 'achievements__icon--default';
  }
}
