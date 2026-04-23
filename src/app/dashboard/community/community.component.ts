// src/app/dashboard/community/community.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CommunityService, ConversationDTO, StudentSearchResult } from '../../core/services/community.service';

@Component({
  selector: 'app-community',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './community.component.html',
  styleUrl: './community.component.scss'
})
export class CommunityComponent implements OnInit {

  conversations = signal<ConversationDTO[]>([]);
  loading = signal(false);
  searchQuery = signal('');
  searchResults = signal<StudentSearchResult[]>([]);
  showSearch = signal(false);
  searchLoading = signal(false);
  searchError = signal(false);
  searchHasRun = signal(false);

  constructor(
    private communityService: CommunityService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadConversations();
  }

  loadConversations(): void {
    this.loading.set(true);
    this.communityService.getConversations().subscribe({
      next: (list) => {
        this.conversations.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  toggleSearch(): void {
    const next = !this.showSearch();
    this.showSearch.set(next);
    if (!next) {
      this.searchQuery.set('');
      this.searchResults.set([]);
      this.searchLoading.set(false);
      this.searchError.set(false);
      this.searchHasRun.set(false);
    }
  }

  openConversation(otherStudentId: number): void {
    this.router.navigate(['/dashboard/community', otherStudentId]);
  }

  onSearch(query: string): void {
    const q = query.trim();
    this.searchQuery.set(query);

    if (q.length < 2) {
      this.searchResults.set([]);
      this.searchLoading.set(false);
      this.searchError.set(false);
      this.searchHasRun.set(false);
      return;
    }

    this.searchLoading.set(true);
    this.searchError.set(false);
    this.searchHasRun.set(true);

    this.communityService.searchStudents(q).subscribe({
      next: (results) => {
        this.searchResults.set(results);
        this.searchLoading.set(false);
      },
      error: () => {
        this.searchResults.set([]);
        this.searchLoading.set(false);
        this.searchError.set(true);
      }
    });
  }

  startNewChat(student: StudentSearchResult): void {
    this.router.navigate(['/dashboard/community', student.id]);
  }

  previewText(value: string | null): string {
    const text = (value ?? '').trim();
    if (!text) return 'No messages yet';
    return text.length > 40 ? `${text.slice(0, 40)}...` : text;
  }

  formatRelativeTime(dateIso: string | null): string {
    if (!dateIso) return '';

    const date = new Date(dateIso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMin / 60);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return date.toLocaleDateString();
  }
}
