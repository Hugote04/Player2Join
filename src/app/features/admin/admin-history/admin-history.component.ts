import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { CollectionService, HiddenGame } from '../../../core/services/collection.service';

@Component({
  selector: 'app-admin-history',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  styleUrl: './admin-history.component.scss',
  template: `
    <section class="admin-history">
      <header class="history__header">
        <h1>🛡️ Panel de Administración</h1>
        <p class="subtitle">Historial de juegos ocultos del catálogo</p>
      </header>

      @if (loading()) {
        <div class="loader">
          <div class="spinner"></div>
          <p>Cargando historial...</p>
        </div>
      }

      @if (!loading() && games().length === 0) {
        <div class="empty">
          <p>No hay juegos ocultos en el catálogo.</p>
          <a routerLink="/home" class="btn-back">← Volver al catálogo</a>
        </div>
      }

      @if (!loading() && games().length > 0) {
        <p class="count-info">{{ games().length }} juego{{ games().length !== 1 ? 's' : '' }} oculto{{ games().length !== 1 ? 's' : '' }}</p>

        <div class="games-grid">
          @for (game of games(); track game.id) {
            <div class="game-card hidden-card">
              <a [routerLink]="['/game', game.id]" class="card-link">
                <div class="card-img" [style.backgroundImage]="'url(' + game.background_image + ')'">
                  <span class="card-rating">⭐ {{ game.rating | number:'1.1-1' }}</span>
                  <span class="hidden-badge">🚫 Oculto</span>
                </div>
                <div class="card-body">
                  <h3 class="card-title">{{ game.name }}</h3>
                  <span class="card-date">Oculto el {{ formatDate(game.hiddenAt) }}</span>
                </div>
              </a>
              <button class="btn-restore" (click)="restoreGame(game)" [disabled]="restoring()">
                ♻️ Restaurar al catálogo
              </button>
            </div>
          }
        </div>
      }
    </section>
  `
})
export class AdminHistoryComponent implements OnInit {
  private collectionService = inject(CollectionService);

  games = signal<HiddenGame[]>([]);
  loading = signal(false);
  restoring = signal(false);

  async ngOnInit() {
    this.loading.set(true);
    try {
      const list = await this.collectionService.loadHiddenGames();
      list.sort((a, b) => b.hiddenAt - a.hiddenAt);
      this.games.set(list);
    } finally {
      this.loading.set(false);
    }
  }

  async restoreGame(game: HiddenGame) {
    const ok = confirm(`¿Restaurar "${game.name}" al catálogo público?`);
    if (!ok) return;

    this.restoring.set(true);
    try {
      await this.collectionService.restoreGameToCatalog(game.id);
      this.games.update(list => list.filter(g => g.id !== game.id));
    } finally {
      this.restoring.set(false);
    }
  }

  formatDate(ts: number): string {
    return new Date(ts).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  }
}
