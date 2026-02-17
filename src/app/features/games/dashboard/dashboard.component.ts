import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { CollectionService, SavedGame } from '../../../core/services/collection.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProfileService } from '../../../core/services/profile.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  styleUrl: './dashboard.component.scss',
  template: `
    <section class="dashboard">
      <header class="dashboard__header">
        <h1>🎮 Mi Colección</h1>
        <p class="subtitle">
          Bienvenido, <strong>{{ userName() }}</strong> — Tienes
          <strong>{{ games().length }}</strong> juego{{ games().length !== 1 ? 's' : '' }} guardado{{ games().length !== 1 ? 's' : '' }}.
        </p>
      </header>

      <!-- Loader -->
      @if (loading()) {
        <div class="loader">
          <div class="spinner"></div>
          <p>Cargando tu colección...</p>
        </div>
      }

      <!-- Lista vacía -->
      @if (!loading() && games().length === 0) {
        <div class="empty">
          <p>Aún no has guardado ningún juego.</p>
          <a routerLink="/home" class="btn-explore">Explorar catálogo →</a>
        </div>
      }

      <!-- Grid de juegos guardados -->
      @if (!loading() && games().length > 0) {
        <div class="games-grid">
          @for (game of games(); track game.id) {
            <div class="game-card">
              <a [routerLink]="['/game', game.id]" class="card-link">
                <div class="card-img" [style.backgroundImage]="'url(' + game.background_image + ')'">
                  <span class="card-rating">⭐ {{ game.rating | number:'1.1-1' }}</span>
                </div>
                <div class="card-body">
                  <h3 class="card-title">{{ game.name }}</h3>
                  <span class="card-date">{{ game.released }}</span>
                </div>
              </a>
              <button class="btn-remove" (click)="removeGame(game)" [disabled]="removing()">
                🗑️ Quitar
              </button>
            </div>
          }
        </div>
      }
    </section>
  `
})
export class DashboardComponent implements OnInit {
  private collectionService = inject(CollectionService);
  private authService = inject(AuthService);
  private profileService = inject(ProfileService);

  // Signals (Check 34)
  games = signal<SavedGame[]>([]);
  loading = signal(false);
  removing = signal(false);

  // Nombre gamer desde el perfil de Firestore
  userName = computed(() => {
    const prof = this.profileService.profileSig();
    if (prof?.username) return prof.username;
    const user = this.authService.currentUserSig();
    return user?.email?.split('@')[0] ?? 'Jugador';
  });

  ngOnInit() {
    this.loadGames();
  }

  async loadGames() {
    this.loading.set(true);
    try {
      const data = await this.collectionService.loadUserCollection();
      // Ordenar por fecha añadida descendente
      data.sort((a, b) => b.addedAt - a.addedAt);
      this.games.set(data);
    } finally {
      this.loading.set(false);
    }
  }

  async removeGame(game: SavedGame) {
    this.removing.set(true);
    try {
      await this.collectionService.removeGame(game.id);
      // Actualizar la lista local
      this.games.update(list => list.filter(g => g.id !== game.id));
    } finally {
      this.removing.set(false);
    }
  }
}
