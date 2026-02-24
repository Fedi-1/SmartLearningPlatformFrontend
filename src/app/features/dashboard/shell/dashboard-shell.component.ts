import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLinkActive],
  templateUrl: './dashboard-shell.component.html',
  styleUrl: './dashboard-shell.component.scss'
})
export class DashboardShellComponent {

  readonly navItems: NavItem[] = [
    { label: 'Overview',   icon: 'home',    route: '/dashboard/overview'   },
    { label: 'Documents',  icon: 'file',    route: '/dashboard/documents'  },
    { label: 'My Courses', icon: 'book',    route: '/dashboard/courses'    },
    { label: 'Flashcards', icon: 'cards',   route: '/dashboard/flashcards' },
    { label: 'Progress',   icon: 'chart',   route: '/dashboard/progress'   },
    { label: 'Profile',    icon: 'user',    route: '/dashboard/profile'    },
  ];

  readonly pageTitles: Record<string, string> = {
    overview:   'Overview',
    documents:  'Documents',
    courses:    'My Courses',
    flashcards: 'Flashcards',
    progress:   'Progress',
    profile:    'Profile',
  };

  get pageTitle(): string {
    const seg = this.router.url.split('/').pop()?.split('?')[0] ?? '';
    return this.pageTitles[seg] ?? 'Dashboard';
  }

  get user() { return this.authService.currentUser(); }

  get initials(): string {
    const u = this.user;
    if (!u) return '?';
    return `${u.firstName.charAt(0)}${u.lastName.charAt(0)}`.toUpperCase();
  }

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
