// src/app/shared/components/xp-bar/xp-bar.component.ts
import { CommonModule } from '@angular/common';
import { Component, InputSignal, computed, input } from '@angular/core';
import { StudentProfileDTO, getRankColor } from '../../../core/services/gamification.service';

@Component({
  selector: 'app-xp-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './xp-bar.component.html',
  styleUrl: './xp-bar.component.scss'
})
export class XpBarComponent {

  profile: InputSignal<StudentProfileDTO> = input.required<StudentProfileDTO>();

  rankColor = computed(() => getRankColor(this.profile().rank));

  progressPercent = computed(() => {
    if (this.profile().xpToNextRank === 0) {
      return 100;
    }

    const range = this.profile().nextRankMinXp - this.profile().rankMinXp;
    const progress = this.profile().xpPoints - this.profile().rankMinXp;

    if (range <= 0) {
      return 100;
    }

    return Math.min(100, Math.round((progress / range) * 100));
  });
}
