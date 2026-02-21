import { Component, inject, computed } from '@angular/core';
import { ToastService } from './toast.service';

/**
 * Componente global de notificaciones toast.
 * Muestra mensajes de éxito/error flotantes con auto-cierre.
 */
@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    @if (toast(); as t) {
      <div class="toast" [class]="'toast--' + t.type" (click)="dismiss()">
        <span class="toast__icon">{{ t.type === 'success' ? '✅' : '❌' }}</span>
        <span class="toast__msg">{{ t.message }}</span>
        <button class="toast__close" (click)="dismiss()">✕</button>
      </div>
    }
  `,
  styles: [`
    .toast {
      position: fixed;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: .6rem;
      padding: .85rem 1.4rem;
      border-radius: 12px;
      font-size: .95rem;
      font-weight: 500;
      color: #fff;
      box-shadow: 0 6px 24px rgba(0,0,0,.45);
      animation: slideUp .3s ease;
      cursor: pointer;
      max-width: 90vw;
    }
    .toast--success { background: #1db954; }
    .toast--error   { background: #e94560; }
    .toast__close {
      background: none;
      border: none;
      color: inherit;
      font-size: 1.1rem;
      cursor: pointer;
      margin-left: .4rem;
      opacity: .8;
    }
    .toast__close:hover { opacity: 1; }
    @keyframes slideUp {
      from { opacity: 0; transform: translateX(-50%) translateY(1rem); }
      to   { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
  `]
})
export class ToastComponent {
  private toastService = inject(ToastService);
  toast = computed(() => this.toastService.current());

  dismiss(): void {
    this.toastService.clear();
  }
}
