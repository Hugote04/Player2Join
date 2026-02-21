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
        <img src="logo_p2j.png" alt="Player2Join" class="hero__logo" />
        <h1 class="hero__title">Player<span class="accent">2</span>Join</h1>
        <p class="hero__subtitle">Tu catálogo de videojuegos favorito. Explora, colecciona y comparte con la comunidad.</p>

        @if (!isLoggedIn()) {
          <div class="hero__actions">
            <a routerLink="/registro" class="btn-primary">🎮 Crear cuenta</a>
            <a routerLink="/login" class="btn-secondary">Iniciar sesión</a>
          </div>
        } @else {
          <div class="hero__actions">
            <a routerLink="/dashboard" class="btn-primary">🎮 Mi Colección</a>
            <a routerLink="/catalogo" class="btn-secondary">Explorar catálogo</a>
          </div>
        }
      </div>

      <!-- Features -->
      <div class="features">
        <div class="feature-card">
          <span class="feature-icon">🔍</span>
          <h3>Explora</h3>
          <p>Miles de juegos de la base de datos RAWG a tu alcance.</p>
        </div>
        <div class="feature-card">
          <span class="feature-icon">📚</span>
          <h3>Colecciona</h3>
          <p>Guarda tus juegos favoritos y lleva un seguimiento de tu progreso.</p>
        </div>
        <div class="feature-card">
          <span class="feature-icon">👥</span>
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
