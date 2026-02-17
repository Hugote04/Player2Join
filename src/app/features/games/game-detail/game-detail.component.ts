import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { GameService } from '../../../core/services/game.service';
import { CollectionService } from '../../../core/services/collection.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-game-detail',
  standalone: true,
  imports: [RouterLink],
  styleUrl: './game-detail.component.scss',
  template: `
    <!-- Loader -->
    @if (loading()) {
      <div class="loader">
        <div class="spinner"></div>
        <p>Cargando ficha del juego...</p>
      </div>
    }

    @if (!loading() && game()) {
      <section class="detail">
        <!-- Hero Banner -->
        <div class="detail__hero" [style.backgroundImage]="'url(' + game().background_image + ')'">
          <div class="hero-overlay">
            <a routerLink="/home" class="btn-back">← Volver al catálogo</a>
            <h1 class="hero-title">{{ game().name }}</h1>
            <div class="hero-meta">
              <span class="badge rating">⭐ {{ game().rating }} / 5</span>
              <span class="badge">{{ game().released }}</span>
              @if (game().metacritic) {
                <span class="badge metacritic">Metacritic: {{ game().metacritic }}</span>
              }
            </div>

            <!-- Botón Colección (solo si está autenticado) -->
            @if (isLoggedIn()) {
              <button
                class="btn-collection"
                [class.saved]="isSaved()"
                (click)="toggleCollection()"
                [disabled]="toggling()">
                @if (toggling()) {
                  ⏳ Guardando...
                } @else if (isSaved()) {
                  ❌ Quitar de mi Colección
                } @else {
                  🎮 Añadir a mi Colección
                }
              </button>
            }
          </div>
        </div>

        <!-- Contenido principal -->
        <div class="detail__body">
          <!-- Info lateral -->
          <aside class="detail__sidebar">
            <!-- Plataformas -->
            <div class="info-block">
              <h3>Plataformas</h3>
              <div class="tag-list">
                @for (p of game().platforms; track p.platform.id) {
                  <span class="tag">{{ p.platform.name }}</span>
                }
              </div>
            </div>

            <!-- Géneros -->
            <div class="info-block">
              <h3>Géneros</h3>
              <div class="tag-list">
                @for (genre of game().genres; track genre.id) {
                  <span class="tag genre">{{ genre.name }}</span>
                }
              </div>
            </div>

            <!-- Desarrolladores -->
            @if (game().developers?.length) {
              <div class="info-block">
                <h3>Desarrollador</h3>
                <div class="tag-list">
                  @for (dev of game().developers; track dev.id) {
                    <span class="tag">{{ dev.name }}</span>
                  }
                </div>
              </div>
            }

            <!-- Publishers -->
            @if (game().publishers?.length) {
              <div class="info-block">
                <h3>Publisher</h3>
                <div class="tag-list">
                  @for (pub of game().publishers; track pub.id) {
                    <span class="tag">{{ pub.name }}</span>
                  }
                </div>
              </div>
            }

            <!-- Web oficial -->
            @if (game().website) {
              <div class="info-block">
                <h3>Web oficial</h3>
                <a [href]="game().website" target="_blank" rel="noopener" class="external-link">
                  Visitar sitio ↗
                </a>
              </div>
            }
          </aside>

          <!-- Descripción -->
          <div class="detail__content">
            <div class="info-block">
              <h3>Descripción</h3>
              <div class="description" [innerHTML]="game().description"></div>
            </div>

            <!-- Capturas de pantalla -->
            @if (screenshots().length > 0) {
              <div class="info-block">
                <h3>Capturas de pantalla</h3>
                <div class="screenshots-grid">
                  @for (shot of screenshots(); track shot.id) {
                    <img [src]="shot.image" [alt]="game().name" class="screenshot" loading="lazy" />
                  }
                </div>
              </div>
            }
          </div>
        </div>
      </section>
    }

    <!-- Error -->
    @if (!loading() && !game()) {
      <div class="error-state">
        <p>No se pudo cargar el juego.</p>
        <a routerLink="/home" class="btn-back">← Volver al catálogo</a>
      </div>
    }
  `
})
export class GameDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private gameService = inject(GameService);
  private collectionService = inject(CollectionService);
  private authService = inject(AuthService);

  // Signals (Check 34)
  game = signal<any>(null);
  screenshots = signal<any[]>([]);
  loading = signal(false);
  toggling = signal(false);

  // Computed: ¿está logueado?
  isLoggedIn = computed(() => !!this.authService.currentUserSig());

  // Computed: ¿está guardado este juego?
  isSaved = computed(() => {
    const g = this.game();
    if (!g) return false;
    return this.collectionService.isSaved(String(g.id));
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loading.set(true);

    // Cargar colección del usuario para saber si ya está guardado
    this.collectionService.loadUserCollection();

    // Cargar detalle del juego (el interceptor añade la API key — Check 33)
    this.gameService.getGameById(id).subscribe({
      next: (data: any) => {
        this.game.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });

    // Cargar capturas de pantalla
    this.gameService.getGameScreenshots(id).subscribe({
      next: (data: any) => this.screenshots.set(data.results ?? []),
      error: () => {}
    });
  }

  /** Añadir o quitar de la colección */
  async toggleCollection() {
    const g = this.game();
    if (!g) return;

    this.toggling.set(true);
    try {
      if (this.collectionService.isSaved(String(g.id))) {
        await this.collectionService.removeGame(String(g.id));
      } else {
        await this.collectionService.addGame(g);
      }
    } finally {
      this.toggling.set(false);
    }
  }
}
