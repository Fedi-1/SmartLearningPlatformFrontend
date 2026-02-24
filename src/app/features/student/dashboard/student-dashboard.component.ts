import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { DocumentService } from '../../../core/services/document.service';
import { User } from '../../../core/models/user.model';
import { DocumentItem } from '../../../core/models/document.model';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './student-dashboard.component.html',
  styleUrl: './student-dashboard.component.scss'
})
export class StudentDashboardComponent implements OnInit {

  currentUser: User | null = null;
  documents: DocumentItem[] = [];

  get categoryBreakdown(): { name: string; count: number; color: string }[] {
    const map = new Map<string, number>();
    for (const doc of this.documents) {
      const cat = doc.category ?? 'Non classé';
      map.set(cat, (map.get(cat) ?? 0) + 1);
    }
    const palette = [
      '#6366f1', '#22c55e', '#f59e0b', '#3b82f6',
      '#ec4899', '#14b8a6', '#f97316', '#a855f7',
      '#ef4444', '#06b6d4', '#84cc16', '#e11d48'
    ];
    let i = 0;
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count, color: palette[i++ % palette.length] }));
  }

  get totalDocuments(): number { return this.documents.length; }
  get completedCount(): number { return this.documents.filter(d => d.status === 'COMPLETED').length; }

  constructor(
    private authService: AuthService,
    private documentService: DocumentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser();
    this.documentService.getMyDocuments().subscribe({
      next: (docs) => { this.documents = docs; },
      error: () => {}
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
