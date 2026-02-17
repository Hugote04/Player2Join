import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  styles: [`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 75vh;
      text-align: center;
    }

    .not-found {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .glitch {
      font-size: 6rem;
      font-weight: 900;
      color: #e94560;
      letter-spacing: 6px;
      text-shadow:
        2px 2px 0 #ff6b81,
        -2px -2px 0 #0f3460,
        4px 0 0 rgba(233, 69, 96, 0.3);
      animation: glitch 2.5s infinite;
    }

    .subtitle {
      font-size: 1.3rem;
      color: #eaeaea;
      font-weight: 600;
    }

    .hint {
      color: #888;
      font-size: 0.95rem;
      max-width: 340px;
    }

    .btn-home {
      margin-top: 0.5rem;
      padding: 0.7rem 2rem;
      border-radius: 8px;
      background: #e94560;
      color: #fff;
      text-decoration: none;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .btn-home:hover {
      background: #ff6b81;
      transform: translateY(-2px);
      box-shadow: 0 4px 18px rgba(233, 69, 96, 0.35);
    }

    @keyframes glitch {
      0%, 100% { transform: translate(0); }
      20% { transform: translate(-2px, 2px); }
      40% { transform: translate(2px, -2px); }
      60% { transform: translate(-1px, 1px); }
      80% { transform: translate(1px, -1px); }
    }
  `],
  template: `
    <div class="not-found">
      <span class="glitch">404</span>
      <p class="subtitle">¡Game Over!</p>
      <p class="hint">La página que buscas no existe en este nivel. Quizás te has perdido en el mapa.</p>
      <a routerLink="/home" class="btn-home">🏠 Volver al Inicio</a>
    </div>
  `
})
export class NotFoundComponent {}