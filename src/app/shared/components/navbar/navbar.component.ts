import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  styleUrl: './navbar.component.scss',
  template: `
    <nav class="navbar">
      <!-- Logo -->
      <a routerLink="/home" class="navbar__logo">
        <span class="logo-icon">🎮</span>
        <span>Player<span class="logo-highlight">2</span>Join</span>
      </a>

      <!-- Links centrales -->
      <div class="navbar__links">
        <a routerLink="/home" routerLinkActive="active" class="nav-link">Catálogo</a>
        @if (authService.currentUserSig()) {
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-link">Mi Colección</a>
        }
      </div>

      <!-- Auth -->
      <div class="navbar__auth">
        @if (authService.currentUserSig(); as user) {
          <span class="user-greeting">
            Hola, <span class="user-email">{{ user.email }}</span>
          </span>
          <button class="btn-logout" (click)="authService.logout()">Logout</button>
        } @else {
          <a routerLink="/login" class="btn-login">Iniciar Sesión</a>
          <a routerLink="/registro" class="btn-register">Registro</a>
        }
      </div>
    </nav>
  `
})
export class NavbarComponent {
  // RA8 - Check 34: Inyectamos AuthService que expone currentUserSig (Signal)
  public authService = inject(AuthService);
}