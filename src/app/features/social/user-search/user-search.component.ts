import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProfileService, UserProfile } from '../../../core/services/profile.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-user-search',
  standalone: true,
  imports: [FormsModule, RouterLink],
  styleUrl: './user-search.component.scss',
  template: `
    <section class="search-page">
      <header class="search-header">
        <h1>🔍 Buscar Jugadores</h1>
        <p class="search-subtitle">Encuentra gamers y descubre sus colecciones</p>
      </header>

      <!-- Barra de búsqueda -->
      <div class="search-bar">
        <input
          type="text"
          class="search-input"
          placeholder="Buscar por nombre de jugador..."
          [(ngModel)]="searchTerm"
          (input)="onSearch()"
          (keydown.enter)="onSearch()"
        />
        @if (searching()) {
          <div class="search-spinner"></div>
        }
      </div>

      <!-- Info -->
      @if (!searched() && !searching()) {
        <div class="search-hint">
          <p>Escribe al menos 2 caracteres para buscar</p>
        </div>
      }

      <!-- Sin resultados -->
      @if (searched() && !searching() && results().length === 0) {
        <div class="no-results">
          <p>😕 No se encontraron jugadores con ese nombre</p>
        </div>
      }

      <!-- Resultados -->
      @if (results().length > 0) {
        <div class="results-grid">
          @for (user of results(); track user.uid) {
            <a [routerLink]="['/usuario', user.uid]" class="user-card" [class.is-me]="user.uid === currentUid()">
              <div class="user-card__avatar">
                @if (user.photoURL) {
                  <img [src]="user.photoURL" [alt]="user.username" />
                } @else {
                  <span class="avatar-fallback">{{ user.username.charAt(0).toUpperCase() }}</span>
                }
              </div>
              <div class="user-card__info">
                <h3 class="user-card__name">{{ user.username }}</h3>
                @if (user.description) {
                  <p class="user-card__desc">{{ user.description }}</p>
                }
              </div>
              <span class="user-card__arrow">→</span>
            </a>
          }
        </div>
      }
    </section>
  `
})
export class UserSearchComponent {
  private profileService = inject(ProfileService);
  private authService = inject(AuthService);

  searchTerm = '';
  results = signal<UserProfile[]>([]);
  searching = signal(false);
  searched = signal(false);

  currentUid = signal<string | null>(null);

  private searchTimer: any;

  constructor() {
    const user = this.authService.currentUserSig();
    this.currentUid.set(user?.uid ?? null);
  }

  onSearch() {
    clearTimeout(this.searchTimer);
    const term = this.searchTerm.trim();

    if (term.length < 2) {
      this.results.set([]);
      this.searched.set(false);
      return;
    }

    this.searching.set(true);
    this.searchTimer = setTimeout(async () => {
      try {
        const users = await this.profileService.searchUsers(term);
        this.results.set(users);
      } catch {
        this.results.set([]);
      } finally {
        this.searching.set(false);
        this.searched.set(true);
      }
    }, 400);
  }
}
