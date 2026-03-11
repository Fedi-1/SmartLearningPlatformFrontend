// src/app/core/services/page-title.service.ts
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PageTitleService {
  /** Custom title override. When set, the shell topbar uses this instead of the route-based title. */
  readonly customTitle = signal<string | null>(null);

  set(title: string): void {
    this.customTitle.set(title);
  }

  clear(): void {
    this.customTitle.set(null);
  }
}
