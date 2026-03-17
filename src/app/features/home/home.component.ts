import { Component, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  styleUrl: './home.component.scss',
  template: `
    <section class="home">
      <!-- Hero -->
      <div class="hero">
        <img src="logo_p2j.png" alt="Player2Join logo" class="hero__logo" />
        <h1 class="hero__title">Player<span class="accent">2</span>Join</h1>
        <p class="hero__subtitle">Tu catálogo de videojuegos favorito. Explora, colecciona y comparte con la comunidad.</p>

        @if (!isLoggedIn()) {
          <div class="hero__actions">
            <a routerLink="/registro" class="btn-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 12h4m-2-2v4m10-2h.01M17 12h.01M4 8h16a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z"/></svg>
              Crear cuenta
            </a>
            <a routerLink="/login" class="btn-secondary">Iniciar sesión</a>
          </div>
        } @else {
          <div class="hero__actions">
            <a routerLink="/dashboard" class="btn-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 12h4m-2-2v4m10-2h.01M17 12h.01M4 8h16a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z"/></svg>
              Mi Colección
            </a>
            <a routerLink="/catalogo" class="btn-secondary">Explorar catálogo</a>
          </div>
        }
      </div>

      <!-- Features -->
      <div class="features">
        <div class="feature-card">
          <span class="feature-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z"/></svg>
          </span>
          <h3>Explora</h3>
          <p>Miles de juegos de la base de datos RAWG a tu alcance.</p>
        </div>
        <div class="feature-card">
          <span class="feature-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"/></svg>
          </span>
          <h3>Colecciona</h3>
          <p>Guarda tus juegos favoritos y lleva un seguimiento de tu progreso.</p>
        </div>
        <div class="feature-card">
          <span class="feature-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"/></svg>
          </span>
          <h3>Comparte</h3>
          <p>Sigue a otros jugadores y descubre qué están jugando.</p>
        </div>
      </div>

      <!-- CTA final -->
      @if (!isLoggedIn()) {
        <div class="cta">
          <h2>¿Listo para jugar?</h2>
          <p>Regístrate gratis y empieza a construir tu colección.</p>
          <a routerLink="/registro" class="btn-primary">Crear cuenta gratis</a>
        </div>
      }
    </section>
  `
})
export class HomeComponent {
  private authService = inject(AuthService);
  isLoggedIn = computed(() => !!this.authService.currentUserSig());

  goToCatalog() {
    // Navegar al catálogo (ruta /catalogo)
  }
}
