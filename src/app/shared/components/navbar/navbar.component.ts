import { Component, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ProfileService } from '../../../core/services/profile.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  styleUrl: './navbar.component.scss',
  template: `
    <nav class="navbar">
      <!-- Logo -->
      <a routerLink="/home" class="navbar__logo">
        <img class="logo-img" src="logo_p2j.png" alt="Player2Join" />
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
        @if (authService.currentUserSig()) {
          <!-- Avatar + Nombre Gamer -->
          <a routerLink="/perfil" class="user-profile-link">
            <div class="user-avatar">
              @if (profilePhoto()) {
                <img [src]="profilePhoto()" alt="Avatar" />
              } @else {
                <span class="avatar-fallback">{{ gamerInitial() }}</span>
              }
            </div>
            <span class="user-name">{{ gamerName() }}</span>
          </a>
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
  public authService = inject(AuthService);
  private profileService = inject(ProfileService);

  // Computed signals para el nombre gamer y foto
  gamerName = computed(() => {
    const prof = this.profileService.profileSig();
    if (prof?.username) return prof.username;
    const user = this.authService.currentUserSig();
    return user?.email?.split('@')[0] ?? 'Jugador';
  });

  profilePhoto = computed(() => this.profileService.profileSig()?.photoURL ?? '');

  gamerInitial = computed(() => this.gamerName().charAt(0).toUpperCase());
}