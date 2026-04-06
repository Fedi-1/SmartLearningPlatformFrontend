// src/app/shared/components/chat-widget/chat-widget.component.ts

// ─────────────────────────────────────────────────────────────────────────────
// INTEGRATION INSTRUCTIONS
// ─────────────────────────────────────────────────────────────────────────────
// VISITOR MODE — add to landing page component:
// <app-chat-widget mode="visitor"></app-chat-widget>
//
// STUDENT MODE (general) — add to dashboard shell:
// <app-chat-widget mode="student"></app-chat-widget>
//
// STUDENT MODE (lesson context) — add to course viewer component:
// <app-chat-widget mode="student" [lessonContext]="currentLesson?.content"></app-chat-widget>
// ─────────────────────────────────────────────────────────────────────────────

import {
  Component,
  Input,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage } from '../../services/chat.service';
import { ChatContextService } from '../../services/chat-context.service';

interface DisplayMessage {
  role: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: Date;
}

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-widget.component.html',
  styleUrl: './chat-widget.component.scss',
})
export class ChatWidgetComponent implements OnDestroy, AfterViewChecked {
  @Input() mode: 'visitor' | 'student' = 'visitor';
  @Input() lessonContext: string | null = null;

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef<HTMLDivElement>;

  isOpen = signal(false);
  messages = signal<DisplayMessage[]>([]);
  inputText = '';
  isLoading = signal(false);
  private shouldScrollToBottom = false;
  private readonly chatContextService = inject(ChatContextService);

  constructor(private readonly chatService: ChatService) {}

  private get effectiveLessonContext(): string | null {
    const inputContext = this.lessonContext?.trim();
    if (inputContext) return inputContext;
    const sharedContext = this.chatContextService.getContext()?.trim();
    return sharedContext || null;
  }

  // ── Welcome message text based on mode/context ──────────────────────────
  get welcomeText(): string {
    if (this.mode === 'student') {
      return this.effectiveLessonContext
        ? 'Hi! I\'m here to help you understand this lesson. Ask me anything 📚'
        : 'Hi! I\'m your learning assistant. How can I help you? 🎓';
    }
    return 'Hi! I\'m the LearnAI assistant. Ask me anything about the platform 👋';
  }

  // ── Mode badge label ─────────────────────────────────────────────────────
  get modeBadgeLabel(): string {
    return this.mode === 'student' ? 'Student' : 'Visitor';
  }

  // ── Toggle open/closed ───────────────────────────────────────────────────
  toggleWidget(): void {
    this.isOpen.set(!this.isOpen());

    if (this.isOpen() && this.messages().length === 0) {
      // Add welcome message only on the very first open
      this.messages.set([
        {
          role: 'assistant',
          content: this.welcomeText,
          timestamp: new Date(),
        },
      ]);
      this.shouldScrollToBottom = true;
    }
  }

  closeWidget(): void {
    this.isOpen.set(false);
  }

  // ── Send a message ───────────────────────────────────────────────────────
  sendMessage(): void {
    const text = this.inputText.trim();
    if (!text || this.isLoading()) return;

    const contextToSend = this.effectiveLessonContext;

    // Add user message to display
    this.messages.update(msgs => [
      ...msgs,
      { role: 'user', content: text, timestamp: new Date() },
    ]);
    this.inputText = '';
    this.isLoading.set(true);
    this.shouldScrollToBottom = true;

    // Build messages array (exclude error and welcome assistant messages that
    // weren't real responses — keep all user + assistant turns for context)
    const history: ChatMessage[] = this.messages()
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    this.chatService
      .sendMessage(history, this.mode, contextToSend || undefined)
      .subscribe({
        next: (res) => {
          this.messages.update(msgs => [
            ...msgs,
            { role: 'assistant', content: res.reply, timestamp: new Date() },
          ]);
          this.isLoading.set(false);
          this.shouldScrollToBottom = true;
        },
        error: () => {
          this.messages.update(msgs => [
            ...msgs,
            {
              role: 'error',
              content: 'Sorry, I\'m having trouble connecting. Please try again.',
              timestamp: new Date(),
            },
          ]);
          this.isLoading.set(false);
          this.shouldScrollToBottom = true;
        },
      });
  }

  // ── Handle Enter key ─────────────────────────────────────────────────────
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  // ── Relative timestamp label ─────────────────────────────────────────────
  relativeTime(date: Date): string {
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin === 1) return '1 min ago';
    return `${diffMin} min ago`;
  }

  // ── Auto-scroll messages to bottom after updates ─────────────────────────
  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom && this.messagesContainer) {
      const el = this.messagesContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.messages.set([]);
  }
}
