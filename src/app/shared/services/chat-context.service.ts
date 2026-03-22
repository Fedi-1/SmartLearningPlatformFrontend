import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ChatContextService {
  private context = signal<string | null>(null);

  setContext(value: string | null): void {
    this.context.set(value);
  }

  getContext(): string | null {
    return this.context();
  }
}
