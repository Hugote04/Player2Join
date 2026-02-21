import { Component, input } from '@angular/core';

/**
 * LoaderComponent — Spinner reutilizable para feedback visual (Check 29).
 * Acepta un mensaje opcional vía input signal.
 */
@Component({
  selector: 'app-loader',
  standalone: true,
  template: `
    <div class="loader">
      <div class="spinner"></div>
      @if (message()) {
        <p>{{ message() }}</p>
      }
    </div>
  `,
  styles: [`
    .loader {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 0;
      gap: 1rem;

      p {
        color: #888;
        font-size: 0.95rem;
      }
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid rgba(233, 69, 96, 0.2);
      border-top-color: #e94560;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class LoaderComponent {
  /** Mensaje opcional debajo del spinner */
  message = input<string>('');
}
