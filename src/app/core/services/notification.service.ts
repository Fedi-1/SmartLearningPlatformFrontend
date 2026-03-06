import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TokenService } from './token.service';

export interface AppNotification {
  id: number;
  userId: number;
  type: 'EMAIL' | 'IN_APP';
  category: 'COURSE_COMPLETE' | 'EXAM_RESULT' | 'CERTIFICATE' | 'REMINDER' | 'ALERT' | 'SUSPICIOUS_ACTIVITY';
  title: string;
  message: string;
  referenceId: number | null;
  actionUrl: string | null;
  isRead: boolean;
  sentAt: string;
  readAt: string | null;
}

const API = 'http://localhost:8069/api/notifications';

@Injectable({ providedIn: 'root' })
export class NotificationService {

  private _notifications = signal<AppNotification[]>([]);
  readonly notifications = this._notifications.asReadonly();
  readonly unreadCount = computed(() =>
    this._notifications().filter(n => n.type === 'IN_APP' && !n.isRead).length
  );

  private eventSource: EventSource | null = null;

  constructor(
    private http: HttpClient,
    private tokenService: TokenService
  ) {}

  /** Load all notifications from REST, then open SSE stream */
  init(): void {
    this.loadAll();
    this.connectSse();
  }

  loadAll(): void {
    this.http.get<AppNotification[]>(API).subscribe({
      next: list => this._notifications.set(list),
      error: () => {}
    });
  }

  markAsRead(id: number): Observable<AppNotification> {
    return this.http.put<AppNotification>(`${API}/${id}/read`, {});
  }

  markAsReadLocally(id: number): void {
    this._notifications.update(list =>
      list.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  }

  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private connectSse(): void {
    if (this.eventSource) {
      this.eventSource.close();
    }

    const token = this.tokenService.getToken();
    if (!token) return;

    // SSE endpoint — token sent as query param because EventSource doesn't support headers
    this.eventSource = new EventSource(`${API}/subscribe?token=${token}`);

    this.eventSource.addEventListener('notification', (event: MessageEvent) => {
      try {
        const notification: AppNotification = JSON.parse(event.data);
        this._notifications.update(list => [notification, ...list]);
      } catch (_) {}
    });

    this.eventSource.onerror = () => {
      this.eventSource?.close();
      this.eventSource = null;
      // Auto-reconnect after 5 seconds
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(() => this.connectSse(), 5000);
    };
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.eventSource?.close();
    this.eventSource = null;
  }
}
