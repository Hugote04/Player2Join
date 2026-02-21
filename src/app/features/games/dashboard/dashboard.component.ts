import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CollectionService, SavedGame } from '../../../core/services/collection.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProfileService } from '../../../core/services/profile.service';
import { ToastService } from '../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DecimalPipe, FormsModule],
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
          <a routerLink="/catalogo" class="btn-explore">Explorar catálogo →</a>
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
                  @if (game.status) {
                    <span class="card-status" [class]="'status-' + game.status">{{ statusLabel(game.status) }}</span>
                  }
                </div>
                <div class="card-body">
                  <h3 class="card-title">{{ game.name }}</h3>
                  <span class="card-date">{{ game.released }}</span>
                  @if (game.notes) {
                    <p class="card-notes">📝 {{ game.notes }}</p>
                  }
                </div>
              </a>

              <!-- Acciones: todos pueden editar/eliminar SUS juegos -->
              <div class="card-actions">
                <button class="btn-edit" (click)="openEdit(game)">✏️ Editar</button>
                <button class="btn-delete" (click)="confirmDelete(game)" [disabled]="removing()">🗑️ Quitar</button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Check 16: Modal de edición pre-rellenado (solo admin) -->
      @if (editingGame()) {
        <div class="modal-overlay" (click)="closeEdit()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <h3>✏️ Editar — {{ editingGame()!.name }}</h3>

            <div class="form-group">
              <label for="editStatus">Estado</label>
              <select id="editStatus" [(ngModel)]="editStatus">
                <option value="">Sin estado</option>
                <option value="playing">🎮 Jugando</option>
                <option value="completed">✅ Completado</option>
                <option value="wishlist">⭐ Lista de deseos</option>
                <option value="dropped">❌ Abandonado</option>
              </select>
            </div>

            <div class="form-group">
              <label for="editNotes">Notas personales</label>
              <textarea id="editNotes" [(ngModel)]="editNotes" rows="3" placeholder="Escribe tus notas sobre este juego..."></textarea>
            </div>

            <div class="modal-actions">
              <button class="btn-cancel" (click)="closeEdit()">Cancelar</button>
              <button class="btn-save" (click)="saveEdit()" [disabled]="saving()">{{ saving() ? 'Guardando...' : 'Guardar' }}</button>
            </div>

            @if (editMsg()) {
              <p class="edit-msg success">{{ editMsg() }}</p>
            }
          </div>
        </div>
      }
    </section>
  `
})
export class DashboardComponent implements OnInit {
  private collectionService = inject(CollectionService);
  private authService = inject(AuthService);
  private profileService = inject(ProfileService);
  private toast = inject(ToastService);

  // Signals (Check 34)
  games = signal<SavedGame[]>([]);
  loading = signal(false);
  removing = signal(false);

  // Edit modal signals
  editingGame = signal<SavedGame | null>(null);
  editStatus = '';
  editNotes = '';
  saving = signal(false);
  editMsg = signal<string | null>(null);

  // Check 10: ¿Es admin?
  isAdmin = computed(() => this.authService.isAdmin());

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

  // Check 16: Abrir modal de edición pre-rellenado
  openEdit(game: SavedGame) {
    this.editingGame.set(game);
    this.editStatus = game.status ?? '';
    this.editNotes = game.notes ?? '';
    this.editMsg.set(null);
  }

  closeEdit() {
    this.editingGame.set(null);
  }

  // Check 16: Guardar edición
  async saveEdit() {
    const game = this.editingGame();
    if (!game) return;

    this.saving.set(true);
    try {
      const uid = this.authService.currentUserSig()?.uid;
      if (!uid) return;
      const data: any = {
        notes: this.editNotes.trim(),
        status: this.editStatus || null
      };
      await this.collectionService.updateGame(uid, game.id, data);

      // Actualizar lista local
      this.games.update(list =>
        list.map(g => g.id === game.id ? { ...g, ...data } : g)
      );
      this.editMsg.set('✅ Guardado correctamente');
      this.toast.success('Cambios guardados correctamente');
      setTimeout(() => this.closeEdit(), 800);
    } catch {
      this.editMsg.set('❌ Error al guardar');
      this.toast.error('Error al guardar los cambios');
    } finally {
      this.saving.set(false);
    }
  }

  // Check 17 + 18: Eliminar con confirmación
  async confirmDelete(game: SavedGame) {
    const ok = confirm(`¿Seguro que quieres quitar "${game.name}" de tu colección?`);
    if (!ok) return;

    this.removing.set(true);
    try {
      await this.collectionService.removeGame(game.id);
      this.games.update(list => list.filter(g => g.id !== game.id));
      this.toast.success(`"${game.name}" eliminado de tu colección`);
    } catch {
      this.toast.error('Error al eliminar el juego');
    } finally {
      this.removing.set(false);
    }
  }

  // Label legible del estado
  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      playing: '🎮 Jugando',
      completed: '✅ Completado',
      wishlist: '⭐ Deseado',
      dropped: '❌ Abandonado'
    };
    return labels[status] ?? status;
  }
}
