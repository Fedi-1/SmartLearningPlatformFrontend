import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService, AppNotification } from '../../../core/services/notification.service';
import { UserRole } from '../../../core/enums/user-role.enum';
import { ChatWidgetComponent } from '../../../shared/components/chat-widget/chat-widget.component';
import { PageTitleService } from '../../../core/services/page-title.service';

// Persisted theme preference
const THEME_KEY = 'dash-theme';
const SIDEBAR_COLLAPSE_KEY = 'dash-sidebar-collapsed';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLinkActive, ChatWidgetComponent],
  templateUrl: './dashboard-shell.component.html',
  styleUrl: './dashboard-shell.component.scss'
})
export class DashboardShellComponent implements OnInit, OnDestroy {

  // Dark theme is default; persisted in localStorage
  isDark = localStorage.getItem(THEME_KEY) !== 'light';

  // Notification panel state
  panelOpen = false;

  isSidebarCollapsed = localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === 'true';

  toggleTheme(): void {
    this.isDark = !this.isDark;
    localStorage.setItem(THEME_KEY, this.isDark ? 'dark' : 'light');
    document.body.classList.toggle('light-theme', !this.isDark);
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    localStorage.setItem(SIDEBAR_COLLAPSE_KEY, this.isSidebarCollapsed ? 'true' : 'false');
  }

  readonly navItems: NavItem[] = [
    { label: 'Overview',    icon: 'home',    route: '/dashboard/overview'        },
    { label: 'Documents',   icon: 'file',    route: '/dashboard/documents'       },
    { label: 'My Courses',  icon: 'book',    route: '/dashboard/courses'         },
    { label: 'Flashcards',  icon: 'cards',   route: '/dashboard/flashcards'      },
    { label: 'Progress',    icon: 'chart',   route: '/dashboard/progress'        },
    { label: 'Profile',     icon: 'user',    route: '/dashboard/profile'         },
    { label: 'Community',   icon: 'chat',    route: '/dashboard/community'       },
    { label: 'Anti-Triche', icon: 'shield',  route: '/dashboard/admin/activity', adminOnly: true },
  ];

  readonly adminNavItems: NavItem[] = [
    { label: 'Overview',    icon: 'home',    route: '/dashboard/admin/overview',      adminOnly: true },
    { label: 'Students',    icon: 'user',    route: '/dashboard/admin/students',      adminOnly: true },
    { label: 'Certificates', icon: 'badge',  route: '/dashboard/admin/certificates',  adminOnly: true },
    { label: 'Assessments',   icon: 'chart',  route: '/dashboard/admin/assessments',   adminOnly: true },
    { label: 'Activity Logs', icon: 'file',   route: '/dashboard/admin/activity-logs', adminOnly: true },
    { label: 'Anti-Triche',   icon: 'shield', route: '/dashboard/admin/activity',      adminOnly: true },
    { label: 'Profile',     icon: 'user',    route: '/dashboard/profile'          },
  ];

  readonly pageTitles: Record<string, string> = {
    overview:       'Overview',
    documents:      'Documents',
    courses:        'My Courses',
    flashcards:     'Flashcards',
    progress:       'Progress',
    profile:        'Profile',
    activity:       'Academic Integrity Monitor',
    students:       'Students',
    certificates:   'Certificates',
    assessments:    'Assessments',
    'activity-logs': 'Activity Logs',
  };

  get pageTitle(): string {
    // Course viewer (and any other page) can push a custom title via PageTitleService
    const custom = this.pageTitleService.customTitle();
    if (custom) return custom;
    const seg = this.router.url.split('/').pop()?.split('?')[0] ?? '';
    return this.pageTitles[seg] ?? 'Dashboard';
  }

  get user() { return this.authService.currentUser(); }

  get isAdmin(): boolean {
    return this.user?.role === UserRole.ADMIN;
  }

  get visibleNavItems(): NavItem[] {
    if (this.isAdmin) {
      return this.adminNavItems;
    }
    return this.navItems.filter(item => !item.adminOnly);
  }

  get initials(): string {
    const u = this.user;
    if (!u) return '?';
    return `${u.firstName.charAt(0)}${u.lastName.charAt(0)}`.toUpperCase();
  }

  get notifications(): AppNotification[] {
    return this.notificationService.notifications().filter(n => n.type === 'IN_APP');
  }

  get unreadCount(): number {
    return this.notificationService.unreadCount();
  }

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService,
    private elRef: ElementRef,
    private pageTitleService: PageTitleService
  ) {}

  ngOnInit(): void {
    this.notificationService.init();
    document.body.classList.toggle('light-theme', !this.isDark);
  }

  ngOnDestroy(): void {
    this.notificationService.disconnect();
  }

  togglePanel(): void {
    this.panelOpen = !this.panelOpen;
  }

  onNotificationClick(n: AppNotification): void {
    if (!n.isRead) {
      this.notificationService.markAsRead(n.id).subscribe();
      this.notificationService.markAsReadLocally(n.id);
    }
    this.panelOpen = false;

    if (n.category === 'CERTIFICATE' && n.actionUrl) {
      window.open(n.actionUrl, '_blank');
      return;
    }

    if (n.actionUrl) {
      this.router.navigateByUrl(n.actionUrl);
    }
  }

  trackById(_: number, n: AppNotification): number { return n.id; }

  // Close panel on outside click
  @HostListener('document:click', ['$event'])
  onDocClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.panelOpen = false;
    }
  }

  categoryIcon(category: AppNotification['category']): string {
    switch (category) {
      case 'EXAM_RESULT':         return '📝';
      case 'CERTIFICATE':         return '🏆';
      case 'COURSE_COMPLETE':     return '🎓';
      case 'ALERT':               return '⚠️';
      case 'SUSPICIOUS_ACTIVITY': return '🔍';
      case 'REMINDER':            return '🔔';
      default:                    return '📣';
    }
  }

  logout(): void {
    this.notificationService.disconnect();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
