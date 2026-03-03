import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';

export type SuspiciousActivityType = 'TAB_SWITCH' | 'RIGHT_CLICK' | 'COPY_PASTE' | 'UNUSUAL_TIMING';

export interface SuspiciousActivityResponse {
  id: number;
  examAttemptId: number;
  activityType: SuspiciousActivityType;
  count: number;
  detectedAt: string;
  totalCount: number;
}

/** Emitted every time an event is logged to the backend. */
export interface AntiCheatEvent {
  type: SuspiciousActivityType;
  totalCount: number;
}

const API = 'http://localhost:8069/api/exam-attempts';

/**
 * Attaches browser event listeners to detect cheating behaviors during an exam.
 * Call attach(attemptId) when the exam starts, detach() when it ends.
 */
@Injectable({ providedIn: 'root' })
export class AntiCheatService implements OnDestroy {

  /** Emits every time a suspicious event is confirmed by the backend. */
  readonly event$ = new Subject<AntiCheatEvent>();

  private attemptId: number | null = null;

  // ── Bound handlers (needed for removeEventListener) ─────────────────────
  private readonly _onVisibility  = () => this._report('TAB_SWITCH');
  private readonly _onContextMenu = (e: Event) => { e.preventDefault(); this._report('RIGHT_CLICK'); };
  private readonly _onCopy        = () => this._report('COPY_PASTE');
  private readonly _onPaste       = () => this._report('COPY_PASTE');

  constructor(private http: HttpClient, private zone: NgZone) {}

  /** Start monitoring for exam attempt `attemptId`. */
  attach(attemptId: number): void {
    this.detach(); // ensure clean state
    this.attemptId = attemptId;

    document.addEventListener('visibilitychange', this._onVisibility);
    document.addEventListener('contextmenu',      this._onContextMenu);
    document.addEventListener('copy',             this._onCopy);
    document.addEventListener('paste',            this._onPaste);
  }

  /** Stop monitoring and remove all listeners. */
  detach(): void {
    this.attemptId = null;
    document.removeEventListener('visibilitychange', this._onVisibility);
    document.removeEventListener('contextmenu',      this._onContextMenu);
    document.removeEventListener('copy',             this._onCopy);
    document.removeEventListener('paste',            this._onPaste);
  }

  /** Manually report UNUSUAL_TIMING from the component. */
  reportUnusualTiming(clientElapsedSeconds: number): void {
    this._report('UNUSUAL_TIMING', clientElapsedSeconds);
  }

  ngOnDestroy(): void {
    this.detach();
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private _report(type: SuspiciousActivityType, clientElapsedSeconds?: number): void {
    if (!this.attemptId) return;
    const attemptId = this.attemptId;

    const body: { activityType: string; clientElapsedSeconds?: number } = { activityType: type };
    if (clientElapsedSeconds !== undefined) body.clientElapsedSeconds = clientElapsedSeconds;

    // Run HTTP call outside Angular zone to avoid unnecessary CD cycles
    this.zone.runOutsideAngular(() => {
      this.http.post<SuspiciousActivityResponse>(
        `${API}/${attemptId}/suspicious-activity`, body
      ).subscribe({
        next: (res) => {
          this.zone.run(() => {
            this.event$.next({ type: res.activityType, totalCount: res.totalCount });
          });
        },
        error: () => { /* silent fail — never block the student */ }
      });
    });
  }
}
