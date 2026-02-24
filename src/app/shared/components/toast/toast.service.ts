import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {

  private _toasts$ = new BehaviorSubject<Toast[]>([]);
  readonly toasts$ = this._toasts$.asObservable();
  private nextId = 0;

  show(message: string, type: ToastType = 'info', duration = 4000): void {
    const id = this.nextId++;
    const toast: Toast = { id, message, type };
    this._toasts$.next([...this._toasts$.value, toast]);
    setTimeout(() => this.dismiss(id), duration);
  }

  success(message: string): void { this.show(message, 'success'); }
  error(message: string):   void { this.show(message, 'error'); }
  info(message: string):    void { this.show(message, 'info'); }
  warning(message: string): void { this.show(message, 'warning'); }

  dismiss(id: number): void {
    this._toasts$.next(this._toasts$.value.filter(t => t.id !== id));
  }
}
