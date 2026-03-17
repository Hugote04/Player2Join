import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { GameService, CustomGame } from '../../../core/services/game.service';
import { CollectionService } from '../../../core/services/collection.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
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

        <!-- Botón añadir juego (solo admins) -->
        @if (isAdmin()) {
          <button class="btn-add-game" (click)="showAddModal.set(true)">➕ Añadir juego al catálogo</button>
        }
      </div>

      <!-- Loader (Check 29) -->
      @if (loading()) {
        <div class="loader">
          <div class="spinner"></div>
          <p>Cargando juegos...</p>
        </div>
      }

      <!-- Juegos custom del usuario en página 1 -->
      @if (!loading() && currentPage() === 1 && customGamesFiltered().length > 0) {
        <h2 class="section-label">🧩 Juegos añadidos por la comunidad</h2>
        <div class="games-grid">
          @for (game of customGamesFiltered(); track game.id) {
            <div class="game-card-wrapper custom-card">
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
                  <span class="card-custom-badge">🧩 Custom</span>
                </div>
                <div class="game-card__info">
                  <h3 class="game-card__name">{{ game.name }}</h3>
                  <div class="game-card__meta">
                    <span class="meta-tag">{{ game.released | slice:0:4 }}</span>
                    @for (genre of game.genres?.slice(0, 2); track genre.name) {
                      <span class="meta-tag genre">{{ genre.name }}</span>
                    }
                  </div>
                </div>
              </a>
              <!-- Admin: editar / eliminar juego custom -->
              @if (isAdmin()) {
                <div class="custom-actions">
                  <button class="btn-admin-edit" (click)="openEditModal($event, game)">✏️ Editar</button>
                  <button class="btn-admin-hide" (click)="deleteCustomGame($event, game)">🗑️ Eliminar</button>
                </div>
              }
            </div>
          }
        </div>
        <h2 class="section-label" style="margin-top: 2rem;">🌐 Juegos de RAWG</h2>
      }

      <!-- Grid de Cards -->
      @if (!loading() && games().length > 0) {
        <div class="games-grid">
          @for (game of games(); track game.id) {
            <div class="game-card-wrapper">
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
            <!-- Admin: botón ocultar/restaurar del catálogo -->
            @if (isAdmin()) {
              @if (isHiddenGame(game.id)) {
                <button class="btn-admin-restore" (click)="restoreFromCatalog($event, game)">
                  ✅ Restaurar al catálogo
                </button>
              } @else {
                <button class="btn-admin-hide" (click)="hideFromCatalog($event, game)">
                  🚫 Ocultar del catálogo
                </button>
              }
            }
            </div>
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
      @if (!loading() && games().length === 0 && customGamesFiltered().length === 0) {
        <div class="no-results">
          <p>No se encontraron juegos. Intenta otra búsqueda.</p>
        </div>
      }
    </section>

    <!-- ===== MODAL: Añadir juego ===== -->
    @if (showAddModal()) {
      <div class="modal-overlay" (click)="showAddModal.set(false)">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <h2>➕ Añadir juego al catálogo</h2>

          <label>Nombre del juego *</label>
          <input type="text" [(ngModel)]="newGame.name" placeholder="Ej: Mi juego indie" />

          <label>Descripción</label>
          <textarea [(ngModel)]="newGame.description" rows="3" placeholder="Descripción del juego..."></textarea>

          <label>URL de la imagen</label>
          <input type="text" [(ngModel)]="newGame.background_image" placeholder="https://..." />

          <label>Fecha de lanzamiento</label>
          <input type="date" [(ngModel)]="newGame.released" />

          <label>Valoración (0-5)</label>
          <input type="number" [(ngModel)]="newGame.rating" min="0" max="5" step="0.1" />

          <label>Géneros (separados por coma)</label>
          <input type="text" [(ngModel)]="newGame.genresRaw" placeholder="Acción, RPG, Aventura" />

          <label>Plataformas (separadas por coma)</label>
          <input type="text" [(ngModel)]="newGame.platformsRaw" placeholder="PC, PlayStation, Xbox" />

          <label>URL del juego (web, tienda, descarga...)</label>
          <input type="text" [(ngModel)]="newGame.website" placeholder="https://store.steampowered.com/..." />

          @if (addError()) {
            <p class="modal-error">{{ addError() }}</p>
          }

          <div class="modal-actions">
            <button class="btn-cancel" (click)="showAddModal.set(false)">Cancelar</button>
            <button class="btn-save" (click)="submitCustomGame()" [disabled]="addingGame()">
              {{ addingGame() ? '⏳ Guardando...' : '💾 Guardar' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ===== MODAL: Editar juego custom ===== -->
    @if (showEditModal()) {
      <div class="modal-overlay" (click)="showEditModal.set(false)">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <h2>✏️ Editar juego</h2>

          <label>Nombre del juego *</label>
          <input type="text" [(ngModel)]="editGame.name" />

          <label>Descripción</label>
          <textarea [(ngModel)]="editGame.description" rows="3"></textarea>

          <label>URL de la imagen</label>
          <input type="text" [(ngModel)]="editGame.background_image" />

          <label>Fecha de lanzamiento</label>
          <input type="date" [(ngModel)]="editGame.released" />

          <label>Valoración (0-5)</label>
          <input type="number" [(ngModel)]="editGame.rating" min="0" max="5" step="0.1" />

          <label>Géneros (separados por coma)</label>
          <input type="text" [(ngModel)]="editGame.genresRaw" />

          <label>Plataformas (separadas por coma)</label>
          <input type="text" [(ngModel)]="editGame.platformsRaw" />

          <label>URL del juego (web, tienda, descarga...)</label>
          <input type="text" [(ngModel)]="editGame.website" />

          @if (editError()) {
            <p class="modal-error">{{ editError() }}</p>
          }

          <div class="modal-actions">
            <button class="btn-cancel" (click)="showEditModal.set(false)">Cancelar</button>
            <button class="btn-save" (click)="submitEditGame()" [disabled]="editingGame()">
              {{ editingGame() ? '⏳ Guardando...' : '💾 Guardar cambios' }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class GameListComponent implements OnInit {
  private gameService = inject(GameService);
  private collectionService = inject(CollectionService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  // Signals para estado reactivo (Check 34)
  games = signal<any[]>([]);
  loading = signal(false);
  searchQuery = '';

  // Paginación
  currentPage = signal(1);
  totalResults = signal(0);
  pageSize = 20;
  hasNextPage = computed(() => this.currentPage() * this.pageSize < this.totalResults());

  // ¿Está buscando el usuario?
  isSearching = signal(false);

  // ¿Es admin? ¿Está logueado?
  isAdmin = computed(() => this.authService.isAdmin());
  isLoggedIn = computed(() => !!this.authService.currentUserSig());
  currentUid = computed(() => this.authService.currentUserSig()?.uid ?? '');

  // ===== Custom games =====
  showAddModal = signal(false);
  addingGame = signal(false);
  addError = signal<string | null>(null);
  newGame = { name: '', description: '', background_image: '', rating: 0, released: '', genresRaw: '', platformsRaw: '', website: '' };

  // ===== Editar custom game =====
  showEditModal = signal(false);
  editingGame = signal(false);
  editError = signal<string | null>(null);
  editGameId = '';
  editGame = { name: '', description: '', background_image: '', rating: 0, released: '', genresRaw: '', platformsRaw: '', website: '' };

  /** Custom games filtrados (búsqueda + ocultos) */
  customGamesFiltered = computed(() => {
    const all = this.gameService.customGamesSig();
    const query = this.searchQuery.trim().toLowerCase();
    let filtered = all;
    if (query) {
      filtered = filtered.filter(g => g.name.toLowerCase().includes(query));
    }
    if (!this.authService.isAdmin()) {
      filtered = filtered.filter(g => !this.collectionService.isHidden(g.id));
    }
    return filtered;
  });

  ngOnInit() {
    // Cargar colección del usuario (para badges y filtrado)
    if (this.authService.isAuthenticated()) {
      this.collectionService.loadUserCollection();
    }
    // Cargar juegos ocultos del catálogo
    this.collectionService.loadHiddenGames();
    // Cargar juegos custom
    this.gameService.loadCustomGames();
    this.loadGames();
  }

  loadGames(search?: string, page = 1) {
    this.loading.set(true);
    this.isSearching.set(!!search);
    const request = search
      ? this.gameService.searchGames(search, page, this.pageSize)
      : this.gameService.getGames(page, this.pageSize);

    request.subscribe({
      next: (data: any) => {
        let results = data.results;
        // Si NO está buscando, ocultar los juegos que ya están en la colección
        if (!search && this.authService.isAuthenticated()) {
          results = results.filter((g: any) => !this.collectionService.isSaved(String(g.id)));
        }
        // Filtrar juegos ocultos por admin (solo para usuarios normales)
        if (!this.authService.isAdmin()) {
          results = results.filter((g: any) => !this.collectionService.isHidden(String(g.id)));
        }
        this.games.set(results);
        this.totalResults.set(data.count ?? 0);
        this.currentPage.set(page);
        this.loading.set(false);
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

  /** Comprueba si un juego está oculto del catálogo */
  isHiddenGame(gameId: number): boolean {
    return this.collectionService.isHidden(String(gameId));
  }

  /** Admin: Restaurar un juego oculto al catálogo */
  async restoreFromCatalog(event: Event, game: any) {
    event.preventDefault();
    event.stopPropagation();
    const ok = confirm(`¿Restaurar "${game.name}" al catálogo?`);
    if (!ok) return;
    try {
      await this.collectionService.restoreGameToCatalog(String(game.id));
      this.toast.success(`"${game.name}" restaurado al catálogo`);
    } catch {
      this.toast.error('Error al restaurar el juego');
    }
  }

  /** Admin: Ocultar un juego del catálogo */
  async hideFromCatalog(event: Event, game: any) {
    event.preventDefault();
    event.stopPropagation();
    const ok = confirm(`¿Ocultar "${game.name}" del catálogo para todos los usuarios?`);
    if (!ok) return;

    const uid = this.authService.currentUserSig()?.uid;
    if (!uid) return;

    try {
      await this.collectionService.hideGameFromCatalog(game, uid);
      // Quitar de la vista local
      this.games.update(list => list.filter(g => g.id !== game.id));
      this.toast.success(`"${game.name}" ocultado del catálogo`);
    } catch {
      this.toast.error('Error al ocultar el juego');
    }
  }

  /** Envía el formulario del juego custom */
  async submitCustomGame() {
    if (!this.newGame.name.trim()) {
      this.addError.set('El nombre del juego es obligatorio.');
      return;
    }
    const uid = this.authService.currentUserSig()?.uid;
    if (!uid) return;

    this.addingGame.set(true);
    this.addError.set(null);

    try {
      const genres = this.newGame.genresRaw
        .split(',')
        .map(g => g.trim())
        .filter(g => g)
        .map((name, i) => ({ id: i + 1, name }));

      const platforms = this.newGame.platformsRaw
        .split(',')
        .map(p => p.trim())
        .filter(p => p)
        .map((name, i) => ({ platform: { id: i + 1, name, slug: name.toLowerCase().replace(/\s+/g, '') } }));

      await this.gameService.addCustomGame({
        name: this.newGame.name.trim(),
        description: this.newGame.description.trim(),
        background_image: this.newGame.background_image.trim(),
        rating: Math.min(5, Math.max(0, this.newGame.rating || 0)),
        released: this.newGame.released || new Date().toISOString().slice(0, 10),
        genres,
        platforms,
        website: this.newGame.website.trim() || undefined,
        addedByUid: uid,
      });

      // Reset form y cerrar modal
      this.newGame = { name: '', description: '', background_image: '', rating: 0, released: '', genresRaw: '', platformsRaw: '', website: '' };
      this.showAddModal.set(false);
      this.toast.success('Juego añadido al catálogo correctamente');
    } catch (err) {
      this.addError.set('Error al guardar el juego. Inténtalo de nuevo.');
      this.toast.error('Error al añadir el juego');
    } finally {
      this.addingGame.set(false);
    }
  }

  /** Abre el modal de edición con los datos del juego */
  openEditModal(event: Event, game: CustomGame) {
    event.preventDefault();
    event.stopPropagation();
    this.editGameId = game.id;
    this.editGame = {
      name: game.name,
      description: game.description ?? '',
      background_image: game.background_image ?? '',
      rating: game.rating ?? 0,
      released: game.released ?? '',
      genresRaw: game.genres?.map(g => g.name).join(', ') ?? '',
      platformsRaw: game.platforms?.map(p => p.platform.name).join(', ') ?? '',
      website: game.website ?? '',
    };
    this.editError.set(null);
    this.showEditModal.set(true);
  }

  /** Envía los cambios del juego editado */
  async submitEditGame() {
    if (!this.editGame.name.trim()) {
      this.editError.set('El nombre es obligatorio.');
      return;
    }
    this.editingGame.set(true);
    this.editError.set(null);

    try {
      const genres = this.editGame.genresRaw
        .split(',')
        .map(g => g.trim())
        .filter(g => g)
        .map((name, i) => ({ id: i + 1, name }));

      const platforms = this.editGame.platformsRaw
        .split(',')
        .map(p => p.trim())
        .filter(p => p)
        .map((name, i) => ({ platform: { id: i + 1, name, slug: name.toLowerCase().replace(/\s+/g, '') } }));

      await this.gameService.updateCustomGame(this.editGameId, {
        name: this.editGame.name.trim(),
        description: this.editGame.description.trim(),
        background_image: this.editGame.background_image.trim(),
        rating: Math.min(5, Math.max(0, this.editGame.rating || 0)),
        released: this.editGame.released || new Date().toISOString().slice(0, 10),
        genres,
        platforms,
        website: this.editGame.website.trim() || undefined,
      });

      this.showEditModal.set(false);
      this.toast.success('Juego actualizado correctamente');
    } catch {
      this.editError.set('Error al guardar los cambios.');
      this.toast.error('Error al actualizar el juego');
    } finally {
      this.editingGame.set(false);
    }
  }

  /** Eliminar un juego custom del catálogo */
  async deleteCustomGame(event: Event, game: CustomGame) {
    event.preventDefault();
    event.stopPropagation();
    const ok = confirm(`¿Eliminar "${game.name}" del catálogo?`);
    if (!ok) return;
    try {
      await this.gameService.deleteCustomGame(game.id);
      this.toast.success(`"${game.name}" eliminado del catálogo`);
    } catch {
      this.toast.error('Error al eliminar el juego');
    }
  }
}