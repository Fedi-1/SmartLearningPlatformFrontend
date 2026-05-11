// src/app/core/services/gamification.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface XpUpdateResponse {
  xpEarned: number;
  totalXp: number;
  rank: string;
  previousRank: string | null;
  rankUp: boolean;
  currentStreak: number;
  longestStreak: number;
}

export interface StudentProfileDTO {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  initials: string;
  xpPoints: number;
  rank: string;
  rankMinXp: number;
  nextRankMinXp: number;
  xpToNextRank: number;
  currentStreak: number;
  longestStreak: number;
  weeklyChampionCount: number;
  completedCourses: number;
  passedExams: number;
  earnedCertificates: number;
  recentAchievements: string[];
}

export function getRankColor(rank: string): string {
  switch (rank) {
    case 'BEGINNER': return '#94a3b8';
    case 'LEARNER':  return '#22c55e';
    case 'SCHOLAR':  return '#3b82f6';
    case 'EXPERT':   return '#a855f7';
    case 'MASTER':   return '#f59e0b';
    default:         return '#94a3b8';
  }
}

export function getRankIcon(rank: string): string {
  switch (rank) {
    case 'BEGINNER': return 'rank-beginner';
    case 'LEARNER':  return 'rank-learner';
    case 'SCHOLAR':  return 'rank-scholar';
    case 'EXPERT':   return 'rank-expert';
    case 'MASTER':   return 'rank-master';
    default:         return 'rank-beginner';
  }
}

@Injectable({ providedIn: 'root' })
export class GamificationService {

  private readonly http = inject(HttpClient);
  private readonly API = 'http://localhost:8069/api/gamification';

  getMyProfile(): Observable<StudentProfileDTO> {
    return this.http.get<StudentProfileDTO>(`${this.API}/my-profile`);
  }

  getProfile(studentId: number): Observable<StudentProfileDTO> {
    return this.http.get<StudentProfileDTO>(`${this.API}/profile/${studentId}`);
  }

  getLeaderboard(limit = 10): Observable<StudentProfileDTO[]> {
    return this.http.get<StudentProfileDTO[]>(`${this.API}/leaderboard`, {
      params: { limit: `${limit || 10}` }
    });
  }
}
