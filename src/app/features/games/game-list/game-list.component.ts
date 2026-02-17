import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { GameService } from '../../../core/services/game.service';
import { CollectionService } from '../../../core/services/collection.service';
import { AuthService } from '../../../core/services/auth.service';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SlicePipe } from '@angular/common';

@Component({
  selector: 'app-game-list',
  standalone: true,
  imports: [RouterLink, FormsModule, SlicePipe],
  styleUrl: './game-list.component.scss',
  template: `
    <section class="catalog">
      <div class="catalog__header">
        <h1 class="catalog__title">🎮 Catálogo de Juegos</h1>
        <p class="catalog__subtitle">Explora miles de juegos de la base de datos de RAWG</p>

        <!-- Buscador -->
        <div class="search-bar">
          <input
            type="text"
            placeholder="Buscar juegos..."
            [(ngModel)]="searchQuery"
            (keyup.enter)="onSearch()"
          />
          <button class="btn-search" (click)="onSearch()">Buscar</button>
        </div>
      </div>

      <!-- Loader (Check 29) -->
      @if (loading()) {
        <div class="loader">
          <div class="spinner"></div>
          <p>Cargando juegos...</p>
        </div>
      }

      <!-- Grid de Cards -->
      @if (!loading() && games().length > 0) {
        <div class="games-grid">
          @for (game of games(); track game.id) {
            <a [routerLink]="['/game', game.id]" class="game-card">
              <div class="game-card__image">
                @if (game.background_image) {
                  <img [src]="game.background_image" [alt]="game.name" loading="lazy" />
                } @else {
                  <div class="no-image">Sin imagen</div>
                }
                <div class="game-card__rating">
                  <span>⭐ {{ game.rating }}</span>
                </div>
                <!-- Badge colección -->
                @if (isInCollection(game.id)) {
                  <span class="card-saved-badge">✔ En colección</span>
                }
              </div>
              <div class="game-card__info">
                <h3 class="game-card__name">{{ game.name }}</h3>
                <div class="game-card__meta">
                  <span class="meta-tag">{{ game.released | slice:0:4 }}</span>
                  @for (genre of game.genres?.slice(0, 2); track genre.id) {
                    <span class="meta-tag genre">{{ genre.name }}</span>
                  }
                </div>
                <div class="game-card__platforms">
                  @for (p of game.parent_platforms?.slice(0, 4); track p.platform.id) {
                    <span class="platform-icon">{{ getPlatformIcon(p.platform.slug) }}</span>
                  }
                </div>
              </div>
            </a>
          }
        </div>

        <!-- Paginación -->
        <div class="pagination">
          <button
            class="btn-page"
            [disabled]="currentPage() <= 1"
            (click)="goToPage(currentPage() - 1)">
            ← Anterior
          </button>
          <span class="page-info">Página {{ currentPage() }}</span>
          <button
            class="btn-page"
            [disabled]="!hasNextPage()"
            (click)="goToPage(currentPage() + 1)">
            Siguiente →
          </button>
        </div>
      }

      <!-- Sin resultados -->
      @if (!loading() && games().length === 0) {
        <div class="no-results">
          <p>No se encontraron juegos. Intenta otra búsqueda.</p>
        </div>
      }
    </section>
  `
})
export class GameListComponent implements OnInit {
  private gameService = inject(GameService);
  private collectionService = inject(CollectionService);
  private authService = inject(AuthService);

  // Signals para estado reactivo (Check 34)
  games = signal<any[]>([]);
  loading = signal(false);
  searchQuery = '';

  // Paginación
  currentPage = signal(1);
  totalResults = signal(0);
  pageSize = 20;
  hasNextPage = computed(() => this.currentPage() * this.pageSize < this.totalResults());

  ngOnInit() {
    // Cargar colección del usuario (para badges)
    if (this.authService.isAuthenticated()) {
      this.collectionService.loadUserCollection();
    }
    this.loadGames();
  }

  loadGames(search?: string, page = 1) {
    this.loading.set(true);
    const request = search
      ? this.gameService.searchGames(search, page, this.pageSize)
      : this.gameService.getGames(page, this.pageSize);

    request.subscribe({
      next: (data: any) => {
        this.games.set(data.results);
        this.totalResults.set(data.count ?? 0);
        this.currentPage.set(page);
        this.loading.set(false);
        // Scroll arriba al cambiar de página
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: () => this.loading.set(false)
    });
  }

  onSearch() {
    const query = this.searchQuery.trim();
    this.loadGames(query || undefined, 1);
  }

  goToPage(page: number) {
    const query = this.searchQuery.trim();
    this.loadGames(query || undefined, page);
  }

  /** Comprueba si un juego está en la colección del usuario */
  isInCollection(gameId: number): boolean {
    return this.collectionService.isSaved(String(gameId));
  }

  // Mapea plataformas a iconos
  getPlatformIcon(slug: string): string {
    const icons: Record<string, string> = {
      pc: '🖥️',
      playstation: '🎮',
      xbox: '🟢',
      nintendo: '🔴',
      mac: '🍎',
      linux: '🐧',
      android: '📱',
      ios: '📱',
      web: '🌐'
    };
    return icons[slug] ?? '🎲';
  }
}