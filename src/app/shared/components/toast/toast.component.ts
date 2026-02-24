import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Toast, ToastService } from './toast.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toasts$ | async; track toast.id) {
        <div class="toast toast--{{ toast.type }}">
          <span class="toast__icon">{{ iconMap[toast.type] }}</span>
          <span class="toast__message">{{ toast.message }}</span>
          <button class="toast__close" (click)="dismiss(toast.id)">✕</button>
          <div class="toast__progress"></div>
        </div>
      }
    </div>
  `,
  styleUrl: './toast.component.scss'
})
export class ToastComponent implements OnInit {

  toasts$!: Observable<Toast[]>;

  readonly iconMap: Record<string, string> = {
    success: '✓',
    error:   '✕',
    warning: '⚠',
    info:    'ℹ'
  };

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.toasts$ = this.toastService.toasts$;
  }

  dismiss(id: number): void {
    this.toastService.dismiss(id);
  }
}
