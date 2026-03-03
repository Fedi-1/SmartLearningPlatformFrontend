import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SuspiciousActivityType } from '../../../core/services/anti-cheat.service';

@Component({
  selector: 'app-anti-cheat-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (visible) {
      <div class="ac-overlay" (click)="dismiss()">
        <div class="ac-modal" (click)="$event.stopPropagation()">
          <div class="ac-modal__icon">⚠️</div>
          <h2 class="ac-modal__title">Activité suspecte détectée</h2>
          <p class="ac-modal__desc">{{ message }}</p>
          <p class="ac-modal__count">
            Total d'événements suspects : <strong>{{ totalCount }}</strong>
          </p>
          <p class="ac-modal__warning">
            Ces activités sont enregistrées et peuvent être examinées après l'examen.
          </p>
          <button class="ac-modal__btn" (click)="dismiss()">
            Compris, reprendre l'examen
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .ac-overlay {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0,0,0,0.55);
      display: flex; align-items: center; justify-content: center;
      animation: acFadeIn 0.15s ease;
    }
    .ac-modal {
      background: #fff; border-radius: 14px;
      padding: 2rem 2.25rem; max-width: 420px; width: 90%;
      text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.25);
      border-top: 4px solid #F59E0B;
    }
    .ac-modal__icon  { font-size: 2.5rem; margin-bottom: .5rem; }
    .ac-modal__title { font-size: 1.2rem; font-weight: 700; color: #92400E; margin: 0 0 .6rem; }
    .ac-modal__desc  { font-size: .9rem; color: #374151; margin: 0 0 .5rem; }
    .ac-modal__count { font-size: .85rem; color: #6B7280; margin: 0 0 .5rem; }
    .ac-modal__warning {
      font-size: .78rem; color: #9CA3AF; margin: 0 0 1.25rem;
      padding: .5rem .75rem;
      background: #FEF3C7; border-radius: 6px;
    }
    .ac-modal__btn {
      background: #1A3A6B; color: #fff; border: none;
      padding: .6rem 1.4rem; border-radius: 8px;
      font-size: .9rem; font-weight: 600; cursor: pointer;
      transition: background .15s;
      &:hover { background: #15316a; }
    }
    @keyframes acFadeIn { from { opacity: 0; } to { opacity: 1; } }
  `]
})
export class AntiCheatModalComponent {
  @Input() visible = false;
  @Input() activityType: SuspiciousActivityType | null = null;
  @Input() totalCount = 0;
  @Output() dismissed = new EventEmitter<void>();

  get message(): string {
    switch (this.activityType) {
      case 'TAB_SWITCH':     return 'Un changement d\'onglet ou de fenêtre a été détecté.';
      case 'RIGHT_CLICK':    return 'Un clic droit a été détecté pendant l\'examen.';
      case 'COPY_PASTE':     return 'Une tentative de copier/coller a été détectée.';
      case 'UNUSUAL_TIMING': return 'Un délai inhabituel a été détecté dans vos réponses.';
      default:               return 'Une activité suspecte a été détectée.';
    }
  }

  dismiss(): void {
    this.dismissed.emit();
  }
}
