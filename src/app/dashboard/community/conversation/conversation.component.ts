// src/app/dashboard/community/conversation/conversation.component.ts
import {
  AfterViewChecked,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  CommunityService,
  ConversationDTO,
  MessageDTO,
  SendMessageRequest
} from '../../../core/services/community.service';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-conversation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './conversation.component.html',
  styleUrl: './conversation.component.scss'
})
export class ConversationComponent implements OnInit, AfterViewChecked, OnDestroy {

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef<HTMLDivElement>;

  messages = signal<MessageDTO[]>([]);
  conversation = signal<ConversationDTO | null>(null);
  messageInput = signal('');
  sending = signal(false);
  showCourseShare = signal(false);
  myCoursesToShare = signal<any[]>([]);

  private selectedCourseId = signal<number | null>(null);
  private shouldScrollToBottom = false;
  private routeSub?: Subscription;
  private sseSub?: Subscription;

  constructor(
    private communityService: CommunityService,
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
    private dashboardService: DashboardService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadMyCourses();

    this.routeSub = this.route.paramMap.subscribe(params => {
      const otherStudentIdRaw = params.get('otherStudentId');
      const otherStudentId = Number(otherStudentIdRaw);

      if (!otherStudentId || Number.isNaN(otherStudentId)) {
        this.router.navigate(['/dashboard/community']);
        return;
      }

      this.bootstrapConversation(otherStudentId);
    });

    this.sseSub = this.notificationService.sseEvents$.subscribe(payload => {
      if (!payload || typeof payload !== 'object') return;

      const event = payload as { type?: string; conversationId?: number };
      const activeConversation = this.conversation();
      if (!activeConversation) return;

      if (event.type === 'NEW_MESSAGE' && event.conversationId === activeConversation.id) {
        this.loadMessages(activeConversation.id);
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.sseSub?.unsubscribe();
  }

  ngAfterViewChecked(): void {
    if (!this.shouldScrollToBottom || !this.messagesContainer) return;
    const el = this.messagesContainer.nativeElement;
    el.scrollTop = el.scrollHeight;
    this.shouldScrollToBottom = false;
  }

  private bootstrapConversation(otherStudentId: number): void {
    this.communityService.getOrCreateConversation(otherStudentId).subscribe({
      next: (conv) => {
        this.conversation.set(conv);
        this.loadMessages(conv.id);
      },
      error: () => {
        this.router.navigate(['/dashboard/community']);
      }
    });
  }

  private loadMessages(conversationId: number): void {
    this.communityService.getMessages(conversationId).subscribe({
      next: (list) => {
        this.messages.set(list);
        this.shouldScrollToBottom = true;
      },
      error: () => {}
    });
  }

  private loadMyCourses(): void {
    this.dashboardService.getDashboard().subscribe({
      next: (res) => {
        this.myCoursesToShare.set(
          res.courses.map(c => ({ id: c.courseId, title: c.title }))
        );
      },
      error: () => {
        this.myCoursesToShare.set([]);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard/community']);
  }

  sendMessage(): void {
    const me = this.authService.currentUser();
    if (!me) {
      this.router.navigate(['/login']);
      return;
    }

    const conv = this.conversation();
    if (!conv) return;

    const content = this.messageInput().trim();
    if (!content) return;

    this.sending.set(true);

    const request: SendMessageRequest = {
      conversationId: conv.id,
      recipientId: null,
      content,
      courseIdToShare: this.selectedCourseId()
    };

    this.communityService.sendMessage(request).subscribe({
      next: (msg) => {
        this.messages.update(list => [...list, msg]);
        this.messageInput.set('');
        this.selectedCourseId.set(null);
        this.sending.set(false);
        this.showCourseShare.set(false);
        this.shouldScrollToBottom = true;
      },
      error: () => {
        this.sending.set(false);
      }
    });
  }

  onEnterKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  formatTime(sentAt: string): string {
    const date = new Date(sentAt);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  shareCourse(course: any): void {
    this.selectedCourseId.set(course.id ?? null);
    if (!this.messageInput().trim()) {
      this.messageInput.set(`I shared a course with you: ${course.title}`);
    }
    this.sendMessage();
  }

  toggleCourseShare(): void {
    this.showCourseShare.set(!this.showCourseShare());
  }

  openSharedCourse(courseId: number): void {
    if (!courseId) return;
    this.router.navigate(['/dashboard/courses', courseId]);
  }
}
